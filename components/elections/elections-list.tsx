'use client';

import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { CreateElectionDialog } from '@/components/elections/create-election-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Lock, Globe, Eye, Vote as VoteIcon } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ElectionsListProps {
  slug: string;
  unionId: number;
  isOwner: boolean;
}

export function ElectionsList({ slug, unionId, isOwner }: ElectionsListProps) {
  const { data, error, isLoading } = useSWR(
    unionId ? `/api/elections/list?unionId=${unionId}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading elections...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <div className="p-12 text-center">
          <p className="text-red-600">Error loading elections. Please try again later.</p>
        </div>
      </Card>
    );
  }

  const { elections, isAdmin } = data || { elections: [], isAdmin: false };

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
    <>
      {/* Create Election Button (Admin only) */}
      {isAdmin && (
        <div className="flex justify-start mb-4">
          <CreateElectionDialog
            unionId={unionId}
            onSuccess={() => mutate(`/api/elections/list?unionId=${unionId}`)}
          />
        </div>
      )}

      {/* Elections List */}
      {elections.length === 0 ? (
        <Card className="shadow-sm">
          <div className="p-12 text-center">
            <VoteIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No elections yet
            </h3>
            <p className="text-gray-500">
              {isAdmin
                ? 'Create your first election to get started!'
                : 'Check back later for upcoming elections.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {elections.map((election: any) => (
            <Card key={election.id} className="shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {election.title}
                      </h3>
                      {getStatusBadge(election.status)}
                    </div>
                    {election.description && (
                      <p className="text-gray-600 mb-4 text-sm sm:text-base">
                        {election.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Opens: {formatDate(election.openTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Closes: {formatDate(election.closeTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{election._count.votes} votes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getVisibilityIcon(election.resultsVisibility)}
                        <span>
                          Results:{' '}
                          {election.resultsVisibility.charAt(0).toUpperCase() +
                            election.resultsVisibility.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                    <Button asChild className="flex-1 sm:flex-none">
                      <Link href={`/${slug}/elections/${election.slug}`}>
                        View Details
                      </Link>
                    </Button>
                    {election.status === 'closed' &&
                      (election.resultsVisibility === 'public' ||
                        election.resultsVisibility === 'members' ||
                        isAdmin) && (
                        <Button asChild variant="outline" className="flex-1 sm:flex-none">
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
