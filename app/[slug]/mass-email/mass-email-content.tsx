'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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
  Mail,
  Send,
  Users as UsersIcon,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Filter,
  ChevronUp,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface Member {
  member: {
    id: number;
    userId: number;
    unionId: number;
    role: string;
    status: string;
    joinedAt: Date;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface MassEmailContentProps {
  slug: string;
  union: {
    id: number;
    name: string;
    localNumber: string | null;
  };
  members: Member[];
}

export function MassEmailContent({ slug, union, members }: MassEmailContentProps) {
  const searchParams = useSearchParams();
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
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
  const [emailUsage, setEmailUsage] = useState<{
    limit: number;
    used: number;
    remaining: number;
    percentUsed: number;
    resetDate: string;
  } | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  // Pre-fill email content from URL parameters (for sharing from posts/files/events)
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    const contentParam = searchParams.get('content');

    if (subjectParam) {
      setSubject(decodeURIComponent(subjectParam));
    }
    if (contentParam) {
      setHtmlContent(decodeURIComponent(contentParam));
    }
  }, [searchParams]);

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

  // Fetch email usage on mount and after successful send
  const fetchEmailUsage = async () => {
    try {
      setIsLoadingUsage(true);
      const response = await fetch(`/api/mass-email/usage?unionId=${union.id}`);
      if (response.ok) {
        const data = await response.json();
        setEmailUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching email usage:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchEmailUsage();
  }, [union.id]);

  // Filter members based on recipient filter and search
  const filteredMembers = useMemo(() => {
    let filtered = members.filter((m) => {
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
        m.user.email.toLowerCase().includes(searchLower);

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
  }, [members, recipientFilter, searchQuery, selectedMembers, sortBy, sortDirection]);

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

  // Get actual recipients that will receive the email
  const actualRecipients = useMemo(() => {
    if (recipientFilter === 'custom') {
      return members.filter((m) => selectedMembers.has(m.member.id));
    }
    return filteredMembers;
  }, [members, filteredMembers, recipientFilter, selectedMembers]);

  const handlePreview = () => {
    setShowPreviewDialog(true);
  };

  const handleConfirmSend = () => {
    setShowConfirmDialog(true);
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendResult(null);

    // Convert HTML to plain text for text content
    const textContent = htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    try {
      const response = await fetch('/api/mass-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unionId: union.id,
          subject,
          htmlContent,
          textContent,
          recipientFilter,
          customRecipientIds: recipientFilter === 'custom' ? Array.from(selectedMembers) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({
          success: true,
          message: `Email sent successfully to ${data.successCount} of ${data.totalRecipients} recipients!`,
          details: data,
        });
        // Reset form after successful send
        setSubject('');
        setHtmlContent('');
        setSelectedMembers(new Set());
        // Refresh email usage
        fetchEmailUsage();
      } else {
        // Handle email limit exceeded error with more details
        if (response.status === 429 && data.details) {
          setSendResult({
            success: false,
            message: data.details.message || data.error,
            details: data.details,
          });
        } else {
          setSendResult({
            success: false,
            message: data.error || 'Failed to send email',
            details: data.details,
          });
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendResult({
        success: false,
        message: 'An error occurred while sending the email',
      });
    } finally {
      setIsSending(false);
      setShowConfirmDialog(false);
    }
  };

  const isFormValid = subject.trim() !== '' && htmlContent.trim() !== '' && actualRecipients.length > 0;

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
            <Mail className="h-8 w-8" />
            Emails
          </h1>
          <p className="text-gray-600 mt-2">
            Send emails to multiple members at once
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
                      {sendResult.details.failureCount} emails failed to send. Check the logs for details.
                    </p>
                  )}
                  {/* Show limit details if provided */}
                  {sendResult.details && sendResult.details.limit && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-3 border border-gray-200">
                      <p><strong>Email Limit:</strong> {sendResult.details.limit.toLocaleString()} emails/month</p>
                      <p><strong>Already Used:</strong> {sendResult.details.used.toLocaleString()} emails</p>
                      <p><strong>Remaining:</strong> {sendResult.details.remaining.toLocaleString()} emails</p>
                      <p><strong>Requested:</strong> {sendResult.details.requested.toLocaleString()} emails</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Usage Counter - Full Width at Top */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Email Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUsage ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : emailUsage ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Progress Bar */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {emailUsage.used.toLocaleString()} / {emailUsage.limit.toLocaleString()} emails
                    </span>
                    <span className="text-gray-500">
                      {emailUsage.percentUsed}%
                    </span>
                  </div>
                  <Progress
                    value={emailUsage.percentUsed}
                    className="h-3"
                  />
                  <p className="text-xs text-gray-600">
                    Resets on {new Date(emailUsage.resetDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Remaining/Usage Info */}
                <div className={`rounded-lg p-4 ${
                  emailUsage.percentUsed >= 90
                    ? 'bg-red-50 border border-red-200'
                    : emailUsage.percentUsed >= 75
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <p className={`text-base font-semibold ${
                    emailUsage.percentUsed >= 90
                      ? 'text-red-900'
                      : emailUsage.percentUsed >= 75
                      ? 'text-yellow-900'
                      : 'text-green-900'
                  }`}>
                    {emailUsage.remaining.toLocaleString()}
                  </p>
                  <p className={`text-sm ${
                    emailUsage.percentUsed >= 90
                      ? 'text-red-700'
                      : emailUsage.percentUsed >= 75
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`}>
                    emails remaining
                  </p>

                  {/* Upgrade message for free users approaching limit */}
                  {emailUsage.limit === 500 && emailUsage.percentUsed >= 75 && (
                    <p className="text-xs text-blue-900 mt-2 pt-2 border-t border-gray-300">
                      Upgrade for up to 15,000 emails/month
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Unable to load usage data</p>
            )}
          </CardContent>
        </Card>

        {/* Recipient Selection Card - Now prominently displayed */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Select Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    <SelectItem value="all">All Members ({members.length})</SelectItem>
                    <SelectItem value="approved">
                      Approved Members ({members.filter((m) => m.member.status === 'approved').length})
                    </SelectItem>
                    <SelectItem value="admin">
                      Admins Only ({members.filter((m) => m.member.role === 'admin').length})
                    </SelectItem>
                    <SelectItem value="pending">
                      Pending Members ({members.filter((m) => m.member.status === 'pending').length})
                    </SelectItem>
                    <SelectItem value="rejected">
                      Rejected Members ({members.filter((m) => m.member.status === 'rejected').length})
                    </SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col justify-center">
                <p className="text-sm font-medium text-blue-900">
                  {actualRecipients.length} {actualRecipients.length === 1 ? 'recipient' : 'recipients'} selected
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {actualRecipients.length === 0
                    ? 'No recipients selected'
                    : recipientFilter === 'custom'
                      ? `${selectedMembers.size} custom selected`
                      : `Using ${recipientFilter} filter`}
                </p>
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
                    placeholder="Search members by name or email..."
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
                          <th
                            className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center gap-2">
                              Email
                              {sortBy === 'email' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
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
                              No members found
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
                                <p className="text-gray-600">{member.user.email}</p>
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

        {/* Email Composer - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <div className="border rounded-lg overflow-hidden">
                <RichTextEditor
                  content={htmlContent}
                  onChange={setHtmlContent}
                  placeholder="Compose your message..."
                  className="min-h-[300px]"
                />
              </div>
              <p className="text-sm text-gray-500">
                Your message will be automatically wrapped in your union's branded email template.
              </p>
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
                disabled={!isFormValid || isSending}
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
                    Send Email
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
                The following {actualRecipients.length} member{actualRecipients.length !== 1 ? 's' : ''} will receive this email:
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
                    <p className="text-sm text-gray-600">{member.user.email}</p>
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
                Are you sure you want to send this email?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Subject:</p>
                  <p className="text-sm text-gray-900">{subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Recipients:</p>
                  <p className="text-sm text-gray-900">
                    {actualRecipients.length} member{actualRecipients.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Each recipient will receive an individual email with your union's branding.
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
                    Send Email
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
