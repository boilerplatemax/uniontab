'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, Trash2, UserPlus, Search, Users } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StewardAssignment {
  id: number;
  scopeType: string;
  scopeValue: string;
  assignedAt: string;
  memberId: number;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberEmail: string | null;
  memberPhone: string | null;
  memberProfilePhotoUrl: string | null;
  userName: string | null;
  userEmail: string;
}

interface ScopeValues {
  bargaining_unit: string[];
  department: string[];
  sub_unit: string[];
}

interface MemberOption {
  member: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    personalEmail: string | null;
    profilePhotoUrl: string | null;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

const SCOPE_LABELS: Record<string, string> = {
  bargaining_unit: 'Bargaining Unit',
  department: 'Department',
  sub_unit: 'Sub-Unit',
};

interface StewardsTabProps {
  unionId: number;
}

export function StewardsTab({ unionId }: StewardsTabProps) {
  const { data: assignments, mutate: mutateAssignments } = useSWR<StewardAssignment[]>(
    `/api/steward-assignments?unionId=${unionId}`,
    fetcher
  );
  const { data: scopes } = useSWR<ScopeValues>(
    `/api/steward-assignments/scopes?unionId=${unionId}`,
    fetcher
  );

  const [scopeType, setScopeType] = useState('');
  const [scopeValue, setScopeValue] = useState('');
  const [customScopeValue, setCustomScopeValue] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MemberOption[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [useCustomValue, setUseCustomValue] = useState(false);

  const scopeValues = scopes ? (scopes[scopeType as keyof ScopeValues] || []) : [];
  const effectiveScopeValue = useCustomValue ? customScopeValue.trim() : scopeValue;

  // Search members
  useEffect(() => {
    if (memberSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/members/list?unionId=${unionId}&status=approved`);
        if (res.ok) {
          const allMembers = await res.json();
          const query = memberSearch.toLowerCase();
          const filtered = allMembers
            .filter((m: any) => {
              const name = (m.user?.name || '').toLowerCase();
              const firstName = (m.member?.firstName || '').toLowerCase();
              const lastName = (m.member?.lastName || '').toLowerCase();
              const email = (m.user?.email || '').toLowerCase();
              return name.includes(query) || firstName.includes(query) || lastName.includes(query) || email.includes(query);
            })
            .slice(0, 10)
            .map((m: any) => ({
              member: {
                id: m.member.id,
                firstName: m.member.firstName,
                lastName: m.member.lastName,
                personalEmail: m.member.personalEmail,
                profilePhotoUrl: m.member.profilePhotoUrl,
              },
              user: {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
              },
            }));
          setSearchResults(filtered);
        }
      } catch {
        // silently fail search
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [memberSearch, unionId]);

  const handleAssign = async () => {
    if (!scopeType || !effectiveScopeValue || !selectedMember) {
      setError('Please select a scope type, value, and member');
      return;
    }

    setAssigning(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/steward-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          memberId: selectedMember.member.id,
          scopeType,
          scopeValue: effectiveScopeValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign steward');
      }

      await mutateAssignments();
      setSelectedMember(null);
      setMemberSearch('');
      setSearchResults([]);
      setScopeValue('');
      setCustomScopeValue('');
      setSuccess('Steward assigned successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    setError('');

    try {
      const res = await fetch(`/api/steward-assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove steward');
      }

      await mutateAssignments();
      setSuccess('Steward removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const getStewardName = (a: StewardAssignment) => {
    if (a.memberFirstName || a.memberLastName) {
      return `${a.memberFirstName || ''} ${a.memberLastName || ''}`.trim();
    }
    return a.userName || a.userEmail;
  };

  const getInitials = (a: StewardAssignment) => {
    const name = getStewardName(a);
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Assign Steward Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Steward
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">{success}</div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Scope Type */}
            <div className="space-y-2">
              <Label>Scope Type</Label>
              <Select value={scopeType} onValueChange={(v) => { setScopeType(v); setScopeValue(''); setCustomScopeValue(''); setUseCustomValue(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bargaining_unit">Bargaining Unit</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="sub_unit">Sub-Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scope Value */}
            <div className="space-y-2">
              <Label>Scope Value</Label>
              {scopeType && scopeValues.length > 0 && !useCustomValue ? (
                <div className="space-y-2">
                  <Select value={scopeValue} onValueChange={setScopeValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select value..." />
                    </SelectTrigger>
                    <SelectContent>
                      {scopeValues.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => { setUseCustomValue(true); setScopeValue(''); }}
                  >
                    Or enter a custom value
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder={scopeType ? `Enter ${SCOPE_LABELS[scopeType] || 'value'}...` : 'Select scope type first'}
                    value={customScopeValue}
                    onChange={(e) => setCustomScopeValue(e.target.value)}
                    disabled={!scopeType}
                  />
                  {scopeType && scopeValues.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => { setUseCustomValue(false); setCustomScopeValue(''); }}
                    >
                      Choose from existing values
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Member Search */}
          <div className="space-y-2">
            <Label>Assign Member as Steward</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setSelectedMember(null); }}
                className="pl-9"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Selected Member */}
            {selectedMember && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Avatar className="h-8 w-8">
                  {selectedMember.member.profilePhotoUrl && (
                    <AvatarImage src={selectedMember.member.profilePhotoUrl} />
                  )}
                  <AvatarFallback className="text-xs">
                    {(selectedMember.user.name || selectedMember.user.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedMember.member.firstName || selectedMember.member.lastName
                      ? `${selectedMember.member.firstName || ''} ${selectedMember.member.lastName || ''}`.trim()
                      : selectedMember.user.name || selectedMember.user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{selectedMember.user.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedMember(null); setMemberSearch(''); }}
                >
                  Change
                </Button>
              </div>
            )}

            {/* Search Results Dropdown */}
            {!selectedMember && searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-white shadow-sm">
                {searchResults.map((m) => (
                  <button
                    key={m.member.id}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                    onClick={() => { setSelectedMember(m); setSearchResults([]); setMemberSearch(''); }}
                  >
                    <Avatar className="h-8 w-8">
                      {m.member.profilePhotoUrl && <AvatarImage src={m.member.profilePhotoUrl} />}
                      <AvatarFallback className="text-xs">
                        {(m.user.name || m.user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.member.firstName || m.member.lastName
                          ? `${m.member.firstName || ''} ${m.member.lastName || ''}`.trim()
                          : m.user.name || m.user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleAssign}
            disabled={assigning || !scopeType || !effectiveScopeValue || !selectedMember}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {assigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Steward
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Steward Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!assignments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No stewards assigned yet</p>
              <p className="text-sm mt-1">Use the form above to assign stewards to organizational units</p>
            </div>
          ) : (
            <div className="divide-y">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <Avatar className="h-10 w-10">
                    {a.memberProfilePhotoUrl && <AvatarImage src={a.memberProfilePhotoUrl} />}
                    <AvatarFallback>{getInitials(a)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{getStewardName(a)}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {a.memberEmail || a.userEmail}
                      {a.memberPhone && ` \u00B7 ${a.memberPhone}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {SCOPE_LABELS[a.scopeType] || a.scopeType}: {a.scopeValue}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(a.id)}
                    disabled={deleting === a.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                  >
                    {deleting === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
