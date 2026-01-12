'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Briefcase, Building2, Calendar } from 'lucide-react';
import type { Member } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface EmploymentTabProps {
  member: MemberData;
  unionId: number;
  onUpdate: () => void;
}

export function EmploymentTab({ member, unionId, onUpdate }: EmploymentTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    employer: member.member.employer || '',
    jobTitle: member.member.jobTitle || '',
    worksite: member.member.worksite || '',
    employmentStatus: member.member.employmentStatus || '',
    department: member.member.department || '',
    employeeId: member.member.employeeId || '',
    shift: member.member.shift || '',
    supervisor: member.member.supervisor || '',
    classification: member.member.classification || '',
    wageRate: member.member.wageRate || '',
    startDateWithEmployer: member.member.startDateWithEmployer
      ? new Date(member.member.startDateWithEmployer).toISOString().split('T')[0]
      : '',
    endDateWithEmployer: member.member.endDateWithEmployer
      ? new Date(member.member.endDateWithEmployer).toISOString().split('T')[0]
      : '',
    seniorityDate: member.member.seniorityDate
      ? new Date(member.member.seniorityDate).toISOString().split('T')[0]
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
          section: 'employment',
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employment information');
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
        <h2 className="text-xl font-semibold text-gray-900">Employment Information</h2>
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
          Employment information updated successfully.
        </div>
      )}

      {/* Employer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Employer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employer">Employer</Label>
            <Input
              id="employer"
              value={formData.employer}
              onChange={(e) => updateField('employer', e.target.value)}
              placeholder="ABC Company"
            />
          </div>
          <div>
            <Label htmlFor="worksite">Worksite / Location</Label>
            <Input
              id="worksite"
              value={formData.worksite}
              onChange={(e) => updateField('worksite', e.target.value)}
              placeholder="Main Office, Building A"
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => updateField('department', e.target.value)}
              placeholder="Operations"
            />
          </div>
          <div>
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              value={formData.employeeId}
              onChange={(e) => updateField('employeeId', e.target.value)}
              placeholder="EMP-12345"
            />
          </div>
        </CardContent>
      </Card>

      {/* Position Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Position Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="jobTitle">Job Title / Classification</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => updateField('jobTitle', e.target.value)}
              placeholder="Senior Technician"
            />
          </div>
          <div>
            <Label htmlFor="classification">Classification Code</Label>
            <Input
              id="classification"
              value={formData.classification}
              onChange={(e) => updateField('classification', e.target.value)}
              placeholder="TECH-III"
            />
          </div>
          <div>
            <Label htmlFor="employmentStatus">Employment Status</Label>
            <Select
              value={formData.employmentStatus}
              onValueChange={(value) => updateField('employmentStatus', value)}
            >
              <SelectTrigger id="employmentStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="term">Term</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="shift">Shift</Label>
            <Input
              id="shift"
              value={formData.shift}
              onChange={(e) => updateField('shift', e.target.value)}
              placeholder="Day Shift / Night Shift"
            />
          </div>
          <div>
            <Label htmlFor="supervisor">Supervisor</Label>
            <Input
              id="supervisor"
              value={formData.supervisor}
              onChange={(e) => updateField('supervisor', e.target.value)}
              placeholder="Supervisor name"
            />
          </div>
          <div>
            <Label htmlFor="wageRate">Wage Rate</Label>
            <Input
              id="wageRate"
              value={formData.wageRate}
              onChange={(e) => updateField('wageRate', e.target.value)}
              placeholder="$25.00/hr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Employment Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDateWithEmployer">Start Date</Label>
            <Input
              id="startDateWithEmployer"
              type="date"
              value={formData.startDateWithEmployer}
              onChange={(e) => updateField('startDateWithEmployer', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDateWithEmployer">End Date</Label>
            <Input
              id="endDateWithEmployer"
              type="date"
              value={formData.endDateWithEmployer}
              onChange={(e) => updateField('endDateWithEmployer', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank if currently employed</p>
          </div>
          <div>
            <Label htmlFor="seniorityDate">Seniority Date</Label>
            <Input
              id="seniorityDate"
              type="date"
              value={formData.seniorityDate}
              onChange={(e) => updateField('seniorityDate', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">May differ from start date</p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
