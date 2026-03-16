'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EditMemberDialog } from './edit-member-dialog';
import { AdminPermissionsDialog } from '@/components/members/admin-permissions-dialog';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Users as UsersIcon, UserCheck, Clock, UserPlus, CheckCircle, XCircle, Loader2, Trash2, Shield, ShieldOff, Search, ChevronLeft, ChevronRight, AlertCircle, UserMinus, Edit, Download, Upload, X, DollarSign, Eye, Phone, TrendingUp, AlertTriangle, Settings2, ClipboardList, FolderPlus, FolderOpen, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import type { AdminPermissions } from '@/lib/db/schema';
import { getPermissionCount } from '@/lib/admin-permissions';

interface Member {
  member: {
    id: number;
    userId: number;
    unionId: number;
    role: string;
    status: string;
    joinedAt: Date;
    phone: string | null;
    cellPhone: string | null;
    homePhone: string | null;
    employer: string | null;
    jobTitle: string | null;
    worksite: string | null;
    employmentStatus: string | null;
    address: string | null;
    dateOfBirth: Date | null;
    memberId: string | null;
    membershipStatus: string | null;
    localChapter: string | null;
    bargainingUnit: string | null;
    startDateWithEmployer: Date | null;
    notes: string | null;
    isDelinquent: boolean;
    delinquentSince: Date | null;
    adminPermissions: AdminPermissions | null;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface GroupData {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: Date;
}

interface GroupAssignment {
  memberId: number;
  groupId: number;
}

interface GroupDetailMember {
  assignmentId: number;
  assignedAt: Date;
  member: {
    id: number;
    role: string;
    status: string;
    memberId: string | null;
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
  groups: GroupData[];
  groupAssignments: GroupAssignment[];
  isDemo: boolean;
}

export function MembersContent({ slug, union, members, isOwner, groups, groupAssignments, isDemo }: MembersContentProps) {
  const [loadingMembers, setLoadingMembers] = useState<Record<number, boolean>>({});
  const [membersList, setMembersList] = useState<Member[]>(members);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Advanced filter states
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState<string>('all');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('all');
  const [localChapterFilter, setLocalChapterFilter] = useState<string>('all');
  const [bargainingUnitFilter, setBargainingUnitFilter] = useState<string>('all');
  const [employerFilter, setEmployerFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Group filter state
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [localGroups, setLocalGroups] = useState<GroupData[]>(groups);
  const [localGroupAssignments, setLocalGroupAssignments] = useState<GroupAssignment[]>(groupAssignments);

  // Group CRUD dialog states
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormDescription, setGroupFormDescription] = useState('');
  const [groupFormError, setGroupFormError] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupData | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  // Manage group members dialog states
  const [manageGroupOpen, setManageGroupOpen] = useState(false);
  const [managingGroup, setManagingGroup] = useState<GroupData | null>(null);
  const [groupDetailMembers, setGroupDetailMembers] = useState<GroupDetailMember[]>([]);
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<Set<number>>(new Set());
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = useState(false);
  const [isAddingGroupMembers, setIsAddingGroupMembers] = useState(false);
  const [removingGroupMemberId, setRemovingGroupMemberId] = useState<number | null>(null);

  // CSV import state
  const [isImporting, setIsImporting] = useState(false);

  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: number; name: string } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Edit member dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  // Admin permissions dialog states
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionsDialogMode, setPermissionsDialogMode] = useState<'make-admin' | 'edit-permissions'>('make-admin');
  const [memberForPermissions, setMemberForPermissions] = useState<Member | null>(null);

  // Member usage state
  const [memberUsage, setMemberUsage] = useState<{
    limit: number;
    current: number;
    remaining: number;
    percentUsed: number;
    isNearLimit: boolean;
    tierName: string;
  } | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [showLimitWarning, setShowLimitWarning] = useState(true);

  // Fetch member usage
  useEffect(() => {
    const fetchMemberUsage = async () => {
      try {
        setIsLoadingUsage(true);
        const response = await fetch(`/api/members/usage?unionId=${union.id}`);
        if (response.ok) {
          const data = await response.json();
          setMemberUsage(data.usage);
        }
      } catch (error) {
        console.error('Error fetching member usage:', error);
      } finally {
        setIsLoadingUsage(false);
      }
    };

    if (isOwner) {
      fetchMemberUsage();
    }
  }, [union.id, isOwner]);

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

  const getMemberPhone = (member: Member['member']) => {
    return member.cellPhone || member.homePhone || member.phone || null;
  };

  // Get unique values for filter dropdowns
  const uniqueEmployers = useMemo(() => {
    const employers = new Set<string>();
    membersList.forEach(m => {
      if (m.member.employer) employers.add(m.member.employer);
    });
    return Array.from(employers).sort();
  }, [membersList]);

  const uniqueLocalChapters = useMemo(() => {
    const chapters = new Set<string>();
    membersList.forEach(m => {
      if (m.member.localChapter) chapters.add(m.member.localChapter);
    });
    return Array.from(chapters).sort();
  }, [membersList]);

  const uniqueBargainingUnits = useMemo(() => {
    const units = new Set<string>();
    membersList.forEach(m => {
      if (m.member.bargainingUnit) units.add(m.member.bargainingUnit);
    });
    return Array.from(units).sort();
  }, [membersList]);

  // Group member IDs for the selected group filter
  const groupFilterMemberIds = useMemo(() => {
    if (groupFilter === 'all') return null;
    const gId = parseInt(groupFilter);
    return new Set(localGroupAssignments.filter(a => a.groupId === gId).map(a => a.memberId));
  }, [groupFilter, localGroupAssignments]);

  // Filtered, sorted, and paginated members
  const { filteredMembers, paginatedMembers, totalPages } = useMemo(() => {
    // Filter by status and search
    let filtered = membersList.filter((m) => {
      // Group filter
      if (groupFilterMemberIds && !groupFilterMemberIds.has(m.member.id)) {
        return false;
      }

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'admin' && m.member.role === 'admin') ||
        (statusFilter !== 'admin' && m.member.status === statusFilter);

      // Search filter - now includes more fields
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        getUserDisplayName(m.user).toLowerCase().includes(searchLower) ||
        m.user.email.toLowerCase().includes(searchLower) ||
        m.member.phone?.toLowerCase().includes(searchLower) ||
        m.member.employer?.toLowerCase().includes(searchLower) ||
        m.member.jobTitle?.toLowerCase().includes(searchLower) ||
        m.member.worksite?.toLowerCase().includes(searchLower) ||
        m.member.memberId?.toLowerCase().includes(searchLower) ||
        m.member.localChapter?.toLowerCase().includes(searchLower) ||
        m.member.bargainingUnit?.toLowerCase().includes(searchLower);

      // Advanced filters
      const matchesEmploymentStatus =
        employmentStatusFilter === 'all' || m.member.employmentStatus === employmentStatusFilter;

      const matchesMembershipStatus =
        membershipStatusFilter === 'all' || m.member.membershipStatus === membershipStatusFilter;

      const matchesLocalChapter =
        localChapterFilter === 'all' || m.member.localChapter === localChapterFilter;

      const matchesBargainingUnit =
        bargainingUnitFilter === 'all' || m.member.bargainingUnit === bargainingUnitFilter;

      const matchesEmployer =
        employerFilter === 'all' || m.member.employer === employerFilter;

      return matchesStatus && matchesSearch && matchesEmploymentStatus &&
             matchesMembershipStatus && matchesLocalChapter && matchesBargainingUnit &&
             matchesEmployer;
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
  }, [membersList, statusFilter, sortBy, searchQuery, currentPage, employmentStatusFilter, membershipStatusFilter, localChapterFilter, bargainingUnitFilter, employerFilter, groupFilterMemberIds]);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: typeof statusFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
    setSelectedMembers(new Set()); // Clear selections when filter changes
    setBulkAction('');
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSelectedMembers(new Set()); // Clear selections when search changes
    setBulkAction('');
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    // Only select members who are not owners
    const selectableMembers = paginatedMembers.filter(m => m.member.role !== 'owner');
    const selectableMemberIds = selectableMembers.map(m => m.member.id);

    // Check if all selectable members on current page are selected
    const allSelectableSelected = selectableMemberIds.every(id => selectedMembers.has(id));

    if (allSelectableSelected) {
      // Deselect all members on current page
      const newSelected = new Set(selectedMembers);
      selectableMemberIds.forEach(id => newSelected.delete(id));
      setSelectedMembers(newSelected);
    } else {
      // Select all selectable members on current page
      setSelectedMembers(new Set([...selectedMembers, ...selectableMemberIds]));
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
      setSuccessMessage(`Member ${action === 'approved' ? 'approved' : 'rejected'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating member status:', error);
      setErrorMessage('Failed to update member status. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleDeleteMember = (memberId: number, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    setLoadingMembers((prev) => ({ ...prev, [memberToDelete.id]: true }));
    setDeleteDialogOpen(false);

    try {
      const response = await fetch('/api/members/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: memberToDelete.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete member');
      }

      // Remove from local state
      setMembersList((prev) => prev.filter((m) => m.member.id !== memberToDelete.id));
      setSuccessMessage(`Successfully deleted ${memberToDelete.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting member:', error);
      setErrorMessage('Failed to delete member. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [memberToDelete.id]: false }));
      setMemberToDelete(null);
    }
  };

  const handleToggleAdmin = async (member: Member) => {
    const currentRole = member.member.role;
    const memberId = member.member.id;

    if (currentRole === 'admin') {
      // Demoting from admin - no dialog needed
      setLoadingMembers((prev) => ({ ...prev, [memberId]: true }));

      try {
        const response = await fetch('/api/members/toggle-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId, role: 'member' }),
        });

        if (!response.ok) {
          throw new Error('Failed to update member role');
        }

        // Update local state
        setMembersList((prev) =>
          prev.map((m) =>
            m.member.id === memberId
              ? { ...m, member: { ...m.member, role: 'member', adminPermissions: null } }
              : m
          )
        );
        setSuccessMessage('Admin role removed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error updating member role:', error);
        setErrorMessage('Failed to update member role. Please try again.');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setLoadingMembers((prev) => ({ ...prev, [memberId]: false }));
      }
    } else {
      // Promoting to admin - show permissions dialog
      setMemberForPermissions(member);
      setPermissionsDialogMode('make-admin');
      setPermissionsDialogOpen(true);
    }
  };

  const handleToggleElectionCommittee = async (member: Member) => {
    const currentRole = member.member.role;
    const memberId = member.member.id;
    const action = currentRole === 'election_committee' ? 'remove' : 'assign';

    setLoadingMembers((prev) => ({ ...prev, [memberId]: true }));

    try {
      const response = await fetch('/api/members/toggle-election-committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setMembersList((prev) =>
        prev.map((m) =>
          m.member.id === memberId
            ? { ...m, member: { ...m.member, role: data.role, adminPermissions: null } }
            : m
        )
      );
      setSuccessMessage(
        action === 'assign'
          ? `${getUserDisplayName(member.user)} added to Election Committee`
          : 'Election Committee role removed'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating election committee role:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update role');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleEditPermissions = (member: Member) => {
    setMemberForPermissions(member);
    setPermissionsDialogMode('edit-permissions');
    setPermissionsDialogOpen(true);
  };

  const handlePermissionsConfirm = async (permissions: AdminPermissions) => {
    if (!memberForPermissions) return;

    const memberId = memberForPermissions.member.id;
    setLoadingMembers((prev) => ({ ...prev, [memberId]: true }));

    try {
      const endpoint = permissionsDialogMode === 'make-admin'
        ? '/api/members/toggle-admin'
        : '/api/members/edit-permissions';

      const body = permissionsDialogMode === 'make-admin'
        ? { memberId, role: 'admin', permissions }
        : { memberId, permissions };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update permissions');
      }

      // Update local state
      setMembersList((prev) =>
        prev.map((m) =>
          m.member.id === memberId
            ? {
                ...m,
                member: {
                  ...m.member,
                  role: permissionsDialogMode === 'make-admin' ? 'admin' : m.member.role,
                  adminPermissions: permissions
                }
              }
            : m
        )
      );

      const message = permissionsDialogMode === 'make-admin'
        ? `${getUserDisplayName(memberForPermissions.user)} is now an admin`
        : 'Permissions updated successfully';
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating permissions:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update permissions');
      setTimeout(() => setErrorMessage(''), 3000);
      throw error; // Re-throw so dialog stays open
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleEditMember = (member: Member) => {
    setMemberToEdit(member);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    setSuccessMessage('Member updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    // Refresh the page to get updated data
    window.location.reload();
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedMembers.size === 0) {
      return;
    }

    setPendingBulkAction(bulkAction);
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    const memberIds = Array.from(selectedMembers);
    setBulkDeleteDialogOpen(false);

    if (pendingBulkAction === 'delete') {
      setIsBulkActionLoading(true);

      try {
        const response = await fetch('/api/members/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberIds }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete members');
        }

        const result = await response.json();

        // Remove deleted members from local state
        setMembersList((prev) => prev.filter((m) => !memberIds.includes(m.member.id)));
        setSelectedMembers(new Set());
        setBulkAction('');
        setPendingBulkAction('');

        setSuccessMessage(`Successfully deleted ${result.deletedCount} ${result.deletedCount === 1 ? 'member' : 'members'}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error bulk deleting members:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to delete members');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setIsBulkActionLoading(false);
      }
    } else if (pendingBulkAction === 'approve' || pendingBulkAction === 'pending' || pendingBulkAction === 'reject') {
      const statusMap = {
        approve: 'approved',
        pending: 'pending',
        reject: 'rejected'
      } as const;

      const status = statusMap[pendingBulkAction];
      const actionLabel = pendingBulkAction === 'approve' ? 'approve' : pendingBulkAction === 'pending' ? 'mark as pending' : 'reject';

      setIsBulkActionLoading(true);

      try {
        const response = await fetch('/api/members/bulk-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberIds, status }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to ${actionLabel} members`);
        }

        const result = await response.json();

        // Update local state
        setMembersList((prev) =>
          prev.map((m) =>
            memberIds.includes(m.member.id)
              ? { ...m, member: { ...m.member, status } }
              : m
          )
        );
        setSelectedMembers(new Set());
        setBulkAction('');
        setPendingBulkAction('');

        setSuccessMessage(`Successfully ${actionLabel}d ${result.updatedCount} ${result.updatedCount === 1 ? 'member' : 'members'}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error(`Error bulk ${actionLabel}ing members:`, error);
        setErrorMessage(error instanceof Error ? error.message : `Failed to ${actionLabel} members`);
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setIsBulkActionLoading(false);
      }
    }
  };

  const pendingCount = membersList.filter((m) => m.member.status === 'pending').length;
  const approvedCount = membersList.filter((m) => m.member.status === 'approved').length;
  const rejectedCount = membersList.filter((m) => m.member.status === 'rejected').length;
  const adminCount = membersList.filter((m) => m.member.role === 'admin').length;

  // CSV Export function
  const handleExportCSV = () => {
    // Create CSV header
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Employer',
      'Job Title',
      'Worksite',
      'Employment Status',
      'Member ID',
      'Membership Status',
      'Local Chapter',
      'Bargaining Unit',
      'Role',
      'Status',
      'Joined At',
      'Address',
      'Date of Birth',
      'Start Date With Employer',
      'Notes'
    ];

    // Create CSV rows from filtered members
    const rows = filteredMembers.map((m) => [
      getUserDisplayName(m.user),
      m.user.email,
      m.member.phone || '',
      m.member.employer || '',
      m.member.jobTitle || '',
      m.member.worksite || '',
      m.member.employmentStatus || '',
      m.member.memberId || '',
      m.member.membershipStatus || '',
      m.member.localChapter || '',
      m.member.bargainingUnit || '',
      m.member.role,
      m.member.status,
      formatDate(m.member.joinedAt),
      m.member.address || '',
      m.member.dateOfBirth ? formatDate(m.member.dateOfBirth) : '',
      m.member.startDateWithEmployer ? formatDate(m.member.startDateWithEmployer) : '',
      m.member.notes || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${union.name.replace(/\s+/g, '_')}${union.localNumber ? '_' + union.localNumber : ''}_members_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage(`Exported ${filteredMembers.length} members to CSV`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // CSV Import function
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          setErrorMessage('CSV file is empty or invalid');
          setTimeout(() => setErrorMessage(''), 3000);
          setIsImporting(false);
          return;
        }

        // Parse CSV
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const data = lines.slice(1).map(line => {
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        // Send to API for processing
        const response = await fetch('/api/members/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: data, unionId: union.id }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import members');
        }

        const result = await response.json();
        setSuccessMessage(`Successfully imported ${result.imported} members. ${result.updated} updated, ${result.skipped} skipped.`);
        setTimeout(() => setSuccessMessage(''), 5000);

        // Refresh the page to show updated data
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Error importing CSV:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to import CSV');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setIsImporting(false);
        // Reset the file input
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  // ── Group CRUD Handlers ──────────────────────────────────────────────

  const openCreateGroupDialog = () => {
    setEditingGroup(null);
    setGroupFormName('');
    setGroupFormDescription('');
    setGroupFormError('');
    setCreateGroupOpen(true);
  };

  const openEditGroupDialog = (group: GroupData) => {
    setEditingGroup(group);
    setGroupFormName(group.name);
    setGroupFormDescription(group.description || '');
    setGroupFormError('');
    setCreateGroupOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupFormName.trim()) {
      setGroupFormError('Group name is required');
      return;
    }

    setSavingGroup(true);
    setGroupFormError('');

    try {
      if (editingGroup) {
        const response = await fetch(`/api/groups/${editingGroup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: groupFormName.trim(),
            description: groupFormDescription.trim() || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            setGroupFormError(data.error || 'A group with this name already exists');
          } else {
            setGroupFormError(data.error || 'Failed to update group');
          }
          return;
        }

        const data = await response.json();
        setLocalGroups((prev) =>
          prev.map((g) =>
            g.id === editingGroup.id
              ? { ...g, name: data.group.name, description: data.group.description }
              : g
          )
        );
      } else {
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unionId: union.id,
            name: groupFormName.trim(),
            description: groupFormDescription.trim() || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            setGroupFormError(data.error || 'A group with this name already exists');
          } else {
            setGroupFormError(data.error || 'Failed to create group');
          }
          return;
        }

        const data = await response.json();
        setLocalGroups((prev) =>
          [...prev, { ...data.group, memberCount: 0 }].sort((a, b) => a.name.localeCompare(b.name))
        );
      }

      setCreateGroupOpen(false);
      setSuccessMessage(editingGroup ? 'Group updated successfully' : 'Group created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setGroupFormError('An unexpected error occurred');
    } finally {
      setSavingGroup(false);
    }
  };

  const openDeleteGroupDialog = (group: GroupData) => {
    setGroupToDelete(group);
    setDeleteGroupOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setDeletingGroup(true);
    try {
      const response = await fetch(`/api/groups/${groupToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to delete group');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      setLocalGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      setLocalGroupAssignments((prev) => prev.filter((a) => a.groupId !== groupToDelete.id));
      if (groupFilter === String(groupToDelete.id)) {
        setGroupFilter('all');
      }
      setDeleteGroupOpen(false);
      setGroupToDelete(null);
      setSuccessMessage('Group deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setErrorMessage('Failed to delete group');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingGroup(false);
    }
  };

  const openManageGroupMembers = async (group: GroupData) => {
    setManagingGroup(group);
    setGroupMemberSearchQuery('');
    setSelectedGroupMemberIds(new Set());
    setManageGroupOpen(true);
    setIsLoadingGroupMembers(true);

    try {
      const response = await fetch(`/api/groups/${group.id}`);
      if (response.ok) {
        const data = await response.json();
        setGroupDetailMembers(data.group.members || []);
      } else {
        setGroupDetailMembers([]);
      }
    } catch {
      setGroupDetailMembers([]);
    } finally {
      setIsLoadingGroupMembers(false);
    }
  };

  const handleAddGroupMembers = async () => {
    if (!managingGroup || selectedGroupMemberIds.size === 0) return;

    setIsAddingGroupMembers(true);
    try {
      const response = await fetch(`/api/groups/${managingGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: Array.from(selectedGroupMemberIds) }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to add members');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      // Refresh group members
      const detailResponse = await fetch(`/api/groups/${managingGroup.id}`);
      if (detailResponse.ok) {
        const data = await detailResponse.json();
        setGroupDetailMembers(data.group.members || []);
      }

      // Update member count and assignments
      const addedCount = selectedGroupMemberIds.size;
      setLocalGroups((prev) =>
        prev.map((g) =>
          g.id === managingGroup.id
            ? { ...g, memberCount: g.memberCount + addedCount }
            : g
        )
      );
      const newAssignments = Array.from(selectedGroupMemberIds).map((memberId) => ({
        memberId,
        groupId: managingGroup.id,
      }));
      setLocalGroupAssignments((prev) => [...prev, ...newAssignments]);

      setSelectedGroupMemberIds(new Set());
      setSuccessMessage(`Added ${addedCount} member${addedCount !== 1 ? 's' : ''} to group`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setErrorMessage('Failed to add members');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsAddingGroupMembers(false);
    }
  };

  const handleRemoveGroupMember = async (memberId: number) => {
    if (!managingGroup) return;

    setRemovingGroupMemberId(memberId);
    try {
      const response = await fetch(`/api/groups/${managingGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: [memberId] }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to remove member');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      setGroupDetailMembers((prev) => prev.filter((gm) => gm.member.id !== memberId));
      setLocalGroups((prev) =>
        prev.map((g) =>
          g.id === managingGroup.id
            ? { ...g, memberCount: Math.max(0, g.memberCount - 1) }
            : g
        )
      );
      setLocalGroupAssignments((prev) =>
        prev.filter((a) => !(a.groupId === managingGroup.id && a.memberId === memberId))
      );
    } catch {
      setErrorMessage('Failed to remove member');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setRemovingGroupMemberId(null);
    }
  };

  const toggleGroupMemberSelection = (memberId: number) => {
    setSelectedGroupMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  // Available members for adding to a group (approved members not already in the group)
  const availableGroupMembers = useMemo(() => {
    const groupMemberIds = new Set(groupDetailMembers.map((gm) => gm.member.id));
    return membersList.filter(
      (m) => m.member.status === 'approved' && !groupMemberIds.has(m.member.id)
    );
  }, [membersList, groupDetailMembers]);

  const filteredAvailableGroupMembers = useMemo(() => {
    if (!groupMemberSearchQuery) return availableGroupMembers;
    const q = groupMemberSearchQuery.toLowerCase();
    return availableGroupMembers.filter(
      (m) =>
        (m.user.name && m.user.name.toLowerCase().includes(q)) ||
        m.user.email.toLowerCase().includes(q)
    );
  }, [availableGroupMembers, groupMemberSearchQuery]);

  // The currently selected group object (for action buttons)
  const selectedGroup = useMemo(() => {
    if (groupFilter === 'all') return null;
    return localGroups.find((g) => g.id === parseInt(groupFilter)) || null;
  }, [groupFilter, localGroups]);

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setEmploymentStatusFilter('all');
    setMembershipStatusFilter('all');
    setLocalChapterFilter('all');
    setBargainingUnitFilter('all');
    setEmployerFilter('all');
  };

  // Check if any advanced filters are active
  const hasActiveAdvancedFilters = employmentStatusFilter !== 'all' ||
    membershipStatusFilter !== 'all' ||
    localChapterFilter !== 'all' ||
    bargainingUnitFilter !== 'all' ||
    employerFilter !== 'all';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all union members
          </p>
        </div>

        {/* Member Limit Warning (dismissible) */}
        {isOwner && memberUsage && memberUsage.isNearLimit && showLimitWarning && (
          <Card className={`mb-6 ${memberUsage.percentUsed >= 100 ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${memberUsage.percentUsed >= 100 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <AlertTriangle className={`h-5 w-5 ${memberUsage.percentUsed >= 100 ? 'text-red-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${memberUsage.percentUsed >= 100 ? 'text-red-900' : 'text-yellow-900'}`}>
                      {memberUsage.percentUsed >= 100
                        ? 'Membership Limit Reached'
                        : 'Approaching Membership Limit'}
                    </p>
                    <p className={`text-sm mt-1 ${memberUsage.percentUsed >= 100 ? 'text-red-700' : 'text-yellow-700'}`}>
                      {memberUsage.percentUsed >= 100
                        ? `Your ${memberUsage.tierName} plan has reached its limit of ${memberUsage.limit} approved members. Upgrade to approve more members.`
                        : `You have ${memberUsage.remaining} member slot${memberUsage.remaining !== 1 ? 's' : ''} remaining on your ${memberUsage.tierName} plan (${memberUsage.current}/${memberUsage.limit}).`}
                    </p>
                    <Link href={`/${slug}/billing`}>
                      <Button
                        size="sm"
                        className={`mt-3 ${memberUsage.percentUsed >= 100 ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                      >
                        Upgrade Plan
                      </Button>
                    </Link>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLimitWarning(false)}
                  className={`${memberUsage.percentUsed >= 100 ? 'text-red-600 hover:bg-red-100' : 'text-yellow-600 hover:bg-yellow-100'}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Capacity Progress Bar */}
        {isOwner && memberUsage && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Member Capacity ({memberUsage.tierName} Plan)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {memberUsage.current} / {memberUsage.limit} approved members
                  </span>
                  <span className={`font-medium ${
                    memberUsage.percentUsed >= 100
                      ? 'text-red-600'
                      : memberUsage.percentUsed >= 80
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {memberUsage.percentUsed}%
                  </span>
                </div>
                <Progress
                  value={Math.min(memberUsage.percentUsed, 100)}
                  className={`h-3 ${
                    memberUsage.percentUsed >= 100
                      ? '[&>div]:bg-red-500'
                      : memberUsage.percentUsed >= 80
                      ? '[&>div]:bg-yellow-500'
                      : '[&>div]:bg-green-500'
                  }`}
                />
                <p className="text-xs text-gray-500">
                  {memberUsage.remaining > 0
                    ? `${memberUsage.remaining} slot${memberUsage.remaining !== 1 ? 's' : ''} remaining`
                    : 'No slots remaining - upgrade to approve more members'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Stats Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${statusFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-700 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleFilterChange('all')}
          >
            <UsersIcon className="h-3.5 w-3.5 mr-1.5" />
            All: {membersList.length}
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${statusFilter === 'approved' ? 'ring-2 ring-green-500 bg-green-50 text-green-700 border-green-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleFilterChange('approved')}
          >
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            Approved: {approvedCount}
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50 text-yellow-700 border-yellow-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleFilterChange('pending')}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Pending: {pendingCount}
          </Badge>
          <Badge
            variant="outline"
            className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${statusFilter === 'admin' ? 'ring-2 ring-purple-500 bg-purple-50 text-purple-700 border-purple-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleFilterChange('admin')}
          >
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Admins: {adminCount}
          </Badge>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, phone, employer, job title, worksite, member ID, chapter, or unit..."
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
            {localGroups.length > 0 && (
              <Select value={groupFilter} onValueChange={(value) => { setGroupFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectSeparator />
                  {localGroups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name} ({g.memberCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Advanced Filters, Group Actions, and CSV Actions Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={hasActiveAdvancedFilters ? 'border-blue-500 text-blue-700' : ''}
              >
                {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
                {hasActiveAdvancedFilters && <span className="ml-2 bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">!</span>}
              </Button>
              {hasActiveAdvancedFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAdvancedFilters}
                  className="text-gray-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
              {/* Group action buttons when a group is selected */}
              {selectedGroup && isOwner && !isDemo && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditGroupDialog(selectedGroup)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Group
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openManageGroupMembers(selectedGroup)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Manage Members
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteGroupDialog(selectedGroup)}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Group
                  </Button>
                </>
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2">
                {!isDemo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCreateGroupDialog}
                    className="gap-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    New Group
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={filteredMembers.length === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <Card className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Employment Status
                  </label>
                  <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="term">Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Membership Status
                  </label>
                  <Select value={membershipStatusFilter} onValueChange={setMembershipStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Local Chapter
                  </label>
                  <Select value={localChapterFilter} onValueChange={setLocalChapterFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueLocalChapters.map(chapter => (
                        <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Bargaining Unit
                  </label>
                  <Select value={bargainingUnitFilter} onValueChange={setBargainingUnitFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueBargainingUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Employer
                  </label>
                  <Select value={employerFilter} onValueChange={setEmployerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueEmployers.map(employer => (
                        <SelectItem key={employer} value={employer}>{employer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {isOwner && selectedMembers.size > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedMembers.size} {selectedMembers.size === 1 ? 'member' : 'members'} selected
                    </p>
                    <p className="text-sm text-gray-600">
                      Choose an action to perform on selected members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-[200px] bg-white">
                      <SelectValue placeholder="Choose action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Approve Members</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span>Mark as Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="reject">
                        <div className="flex items-center gap-2">
                          <UserMinus className="h-4 w-4 text-orange-600" />
                          <span>Reject Members</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="delete">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4 text-red-600" />
                          <span>Delete Members</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || isBulkActionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isBulkActionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Apply Action'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMembers(new Set());
                      setBulkAction('');
                    }}
                    disabled={isBulkActionLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              {isOwner && paginatedMembers.some(m => m.member.role !== 'owner') && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      paginatedMembers.filter(m => m.member.role !== 'owner').length > 0 &&
                      paginatedMembers.filter(m => m.member.role !== 'owner').every(m => selectedMembers.has(m.member.id))
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    Select all on page ({selectedMembers.size} selected)
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
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    {/* Top row on mobile: checkbox + avatar + user info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checkbox for bulk selection */}
                      {isOwner && member.member.role !== 'owner' && (
                        <Checkbox
                          checked={selectedMembers.has(member.member.id)}
                          onCheckedChange={() => toggleSelectMember(member.member.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        />
                      )}

                      {/* Avatar and User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {getInitials(getUserDisplayName(member.user))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                            {getUserDisplayName(member.user)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{member.user.email}</p>
                          {getMemberPhone(member.member) && (
                            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{getMemberPhone(member.member)}</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500 sm:hidden">
                            {getMemberPhone(member.member) ? (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {getMemberPhone(member.member)}
                              </span>
                            ) : (
                              `Joined ${formatDate(member.member.joinedAt)}`
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Join date - desktop only, visible on hover */}
                      <span className="hidden sm:block text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex-shrink-0">
                        Joined {formatDate(member.member.joinedAt)}
                      </span>
                    </div>

                    {/* Tags and Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      {/* Role and Status Tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                            member.member.role === 'owner'
                              ? 'bg-blue-100 text-blue-700'
                              : member.member.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : member.member.role === 'election_committee'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {member.member.role === 'election_committee'
                            ? 'Election Committee'
                            : member.member.role.charAt(0).toUpperCase() + member.member.role.slice(1)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
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
                        {member.member.isDelinquent && (
                          <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Delinquent
                          </span>
                        )}
                      </div>

                      {/* Action buttons (owners only) */}
                      {isOwner && member.member.role !== 'owner' && (
                        <div className="flex flex-wrap gap-2">
                          {/* Approval buttons for pending members */}
                          {member.member.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproval(member.member.id, 'approved')}
                                disabled={loadingMembers[member.member.id]}
                                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                              >
                                {loadingMembers[member.member.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Approve</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleApproval(member.member.id, 'rejected')}
                                disabled={loadingMembers[member.member.id]}
                                className="flex-1 sm:flex-initial"
                              >
                                {loadingMembers[member.member.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Reject</span>
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
                                  <CheckCircle className="h-4 w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Approve</span>
                                </>
                              )}
                            </Button>
                          )}

                          {/* View Profile button */}
                          <Link href={`/${slug}/members/${member.member.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            >
                              <Eye className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>

                          {/* Edit button - always visible */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMember(member)}
                            disabled={loadingMembers[member.member.id]}
                          >
                            <Edit className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>

                          {/* Admin toggle for approved members (not available for election_committee) */}
                          {member.member.status === 'approved' && member.member.role !== 'election_committee' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAdmin(member)}
                                disabled={loadingMembers[member.member.id]}
                                className="hidden sm:inline-flex"
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
                              {/* Edit Permissions button for existing admins */}
                              {member.member.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditPermissions(member)}
                                  disabled={loadingMembers[member.member.id]}
                                  className="hidden sm:inline-flex bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                  title="Edit Permissions"
                                >
                                  <Settings2 className="h-4 w-4 mr-1" />
                                  Permissions
                                </Button>
                              )}
                            </>
                          )}

                          {/* Election Committee toggle for approved non-admin members */}
                          {member.member.status === 'approved' && member.member.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleElectionCommittee(member)}
                              disabled={loadingMembers[member.member.id]}
                              className={`hidden sm:inline-flex ${
                                member.member.role === 'election_committee'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                  : 'text-gray-700'
                              }`}
                            >
                              {loadingMembers[member.member.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : member.member.role === 'election_committee' ? (
                                <>
                                  <ClipboardList className="h-4 w-4 mr-1" />
                                  Remove EC
                                </>
                              ) : (
                                <>
                                  <ClipboardList className="h-4 w-4 mr-1" />
                                  Make EC
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

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
          <XCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Delete Single Member Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteMember}
        title="Delete Member"
        description={`Are you sure you want to delete ${memberToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={confirmBulkAction}
        title={
          pendingBulkAction === 'delete'
            ? 'Delete Members'
            : pendingBulkAction === 'approve'
            ? 'Approve Members'
            : pendingBulkAction === 'reject'
            ? 'Reject Members'
            : 'Mark Members as Pending'
        }
        description={
          pendingBulkAction === 'delete'
            ? `Are you sure you want to delete ${selectedMembers.size} ${selectedMembers.size === 1 ? 'member' : 'members'}? This action cannot be undone.`
            : pendingBulkAction === 'approve'
            ? `Are you sure you want to approve ${selectedMembers.size} ${selectedMembers.size === 1 ? 'member' : 'members'}?`
            : pendingBulkAction === 'reject'
            ? `Are you sure you want to reject ${selectedMembers.size} ${selectedMembers.size === 1 ? 'member' : 'members'}?`
            : `Are you sure you want to mark ${selectedMembers.size} ${selectedMembers.size === 1 ? 'member' : 'members'} as pending?`
        }
        confirmText={
          pendingBulkAction === 'delete'
            ? 'Delete'
            : pendingBulkAction === 'approve'
            ? 'Approve'
            : pendingBulkAction === 'reject'
            ? 'Reject'
            : 'Mark as Pending'
        }
        cancelText="Cancel"
        variant={pendingBulkAction === 'delete' ? 'destructive' : 'default'}
      />

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={memberToEdit}
        unionId={union.id}
        onSave={handleEditSave}
      />

      {/* Admin Permissions Dialog */}
      <AdminPermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        mode={permissionsDialogMode}
        memberName={memberForPermissions ? getUserDisplayName(memberForPermissions.user) : ''}
        memberId={memberForPermissions?.member.id || 0}
        currentPermissions={memberForPermissions?.member.adminPermissions}
        onConfirm={handlePermissionsConfirm}
      />

      {/* Create / Edit Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Update the group name and description.'
                : 'Create a new group to organize your members.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Name *</Label>
              <Input
                id="group-name"
                placeholder="e.g., Executive Committee"
                value={groupFormName}
                onChange={(e) => {
                  setGroupFormName(e.target.value);
                  setGroupFormError('');
                }}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                placeholder="Optional description for this group..."
                value={groupFormDescription}
                onChange={(e) => setGroupFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            {groupFormError && (
              <p className="text-sm text-red-600">{groupFormError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateGroupOpen(false)}
              disabled={savingGroup}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={savingGroup}>
              {savingGroup ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingGroup ? (
                'Save Changes'
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteGroupOpen}
        onOpenChange={setDeleteGroupOpen}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        description={
          groupToDelete
            ? `Are you sure you want to delete "${groupToDelete.name}"? This group has ${groupToDelete.memberCount} ${groupToDelete.memberCount === 1 ? 'member' : 'members'}. Members will not be deleted, only removed from this group.`
            : 'Are you sure you want to delete this group?'
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={deletingGroup}
      />

      {/* Manage Group Members Dialog */}
      <Dialog open={manageGroupOpen} onOpenChange={setManageGroupOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Manage Members — {managingGroup?.name}
            </DialogTitle>
            <DialogDescription>
              Add or remove members from this group.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-2">
            {/* Current Members */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Current Members ({groupDetailMembers.length})
              </h4>
              {isLoadingGroupMembers ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : groupDetailMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  No members in this group yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {groupDetailMembers.map((gm) => (
                    <div
                      key={gm.member.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {gm.user.name || gm.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {gm.user.email}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          gm.member.role === 'owner'
                            ? 'bg-purple-100 text-purple-700'
                            : gm.member.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {gm.member.role.charAt(0).toUpperCase() + gm.member.role.slice(1)}
                        </span>
                      </div>
                      {!isDemo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                          onClick={() => handleRemoveGroupMember(gm.member.id)}
                          disabled={removingGroupMemberId === gm.member.id}
                        >
                          {removingGroupMemberId === gm.member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Members */}
            {!isDemo && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Members
                </h4>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search members to add..."
                    value={groupMemberSearchQuery}
                    onChange={(e) => setGroupMemberSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filteredAvailableGroupMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3">
                    {groupMemberSearchQuery
                      ? 'No matching members found'
                      : 'All approved members are already in this group'}
                  </p>
                ) : (
                  <>
                    <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                      {filteredAvailableGroupMembers.map((m) => (
                        <label
                          key={m.member.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedGroupMemberIds.has(m.member.id)}
                            onCheckedChange={() => toggleGroupMemberSelection(m.member.id)}
                          />
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {m.user.name || m.user.email}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {m.user.email}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              m.member.role === 'owner'
                                ? 'bg-purple-100 text-purple-700'
                                : m.member.role === 'admin'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {m.member.role.charAt(0).toUpperCase() + m.member.role.slice(1)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedGroupMemberIds.size > 0 && (
                      <div className="mt-3">
                        <Button
                          onClick={handleAddGroupMembers}
                          disabled={isAddingGroupMembers}
                          size="sm"
                        >
                          {isAddingGroupMembers ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add {selectedGroupMemberIds.size} Selected
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
