'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Lock, Loader2, Briefcase } from 'lucide-react';
import type { User as UserType, Union, Member } from '@/lib/db/schema';

interface MemberProfileProps {
  slug: string;
  user: UserType;
  userWithUnion: any;
  membership: {
    user: UserType;
    member: Member;
  } | null;
  union: Union;
}

export function MemberProfile({ slug, user, userWithUnion, membership, union }: MemberProfileProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'member' | 'security'>('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // General Settings
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);

  // Member Information
  const memberData = membership?.member;
  const [phone, setPhone] = useState(memberData?.phone || '');
  const [employer, setEmployer] = useState(memberData?.employer || '');
  const [jobTitle, setJobTitle] = useState(memberData?.jobTitle || '');
  const [worksite, setWorksite] = useState(memberData?.worksite || '');
  const [employmentStatus, setEmploymentStatus] = useState(memberData?.employmentStatus || '');
  const [address, setAddress] = useState(memberData?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    memberData?.dateOfBirth ? new Date(memberData.dateOfBirth).toISOString().split('T')[0] : ''
  );
  const [memberId, setMemberId] = useState(memberData?.memberId || '');
  const [localChapter, setLocalChapter] = useState(memberData?.localChapter || '');
  const [bargainingUnit, setBargainingUnit] = useState(memberData?.bargainingUnit || '');
  const [startDateWithEmployer, setStartDateWithEmployer] = useState(
    memberData?.startDateWithEmployer ? new Date(memberData.startDateWithEmployer).toISOString().split('T')[0] : ''
  );

  // Security Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/members/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId: union.id,
          name,
          phone,
          employer,
          jobTitle,
          worksite,
          employmentStatus,
          address,
          dateOfBirth,
          memberId,
          localChapter,
          bargainingUnit,
          startDateWithEmployer,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member information');
      }

      setMessage({ type: 'success', text: 'Member information updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and member information
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              General
            </div>
          </button>
          <button
            onClick={() => setActiveTab('member')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'member'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Member Info
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </div>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* General Settings */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateGeneral} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>

                <div className="pt-4">
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
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Member Information */}
        {activeTab === 'member' && (
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateMemberInfo} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
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
                      <Label htmlFor="employer">Employer *</Label>
                      <Input
                        id="employer"
                        value={employer}
                        onChange={(e) => setEmployer(e.target.value)}
                        placeholder="ABC Company"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobTitle">Job Title / Classification *</Label>
                      <Input
                        id="jobTitle"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Software Engineer"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="worksite">Worksite / Location *</Label>
                      <Input
                        id="worksite"
                        value={worksite}
                        onChange={(e) => setWorksite(e.target.value)}
                        placeholder="Main Office, Building A"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="employmentStatus">Employment Status *</Label>
                      <Select
                        value={employmentStatus}
                        onValueChange={setEmploymentStatus}
                        required
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
                        value={startDateWithEmployer}
                        onChange={(e) => setStartDateWithEmployer(e.target.value)}
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
                        value={memberId}
                        onChange={(e) => setMemberId(e.target.value)}
                        placeholder="M12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="localChapter">Local / Chapter Assignment</Label>
                      <Input
                        id="localChapter"
                        value={localChapter}
                        onChange={(e) => setLocalChapter(e.target.value)}
                        placeholder="Local 123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bargainingUnit">Bargaining Unit</Label>
                      <Input
                        id="bargainingUnit"
                        value={bargainingUnit}
                        onChange={(e) => setBargainingUnit(e.target.value)}
                        placeholder="Technical Services"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
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
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
