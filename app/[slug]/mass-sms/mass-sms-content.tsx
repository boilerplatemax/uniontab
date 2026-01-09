'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Users as UsersIcon,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Phone,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

const SMS_CHARACTER_LIMIT = 160;

interface Member {
  member: {
    id: number;
    userId: number;
    unionId: number;
    role: string;
    status: string;
    joinedAt: Date;
    phone: string | null;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface MassSMSContentProps {
  slug: string;
  union: {
    id: number;
    name: string;
    localNumber: string | null;
  };
  members: Member[];
}

export function MassSMSContent({ slug, union, members }: MassSMSContentProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'approved' | 'admin' | 'pending' | 'rejected' | 'custom'>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [smsUsage, setSMSUsage] = useState<{
    hasAccess: boolean;
    limit: number;
    used: number;
    remaining: number;
    percentUsed: number;
    resetDate: string;
  } | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  const getUserDisplayName = (user: { name: string | null; email: string }) => {
    return user.name || user.email;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSort = (column: 'name' | 'email' | 'role' | 'status') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Fetch SMS usage on mount and after successful send
  const fetchSMSUsage = async () => {
    try {
      setIsLoadingUsage(true);
      const response = await fetch(`/api/mass-sms/usage?unionId=${union.id}`);
      if (response.ok) {
        const data = await response.json();
        setSMSUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching SMS usage:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchSMSUsage();
  }, [union.id]);

  // Filter members - only those with phone numbers
  const membersWithPhone = useMemo(() => {
    return members.filter((m) => m.member.phone && m.member.phone.trim() !== '');
  }, [members]);

  // Filter members based on recipient filter and search
  const filteredMembers = useMemo(() => {
    let filtered = membersWithPhone.filter((m) => {
      // Recipient filter
      let matchesFilter = true;
      if (recipientFilter === 'approved') {
        matchesFilter = m.member.status === 'approved';
      } else if (recipientFilter === 'admin') {
        matchesFilter = m.member.role === 'admin';
      } else if (recipientFilter === 'pending') {
        matchesFilter = m.member.status === 'pending';
      } else if (recipientFilter === 'rejected') {
        matchesFilter = m.member.status === 'rejected';
      }
      // For 'custom' and 'all', show all members (no filter)

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        getUserDisplayName(m.user).toLowerCase().includes(searchLower) ||
        m.user.email.toLowerCase().includes(searchLower) ||
        (m.member.phone && m.member.phone.includes(searchQuery));

      return matchesFilter && matchesSearch;
    });

    // Sort members
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = getUserDisplayName(a.user).localeCompare(getUserDisplayName(b.user));
      } else if (sortBy === 'email') {
        comparison = a.user.email.localeCompare(b.user.email);
      } else if (sortBy === 'role') {
        comparison = a.member.role.localeCompare(b.member.role);
      } else if (sortBy === 'status') {
        comparison = a.member.status.localeCompare(b.member.status);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [membersWithPhone, recipientFilter, searchQuery, selectedMembers, sortBy, sortDirection]);

  const toggleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map((m) => m.member.id)));
    }
  };

  const toggleMemberSelection = (memberId: number) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  // Get actual recipients that will receive the SMS
  const actualRecipients = useMemo(() => {
    if (recipientFilter === 'custom') {
      return membersWithPhone.filter((m) => selectedMembers.has(m.member.id));
    }
    return filteredMembers;
  }, [membersWithPhone, filteredMembers, recipientFilter, selectedMembers]);

  const handlePreview = () => {
    setShowPreviewDialog(true);
  };

  const handleConfirmSend = () => {
    setShowConfirmDialog(true);
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/mass-sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unionId: union.id,
          message,
          recipientFilter,
          customRecipientIds: recipientFilter === 'custom' ? Array.from(selectedMembers) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({
          success: true,
          message: `SMS sent successfully to ${data.successCount} of ${data.totalRecipients} recipients!`,
          details: data,
        });
        // Reset form after successful send
        setMessage('');
        setSelectedMembers(new Set());
        // Refresh SMS usage
        fetchSMSUsage();
      } else {
        // Handle SMS limit exceeded error with more details
        if (response.status === 429 && data.details) {
          setSendResult({
            success: false,
            message: data.details.message || data.error,
            details: data.details,
          });
        } else if (response.status === 403 && data.details?.hasAccess === false) {
          setSendResult({
            success: false,
            message: data.details.message || data.error,
            details: data.details,
          });
        } else {
          setSendResult({
            success: false,
            message: data.error || 'Failed to send SMS',
            details: data.details,
          });
        }
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSendResult({
        success: false,
        message: 'An error occurred while sending the SMS',
      });
    } finally {
      setIsSending(false);
      setShowConfirmDialog(false);
    }
  };

  const isFormValid = message.trim() !== '' && actualRecipients.length > 0 && message.length <= SMS_CHARACTER_LIMIT;
  const exceedsLimit = !!(smsUsage && actualRecipients.length > smsUsage.remaining);

  // If no access, show upgrade prompt
  if (!isLoadingUsage && smsUsage && !smsUsage.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-6">
            <Link
              href={`/${slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Union
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Text Messages
            </h1>
          </div>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className="bg-amber-100 rounded-full p-4 mb-4">
                  <Lock className="h-12 w-12 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-amber-900 mb-2">
                  SMS Feature Requires a Paid Plan
                </h2>
                <p className="text-amber-700 mb-6 max-w-md">
                  Upgrade to a paid plan to send text messages to your union members.
                  SMS is a powerful way to reach members quickly for urgent updates.
                </p>
                <div className="space-y-3">
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Plan SMS Limits:</p>
                    <ul className="mt-2 space-y-1">
                      <li>Base Plan: 10 SMS/month</li>
                      <li>Plus Plan: 25 SMS/month</li>
                    </ul>
                  </div>
                  <Link href={`/${slug}/billing`}>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      Upgrade Your Plan
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Union
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Text Messages
          </h1>
          <p className="text-gray-600 mt-2">
            Send text messages to members with phone numbers on file
          </p>
        </div>

        {/* Send Result Alert */}
        {sendResult && (
          <Card className={`mb-6 ${sendResult.success ? 'border-green-500' : 'border-red-500'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {sendResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${sendResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {sendResult.message}
                  </p>
                  {sendResult.details && sendResult.details.failureCount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {sendResult.details.failureCount} messages failed to send.
                    </p>
                  )}
                  {/* Show limit details if provided */}
                  {sendResult.details && sendResult.details.limit && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-3 border border-gray-200">
                      <p><strong>SMS Limit:</strong> {sendResult.details.limit} texts/month</p>
                      <p><strong>Already Used:</strong> {sendResult.details.used} texts</p>
                      <p><strong>Remaining:</strong> {sendResult.details.remaining} texts</p>
                      <p><strong>Requested:</strong> {sendResult.details.requested} texts</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SMS Usage Counter - Full Width at Top */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly SMS Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUsage ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : smsUsage ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Progress Bar */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {smsUsage.used} / {smsUsage.limit} texts
                    </span>
                    <span className="text-gray-500">
                      {smsUsage.percentUsed}%
                    </span>
                  </div>
                  <Progress
                    value={smsUsage.percentUsed}
                    className="h-3"
                  />
                  <p className="text-xs text-gray-600">
                    Resets on {new Date(smsUsage.resetDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Remaining/Usage Info */}
                <div className={`rounded-lg p-4 ${
                  smsUsage.percentUsed >= 90
                    ? 'bg-red-50 border border-red-200'
                    : smsUsage.percentUsed >= 75
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <p className={`text-base font-semibold ${
                    smsUsage.percentUsed >= 90
                      ? 'text-red-900'
                      : smsUsage.percentUsed >= 75
                      ? 'text-yellow-900'
                      : 'text-green-900'
                  }`}>
                    {smsUsage.remaining}
                  </p>
                  <p className={`text-sm ${
                    smsUsage.percentUsed >= 90
                      ? 'text-red-700'
                      : smsUsage.percentUsed >= 75
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`}>
                    texts remaining
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Unable to load usage data</p>
            )}
          </CardContent>
        </Card>

        {/* Recipient Selection Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Select Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info about phone numbers */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Only members with phone numbers on file can receive SMS.
                  <strong> {membersWithPhone.length}</strong> of {members.length} members have phone numbers.
                </p>
              </div>
            </div>

            {/* Recipient Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter">Send to:</Label>
                <Select value={recipientFilter} onValueChange={(value: any) => {
                  setRecipientFilter(value);
                  if (value !== 'custom') {
                    setSelectedMembers(new Set());
                  }
                }}>
                  <SelectTrigger id="filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members with Phone ({membersWithPhone.length})</SelectItem>
                    <SelectItem value="approved">
                      Approved Members ({membersWithPhone.filter((m) => m.member.status === 'approved').length})
                    </SelectItem>
                    <SelectItem value="admin">
                      Admins Only ({membersWithPhone.filter((m) => m.member.role === 'admin').length})
                    </SelectItem>
                    <SelectItem value="pending">
                      Pending Members ({membersWithPhone.filter((m) => m.member.status === 'pending').length})
                    </SelectItem>
                    <SelectItem value="rejected">
                      Rejected Members ({membersWithPhone.filter((m) => m.member.status === 'rejected').length})
                    </SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Count */}
              <div className={`rounded-lg p-4 flex flex-col justify-center ${
                exceedsLimit
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm font-medium ${exceedsLimit ? 'text-red-900' : 'text-blue-900'}`}>
                  {actualRecipients.length} {actualRecipients.length === 1 ? 'recipient' : 'recipients'} selected
                </p>
                {exceedsLimit && (
                  <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Exceeds remaining SMS limit ({smsUsage?.remaining})
                  </p>
                )}
                {!exceedsLimit && (
                  <p className="text-xs text-blue-700 mt-1">
                    {actualRecipients.length === 0
                      ? 'No recipients selected'
                      : recipientFilter === 'custom'
                        ? `${selectedMembers.size} custom selected`
                        : `Using ${recipientFilter} filter`}
                  </p>
                )}
              </div>
            </div>

            {/* Member Selection Table - Always visible for custom selection */}
            {recipientFilter === 'custom' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Choose individual members</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedMembers.size === filteredMembers.length && filteredMembers.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search members by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left w-12">
                            <Checkbox
                              checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </th>
                          <th className="px-4 py-3 text-left w-16"></th>
                          <th
                            className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-2">
                              Name
                              {sortBy === 'name' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">
                            Phone
                          </th>
                          <th
                            className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('role')}
                          >
                            <div className="flex items-center gap-2">
                              Role
                              {sortBy === 'role' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-2">
                              Status
                              {sortBy === 'status' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No members found with phone numbers
                            </td>
                          </tr>
                        ) : (
                          filteredMembers.map((member) => (
                            <tr
                              key={member.member.id}
                              className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                selectedMembers.has(member.member.id) ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => toggleMemberSelection(member.member.id)}
                            >
                              <td className="px-4 py-3">
                                <Checkbox
                                  checked={selectedMembers.has(member.member.id)}
                                  onCheckedChange={() => toggleMemberSelection(member.member.id)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {getInitials(getUserDisplayName(member.user))}
                                  </AvatarFallback>
                                </Avatar>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">
                                  {getUserDisplayName(member.user)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-gray-600">{member.member.phone}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  member.member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                  member.member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.member.role.charAt(0).toUpperCase() + member.member.role.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  member.member.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  member.member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {member.member.status.charAt(0).toUpperCase() + member.member.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS Composer - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[120px] resize-none"
                maxLength={SMS_CHARACTER_LIMIT}
              />
              <div className="flex justify-between text-sm">
                <p className={`${message.length > SMS_CHARACTER_LIMIT ? 'text-red-600' : 'text-gray-500'}`}>
                  {message.length}/{SMS_CHARACTER_LIMIT} characters
                </p>
                {message.length > SMS_CHARACTER_LIMIT && (
                  <p className="text-red-600">
                    Message too long
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                onClick={handlePreview}
                variant="outline"
                disabled={!isFormValid}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Recipients
              </Button>
              <Button
                onClick={handleConfirmSend}
                disabled={!isFormValid || isSending || exceedsLimit}
                className="flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Text Message
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Recipients</DialogTitle>
              <DialogDescription>
                The following {actualRecipients.length} member{actualRecipients.length !== 1 ? 's' : ''} will receive this text message:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {actualRecipients.map((member) => (
                <div
                  key={member.member.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(getUserDisplayName(member.user))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{getUserDisplayName(member.user)}</p>
                    <p className="text-sm text-gray-600">{member.member.phone}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.member.role === 'admin' && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
                    )}
                    {member.member.role === 'owner' && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Owner</span>
                    )}
                    {member.member.status === 'pending' && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Send</DialogTitle>
              <DialogDescription>
                Are you sure you want to send this text message?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Message Preview:</p>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{message}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Recipients:</p>
                  <p className="text-sm text-gray-900">
                    {actualRecipients.length} member{actualRecipients.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Each recipient will receive an individual text message.
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Text Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
