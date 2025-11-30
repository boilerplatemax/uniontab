'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { VotingForm } from '@/components/elections/voting-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ElectionVotePage({
  slug,
  electionSlug,
}: {
  slug: string;
  electionSlug: string;
}) {
  const router = useRouter();
  const [unionId, setUnionId] = useState<number | null>(null);
  const [electionId, setElectionId] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  // Get union data
  useEffect(() => {
    const getUnion = async () => {
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const data = await res.json();
          setUnionId(data.id);
        }
      } catch (error) {
        console.error('Error fetching union:', error);
      }
    };
    getUnion();
  }, []);

  // Get election by slug
  useEffect(() => {
    if (!unionId) return;

    const getElectionBySlug = async () => {
      try {
        const res = await fetch(`/api/elections/list?unionId=${unionId}`);
        if (res.ok) {
          const data = await res.json();
          const election = data.elections.find(
            (e: any) => e.slug === electionSlug
          );
          if (election) {
            setElectionId(election.id);
          }
        }
      } catch (error) {
        console.error('Error finding election:', error);
      }
    };
    getElectionBySlug();
  }, [unionId, electionSlug]);

  const { data, error, isLoading } = useSWR(
    electionId ? `/api/elections/${electionId}` : null,
    fetcher
  );

  if (isLoading || !electionId) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading election</div>;
  }

  const { election, userHasVoted } = data;

  const handleVoteSubmit = async (voteData: any) => {
    try {
      const response = await fetch(`/api/elections/${election.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        body: JSON.stringify(voteData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit vote');
      }

      setSuccess(true);
    } catch (err: any) {
      throw err;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const now = new Date();
  const openTime = new Date(election.openTime);
  const closeTime = new Date(election.closeTime);
  const isOpen = now >= openTime && now < closeTime && election.status === 'active';
  const isClosed = now >= closeTime || election.status === 'closed';
  const isPending = now < openTime || election.status === 'draft';

  if (success) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Vote Submitted Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for participating in this election.
        </p>
        <div className="space-x-3">
          <Button asChild>
            <Link href={`/${slug}/elections`}>Back to Elections</Link>
          </Button>
          {(election.resultsVisibility === 'public' ||
            election.resultsVisibility === 'members') &&
            isClosed && (
              <Button asChild variant="outline">
                <Link href={`/${slug}/elections/${electionSlug}/results`}>
                  View Results
                </Link>
              </Button>
            )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${slug}/elections`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Elections
        </Link>
      </div>

      <Card className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{election.title}</h1>
          {election.description && (
            <p className="text-gray-600">{election.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Opens: {formatDate(election.openTime)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Closes: {formatDate(election.closeTime)}</span>
          </div>
        </div>

        {isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              <span className="font-medium">This election has not opened yet</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Voting will open on {formatDate(election.openTime)}
            </p>
          </div>
        )}

        {isClosed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">This election has closed</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Voting closed on {formatDate(election.closeTime)}
            </p>
            {(election.resultsVisibility === 'public' ||
              election.resultsVisibility === 'members') && (
              <Button asChild variant="outline" className="mt-3">
                <Link href={`/${slug}/elections/${electionSlug}/results`}>
                  View Results
                </Link>
              </Button>
            )}
          </div>
        )}

        {userHasVoted && !election.allowRevotes && isOpen && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">You have already voted</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Thank you for participating in this election.
            </p>
          </div>
        )}

        {userHasVoted && election.allowRevotes && isOpen && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">You have already voted</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              You can change your vote by submitting a new response below.
            </p>
          </div>
        )}

        {isOpen && (!userHasVoted || election.allowRevotes) && (
          <VotingForm
            election={election}
            onSubmit={handleVoteSubmit}
            onCancel={() => router.push(`/${slug}/elections`)}
          />
        )}
      </Card>
    </div>
  );
}
