'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, UserCheck, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface Member {
  id: number;
  userId: number;
  role: string;
  status: string;
  employer: string | null;
  jobTitle: string | null;
  worksite: string | null;
  employmentStatus: string | null;
  localChapter: string | null;
  bargainingUnit: string | null;
  user: {
    id: number | null;
    name: string | null;
    email: string | null;
  } | null;
}

interface MeetingParticipantSelectorProps {
  unionId: number;
  participantMode: 'all' | 'selected';
  onParticipantModeChange: (mode: 'all' | 'selected') => void;
  selectedMemberIds: number[];
  onSelectedMembersChange: (memberIds: number[]) => void;
  disabled?: boolean;
}

export function MeetingParticipantSelector({
  unionId,
  participantMode,
  onParticipantModeChange,
  selectedMemberIds,
  onSelectedMembersChange,
  disabled = false,
}: MeetingParticipantSelectorProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [employerFilter, setEmployerFilter] = useState('all');
  const [worksiteFilter, setWorksiteFilter] = useState('all');
  const [localChapterFilter, setLocalChapterFilter] = useState('all');
  const [bargainingUnitFilter, setBargainingUnitFilter] = useState('all');

  useEffect(() => {
    fetchMembers();
  }, [unionId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/list?unionId=${unionId}&status=approved`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const uniqueEmployers = useMemo(() => {
    const employers = new Set<string>();
    members.forEach(m => {
      if (m.employer) employers.add(m.employer);
    });
    return Array.from(employers).sort();
  }, [members]);

  const uniqueWorksites = useMemo(() => {
    const worksites = new Set<string>();
    members.forEach(m => {
      if (m.worksite) worksites.add(m.worksite);
    });
    return Array.from(worksites).sort();
  }, [members]);

  const uniqueLocalChapters = useMemo(() => {
    const chapters = new Set<string>();
    members.forEach(m => {
      if (m.localChapter) chapters.add(m.localChapter);
    });
    return Array.from(chapters).sort();
  }, [members]);

  const uniqueBargainingUnits = useMemo(() => {
    const units = new Set<string>();
    members.forEach(m => {
      if (m.bargainingUnit) units.add(m.bargainingUnit);
    });
    return Array.from(units).sort();
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        (m.user?.name?.toLowerCase().includes(searchLower)) ||
        (m.user?.email?.toLowerCase().includes(searchLower)) ||
        m.employer?.toLowerCase().includes(searchLower) ||
        m.jobTitle?.toLowerCase().includes(searchLower);

      const matchesEmployer = employerFilter === 'all' || m.employer === employerFilter;
      const matchesWorksite = worksiteFilter === 'all' || m.worksite === worksiteFilter;
      const matchesLocalChapter = localChapterFilter === 'all' || m.localChapter === localChapterFilter;
      const matchesBargainingUnit = bargainingUnitFilter === 'all' || m.bargainingUnit === bargainingUnitFilter;

      return matchesSearch && matchesEmployer && matchesWorksite && matchesLocalChapter && matchesBargainingUnit;
    });
  }, [members, searchQuery, employerFilter, worksiteFilter, localChapterFilter, bargainingUnitFilter]);

  const hasActiveFilters = employerFilter !== 'all' || worksiteFilter !== 'all' ||
    localChapterFilter !== 'all' || bargainingUnitFilter !== 'all';

  const clearFilters = () => {
    setEmployerFilter('all');
    setWorksiteFilter('all');
    setLocalChapterFilter('all');
    setBargainingUnitFilter('all');
  };

  const getUserDisplayName = (user: { name: string | null; email: string | null } | null) => {
    if (!user) return 'Unknown';
    return user.name || user.email || 'Unknown';
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleMember = (memberId: number) => {
    if (selectedMemberIds.includes(memberId)) {
      onSelectedMembersChange(selectedMemberIds.filter(id => id !== memberId));
    } else {
      onSelectedMembersChange([...selectedMemberIds, memberId]);
    }
  };

  const selectAll = () => {
    const allFilteredIds = filteredMembers.map(m => m.id);
    const newSelected = new Set([...selectedMemberIds, ...allFilteredIds]);
    onSelectedMembersChange(Array.from(newSelected));
  };

  const deselectAll = () => {
    const filteredIds = new Set(filteredMembers.map(m => m.id));
    onSelectedMembersChange(selectedMemberIds.filter(id => !filteredIds.has(id)));
  };

  const selectByFilter = (filterType: string, filterValue: string) => {
    const matchingMembers = members.filter(m => {
      switch (filterType) {
        case 'employer': return m.employer === filterValue;
        case 'worksite': return m.worksite === filterValue;
        case 'localChapter': return m.localChapter === filterValue;
        case 'bargainingUnit': return m.bargainingUnit === filterValue;
        default: return false;
      }
    });
    const matchingIds = matchingMembers.map(m => m.id);
    const newSelected = new Set([...selectedMemberIds, ...matchingIds]);
    onSelectedMembersChange(Array.from(newSelected));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Meeting Participants</Label>
        <p className="text-sm text-gray-500 mt-1">
          Choose who can view and participate in this meeting
        </p>
      </div>

      <RadioGroup
        value={participantMode}
        onValueChange={(value) => onParticipantModeChange(value as 'all' | 'selected')}
        disabled={disabled}
        className="space-y-2"
      >
        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
          <RadioGroupItem value="all" id="all-members" />
          <Label htmlFor="all-members" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-medium">All Approved Members</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              All approved union members can view and receive invites for this meeting
            </p>
          </Label>
        </div>

        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
          <RadioGroupItem value="selected" id="selected-members" />
          <Label htmlFor="selected-members" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Selected Members Only</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Only selected members can view and receive invites for this meeting
            </p>
          </Label>
        </div>
      </RadioGroup>

      {participantMode === 'selected' && (
        <div className="border rounded-lg p-4 space-y-4">
          {/* Selection summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} selected
              </Badge>
              {selectedMemberIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectedMembersChange([])}
                  className="text-red-600 hover:text-red-700 h-auto py-1"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={disabled || loading}
              >
                Select visible
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deselectAll}
                disabled={disabled || loading}
              >
                Deselect visible
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, employer, job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={disabled}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? 'border-blue-500 text-blue-700' : ''}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
                )}
                {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                {uniqueEmployers.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500">Employer</Label>
                    <Select value={employerFilter} onValueChange={setEmployerFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All employers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All employers</SelectItem>
                        {uniqueEmployers.map(employer => (
                          <SelectItem key={employer} value={employer}>{employer}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {employerFilter !== 'all' && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => selectByFilter('employer', employerFilter)}
                        className="text-xs h-auto p-0 mt-1"
                      >
                        Select all from {employerFilter}
                      </Button>
                    )}
                  </div>
                )}

                {uniqueWorksites.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500">Worksite</Label>
                    <Select value={worksiteFilter} onValueChange={setWorksiteFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All worksites" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All worksites</SelectItem>
                        {uniqueWorksites.map(worksite => (
                          <SelectItem key={worksite} value={worksite}>{worksite}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {worksiteFilter !== 'all' && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => selectByFilter('worksite', worksiteFilter)}
                        className="text-xs h-auto p-0 mt-1"
                      >
                        Select all from {worksiteFilter}
                      </Button>
                    )}
                  </div>
                )}

                {uniqueLocalChapters.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500">Local Chapter</Label>
                    <Select value={localChapterFilter} onValueChange={setLocalChapterFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All chapters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All chapters</SelectItem>
                        {uniqueLocalChapters.map(chapter => (
                          <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {localChapterFilter !== 'all' && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => selectByFilter('localChapter', localChapterFilter)}
                        className="text-xs h-auto p-0 mt-1"
                      >
                        Select all from {localChapterFilter}
                      </Button>
                    )}
                  </div>
                )}

                {uniqueBargainingUnits.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500">Bargaining Unit</Label>
                    <Select value={bargainingUnitFilter} onValueChange={setBargainingUnitFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All units" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All units</SelectItem>
                        {uniqueBargainingUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {bargainingUnitFilter !== 'all' && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => selectByFilter('bargainingUnit', bargainingUnitFilter)}
                        className="text-xs h-auto p-0 mt-1"
                      >
                        Select all from {bargainingUnitFilter}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Member list */}
          <div className="h-64 border rounded-lg overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No members found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredMembers.map(member => {
                  const displayName = getUserDisplayName(member.user);
                  const email = member.user?.email || '';
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedMemberIds.includes(member.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => !disabled && toggleMember(member.id)}
                    >
                      <Checkbox
                        checked={selectedMemberIds.includes(member.id)}
                        disabled={disabled}
                        className="pointer-events-none"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {email}
                          {member.jobTitle ? ` • ${member.jobTitle}` : ''}
                        </p>
                      </div>
                      {member.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Showing {filteredMembers.length} of {members.length} approved members
          </p>
        </div>
      )}
    </div>
  );
}
