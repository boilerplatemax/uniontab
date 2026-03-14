'use client';

import { useEffect, useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  CheckCircle,
  UserCheck,
  AlertCircle,
  Loader2,
  ClipboardList,
  Search,
  UserX,
  Monitor,
  MapPin,
  X,
} from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VoterRollData {
  electionId: number;
  electionTitle: string;
  electionStatus: string;
  onlineVoters: {
    voteId: number;
    votedAt: string;
    displayName: string;
    memberId: string | null;
  }[];
  inPersonVoters: {
    id: number;
    memberId: number;
    markedAt: string;
    notes: string | null;
    displayName: string;
    memberIdNumber: string | null;
    markedBy: string;
  }[];
  totalOnlineVotes: number;
  totalInPersonVotes: number;
  totalVotes: number;
}

interface MemberOption {
  memberId: number;
  displayName: string;
  memberIdNumber: string | null;
}

interface Election {
  id: number;
  title: string;
  status: string;
  slug: string;
  openTime: string;
  closeTime: string;
  _count: { votes: number };
}

const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function ElectionCommitteeElectionContent({
  slug,
  electionId,
}: {
  slug: string;
  electionId: number;
}) {
  const [unionId, setUnionId] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [election, setElection] = useState<Election | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const teamRes = await fetch('/api/team');
        if (!teamRes.ok) return;
        const teamData = await teamRes.json();
        setUnionId(teamData.id);

        const electionsRes = await fetch(`/api/elections/list?unionId=${teamData.id}`);
        if (!electionsRes.ok) return;
        const electionsData = await electionsRes.json();

        setIsAuthorized(electionsData.isAdmin || electionsData.isElectionCommittee);
        const found = electionsData.elections?.find((e: Election) => e.id === electionId);
        setElection(found || null);
      } catch {
        // ignore
      }
    };
    init();
  }, [electionId]);

  if (unionId === null || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">
          You do not have permission to view the Election Committee dashboard.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href={`/${slug}/elections`}>Back to Elections</Link>
        </Button>
      </Card>
    );
  }

  if (!election) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Election Not Found</h2>
        <p className="text-gray-600">This election does not exist or is not yet active.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link href={`/${slug}/election-committee`}>Back to EC Dashboard</Link>
        </Button>
      </Card>
    );
  }

  return (
    <ElectionDashboard slug={slug} election={election} unionId={unionId} />
  );
}

function ElectionDashboard({
  slug,
  election,
  unionId,
}: {
  slug: string;
  election: Election;
  unionId: number;
}) {
  const { data, error, isLoading } = useSWR<VoterRollData>(
    `/api/elections/${election.id}/voter-roll`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
  const [markingMemberId, setMarkingMemberId] = useState<number | null>(null);
  const [markError, setMarkError] = useState('');
  const [markSuccess, setMarkSuccess] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Search states
  const [markSearch, setMarkSearch] = useState('');
  const [voterSearch, setVoterSearch] = useState('');
  const [notVotedSearch, setNotVotedSearch] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/members/list?unionId=${unionId}&status=approved`);
        if (res.ok) {
          const data = await res.json();
          setAllMembers(
            (data.members || []).map((m: any) => ({
              memberId: m.id,
              displayName:
                `${m.firstName || ''} ${m.lastName || ''}`.trim() ||
                m.user?.name ||
                m.user?.email ||
                'Unknown',
              memberIdNumber: m.memberId || null,
            }))
          );
        }
      } catch {
        // ignore
      }
    };
    fetchMembers();
  }, [unionId]);

  const handleMarkInPerson = async (memberId: number, displayName: string) => {
    setMarkingMemberId(memberId);
    setMarkError('');
    setMarkSuccess('');
    try {
      const res = await fetch(`/api/elections/${election.id}/in-person-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMarkError(result.error || 'Failed to record in-person vote');
        setTimeout(() => setMarkError(''), 5000);
        return;
      }
      setMarkSuccess(`${displayName} marked as voted in person`);
      setMarkSearch('');
      setTimeout(() => setMarkSuccess(''), 4000);
      mutate(`/api/elections/${election.id}/voter-roll`);
    } catch {
      setMarkError('Failed to record in-person vote');
      setTimeout(() => setMarkError(''), 5000);
    } finally {
      setMarkingMemberId(null);
    }
  };

  const handleRemoveInPerson = async (memberId: number) => {
    setRemovingId(memberId);
    try {
      const res = await fetch(
        `/api/elections/${election.id}/in-person-vote?memberId=${memberId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        mutate(`/api/elections/${election.id}/voter-roll`);
      }
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  };

  // Compute derived sets
  const votedInPersonMemberIds = useMemo(
    () => new Set((data?.inPersonVoters || []).map((v) => v.memberId)),
    [data]
  );

  // Members eligible to mark (not already voted in person)
  const eligibleToMark = useMemo(
    () => allMembers.filter((m) => !votedInPersonMemberIds.has(m.memberId)),
    [allMembers, votedInPersonMemberIds]
  );

  // Members who haven't voted at all (online or in person)
  const notVotedMembers = useMemo(() => {
    if (!data) return [];
    // Build a set of display names who have voted (online voters don't have memberId, match by name)
    const onlineNames = new Set(data.onlineVoters.map((v) => v.displayName));
    return allMembers.filter(
      (m) => !votedInPersonMemberIds.has(m.memberId) && !onlineNames.has(m.displayName)
    );
  }, [allMembers, data, votedInPersonMemberIds]);

  // Filtered lists
  const filteredEligible = useMemo(() => {
    if (!markSearch.trim()) return eligibleToMark;
    const q = markSearch.toLowerCase();
    return eligibleToMark.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        (m.memberIdNumber && m.memberIdNumber.toLowerCase().includes(q))
    );
  }, [eligibleToMark, markSearch]);

  const filteredVoters = useMemo(() => {
    if (!voterSearch.trim()) return null;
    const q = voterSearch.toLowerCase();
    return {
      online: (data?.onlineVoters || []).filter((v) =>
        v.displayName.toLowerCase().includes(q)
      ),
      inPerson: (data?.inPersonVoters || []).filter((v) =>
        v.displayName.toLowerCase().includes(q)
      ),
    };
  }, [voterSearch, data]);

  const filteredNotVoted = useMemo(() => {
    if (!notVotedSearch.trim()) return notVotedMembers;
    const q = notVotedSearch.toLowerCase();
    return notVotedMembers.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        (m.memberIdNumber && m.memberIdNumber.toLowerCase().includes(q))
    );
  }, [notVotedMembers, notVotedSearch]);

  const getStatusBadge = (status: string) => {
    if (status === 'active')
      return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
    if (status === 'closed')
      return <Badge className="bg-blue-100 text-blue-800 border-0">Closed</Badge>;
    return <Badge className="bg-gray-100 text-gray-800 border-0">{status}</Badge>;
  };

  const totalMembers = allMembers.length;
  const participationPct =
    totalMembers > 0 && data ? Math.round((data.totalVotes / totalMembers) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/${slug}/elections`} className="hover:text-blue-600">
          Elections
        </Link>
        <span>›</span>
        <Link href={`/${slug}/election-committee`} className="hover:text-blue-600">
          EC Dashboard
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{election.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <ClipboardList className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
              {getStatusBadge(election.status)}
            </div>
            <p className="text-sm text-gray-500">
              Ballot contents are not visible here · Auto-refreshes every 15s
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error || !data ? (
        <Card className="p-8 text-center text-red-600">Failed to load voter roll.</Card>
      ) : (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{data.totalVotes}</p>
              <p className="text-xs text-gray-500 mt-1">Total Votes</p>
            </Card>
            <Card className="p-4 text-center border-blue-100">
              <p className="text-3xl font-bold text-blue-700">{data.totalOnlineVotes}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Monitor className="h-3 w-3 text-blue-500" />
                <p className="text-xs text-blue-600">Online</p>
              </div>
            </Card>
            <Card className="p-4 text-center border-green-100">
              <p className="text-3xl font-bold text-green-700">{data.totalInPersonVotes}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-green-500" />
                <p className="text-xs text-green-600">In Person</p>
              </div>
            </Card>
            <Card className="p-4 text-center border-orange-100">
              <p className="text-3xl font-bold text-orange-700">{notVotedMembers.length}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <UserX className="h-3 w-3 text-orange-500" />
                <p className="text-xs text-orange-600">Haven't Voted</p>
              </div>
            </Card>
          </div>

          {/* Participation bar */}
          {totalMembers > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Participation</span>
                <span>{participationPct}% ({data.totalVotes} of {totalMembers} members)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(participationPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Feedback */}
          {markSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-800 text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {markSuccess}
            </div>
          )}
          {markError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {markError}
            </div>
          )}

          {/* Mark In-Person Vote */}
          {election.status === 'active' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Mark Member as Voted In Person
                  <span className="text-sm font-normal text-gray-500">
                    ({eligibleToMark.length} eligible)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9 pr-9"
                    placeholder="Search by name or member ID…"
                    value={markSearch}
                    onChange={(e) => setMarkSearch(e.target.value)}
                  />
                  {markSearch && (
                    <button
                      onClick={() => setMarkSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {eligibleToMark.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-4 text-center">
                    All members have a vote recorded.
                  </p>
                ) : filteredEligible.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-4 text-center">
                    No members match "{markSearch}".
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto border rounded-lg divide-y bg-white">
                    {filteredEligible.map((m) => (
                      <div
                        key={m.memberId}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {m.displayName}
                          </span>
                          {m.memberIdNumber && (
                            <span className="text-xs text-gray-400 ml-2">#{m.memberIdNumber}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkInPerson(m.memberId, m.displayName)}
                          disabled={markingMemberId === m.memberId}
                          className="text-green-700 border-green-300 hover:bg-green-50 shrink-0"
                        >
                          {markingMemberId === m.memberId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Mark In Person'
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Members who haven't voted */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-500" />
                Haven't Voted
                <span className="text-sm font-normal text-gray-500">
                  ({notVotedMembers.length} member{notVotedMembers.length !== 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notVotedMembers.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">All members have voted!</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9 pr-9"
                      placeholder="Search by name or member ID…"
                      value={notVotedSearch}
                      onChange={(e) => setNotVotedSearch(e.target.value)}
                    />
                    {notVotedSearch && (
                      <button
                        onClick={() => setNotVotedSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {filteredNotVoted.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-4 text-center">
                      No members match "{notVotedSearch}".
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border rounded-lg divide-y bg-white">
                      {filteredNotVoted.map((m) => (
                        <div
                          key={m.memberId}
                          className="flex items-center justify-between px-4 py-2.5"
                        >
                          <span className="text-sm text-gray-900">{m.displayName}</span>
                          {m.memberIdNumber && (
                            <span className="text-xs text-gray-400">#{m.memberIdNumber}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Voter Roll — combined searchable */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Voter Roll
                <span className="text-sm font-normal text-gray-500">
                  ({data.totalVotes} vote{data.totalVotes !== 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9 pr-9"
                  placeholder="Filter voters by name…"
                  value={voterSearch}
                  onChange={(e) => setVoterSearch(e.target.value)}
                />
                {voterSearch && (
                  <button
                    onClick={() => setVoterSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Online voters */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Online ({filteredVoters ? filteredVoters.online.length : data.totalOnlineVotes})
                </h4>
                {(filteredVoters ? filteredVoters.online : data.onlineVoters).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    {voterSearch ? `No online voters match "${voterSearch}".` : 'No online votes recorded yet.'}
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y bg-white max-h-56 overflow-y-auto">
                    {(filteredVoters ? filteredVoters.online : data.onlineVoters).map((v) => (
                      <div key={v.voteId} className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm text-gray-900">{v.displayName}</span>
                        <span className="text-xs text-gray-400">{formatDate(v.votedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* In-person voters */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  In Person ({filteredVoters ? filteredVoters.inPerson.length : data.totalInPersonVotes})
                </h4>
                {(filteredVoters ? filteredVoters.inPerson : data.inPersonVoters).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    {voterSearch ? `No in-person voters match "${voterSearch}".` : 'No in-person votes recorded yet.'}
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y bg-white max-h-56 overflow-y-auto">
                    {(filteredVoters ? filteredVoters.inPerson : data.inPersonVoters).map((v) => (
                      <div key={v.id} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <span className="text-sm text-gray-900">{v.displayName}</span>
                          <p className="text-xs text-gray-400">
                            Marked by {v.markedBy} · {formatDate(v.markedAt)}
                            {v.notes && ` · ${v.notes}`}
                          </p>
                        </div>
                        {election.status === 'active' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveInPerson(v.memberId)}
                            disabled={removingId === v.memberId}
                            className="text-red-500 hover:bg-red-50 text-xs shrink-0"
                          >
                            {removingId === v.memberId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Remove'
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
