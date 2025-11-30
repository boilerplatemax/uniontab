'use client';

import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { CreateElectionDialog } from '@/components/elections/create-election-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Lock, Globe, Eye } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ElectionsContent({ slug }: { slug: string }) {
  const [unionId, setUnionId] = useState<number | null>(null);

  // Get union data first
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

  const { data, error, isLoading } = useSWR(
    unionId ? `/api/elections/list?unionId=${unionId}` : null,
    fetcher
  );

  if (isLoading || !unionId) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading elections</div>;
  }

  const { elections, isAdmin } = data;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      closed: 'bg-blue-100 text-blue-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.draft}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'members':
        return <Users className="h-4 w-4" />;
      case 'hidden':
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${slug}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Union
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Elections & Voting</h1>
        {isAdmin && (
          <CreateElectionDialog
            unionId={unionId}
            onSuccess={() => mutate(`/api/elections/list?unionId=${unionId}`)}
          />
        )}
      </div>

      {elections.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-600">
            No elections yet
          </h3>
          <p className="text-gray-500 mt-2">
            {isAdmin
              ? 'Create your first election to get started.'
              : 'Check back later for upcoming elections.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {elections.map((election: any) => (
            <Card key={election.id} className="p-6 hover:shadow-lg transition">
              <Link href={`/${slug}/elections/${election.slug}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold">
                        {election.title}
                      </h3>
                      {getStatusBadge(election.status)}
                    </div>
                    {election.description && (
                      <p className="text-gray-600 mb-4">
                        {election.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Opens: {formatDate(election.openTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Closes: {formatDate(election.closeTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{election._count.votes} votes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getVisibilityIcon(election.resultsVisibility)}
                        <span>
                          Results:{' '}
                          {election.resultsVisibility.charAt(0).toUpperCase() +
                            election.resultsVisibility.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button asChild>
                      <Link href={`/${slug}/elections/${election.slug}`}>
                        View Details
                      </Link>
                    </Button>
                    {election.status === 'closed' &&
                      (election.resultsVisibility === 'public' ||
                        election.resultsVisibility === 'members' ||
                        isAdmin) && (
                        <Button asChild variant="outline">
                          <Link
                            href={`/${slug}/elections/${election.slug}/results`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Results
                          </Link>
                        </Button>
                      )}
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
