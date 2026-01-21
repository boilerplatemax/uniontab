'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
  X,
  ArrowLeft,
  Send,
  Upload,
} from 'lucide-react';
import type { Union, Member, User } from '@/lib/db/schema';
import { createClient } from '@supabase/supabase-js';

interface SupportContentProps {
  union: Union;
  membership: { user: User; member: Member } | null;
  handleSignOut: () => Promise<void>;
  slug: string;
}

interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  userName?: string;
  userEmail?: string;
}

interface TicketReply {
  id: number;
  message: string;
  isStaffReply: boolean;
  createdAt: string;
  userName: string;
  userEmail: string;
  attachments?: any[];
}

interface TicketDetail extends Ticket {
  attachments: any[];
}

const categoryOptions = [
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'technical_issue', label: 'Technical Issue' },
];

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  awaiting_response: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  awaiting_response: 'Awaiting Response',
  resolved: 'Resolved',
  closed: 'Closed',
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function SupportContent({
  union,
  membership,
  handleSignOut,
  slug,
}: SupportContentProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reply form
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<any[]>([]);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/support-tickets?unionId=${union.id}`);
      const data = await response.json();

      if (response.ok) {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    setLoadingTicket(true);
    try {
      const response = await fetch(`/api/support-tickets/${ticketId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedTicket(data.ticket);
        setTicketReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleFileUpload = async (
    files: FileList | null,
    isReply: boolean = false
  ) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: any[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `support-tickets/${union.id}/${fileName}`;

        const { error } = await supabase.storage
          .from('files')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);

        newAttachments.push({
          fileName: file.name,
          fileUrl: publicUrl,
          fileType: file.type,
          fileSize: file.size,
        });
      }

      if (isReply) {
        setReplyAttachments([...replyAttachments, ...newAttachments]);
      } else {
        setAttachments([...attachments, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number, isReply: boolean = false) => {
    if (isReply) {
      setReplyAttachments(replyAttachments.filter((_, i) => i !== index));
    } else {
      setAttachments(attachments.filter((_, i) => i !== index));
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim() || !category) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId: union.id,
          subject,
          description,
          category,
          attachments,
        }),
      });

      if (response.ok) {
        setShowNewTicket(false);
        setSubject('');
        setDescription('');
        setCategory('');
        setAttachments([]);
        fetchTickets();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);

    try {
      const response = await fetch(`/api/support-tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          attachments: replyAttachments,
        }),
      });

      if (response.ok) {
        setReplyMessage('');
        setReplyAttachments([]);
        fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
      />
      <NavbarSpacer />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`/${slug}/help`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <LifeBuoy className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Support</h1>
            </div>
            <p className="text-gray-600">
              Submit a support ticket and our team will get back to you.
            </p>
          </div>
          <Button onClick={() => setShowNewTicket(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No support tickets yet
              </h3>
              <p className="text-gray-600 mb-6">
                Have a question or issue? Create a support ticket and we'll help you out.
              </p>
              <Button onClick={() => setShowNewTicket(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => fetchTicketDetails(ticket.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <Badge className={statusColors[ticket.status] || statusColors.open}>
                          {statusLabels[ticket.status] || ticket.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="capitalize">
                          {categoryOptions.find(c => c.value === ticket.category)?.label || ticket.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <MessageSquare className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue or question and our team will get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitTicket}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your issue in detail. Include any relevant steps to reproduce the problem, error messages, or screenshots."
                  rows={6}
                />
              </div>

              <div>
                <Label>Attachments (optional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload Files
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload screenshots, documents, or other relevant files
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((att, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                      >
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="flex-1 text-sm truncate">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewTicket(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
            setTicketReplies([]);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          {loadingTicket ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : selectedTicket ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <span className="capitalize">
                        {categoryOptions.find(c => c.value === selectedTicket.category)?.label}
                      </span>
                      <span>•</span>
                      <span>{formatDate(selectedTicket.createdAt)}</span>
                    </DialogDescription>
                  </div>
                  <Badge className={statusColors[selectedTicket.status] || statusColors.open}>
                    {statusLabels[selectedTicket.status] || selectedTicket.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Original Ticket */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {selectedTicket.userName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedTicket.userName}</p>
                      <p className="text-xs text-gray-500">{selectedTicket.userEmail}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>

                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {selectedTicket.attachments.map((att: any) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          {att.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Replies */}
                {ticketReplies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-lg p-4 ${
                      reply.isStaffReply ? 'bg-blue-50 ml-4' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          reply.isStaffReply ? 'bg-blue-200' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            reply.isStaffReply ? 'text-blue-700' : 'text-gray-600'
                          }`}
                        >
                          {reply.userName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{reply.userName}</p>
                          {reply.isStaffReply && (
                            <Badge variant="outline" className="text-xs">
                              Support Staff
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>

                    {reply.attachments && reply.attachments.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {reply.attachments.map((att: any) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <Paperclip className="h-3 w-3" />
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleFileUpload(e.target.files, true)}
                          className="hidden"
                          id="reply-file-upload"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <label
                          htmlFor="reply-file-upload"
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm"
                        >
                          <Paperclip className="h-4 w-4" />
                          Attach
                        </label>

                        {replyAttachments.length > 0 && (
                          <span className="text-sm text-gray-500">
                            {replyAttachments.length} file(s)
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || sendingReply}
                      >
                        {sendingReply ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>

                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((att, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            <span className="truncate max-w-[150px]">{att.fileName}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index, true)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
