'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';

interface Member {
  member: {
    id: number;
    userId: number;
    unionId: number;
    role: string;
    status: string;
    joinedAt: Date;
    phone: string | null;
    employer: string | null;
    jobTitle: string | null;
    worksite: string | null;
    employmentStatus: string | null;
    address: string | null;
    dateOfBirth: Date | null;
    memberId: string | null;
    membershipStatus: string | null;
    localChapter: string | null;
    bargainingUnit: string | null;
    startDateWithEmployer: Date | null;
    notes: string | null;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  unionId: number;
  onSave: () => void;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  unionId,
  onSave,
}: EditMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    employer: '',
    jobTitle: '',
    worksite: '',
    employmentStatus: '',
    address: '',
    dateOfBirth: '',
    memberId: '',
    membershipStatus: '',
    localChapter: '',
    bargainingUnit: '',
    startDateWithEmployer: '',
    notes: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.user.name || '',
        phone: member.member.phone || '',
        employer: member.member.employer || '',
        jobTitle: member.member.jobTitle || '',
        worksite: member.member.worksite || '',
        employmentStatus: member.member.employmentStatus || '',
        address: member.member.address || '',
        dateOfBirth: member.member.dateOfBirth
          ? new Date(member.member.dateOfBirth).toISOString().split('T')[0]
          : '',
        memberId: member.member.memberId || '',
        membershipStatus: member.member.membershipStatus || 'active',
        localChapter: member.member.localChapter || '',
        bargainingUnit: member.member.bargainingUnit || '',
        startDateWithEmployer: member.member.startDateWithEmployer
          ? new Date(member.member.startDateWithEmployer).toISOString().split('T')[0]
          : '',
        notes: member.member.notes || '',
      });
      setError('');
    }
  }, [member]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) return;

    setLoading(true);
    setError('');

    try {
      const { memberId: memberIdNumber, ...restFormData } = formData;
      const response = await fetch('/api/members/update-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.member.id,
          unionId,
          ...restFormData,
          memberIdNumber, // API expects memberIdNumber
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member');
      }

      onSave();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member: {member.user.name || member.user.email}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="jobTitle">Job Title / Classification</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => updateField('jobTitle', e.target.value)}
                  placeholder="Software Engineer"
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDateWithEmployer">Start Date with Employer</Label>
                <Input
                  id="startDateWithEmployer"
                  type="date"
                  value={formData.startDateWithEmployer}
                  onChange={(e) => updateField('startDateWithEmployer', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Union Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900">Union Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="localChapter">Local / Chapter Assignment</Label>
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
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
              <p>These notes are only visible to admins and owners. Members cannot see this information.</p>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any notes about this member..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
