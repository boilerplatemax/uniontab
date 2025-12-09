'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Loader2, Briefcase, DollarSign, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
  memberDues: any[];
}

export function MemberProfile({ slug, user, userWithUnion, membership, union, memberDues }: MemberProfileProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'member' | 'dues' | 'security'>('general');
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

  // Dues helper functions
  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountInCents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string, dueDate: Date) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
    }
    if (status === 'partial') {
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Partial</Badge>;
    }
    const isOverdue = new Date(dueDate) < new Date();
    if (isOverdue) {
      return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Unpaid</Badge>;
  };

  const handleDownloadReceipt = async (receiptId: number) => {
    try {
      const response = await fetch(`/api/dues/receipt/${receiptId}`);
      if (!response.ok) {
        throw new Error('Failed to load receipt');
      }
      const data = await response.json();
      // Open in new window for print/download
      window.open(`/${slug}/profile?receipt=${receiptId}`, '_blank');
    } catch (error: any) {
      alert(error.message || 'Failed to load receipt');
    }
  };

  // Calculate dues summary
  const duesSummary = {
    totalDues: memberDues.reduce((sum, d) => sum + d.amount, 0),
    totalPaid: memberDues.reduce((sum, d) => sum + d.paidAmount, 0),
    totalOutstanding: memberDues.filter(d => d.paymentStatus !== 'paid').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0),
    overdueCount: memberDues.filter(d => d.paymentStatus === 'unpaid' && new Date(d.dueDate) < new Date()).length,
    isDelinquent: membership?.member.isDelinquent || false,
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
            onClick={() => setActiveTab('dues')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'dues'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Dues
              {duesSummary.overdueCount > 0 && (
                <Badge className="bg-red-500 ml-1">{duesSummary.overdueCount}</Badge>
              )}
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

        {/* Dues Tab */}
        {activeTab === 'dues' && (
          <div className="space-y-6">
            {/* Dues Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Your Dues Status</CardTitle>
                <CardDescription>View your payment history and current standing</CardDescription>
              </CardHeader>
              <CardContent>
                {duesSummary.isDelinquent ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900">Payment Overdue</h3>
                        <p className="text-sm text-red-700 mt-1">
                          Your dues payments are past due. Outstanding balance: <strong>{formatCurrency(duesSummary.totalOutstanding)}</strong>
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          Please contact the union office or submit payment as soon as possible to maintain your membership in good standing.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900">Account in Good Standing</h3>
                        <p className="text-sm text-green-700 mt-1">
                          {duesSummary.totalOutstanding > 0
                            ? `Current balance: ${formatCurrency(duesSummary.totalOutstanding)}`
                            : 'All dues are paid up to date. Thank you!'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Dues</div>
                    <div className="text-2xl font-bold">{formatCurrency(duesSummary.totalDues)}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Paid</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(duesSummary.totalPaid)}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Outstanding</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(duesSummary.totalOutstanding)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All your dues records and receipts</CardDescription>
              </CardHeader>
              <CardContent>
                {memberDues.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-sm">Due Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Paid</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Payment Method</th>
                          <th className="text-right py-3 px-4 font-semibold text-sm">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberDues.map((d: any) => (
                          <tr key={d.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{formatDate(d.dueDate)}</td>
                            <td className="py-3 px-4 font-semibold">{formatCurrency(d.amount)}</td>
                            <td className="py-3 px-4">{getStatusBadge(d.paymentStatus, d.dueDate)}</td>
                            <td className="py-3 px-4">
                              {d.paidAmount > 0 ? (
                                <div>
                                  <div className="font-medium">{formatCurrency(d.paidAmount)}</div>
                                  {d.paidDate && (
                                    <div className="text-xs text-gray-500">{formatDate(d.paidDate)}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {d.paymentMethod ? (
                                <span className="capitalize">{d.paymentMethod.replace('_', ' ')}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {d.receipts && d.receipts.length > 0 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadReceipt(d.receipts[0].id)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              ) : d.paymentStatus !== 'unpaid' ? (
                                <span className="text-xs text-gray-500">No receipt</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Dues Records</h3>
                    <p className="text-gray-500">You don't have any dues records yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            {union.paymentInstructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{union.paymentInstructions}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
