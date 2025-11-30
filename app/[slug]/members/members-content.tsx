'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users as UsersIcon, UserCheck, Clock, UserPlus, CheckCircle, XCircle, Loader2, Trash2, Shield, ShieldOff, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Filtered, sorted, and paginated members
  const { filteredMembers, paginatedMembers, totalPages } = useMemo(() => {
    // Filter by status and search
    let filtered = membersList.filter((m) => {
      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'admin' && m.member.role === 'admin') ||
        (statusFilter !== 'admin' && m.member.status === statusFilter);

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        getUserDisplayName(m.user).toLowerCase().includes(searchLower) ||
        m.user.email.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.member.joinedAt).getTime() - new Date(a.member.joinedAt).getTime();
        case 'oldest':
          return new Date(a.member.joinedAt).getTime() - new Date(b.member.joinedAt).getTime();
        case 'a-z':
          return getUserDisplayName(a.user).localeCompare(getUserDisplayName(b.user));
        case 'z-a':
          return getUserDisplayName(b.user).localeCompare(getUserDisplayName(a.user));
        default:
          return 0;
      }
    });

    // Paginate
    const total = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filteredMembers: filtered, paginatedMembers: paginated, totalPages: total };
  }, [membersList, statusFilter, sortBy, searchQuery, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: typeof statusFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedMembers.size === paginatedMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(paginatedMembers.map(m => m.member.id)));
    }
  };

  const toggleSelectMember = (memberId: number) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
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

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      return;
    }

    setLoadingMembers((prev) => ({ ...prev, [memberId]: true }));

    try {
      const response = await fetch('/api/members/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete member');
      }

      // Remove from local state
      setMembersList((prev) => prev.filter((m) => m.member.id !== memberId));
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleToggleAdmin = async (memberId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setLoadingMembers((prev) => ({ ...prev, [memberId]: true }));

    try {
      const response = await fetch('/api/members/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member role');
      }

      // Update local state
      setMembersList((prev) =>
        prev.map((m) =>
          m.member.id === memberId
            ? { ...m, member: { ...m.member, role: newRole } }
            : m
        )
      );
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role');
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const pendingCount = membersList.filter((m) => m.member.status === 'pending').length;
  const approvedCount = membersList.filter((m) => m.member.status === 'approved').length;
  const rejectedCount = membersList.filter((m) => m.member.status === 'rejected').length;
  const adminCount = membersList.filter((m) => m.member.role === 'admin').length;

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
          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => handleFilterChange('all')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{membersList.length}</p>
                  <p className="text-sm text-gray-600">All Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'approved' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
            onClick={() => handleFilterChange('approved')}
          >
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

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'}`}
            onClick={() => handleFilterChange('pending')}
          >
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

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'admin' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
            onClick={() => handleFilterChange('admin')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
                  <p className="text-sm text-gray-600">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => handleSortChange(value as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="a-z">Name (A-Z)</SelectItem>
              <SelectItem value="z-a">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rejected Members Card (if any exist and owner) */}
        {isOwner && rejectedCount > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {rejectedCount} Rejected {rejectedCount === 1 ? 'Member' : 'Members'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Click to view and manage rejected members
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange('rejected')}
                  className="border-red-300 hover:bg-red-100"
                >
                  View Rejected
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {statusFilter === 'all' && 'All Members'}
                {statusFilter === 'approved' && 'Approved Members'}
                {statusFilter === 'pending' && 'Pending Members'}
                {statusFilter === 'rejected' && 'Rejected Members'}
                {statusFilter === 'admin' && 'Admin Members'}
                {filteredMembers.length > 0 && ` (${filteredMembers.length})`}
              </CardTitle>
              {isOwner && paginatedMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedMembers.size === paginatedMembers.length && paginatedMembers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    Select all ({selectedMembers.size} selected)
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No members found' : 'No members yet'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Members will appear here once they join your union'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedMembers.map((member) => (
                  <div
                    key={member.member.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    {/* Checkbox for bulk selection */}
                    {isOwner && member.member.role !== 'owner' && (
                      <Checkbox
                        checked={selectedMembers.has(member.member.id)}
                        onCheckedChange={() => toggleSelectMember(member.member.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    {/* Avatar and User Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(getUserDisplayName(member.user))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {getUserDisplayName(member.user)}
                          </p>
                          {/* Join date - visible on hover */}
                          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Joined {formatDate(member.member.joinedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-gray-600 truncate">{member.user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags and Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Role and Status Tags */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            member.member.role === 'owner'
                              ? 'bg-blue-100 text-blue-700'
                              : member.member.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {member.member.role.charAt(0).toUpperCase() +
                            member.member.role.slice(1)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
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
                      {/* Action buttons (owners only) */}
                      {isOwner && member.member.role !== 'owner' && (
                        <div className="flex items-center gap-2">
                          {/* Approval buttons for pending members */}
                          {member.member.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproval(member.member.id, 'approved')}
                                disabled={loadingMembers[member.member.id]}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {loadingMembers[member.member.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
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
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </>
                          )}

                          {/* Re-approve button for rejected members */}
                          {member.member.status === 'rejected' && (
                            <Button
                              size="sm"
                              onClick={() => handleApproval(member.member.id, 'approved')}
                              disabled={loadingMembers[member.member.id]}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {loadingMembers[member.member.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                          )}

                          {/* Admin toggle for approved members */}
                          {member.member.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAdmin(member.member.id, member.member.role)}
                              disabled={loadingMembers[member.member.id]}
                            >
                              {loadingMembers[member.member.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : member.member.role === 'admin' ? (
                                <>
                                  <ShieldOff className="h-4 w-4 mr-1" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          )}

                          {/* Delete button for non-pending members */}
                          {member.member.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMember(member.member.id, getUserDisplayName(member.user))}
                              disabled={loadingMembers[member.member.id]}
                            >
                              {loadingMembers[member.member.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            size="sm"
                            variant={currentPage === page ? 'default' : 'outline'}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? 'bg-blue-600' : ''}
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
