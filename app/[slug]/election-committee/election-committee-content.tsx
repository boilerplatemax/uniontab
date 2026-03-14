'use client';

import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, UserCheck, AlertCircle, Loader2, ClipboardList } from 'lucide-react';
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

interface Election {
  id: number;
  title: string;
  status: string;
  slug: string;
  openTime: string;
  closeTime: string;
  _count: { votes: number };
}

interface MemberOption {
  memberId: number;
  displayName: string;
  memberIdNumber: string | null;
}

function VoterRollPanel({
  election,
  unionId,
}: {
  election: Election;
  unionId: number;
}) {
  const { data, error, isLoading } = useSWR<VoterRollData>(
    `/api/elections/${election.id}/voter-roll`,
    fetcher
  );

  const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
  const [markingMemberId, setMarkingMemberId] = useState<number | null>(null);
  const [markError, setMarkError] = useState('');
  const [markSuccess, setMarkSuccess] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Fetch all approved members for the "mark in person" dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/members/list?unionId=${unionId}&status=approved`);
        if (res.ok) {
          const data = await res.json();
          setAllMembers(
            (data.members || []).map((m: any) => ({
              memberId: m.member.id,
              displayName:
                `${m.member.firstName || ''} ${m.member.lastName || ''}`.trim() ||
                m.user.name ||
                m.user.email,
              memberIdNumber: m.member.memberId || null,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-600 py-4">
        Failed to load voter roll.
      </div>
    );
  }

  // Members who haven't voted yet (neither online nor in person)
  const votedOnlineMemberIds = new Set(data.onlineVoters.map((v) => v.voteId));
  const votedInPersonMemberIds = new Set(data.inPersonVoters.map((v) => v.memberId));
  const eligibleToMark = allMembers.filter(
    (m) => !votedInPersonMemberIds.has(m.memberId)
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.totalVotes}</p>
          <p className="text-sm text-gray-600">Total Votes</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{data.totalOnlineVotes}</p>
          <p className="text-sm text-blue-600">Online</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{data.totalInPersonVotes}</p>
          <p className="text-sm text-green-600">In Person</p>
        </div>
      </div>

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

      {/* Mark In-Person Vote (active elections only) */}
      {election.status === 'active' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Mark Member as Voted In Person
          </h4>
          {eligibleToMark.length === 0 ? (
            <p className="text-sm text-gray-500 italic">All members have a vote recorded.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto border rounded-lg divide-y bg-white">
              {eligibleToMark.map((m) => (
                <div
                  key={m.memberId}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">{m.displayName}</span>
                    {m.memberIdNumber && (
                      <span className="text-xs text-gray-500 ml-2">#{m.memberIdNumber}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkInPerson(m.memberId, m.displayName)}
                    disabled={markingMemberId === m.memberId}
                    className="text-green-700 border-green-300 hover:bg-green-50"
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
        </div>
      )}

      {/* Online Voters */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Online Voters ({data.totalOnlineVotes})
        </h4>
        {data.onlineVoters.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No online votes recorded yet.</p>
        ) : (
          <div className="border rounded-lg divide-y bg-white max-h-64 overflow-y-auto">
            {data.onlineVoters.map((v) => (
              <div key={v.voteId} className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-gray-900">{v.displayName}</span>
                <span className="text-xs text-gray-500">{formatDate(v.votedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-Person Voters */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          In-Person Voters ({data.totalInPersonVotes})
        </h4>
        {data.inPersonVoters.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No in-person votes recorded yet.</p>
        ) : (
          <div className="border rounded-lg divide-y bg-white max-h-64 overflow-y-auto">
            {data.inPersonVoters.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <span className="text-sm text-gray-900">{v.displayName}</span>
                  <p className="text-xs text-gray-500">
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
                    className="text-red-600 hover:bg-red-50 text-xs"
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
    </div>
  );
}

export function ElectionCommitteeContent({ slug }: { slug: string }) {
  const [unionId, setUnionId] = useState<number | null>(null);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    const getUnion = async () => {
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const data = await res.json();
          setUnionId(data.id);
        }
      } catch {
        // ignore
      }
    };
    getUnion();
  }, []);

  const { data, error, isLoading } = useSWR(
    unionId ? `/api/elections/list?unionId=${unionId}` : null,
    fetcher
  );

  if (isLoading || !unionId) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-600">
        Error loading elections
      </div>
    );
  }

  // Access check — only election_committee, admins, or owners should see this page
  if (!data.isAdmin && !data.isElectionCommittee) {
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

  const { elections } = data;
  const activeAndClosed = elections.filter(
    (e: Election) => e.status === 'active' || e.status === 'closed'
  );

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
    if (status === 'closed') return <Badge className="bg-blue-100 text-blue-800 border-0">Closed</Badge>;
    return <Badge className="bg-gray-100 text-gray-800 border-0">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${slug}/elections`} className="text-sm text-blue-600 hover:underline">
          ← Back to Elections
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <ClipboardList className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Election Committee Dashboard</h1>
          <p className="text-sm text-gray-600">
            Monitor voter participation and record in-person votes. Ballot contents are not visible here.
          </p>
        </div>
      </div>

      {activeAndClosed.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No active or closed elections</h3>
          <p className="text-gray-500 mt-2">Voter rolls will appear here once an election is active.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeAndClosed.map((election: Election) => (
            <Card key={election.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    {election.title}
                    {getStatusBadge(election.status)}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {election._count.votes} vote{election._count.votes !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <VoterRollPanel election={election} unionId={unionId} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
