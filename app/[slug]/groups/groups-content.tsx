'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Plus,
  Search,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  X,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import type { Union, Member } from '@/lib/db/schema';

interface GroupData {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
}

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
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

interface GroupsContentProps {
  slug: string;
  union: Union;
  groups: GroupData[];
  members: MemberData[];
  isDemo: boolean;
}

export function GroupsContent({ slug, union, groups: initialGroups, members, isDemo }: GroupsContentProps) {
  const [groups, setGroups] = useState<GroupData[]>(initialGroups);
  const [searchQuery, setSearchQuery] = useState('');

  // Create/Edit dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manage members dialog state
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [managingGroup, setManagingGroup] = useState<GroupData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupDetailMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<number | null>(null);

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  // Available members (not already in the group)
  const availableMembers = useMemo(() => {
    const groupMemberIds = new Set(groupMembers.map((gm) => gm.member.id));
    return members.filter((m) => !groupMemberIds.has(m.member.id));
  }, [members, groupMembers]);

  // Filter available members by search
  const filteredAvailableMembers = useMemo(() => {
    if (!memberSearchQuery) return availableMembers;
    const q = memberSearchQuery.toLowerCase();
    return availableMembers.filter(
      (m) =>
        (m.user.name && m.user.name.toLowerCase().includes(q)) ||
        m.user.email.toLowerCase().includes(q)
    );
  }, [availableMembers, memberSearchQuery]);

  // ── Create / Edit Group ──────────────────────────────────────────────

  const openCreateDialog = () => {
    setEditingGroup(null);
    setFormName('');
    setFormDescription('');
    setFormError('');
    setCreateDialogOpen(true);
  };

  const openEditDialog = (group: GroupData) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormDescription(group.description || '');
    setFormError('');
    setCreateDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!formName.trim()) {
      setFormError('Group name is required');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (editingGroup) {
        // Update existing group
        const response = await fetch(`/api/groups/${editingGroup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim() || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            setFormError(data.error || 'A group with this name already exists');
          } else {
            setFormError(data.error || 'Failed to update group');
          }
          return;
        }

        const data = await response.json();
        setGroups((prev) =>
          prev.map((g) =>
            g.id === editingGroup.id
              ? { ...g, name: data.group.name, description: data.group.description, updatedAt: data.group.updatedAt }
              : g
          )
        );
      } else {
        // Create new group
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unionId: union.id,
            name: formName.trim(),
            description: formDescription.trim() || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            setFormError(data.error || 'A group with this name already exists');
          } else {
            setFormError(data.error || 'Failed to create group');
          }
          return;
        }

        const data = await response.json();
        setGroups((prev) => [...prev, { ...data.group, memberCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setCreateDialogOpen(false);
    } catch (error) {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete Group ─────────────────────────────────────────────────────

  const openDeleteDialog = (group: GroupData) => {
    setGroupToDelete(group);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/groups/${groupToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to delete group');
        return;
      }

      setGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    } catch (error) {
      alert('Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Manage Members ───────────────────────────────────────────────────

  const openManageMembers = async (group: GroupData) => {
    setManagingGroup(group);
    setMemberSearchQuery('');
    setSelectedMemberIds(new Set());
    setManageMembersOpen(true);
    setIsLoadingGroupMembers(true);

    try {
      const response = await fetch(`/api/groups/${group.id}`);
      if (response.ok) {
        const data = await response.json();
        setGroupMembers(data.group.members || []);
      } else {
        setGroupMembers([]);
      }
    } catch {
      setGroupMembers([]);
    } finally {
      setIsLoadingGroupMembers(false);
    }
  };

  const handleAddMembers = async () => {
    if (!managingGroup || selectedMemberIds.size === 0) return;

    setIsAddingMembers(true);
    try {
      const response = await fetch(`/api/groups/${managingGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: Array.from(selectedMemberIds) }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to add members');
        return;
      }

      // Refresh group members
      const detailResponse = await fetch(`/api/groups/${managingGroup.id}`);
      if (detailResponse.ok) {
        const data = await detailResponse.json();
        setGroupMembers(data.group.members || []);
      }

      // Update member count in the groups list
      setGroups((prev) =>
        prev.map((g) =>
          g.id === managingGroup.id
            ? { ...g, memberCount: g.memberCount + selectedMemberIds.size }
            : g
        )
      );

      setSelectedMemberIds(new Set());
    } catch {
      alert('Failed to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!managingGroup) return;

    setIsRemovingMember(memberId);
    try {
      const response = await fetch(`/api/groups/${managingGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: [memberId] }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to remove member');
        return;
      }

      setGroupMembers((prev) => prev.filter((gm) => gm.member.id !== memberId));

      // Update member count in the groups list
      setGroups((prev) =>
        prev.map((g) =>
          g.id === managingGroup.id
            ? { ...g, memberCount: Math.max(0, g.memberCount - 1) }
            : g
        )
      );
    } catch {
      alert('Failed to remove member');
    } finally {
      setIsRemovingMember(null);
    }
  };

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-500 text-white text-xs">Owner</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500 text-white text-xs">Admin</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Member</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Groups</h1>
          <p className="text-gray-600">
            Create and manage custom groups to organize your members
          </p>
        </div>
        {!isDemo && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        )}
      </div>

      {/* Search */}
      {groups.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No groups found' : 'No groups yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first group to organize members into categories like departments, committees, or teams.'}
          </p>
          {!searchQuery && !isDemo && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                  </div>
                  {!isDemo && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(group)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openManageMembers(group)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(group)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormError('');
                }}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                placeholder="Optional description for this group..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={isSaving}>
              {isSaving ? (
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        description={
          groupToDelete
            ? `Are you sure you want to delete "${groupToDelete.name}"? This group has ${groupToDelete.memberCount} ${groupToDelete.memberCount === 1 ? 'member' : 'members'}. Members will not be deleted, only removed from this group.`
            : 'Are you sure you want to delete this group?'
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Manage Members Dialog */}
      <Dialog open={manageMembersOpen} onOpenChange={setManageMembersOpen}>
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
                <Users className="h-4 w-4" />
                Current Members ({groupMembers.length})
              </h4>
              {isLoadingGroupMembers ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : groupMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  No members in this group yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {groupMembers.map((gm) => (
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
                        {getRoleBadge(gm.member.role)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => handleRemoveMember(gm.member.id)}
                        disabled={isRemovingMember === gm.member.id}
                      >
                        {isRemovingMember === gm.member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Members */}
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
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filteredAvailableMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  {memberSearchQuery
                    ? 'No matching members found'
                    : 'All members are already in this group'}
                </p>
              ) : (
                <>
                  <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                    {filteredAvailableMembers.map((m) => (
                      <label
                        key={m.member.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedMemberIds.has(m.member.id)}
                          onCheckedChange={() => toggleMemberSelection(m.member.id)}
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
                          {getRoleBadge(m.member.role)}
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedMemberIds.size > 0 && (
                    <div className="mt-3">
                      <Button
                        onClick={handleAddMembers}
                        disabled={isAddingMembers}
                        size="sm"
                      >
                        {isAddingMembers ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add {selectedMemberIds.size} Selected
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
