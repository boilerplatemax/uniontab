'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users as UsersIcon, UserCheck, Clock, UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Member {
  member: {
    id: number;
    userId: number;
    unionId: number;
    role: string;
    status: string;
    joinedAt: Date;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface MembersContentProps {
  slug: string;
  union: {
    id: number;
    name: string;
    localNumber: string | null;
  };
  members: Member[];
  isOwner: boolean;
}

export function MembersContent({ slug, union, members, isOwner }: MembersContentProps) {
  const [loadingMembers, setLoadingMembers] = useState<Record<number, boolean>>({});
  const [membersList, setMembersList] = useState<Member[]>(members);
  const getUserDisplayName = (user: { name: string | null; email: string }) => {
    return user.name || user.email;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleApproval = async (memberId: number, action: 'approved' | 'rejected') => {
    setLoadingMembers((prev) => ({ ...prev, [memberId]: true }));

    try {
      const response = await fetch('/api/members/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member status');
      }

      // Update local state
      setMembersList((prev) =>
        prev.map((m) =>
          m.member.id === memberId
            ? { ...m, member: { ...m.member, status: action } }
            : m
        )
      );
    } catch (error) {
      console.error('Error updating member status:', error);
      alert('Failed to update member status');
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const pendingCount = membersList.filter((m) => m.member.status === 'pending').length;
  const approvedCount = membersList.filter((m) => m.member.status === 'approved').length;
  const ownerCount = membersList.filter((m) => m.member.role === 'owner').length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {union.name}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all union members
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{membersList.length}</p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <UserPlus className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{ownerCount}</p>
                  <p className="text-sm text-gray-600">Owners</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
          </CardHeader>
          <CardContent>
            {membersList.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No members yet
                </h3>
                <p className="text-gray-500">
                  Members will appear here once they join your union
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {membersList.map((member) => (
                  <div
                    key={member.member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(getUserDisplayName(member.user))}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getUserDisplayName(member.user)}
                        </p>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Joined {formatDate(member.member.joinedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            member.member.role === 'owner'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {member.member.role.charAt(0).toUpperCase() +
                            member.member.role.slice(1)}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            member.member.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : member.member.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {member.member.status.charAt(0).toUpperCase() +
                            member.member.status.slice(1)}
                        </span>
                      </div>
                      {/* Approval buttons for pending members (owners only) */}
                      {isOwner && member.member.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproval(member.member.id, 'approved')}
                            disabled={loadingMembers[member.member.id]}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {loadingMembers[member.member.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproval(member.member.id, 'rejected')}
                            disabled={loadingMembers[member.member.id]}
                          >
                            {loadingMembers[member.member.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
