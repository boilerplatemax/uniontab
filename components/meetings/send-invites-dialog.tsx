'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Users, CheckCircle, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface Member {
  member: {
    id: number;
    userId: number;
    role: string;
    status: string;
    profilePhotoUrl?: string | null;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface SendInvitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: number;
  meetingTitle: string;
  unionId: number;
  participantMode?: string;
}

type RecipientFilter = 'all' | 'approved' | 'admin' | 'pending' | 'rejected' | 'custom';
type SortKey = 'name' | 'email' | 'role' | 'status';

export function SendInvitesDialog({ open, onOpenChange, meetingId, meetingTitle, unionId, participantMode }: SendInvitesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('approved');
  const [existingInvites, setExistingInvites] = useState<number>(0);
  const [participantCount, setParticipantCount] = useState<number>(0);

  // Member selection state
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      fetchExistingInvites();
      if (participantMode === 'selected') {
        fetchParticipantCount();
      } else {
        fetchMembers();
      }
    }
  }, [open, meetingId, participantMode]);

  const fetchExistingInvites = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/invites`);
      const data = await response.json();
      if (data.success) {
        setExistingInvites(data.invites.length);
      }
    } catch (err) {
      console.error('Failed to fetch existing invites:', err);
    }
  };

  const fetchParticipantCount = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants`);
      const data = await response.json();
      if (data.success) {
        setParticipantCount(data.participants.length);
      }
    } catch (err) {
      console.error('Failed to fetch participant count:', err);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/members/list?unionId=${unionId}`);
      const data = await response.json();
      if (data.success) {
        // Transform flat format { id, userId, role, status, user } → nested { member, user }
        const transformed: Member[] = data.members.map((m: any) => ({
          member: { id: m.id, userId: m.userId, role: m.role, status: m.status, profilePhotoUrl: m.profilePhotoUrl },
          user: { id: m.user.id, name: m.user.name, email: m.user.email },
        }));
        setMembers(transformed);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const getUserDisplayName = (user: { name: string | null; email: string }) =>
    user.name || user.email;

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSort = (column: SortKey) => {
    if (sortBy === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const filteredMembers = useMemo(() => {
    let filtered = members.filter(m => {
      let matchesFilter = true;
      if (recipientFilter === 'approved') {
        matchesFilter = m.member.status === 'approved';
      } else if (recipientFilter === 'admin') {
        matchesFilter = m.member.role === 'admin';
      } else if (recipientFilter === 'pending') {
        matchesFilter = m.member.status === 'pending';
      } else if (recipientFilter === 'rejected') {
        matchesFilter = m.member.status === 'rejected';
      }
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        getUserDisplayName(m.user).toLowerCase().includes(searchLower) ||
        m.user.email.toLowerCase().includes(searchLower);
      return matchesFilter && matchesSearch;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = getUserDisplayName(a.user).localeCompare(getUserDisplayName(b.user));
      else if (sortBy === 'email') cmp = a.user.email.localeCompare(b.user.email);
      else if (sortBy === 'role') cmp = a.member.role.localeCompare(b.member.role);
      else if (sortBy === 'status') cmp = a.member.status.localeCompare(b.member.status);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return filtered;
  }, [members, recipientFilter, searchQuery, sortBy, sortDirection]);

  const actualRecipients = useMemo(() => {
    if (recipientFilter === 'custom') {
      return members.filter(m => selectedMembers.has(m.member.id));
    }
    return filteredMembers;
  }, [recipientFilter, members, selectedMembers, filteredMembers]);

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.member.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const body: Record<string, unknown> = { recipientFilter };
    if (recipientFilter === 'custom') {
      body.memberIds = Array.from(selectedMembers);
    }

    try {
      const response = await fetch(`/api/meetings/${meetingId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invites');
      }

      setSuccess(data.message);
      fetchExistingInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortBy === col ? (
      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Meeting Invites
          </DialogTitle>
          <DialogDescription>
            Send email invitations for: <strong>{meetingTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          {existingInvites > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
              {existingInvites} invite(s) already sent. New invites will only be sent to members who haven&apos;t received one.
            </div>
          )}

          {participantMode === 'selected' ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  This meeting is set to <strong>selected participants only</strong>.
                  {participantCount > 0
                    ? ` ${participantCount} member${participantCount !== 1 ? 's' : ''} will receive invites.`
                    : ' No participants have been selected yet.'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                To change who receives invites, edit the meeting and modify the participant selection.
              </p>
            </div>
          ) : (
            <>
              {/* Recipient filter row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Send to:</Label>
                  {loadingMembers ? (
                    <div className="text-sm text-gray-500">Loading members…</div>
                  ) : (
                    <Select
                      value={recipientFilter}
                      onValueChange={(value: RecipientFilter) => {
                        setRecipientFilter(value);
                        if (value !== 'custom') setSelectedMembers(new Set());
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members ({members.length})</SelectItem>
                        <SelectItem value="approved">
                          Approved Members ({members.filter(m => m.member.status === 'approved').length})
                        </SelectItem>
                        <SelectItem value="admin">
                          Admins Only ({members.filter(m => m.member.role === 'admin').length})
                        </SelectItem>
                        <SelectItem value="pending">
                          Pending Members ({members.filter(m => m.member.status === 'pending').length})
                        </SelectItem>
                        <SelectItem value="rejected">
                          Rejected Members ({members.filter(m => m.member.status === 'rejected').length})
                        </SelectItem>
                        <SelectItem value="custom">Custom Selection</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Recipient count */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col justify-center">
                  <p className="text-sm font-medium text-blue-900">
                    {actualRecipients.length} {actualRecipients.length === 1 ? 'recipient' : 'recipients'} selected
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {actualRecipients.length === 0
                      ? 'No recipients selected'
                      : recipientFilter === 'custom'
                        ? `${selectedMembers.size} custom selected`
                        : `Using ${recipientFilter} filter`}
                  </p>
                </div>
              </div>

              {/* Custom selection table */}
              {recipientFilter === 'custom' && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Choose individual members</h3>
                    <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll}>
                      {selectedMembers.size === filteredMembers.length && filteredMembers.length > 0
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name or email…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Table */}
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left w-10">
                            <Checkbox
                              checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </th>
                          <th className="px-3 py-2 w-10" />
                          <th
                            className="px-3 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-1">Name <SortIcon col="name" /></div>
                          </th>
                          <th
                            className="px-3 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('role')}
                          >
                            <div className="flex items-center gap-1">Role <SortIcon col="role" /></div>
                          </th>
                          <th
                            className="px-3 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-1">Status <SortIcon col="status" /></div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No members found</td>
                          </tr>
                        ) : (
                          filteredMembers.map(m => (
                            <tr
                              key={m.member.id}
                              className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedMembers.has(m.member.id) ? 'bg-blue-50' : ''}`}
                              onClick={() => toggleMemberSelection(m.member.id)}
                            >
                              <td className="px-3 py-2">
                                <Checkbox
                                  checked={selectedMembers.has(m.member.id)}
                                  onCheckedChange={() => toggleMemberSelection(m.member.id)}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Avatar className="h-7 w-7">
                                  {m.member.profilePhotoUrl && (
                                    <AvatarImage src={m.member.profilePhotoUrl} alt={getUserDisplayName(m.user)} />
                                  )}
                                  <AvatarFallback className="text-xs">
                                    {getInitials(getUserDisplayName(m.user))}
                                  </AvatarFallback>
                                </Avatar>
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-medium text-gray-900">{getUserDisplayName(m.user)}</p>
                                <p className="text-xs text-gray-500">{m.user.email}</p>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  m.member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                  m.member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {m.member.role.charAt(0).toUpperCase() + m.member.role.slice(1)}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  m.member.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  m.member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {m.member.status.charAt(0).toUpperCase() + m.member.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="submit"
              disabled={loading || (recipientFilter === 'custom' && selectedMembers.size === 0)}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              {loading ? 'Sending…' : 'Send Invites'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
