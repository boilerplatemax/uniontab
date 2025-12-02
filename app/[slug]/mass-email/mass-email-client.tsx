'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';
import {
  ArrowLeft,
  Mail,
  Users,
  Send,
  Loader2,
  Search,
  Paperclip,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import type { Union } from '@/lib/db/schema';

interface Member {
  memberId: number;
  userId: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
}

interface EmailAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface MassEmailClientProps {
  slug: string;
  union: Union;
  members: Member[];
}

export function MassEmailClient({ slug, union, members }: MassEmailClientProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('approved');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'member'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Email composition
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());

  // Confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const getUserDisplayName = (member: Member) => {
    return member.name || member.email;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Status filter
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

      // Role filter
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        getUserDisplayName(m).toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower);

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [members, statusFilter, roleFilter, searchQuery]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map((m) => m.memberId)));
    }
  };

  const toggleSelectMember = (memberId: number) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSendEmail = async () => {
    setConfirmDialogOpen(false);
    setSending(true);
    setError('');

    try {
      const selectedMembersList = filteredMembers.filter((m) =>
        selectedMembers.has(m.memberId)
      );

      const response = await fetch(`/api/unions/${union.id}/mass-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedMembersList,
          subject,
          message,
          attachments
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      // Success! Reset form
      setSubject('');
      setMessage('');
      setAttachments([]);
      setSelectedMembers(new Set());
      alert(`Successfully sent ${data.sent} email(s)!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleAddAttachment = (file: File | null, url?: string) => {
    if (file && url) {
      setAttachments([
        ...attachments,
        {
          url,
          name: file.name,
          type: file.type,
          size: file.size
        }
      ]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const canSend = subject.trim() && message.trim() && selectedMembers.size > 0;

  const unionDisplayName = union.publicName || union.name;
  const localNumberPart = union.localNumber ? ` Local ${union.localNumber}` : '';

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/${slug}`}>
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Union
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600" />
            Mass Email
          </h1>
          <p className="text-gray-600 mt-2">
            Send bulk emails to your union members
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Email Composition */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subject will be sent as: <span className="font-medium">{unionDisplayName}{localNumberPart} - {subject || '...'}</span>
                  </p>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      content={message}
                      onChange={setMessage}
                      placeholder="Compose your message... This will be sent with your union's branding."
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Each email will include your union's branding (logo, colors, etc.)
                  </p>
                </div>

                <div>
                  <Label>Attachments</Label>
                  <div className="mt-1 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{attachment.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <FileUpload
                      onFileSelect={handleAddAttachment}
                      accept="*"
                      maxSize={10}
                      label="Add Attachment"
                      hint="Upload files to include in the email (max 10MB)"
                      bucket="union-files"
                      path={`${slug}/email-attachments`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Recipients */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recipients ({selectedMembers.size})</span>
                  <Button
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={!canSend || sending}
                    className="gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMembers.size > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-gray-500">
                      Each member will receive an individual email with your union's branding.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No members selected. Select members below to send emails.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Member Selection */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status ({members.length})</SelectItem>
                    <SelectItem value="approved">
                      Approved ({members.filter((m) => m.status === 'approved').length})
                    </SelectItem>
                    <SelectItem value="pending">
                      Pending ({members.filter((m) => m.status === 'pending').length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role-filter">Role</Label>
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                  <SelectTrigger id="role-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="owner">
                      Owners ({members.filter((m) => m.role === 'owner').length})
                    </SelectItem>
                    <SelectItem value="member">
                      Members ({members.filter((m) => m.role === 'member').length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Select All */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
              <Checkbox
                checked={
                  filteredMembers.length > 0 &&
                  selectedMembers.size === filteredMembers.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <Label className="text-sm font-medium cursor-pointer" onClick={toggleSelectAll}>
                Select all {filteredMembers.length} filtered member
                {filteredMembers.length !== 1 ? 's' : ''}
              </Label>
            </div>

            {/* Members List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members found</p>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.memberId}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Checkbox
                      checked={selectedMembers.has(member.memberId)}
                      onCheckedChange={() => toggleSelectMember(member.memberId)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(getUserDisplayName(member))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getUserDisplayName(member)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 capitalize">
                        {member.role} · {member.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              You are about to send this email to {selectedMembers.size} member
              {selectedMembers.size !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Subject:</p>
              <p className="text-sm text-gray-700">{unionDisplayName}{localNumberPart} - {subject}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">Recipients:</p>
              <p className="text-sm text-gray-700">
                {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''}
              </p>
            </div>

            {attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900">Attachments:</p>
                <ul className="text-sm text-gray-700 list-disc list-inside">
                  {attachments.map((att, i) => (
                    <li key={i}>{att.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-900">
                Each email will be personalized with your union's branding and sent individually to each recipient.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} className="gap-2">
              <Send className="h-4 w-4" />
              Send {selectedMembers.size} Email{selectedMembers.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
