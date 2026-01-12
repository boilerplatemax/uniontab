'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  Users,
  AlertTriangle,
} from 'lucide-react';
import type { Member, MemberDocument, MemberCertification, MemberPosition } from '@/lib/db/schema';

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

interface OverviewTabProps {
  member: MemberData;
  documents: DocumentWithUploader[];
  certifications: CertificationWithCreator[];
  positions: PositionWithCreator[];
}

export function OverviewTab({ member, documents, certifications, positions }: OverviewTabProps) {
  const expiredCertifications = certifications.filter(
    (c) => c.certification.expiryDate && new Date(c.certification.expiryDate) < new Date()
  );

  const currentPositions = positions.filter((p) => p.position.isCurrent);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Member Overview</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{member.user.email}</span>
            </div>
            {(member.member.cellPhone || member.member.phone) && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{member.member.cellPhone || member.member.phone}</span>
              </div>
            )}
            {member.member.address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span>
                  {member.member.address}
                  {member.member.city && `, ${member.member.city}`}
                  {member.member.province && `, ${member.member.province}`}
                  {member.member.postalCode && ` ${member.member.postalCode}`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {member.member.employer && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{member.member.employer}</span>
              </div>
            )}
            {member.member.jobTitle && (
              <div className="text-sm">
                <span className="text-gray-500">Position:</span>{' '}
                <span className="font-medium">{member.member.jobTitle}</span>
              </div>
            )}
            {member.member.employmentStatus && (
              <div className="text-sm">
                <span className="text-gray-500">Status:</span>{' '}
                <Badge variant="outline" className="capitalize">
                  {member.member.employmentStatus}
                </Badge>
              </div>
            )}
            {member.member.startDateWithEmployer && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Started: {formatDate(member.member.startDateWithEmployer)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Union Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Union Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {member.member.memberId && (
              <div className="text-sm">
                <span className="text-gray-500">Member ID:</span>{' '}
                <span className="font-medium">{member.member.memberId}</span>
              </div>
            )}
            {member.member.localChapter && (
              <div className="text-sm">
                <span className="text-gray-500">Local/Chapter:</span>{' '}
                <span className="font-medium">{member.member.localChapter}</span>
              </div>
            )}
            {member.member.bargainingUnit && (
              <div className="text-sm">
                <span className="text-gray-500">Bargaining Unit:</span>{' '}
                <span className="font-medium">{member.member.bargainingUnit}</span>
              </div>
            )}
            {member.member.votingStatus && (
              <div className="text-sm">
                <span className="text-gray-500">Voting Status:</span>{' '}
                <Badge
                  variant="outline"
                  className={
                    member.member.votingStatus === 'eligible'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-700'
                  }
                >
                  {member.member.votingStatus}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Positions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPositions.length > 0 ? (
              <div className="space-y-2">
                {currentPositions.map((p) => (
                  <div key={p.position.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{p.position.title}</p>
                      {p.position.area && (
                        <p className="text-xs text-gray-500">{p.position.area}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {p.position.positionType.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No current positions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring/Expired Certifications Alert */}
      {expiredCertifications.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-3">
              The following certifications have expired and may need renewal:
            </p>
            <div className="space-y-2">
              {expiredCertifications.map((c) => (
                <div key={c.certification.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200">
                  <span className="font-medium text-sm">{c.certification.name}</span>
                  <span className="text-xs text-red-600">
                    Expired: {formatDate(c.certification.expiryDate)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
