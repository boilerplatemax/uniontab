'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Building2, Vote, Users } from 'lucide-react';
import type { Member } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface UnionInfoTabProps {
  member: MemberData;
  unionId: number;
  onUpdate: () => void;
}

export function UnionInfoTab({ member, unionId, onUpdate }: UnionInfoTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    memberId: member.member.memberId || '',
    membershipStatus: member.member.membershipStatus || 'active',
    membershipType: member.member.membershipType || '',
    localChapter: member.member.localChapter || '',
    bargainingUnit: member.member.bargainingUnit || '',
    subUnit: member.member.subUnit || '',
    unionEmail: member.member.unionEmail || '',
    votingStatus: member.member.votingStatus || 'eligible',
    seniorityNumber: member.member.seniorityNumber || '',
    steward: member.member.steward || '',
    joinDate: member.member.joinDate
      ? new Date(member.member.joinDate).toISOString().split('T')[0]
      : '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/members/update-profile-extended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.member.id,
          unionId,
          section: 'union',
          memberIdNumber: formData.memberId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update union information');
      }

      setSuccess(true);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Union Information</h2>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          Union information updated successfully.
        </div>
      )}

      {/* Membership Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Membership Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="memberId">Member ID / Number</Label>
            <Input
              id="memberId"
              value={formData.memberId}
              onChange={(e) => updateField('memberId', e.target.value)}
              placeholder="M12345"
            />
          </div>
          <div>
            <Label htmlFor="membershipStatus">Membership Status</Label>
            <Select
              value={formData.membershipStatus}
              onValueChange={(value) => updateField('membershipStatus', value)}
            >
              <SelectTrigger id="membershipStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="membershipType">Membership Type</Label>
            <Select
              value={formData.membershipType}
              onValueChange={(value) => updateField('membershipType', value)}
            >
              <SelectTrigger id="membershipType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Member</SelectItem>
                <SelectItem value="associate">Associate</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="honorary">Honorary</SelectItem>
                <SelectItem value="probationary">Probationary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="joinDate">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={(e) => updateField('joinDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="seniorityNumber">Seniority Number</Label>
            <Input
              id="seniorityNumber"
              value={formData.seniorityNumber}
              onChange={(e) => updateField('seniorityNumber', e.target.value)}
              placeholder="123"
            />
          </div>
          <div>
            <Label htmlFor="unionEmail">Union Email</Label>
            <Input
              id="unionEmail"
              type="email"
              value={formData.unionEmail}
              onChange={(e) => updateField('unionEmail', e.target.value)}
              placeholder="john@union.org"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="localChapter">Local / Chapter</Label>
            <Input
              id="localChapter"
              value={formData.localChapter}
              onChange={(e) => updateField('localChapter', e.target.value)}
              placeholder="Local 123"
            />
          </div>
          <div>
            <Label htmlFor="bargainingUnit">Bargaining Unit</Label>
            <Input
              id="bargainingUnit"
              value={formData.bargainingUnit}
              onChange={(e) => updateField('bargainingUnit', e.target.value)}
              placeholder="Technical Services"
            />
          </div>
          <div>
            <Label htmlFor="subUnit">Sub-Unit</Label>
            <Input
              id="subUnit"
              value={formData.subUnit}
              onChange={(e) => updateField('subUnit', e.target.value)}
              placeholder="Division A"
            />
          </div>
          <div>
            <Label htmlFor="steward">Assigned Steward</Label>
            <Input
              id="steward"
              value={formData.steward}
              onChange={(e) => updateField('steward', e.target.value)}
              placeholder="Steward Name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Voting Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Voting Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="votingStatus">Voting Eligibility</Label>
            <Select
              value={formData.votingStatus}
              onValueChange={(value) => updateField('votingStatus', value)}
            >
              <SelectTrigger id="votingStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eligible">Eligible</SelectItem>
                <SelectItem value="ineligible">Ineligible</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">
              Determines if this member can participate in union elections and votes.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
