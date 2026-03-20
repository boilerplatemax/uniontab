'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, Phone, Loader2 } from 'lucide-react';

interface StewardInfo {
  id: number;
  scopeType: string;
  scopeValue: string;
  memberId: number;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberEmail: string | null;
  memberPhone: string | null;
  memberProfilePhotoUrl: string | null;
  userName: string | null;
  userEmail: string;
}

const SCOPE_LABELS: Record<string, string> = {
  bargaining_unit: 'Bargaining Unit',
  department: 'Department',
  sub_unit: 'Sub-Unit',
};

interface StewardCardProps {
  unionId: number;
}

export function StewardCard({ unionId }: StewardCardProps) {
  const [stewards, setStewards] = useState<StewardInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSteward() {
      try {
        const res = await fetch(`/api/steward-assignments/my-steward?unionId=${unionId}`);
        if (res.ok) {
          const data = await res.json();
          setStewards(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchSteward();
  }, [unionId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (stewards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Steward
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No steward is currently assigned for your unit. Contact your union administration for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Your Steward{stewards.length > 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stewards.map((s) => {
          const name = (s.memberFirstName || s.memberLastName)
            ? `${s.memberFirstName || ''} ${s.memberLastName || ''}`.trim()
            : s.userName || s.userEmail;

          const initials = name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          const email = s.memberEmail || s.userEmail;

          return (
            <div key={s.id} className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                {s.memberProfilePhotoUrl && <AvatarImage src={s.memberProfilePhotoUrl} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-gray-900">{name}</p>
                <Badge variant="outline" className="text-xs">
                  {SCOPE_LABELS[s.scopeType] || s.scopeType}: {s.scopeValue}
                </Badge>
                {email && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <a href={`mailto:${email}`} className="hover:underline truncate">{email}</a>
                  </div>
                )}
                {s.memberPhone && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <a href={`tel:${s.memberPhone}`} className="hover:underline">{s.memberPhone}</a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
