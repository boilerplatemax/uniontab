'use client';

import { useState, useEffect, use } from 'react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';
import {
  Users,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  FolderOpen,
  Vote,
  AlertTriangle,
  DollarSign,
  Zap,
  Megaphone,
  Video,
  TrendingUp,
  Activity,
  ArrowLeft,
  RefreshCw,
  HardDrive,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalMembers: number;
    approvedMembers: number;
    pendingMembers: number;
    rejectedMembers: number;
    delinquentMembers: number;
    monthlyEmailsSent: number;
    monthlySMSSent: number;
    storageUsedBytes: number;
  };
  members: {
    byStatus: { status: string; count: number }[];
    byRole: { role: string; count: number }[];
    growth: { month: string; count: number }[];
    communicationPrefs: {
      allowEmails: number;
      allowTextMessages: number;
      allowPhoneCalls: number;
      allowPushNotifications: number;
    };
  };
  communications: {
    email: {
      totalCampaigns: number;
      totalSent: number;
      totalSuccess: number;
      totalFailed: number;
      history: { month: string; count: number; totalSent: number }[];
    };
    sms: {
      totalCampaigns: number;
      totalSent: number;
      totalSuccess: number;
      totalFailed: number;
      history: { month: string; count: number; totalSent: number }[];
    };
  };
  content: {
    posts: {
      total: number;
      public: number;
      private: number;
      pinned: number;
      topEngaged: { postId: number; title: string; likes: number; createdAt: string }[];
    };
    events: {
      total: number;
      upcoming: number;
      past: number;
      public: number;
      private: number;
      upcomingList: { id: number; title: string; startDate: string; location: string }[];
    };
    files: {
      total: number;
      public: number;
      private: number;
      totalSize: number;
    };
  };
  engagement: {
    activity: {
      last30Days: number;
      signIns: number;
      uniqueUsers: number;
      byDay: { date: string; count: number }[];
      recent: { id: number; action: string; timestamp: string; userId: number }[];
    };
    elections: {
      total: number;
      draft: number;
      active: number;
      closed: number;
      participation: { electionId: number; title: string; totalVotes: number; status: string }[];
    };
  };
  operations: {
    grievances: {
      total: number;
      open: number;
      resolved: number;
      archived: number;
      byStatus: { status: string; count: number }[];
    };
    dues: {
      total: number;
      paid: number;
      unpaid: number;
      partial: number;
      waived: number;
      totalOwed: number;
      totalCollected: number;
      collectionRate: number;
    };
    strikes: {
      total: number;
      preparing: number;
      active: number;
      resolved: number;
    };
    announcements: {
      total: number;
      active: number;
      popup: number;
      banner: number;
    };
    meetings: {
      total: number;
      scheduled: number;
      completed: number;
      cancelled: number;
    };
  };
  generatedAt: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatMonthLabel(monthStr: string): string {
  try {
    const date = parseISO(monthStr + '-01');
    return format(date, 'MMM yyyy');
  } catch {
    return monthStr;
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className={`h-4 w-4 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm ml-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [unionId, setUnionId] = useState<number | null>(null);

  // Get union ID from the slug
  useEffect(() => {
    async function fetchUnionId() {
      try {
        const res = await fetch(`/api/check-union?slug=${resolvedParams.slug}`);
        const data = await res.json();
        if (data.id) {
          setUnionId(data.id);
        }
      } catch (error) {
        console.error('Error fetching union:', error);
      }
    }
    fetchUnionId();
  }, [resolvedParams.slug]);

  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    unionId ? `/api/analytics?unionId=${unionId}` : null,
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load analytics</h2>
          <p className="text-gray-600 mb-4">{error.message || 'An error occurred while fetching analytics data.'}</p>
          <Button onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const memberStatusData = data.members.byStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  }));

  const memberRoleData = data.members.byRole.map((item) => ({
    name: item.role.charAt(0).toUpperCase() + item.role.slice(1),
    value: item.count,
  }));

  const memberGrowthData = data.members.growth.map((item) => ({
    month: formatMonthLabel(item.month),
    members: item.count,
  }));

  const activityData = data.engagement.activity.byDay.map((item) => ({
    date: format(parseISO(item.date), 'MMM d'),
    activity: item.count,
  }));

  const communicationData = [
    ...data.communications.email.history.map((item) => ({
      month: formatMonthLabel(item.month),
      emails: item.totalSent,
      sms: 0,
    })),
  ];

  // Merge SMS data
  data.communications.sms.history.forEach((smsItem) => {
    const existing = communicationData.find((d) => d.month === formatMonthLabel(smsItem.month));
    if (existing) {
      existing.sms = smsItem.totalSent;
    } else {
      communicationData.push({
        month: formatMonthLabel(smsItem.month),
        emails: 0,
        sms: smsItem.totalSent,
      });
    }
  });

  // Sort by month
  communicationData.sort((a, b) => a.month.localeCompare(b.month));

  const grievanceStatusData = data.operations.grievances.byStatus.map((item) => ({
    name: item.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: item.count,
  }));

  const duesData = [
    { name: 'Paid', value: data.operations.dues.paid, color: CHART_COLORS.success },
    { name: 'Unpaid', value: data.operations.dues.unpaid, color: CHART_COLORS.danger },
    { name: 'Partial', value: data.operations.dues.partial, color: CHART_COLORS.warning },
    { name: 'Waived', value: data.operations.dues.waived, color: CHART_COLORS.purple },
  ].filter((item) => item.value > 0);

  const commPrefsData = [
    { name: 'Email', value: data.members.communicationPrefs.allowEmails },
    { name: 'SMS', value: data.members.communicationPrefs.allowTextMessages },
    { name: 'Phone', value: data.members.communicationPrefs.allowPhoneCalls },
    { name: 'Push', value: data.members.communicationPrefs.allowPushNotifications },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href={`/${resolvedParams.slug}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into your union&apos;s performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              Last updated: {format(parseISO(data.generatedAt), 'MMM d, yyyy h:mm a')}
            </p>
            <Button onClick={() => mutate()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Members"
            value={data.overview.totalMembers}
            icon={Users}
            description={`${data.overview.approvedMembers} approved`}
            color="blue"
          />
          <StatCard
            title="Pending Approvals"
            value={data.overview.pendingMembers}
            icon={Clock}
            description="Awaiting review"
            color="yellow"
          />
          <StatCard
            title="Emails This Month"
            value={data.overview.monthlyEmailsSent}
            icon={Mail}
            color="green"
          />
          <StatCard
            title="SMS This Month"
            value={data.overview.monthlySMSSent}
            icon={MessageSquare}
            color="purple"
          />
        </div>

        {/* Member Growth & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Member Growth
              </CardTitle>
              <CardDescription>New members over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={memberGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="members"
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Member Distribution
              </CardTitle>
              <CardDescription>By status and role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-48">
                  <p className="text-sm font-medium text-gray-700 mb-2 text-center">By Status</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={memberStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {memberStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="h-48">
                  <p className="text-sm font-medium text-gray-700 mb-2 text-center">By Role</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={memberRoleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {memberRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communication Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Communication History
              </CardTitle>
              <CardDescription>Emails and SMS sent over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={communicationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="emails" name="Emails" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sms" name="SMS" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Communication Preferences
              </CardTitle>
              <CardDescription>How members prefer to be contacted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commPrefsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="value" name="Members" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                User Activity
              </CardTitle>
              <CardDescription>Daily activity over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{data.engagement.activity.last30Days}</p>
                  <p className="text-xs text-gray-600">Actions (30d)</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.engagement.activity.signIns}</p>
                  <p className="text-xs text-gray-600">Sign-ins (30d)</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{data.engagement.activity.uniqueUsers}</p>
                  <p className="text-xs text-gray-600">Active Users</p>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="activity"
                      stroke={CHART_COLORS.warning}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.warning, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-purple-600" />
                Election Participation
              </CardTitle>
              <CardDescription>Recent election voter turnout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold text-gray-900">{data.engagement.elections.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xl font-bold text-yellow-600">{data.engagement.elections.draft}</p>
                  <p className="text-xs text-gray-600">Draft</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{data.engagement.elections.active}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{data.engagement.elections.closed}</p>
                  <p className="text-xs text-gray-600">Closed</p>
                </div>
              </div>
              {data.engagement.elections.participation.length > 0 ? (
                <div className="space-y-3">
                  {data.engagement.elections.participation.map((election) => (
                    <div key={election.electionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{election.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          election.status === 'active' ? 'bg-green-100 text-green-800' :
                          election.status === 'closed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {election.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">{election.totalVotes}</p>
                        <p className="text-xs text-gray-500">votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Vote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No elections yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content & Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Posts"
            value={data.content.posts.total}
            icon={FileText}
            description={`${data.content.posts.pinned} pinned`}
            color="blue"
          />
          <StatCard
            title="Events"
            value={data.content.events.total}
            icon={Calendar}
            description={`${data.content.events.upcoming} upcoming`}
            color="green"
          />
          <StatCard
            title="Files"
            value={data.content.files.total}
            icon={FolderOpen}
            description={formatBytes(data.content.files.totalSize)}
            color="purple"
          />
          <StatCard
            title="Storage Used"
            value={formatBytes(data.overview.storageUsedBytes)}
            icon={HardDrive}
            color="yellow"
          />
        </div>

        {/* Grievances & Dues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Grievances Overview
              </CardTitle>
              <CardDescription>Status breakdown of all grievances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold text-gray-900">{data.operations.grievances.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xl font-bold text-yellow-600">{data.operations.grievances.open}</p>
                  <p className="text-xs text-gray-600">Open</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{data.operations.grievances.resolved}</p>
                  <p className="text-xs text-gray-600">Resolved</p>
                </div>
                <div className="text-center p-2 bg-gray-100 rounded-lg">
                  <p className="text-xl font-bold text-gray-600">{data.operations.grievances.archived}</p>
                  <p className="text-xs text-gray-600">Archived</p>
                </div>
              </div>
              {grievanceStatusData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={grievanceStatusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="value" name="Count" fill={CHART_COLORS.danger} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No grievances filed</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Dues Collection
              </CardTitle>
              <CardDescription>Payment status and collection rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Owed</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.operations.dues.totalOwed)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Collected</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(data.operations.dues.totalCollected)}</p>
                </div>
              </div>

              {/* Collection Rate Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Collection Rate</span>
                  <span className="font-medium">{data.operations.dues.collectionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${data.operations.dues.collectionRate}%` }}
                  />
                </div>
              </div>

              {duesData.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={duesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {duesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No dues records</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delinquent Members</p>
                  <p className="text-2xl font-bold text-red-600">{data.overview.delinquentMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Strikes</p>
                  <p className="text-2xl font-bold text-yellow-600">{data.operations.strikes.active}</p>
                  <p className="text-xs text-gray-500">{data.operations.strikes.preparing} preparing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Meetings</p>
                  <p className="text-2xl font-bold text-blue-600">{data.operations.meetings.total}</p>
                  <p className="text-xs text-gray-500">{data.operations.meetings.scheduled} scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Megaphone className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Announcements</p>
                  <p className="text-2xl font-bold text-pink-600">{data.operations.announcements.total}</p>
                  <p className="text-xs text-gray-500">{data.operations.announcements.active} active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Engaged Posts & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-blue-600" />
                Top Engaged Posts
              </CardTitle>
              <CardDescription>Posts with the most likes</CardDescription>
            </CardHeader>
            <CardContent>
              {data.content.posts.topEngaged.length > 0 ? (
                <div className="space-y-3">
                  {data.content.posts.topEngaged.map((post, index) => (
                    <div key={post.postId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{post.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(post.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="font-bold">{post.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No posts yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Next 5 scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              {data.content.events.upcomingList.length > 0 ? (
                <div className="space-y-3">
                  {data.content.events.upcomingList.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex flex-col items-center justify-center">
                        <p className="text-xs text-green-600 font-medium">
                          {format(new Date(event.startDate), 'MMM')}
                        </p>
                        <p className="text-lg font-bold text-green-700">
                          {format(new Date(event.startDate), 'd')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{event.title}</p>
                        {event.location && (
                          <p className="text-xs text-gray-500 truncate">{event.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email & SMS Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Email Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{data.communications.email.totalCampaigns}</p>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{data.communications.email.totalSent}</p>
                  <p className="text-sm text-gray-600">Emails Sent</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{data.communications.email.totalSuccess}</p>
                  <p className="text-sm text-gray-600">Delivered</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{data.communications.email.totalFailed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>
              {data.communications.email.totalSent > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Delivery Rate</span>
                    <span className="font-medium">
                      {Math.round((data.communications.email.totalSuccess / data.communications.email.totalSent) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(data.communications.email.totalSuccess / data.communications.email.totalSent) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                SMS Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{data.communications.sms.totalCampaigns}</p>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{data.communications.sms.totalSent}</p>
                  <p className="text-sm text-gray-600">SMS Sent</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{data.communications.sms.totalSuccess}</p>
                  <p className="text-sm text-gray-600">Delivered</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{data.communications.sms.totalFailed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>
              {data.communications.sms.totalSent > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Delivery Rate</span>
                    <span className="font-medium">
                      {Math.round((data.communications.sms.totalSuccess / data.communications.sms.totalSent) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(data.communications.sms.totalSuccess / data.communications.sms.totalSent) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
