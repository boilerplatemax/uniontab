'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle, Loader2, ClipboardList, ShieldCheck, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Election {
  id: number;
  title: string;
  status: string;
  slug: string;
  openTime: string;
  closeTime: string;
  _count: { votes: number };
}

export function ElectionCommitteeContent({ slug }: { slug: string }) {
  const [unionId, setUnionId] = useState<number | null>(null);

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
    return <div className="text-center py-16 text-red-600">Error loading elections</div>;
  }

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
  const relevantElections: Election[] = elections.filter(
    (e: Election) => e.status === 'active' || e.status === 'closed'
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getStatusBadge = (status: string) => {
    if (status === 'active')
      return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
    if (status === 'closed')
      return <Badge className="bg-blue-100 text-blue-800 border-0">Closed</Badge>;
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
            Select an election below to manage voter rolls and record in-person votes.
          </p>
        </div>
      </div>

      {relevantElections.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No active or closed elections</h3>
          <p className="text-gray-500 mt-2">
            Voter rolls will appear here once an election is active.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {relevantElections.map((election) => (
            <Link
              key={election.id}
              href={`/${slug}/election-committee/${election.id}`}
              className="block"
            >
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group border hover:border-amber-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{election.title}</span>
                        {getStatusBadge(election.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Closes {formatDate(election.closeTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {election._count.votes} vote{election._count.votes !== 1 ? 's' : ''} recorded
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
