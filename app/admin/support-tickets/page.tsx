'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  Loader2,
  Paperclip,
  X,
  Send,
  MoreVertical,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface Ticket {
  id: number;
  unionId: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  userName: string;
  userEmail: string;
  unionName: string;
  unionSlug: string;
  unionLocalNumber: string | null;
  unionPublicName: string | null;
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
  { value: 'billing', label: 'Billing' },
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'site_customization', label: 'Site Customization' },
];

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  awaiting_response: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWebmaster, setIsWebmaster] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [loadingTicket, setLoadingTicket] = useState(false);

  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support-tickets');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }

      if (!data.isWebmaster) {
        setError('Access denied. Only support staff can access this page.');
        return;
      }

      setIsWebmaster(true);
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message);
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

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);

    try {
      const response = await fetch(`/api/support-tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (response.ok) {
        setReplyMessage('');
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

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;

    setUpdatingStatus(true);

    try {
      const response = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    if (!selectedTicket) return;

    setUpdatingStatus(true);

    try {
      const response = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });

      if (response.ok) {
        fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Failed to update priority. Please try again.');
    } finally {
      setUpdatingStatus(false);
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

  const getUnionDisplayName = (ticket: Ticket) => {
    if (ticket.unionPublicName) return ticket.unionPublicName;
    return `${ticket.unionName.toUpperCase()}${ticket.unionLocalNumber ? ` ${ticket.unionLocalNumber}` : ''}`;
  };

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterCategory !== 'all' && ticket.category !== filterCategory) return false;
    return true;
  });

  // Stats
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const awaitingCount = tickets.filter((t) => t.status === 'awaiting_response').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h2 className="font-semibold">Access Denied</h2>
            </div>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LifeBuoy className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            </div>
            <p className="text-gray-600">
              Manage and respond to support tickets from union admins
            </p>
          </div>
          <Button variant="outline" onClick={fetchTickets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{tickets.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{openCount}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Awaiting Response</p>
                  <p className="text-2xl font-bold text-purple-600">{awaitingCount}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filters:</span>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filterStatus !== 'all' || filterCategory !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filterStatus !== 'all' || filterCategory !== 'all'
                ? `Filtered Tickets (${filteredTickets.length})`
                : `All Tickets (${tickets.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tickets found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Union</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => fetchTicketDetails(ticket.id)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                              {ticket.subject}
                            </p>
                            <p className="text-sm text-gray-500">{ticket.userName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[150px]">
                              {getUnionDisplayName(ticket)}
                            </span>
                            <Link
                              href={`/${ticket.unionSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {categoryOptions.find((c) => c.value === ticket.category)?.label ||
                            ticket.category}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[ticket.status] || statusColors.open}>
                            {statusOptions.find((s) => s.value === ticket.status)?.label ||
                              ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[ticket.priority] || priorityColors.normal}>
                            {priorityOptions.find((p) => p.value === ticket.priority)?.label ||
                              ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => fetchTicketDetails(ticket.id)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/${ticket.unionSlug}`, '_blank');
                                }}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Union Page
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
            setTicketReplies([]);
            setReplyMessage('');
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          {loadingTicket ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : selectedTicket ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl pr-8">{selectedTicket.subject}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 mt-2">
                      <span>{selectedTicket.userName} ({selectedTicket.userEmail})</span>
                      <span>•</span>
                      <Link
                        href={`/${selectedTicket.unionSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {getUnionDisplayName(selectedTicket)}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span>•</span>
                      <span>{formatDate(selectedTicket.createdAt)}</span>
                    </DialogDescription>
                  </div>
                </div>

                {/* Status and Priority Controls */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={handleUpdateStatus}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={handleUpdatePriority}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {categoryOptions.find((c) => c.value === selectedTicket.category)?.label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Original Ticket */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
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
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
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

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('resolved')}
                        disabled={updatingStatus || selectedTicket.status === 'resolved'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </Button>
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
