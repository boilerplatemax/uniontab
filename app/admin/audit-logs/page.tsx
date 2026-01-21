'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Loader2,
  Mail,
  MessageSquare,
  Vote,
  Activity,
  RefreshCw,
  Filter,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface EmailLog {
  id: number;
  unionId: number;
  unionName: string;
  unionLocalNumber: string | null;
  subject: string;
  recipientFilter: string;
  status: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  sentAt: string | null;
  createdByName: string;
  createdByEmail: string;
}

interface SMSLog {
  id: number;
  unionId: number;
  unionName: string;
  unionLocalNumber: string | null;
  message: string;
  recipientFilter: string;
  status: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  sentAt: string | null;
  createdByName: string;
  createdByEmail: string;
}

interface ElectionLog {
  id: number;
  unionId: number;
  unionName: string;
  unionLocalNumber: string | null;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  createdByName: string;
  createdByEmail: string;
  totalVotes: number;
}

interface ActivityLog {
  id: number;
  unionId: number;
  unionName: string;
  unionLocalNumber: string | null;
  action: string;
  timestamp: string;
  ipAddress: string | null;
  userName: string;
  userEmail: string;
}

interface Union {
  id: number;
  name: string;
  localNumber: string | null;
  slug: string;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    sent: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    sending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1 animate-pulse" /> },
    failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    draft: { variant: 'outline', icon: null },
    scheduled: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
    active: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    completed: { variant: 'secondary', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    cancelled: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
  };

  const config = variants[status] || { variant: 'outline' as const, icon: null };

  return (
    <Badge variant={config.variant} className="flex items-center w-fit">
      {config.icon}
      {status}
    </Badge>
  );
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

const getUnionDisplayName = (name: string, localNumber: string | null) => {
  if (localNumber) {
    return `${name.toUpperCase()} ${localNumber}`;
  }
  return name.toUpperCase();
};

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [sms, setSms] = useState<SMSLog[]>([]);
  const [electionLogs, setElectionLogs] = useState<ElectionLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [unions, setUnions] = useState<Union[]>([]);
  const [selectedUnion, setSelectedUnion] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('email');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUnion !== 'all') {
        params.set('unionId', selectedUnion);
      }

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEmails(data.emails || []);
        setSms(data.sms || []);
        setElectionLogs(data.elections || []);
        setActivities(data.activities || []);
        setUnions(data.unions || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedUnion]);

  if (loading && unions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">
              Track all communication and election activities across unions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedUnion} onValueChange={setSelectedUnion}>
              <SelectTrigger className="w-[220px]">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by union" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Unions</SelectItem>
                {unions.map((union) => (
                  <SelectItem key={union.id} value={union.id.toString()}>
                    {getUnionDisplayName(union.name, union.localNumber)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Emails Sent</p>
                  <p className="text-2xl font-bold text-blue-600">{emails.length}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">SMS Sent</p>
                  <p className="text-2xl font-bold text-green-600">{sms.length}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Elections</p>
                  <p className="text-2xl font-bold text-purple-600">{electionLogs.length}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Vote className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activity Events</p>
                  <p className="text-2xl font-bold text-orange-600">{activities.length}</p>
                </div>
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Logs
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Logs
            </TabsTrigger>
            <TabsTrigger value="elections" className="gap-2">
              <Vote className="h-4 w-4" />
              Elections
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Email Logs Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Mass Email History</CardTitle>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No email logs found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Union</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Recipients</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent By</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  {getUnionDisplayName(email.unionName, email.unionLocalNumber)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {email.subject}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{email.totalRecipients} total</span>
                                <span className="text-xs text-gray-500">
                                  {email.successCount} sent, {email.failureCount} failed
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(email.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{email.createdByName}</span>
                                <span className="text-xs text-gray-500">{email.createdByEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(email.sentAt || email.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Logs Tab */}
          <TabsContent value="sms">
            <Card>
              <CardHeader>
                <CardTitle>Mass SMS History</CardTitle>
              </CardHeader>
              <CardContent>
                {sms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No SMS logs found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Union</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Recipients</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent By</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sms.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <span className="font-medium">
                                {getUnionDisplayName(s.unionName, s.unionLocalNumber)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {s.message}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{s.totalRecipients} total</span>
                                <span className="text-xs text-gray-500">
                                  {s.successCount} sent, {s.failureCount} failed
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(s.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{s.createdByName}</span>
                                <span className="text-xs text-gray-500">{s.createdByEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(s.sentAt || s.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Elections Tab */}
          <TabsContent value="elections">
            <Card>
              <CardHeader>
                <CardTitle>Election History</CardTitle>
              </CardHeader>
              <CardContent>
                {electionLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No elections found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Union</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Votes</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {electionLogs.map((election) => (
                          <TableRow key={election.id}>
                            <TableCell>
                              <span className="font-medium">
                                {getUnionDisplayName(election.unionName, election.unionLocalNumber)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="font-medium">{election.title}</div>
                              {election.description && (
                                <div className="text-xs text-gray-500 truncate">
                                  {election.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(election.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{election.totalVotes} votes</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              <div className="flex flex-col">
                                <span>Start: {formatDate(election.startDate)}</span>
                                <span>End: {formatDate(election.endDate)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{election.createdByName}</span>
                                <span className="text-xs text-gray-500">{election.createdByEmail}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No activity logs found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Union</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              <span className="font-medium">
                                {activity.unionName
                                  ? getUnionDisplayName(activity.unionName, activity.unionLocalNumber)
                                  : '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{activity.userName || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">{activity.userEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{activity.action}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {activity.ipAddress || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(activity.timestamp)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
