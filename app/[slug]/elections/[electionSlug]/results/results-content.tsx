'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ElectionResults } from '@/components/elections/election-results';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Users, Download } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ElectionResultsPage({
  slug,
  electionSlug,
}: {
  slug: string;
  electionSlug: string;
}) {
  const [unionId, setUnionId] = useState<number | null>(null);
  const [electionId, setElectionId] = useState<number | null>(null);

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
    electionId ? `/api/elections/${electionId}/results` : null,
    fetcher
  );

  if (isLoading || !electionId) {
    return <div>Loading results...</div>;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Error Loading Results
        </h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'Unable to load election results'}
        </p>
        <Button asChild>
          <Link href={`/${slug}/elections`}>Back to Elections</Link>
        </Button>
      </Card>
    );
  }

  const { election, results, totalVotes } = data;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

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
            <p className="text-gray-600 mb-4">{election.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Opened: {formatDate(election.openTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Closed: {formatDate(election.closeTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{totalVotes} total votes</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Results</h2>
          </div>
          <ElectionResults results={results} totalVotes={totalVotes} />
        </div>
      </Card>
    </div>
  );
}
