'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  User,
  Briefcase,
  Building2,
  FileText,
  Award,
  Users,
  StickyNote,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import type { Union, Member, MemberDocument, MemberCertification, MemberPosition, MemberNote } from '@/lib/db/schema';
import { OverviewTab } from './tabs/overview-tab';
import { PersonalInfoTab } from './tabs/personal-info-tab';
import { EmploymentTab } from './tabs/employment-tab';
import { UnionInfoTab } from './tabs/union-info-tab';
import { DocumentsTab } from './tabs/documents-tab';
import { CertificationsTab } from './tabs/certifications-tab';
import { PositionsTab } from './tabs/positions-tab';
import { NotesTab } from './tabs/notes-tab';
import { SettingsTab } from './tabs/settings-tab';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface DocumentWithUploader {
  document: MemberDocument;
  uploadedBy: {
    id: number;
    name: string | null;
  } | null;
}

interface CertificationWithCreator {
  certification: MemberCertification;
  createdBy: {
    id: number;
    name: string | null;
  } | null;
}

interface PositionWithCreator {
  position: MemberPosition;
  createdBy: {
    id: number;
    name: string | null;
  } | null;
}

interface NoteWithCreator {
  note: MemberNote;
  createdBy: {
    id: number;
    name: string | null;
  } | null;
}

interface MemberProfileContentProps {
  slug: string;
  union: Union;
  memberData: MemberData;
  documents: DocumentWithUploader[];
  certifications: CertificationWithCreator[];
  positions: PositionWithCreator[];
  notes: NoteWithCreator[];
  currentUserId: number;
}

export function MemberProfileContent({
  slug,
  union,
  memberData,
  documents: initialDocuments,
  certifications: initialCertifications,
  positions: initialPositions,
  notes: initialNotes,
  currentUserId,
}: MemberProfileContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState(initialDocuments);
  const [certifications, setCertifications] = useState(initialCertifications);
  const [positions, setPositions] = useState(initialPositions);
  const [notes, setNotes] = useState(initialNotes);
  const [member, setMember] = useState(memberData);

  const displayName = member.user.name || member.user.email;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getStatusBadge = () => {
    switch (member.member.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getMembershipStatusBadge = () => {
    switch (member.member.membershipStatus) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'retired':
        return <Badge className="bg-purple-100 text-purple-800">Retired</Badge>;
      default:
        return null;
    }
  };

  const handleMemberUpdate = () => {
    router.refresh();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'union', label: 'Union', icon: Building2 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'certifications', label: 'Training', icon: Award },
    { id: 'positions', label: 'Positions', icon: Users },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${slug}/members`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Members
          </Link>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  <p className="text-gray-500">{member.user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge()}
                    {getMembershipStatusBadge()}
                    {member.member.role === 'owner' && (
                      <Badge className="bg-purple-100 text-purple-800">Owner</Badge>
                    )}
                    {member.member.role === 'admin' && (
                      <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                    )}
                    {member.member.isDelinquent && (
                      <Badge className="bg-red-100 text-red-800">Delinquent</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                {member.member.memberId && (
                  <p>Member ID: <span className="font-medium text-gray-900">{member.member.memberId}</span></p>
                )}
                <p>Joined: {new Date(member.member.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <TabsList className="w-full justify-start p-1 h-auto flex-wrap gap-1 bg-transparent">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <TabsContent value="overview" className="m-0 p-6">
              <OverviewTab
                member={member}
                documents={documents}
                certifications={certifications}
                positions={positions}
              />
            </TabsContent>

            <TabsContent value="personal" className="m-0 p-6">
              <PersonalInfoTab
                member={member}
                unionId={union.id}
                onUpdate={handleMemberUpdate}
              />
            </TabsContent>

            <TabsContent value="employment" className="m-0 p-6">
              <EmploymentTab
                member={member}
                unionId={union.id}
                onUpdate={handleMemberUpdate}
              />
            </TabsContent>

            <TabsContent value="union" className="m-0 p-6">
              <UnionInfoTab
                member={member}
                unionId={union.id}
                onUpdate={handleMemberUpdate}
              />
            </TabsContent>

            <TabsContent value="documents" className="m-0 p-6">
              <DocumentsTab
                member={member}
                documents={documents}
                unionId={union.id}
                currentUserId={currentUserId}
                onUpdate={() => router.refresh()}
              />
            </TabsContent>

            <TabsContent value="certifications" className="m-0 p-6">
              <CertificationsTab
                member={member}
                certifications={certifications}
                unionId={union.id}
                currentUserId={currentUserId}
                onUpdate={() => router.refresh()}
              />
            </TabsContent>

            <TabsContent value="positions" className="m-0 p-6">
              <PositionsTab
                member={member}
                positions={positions}
                unionId={union.id}
                currentUserId={currentUserId}
                onUpdate={() => router.refresh()}
              />
            </TabsContent>

            <TabsContent value="notes" className="m-0 p-6">
              <NotesTab
                member={member}
                notes={notes}
                unionId={union.id}
                currentUserId={currentUserId}
                onUpdate={() => router.refresh()}
              />
            </TabsContent>

            <TabsContent value="settings" className="m-0 p-6">
              <SettingsTab
                member={member}
                unionId={union.id}
                onUpdate={handleMemberUpdate}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
