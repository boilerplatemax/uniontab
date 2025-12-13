'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DollarSign,
  Clock,
  Users,
  Calendar,
  Download,
  Loader2,
  Filter,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { Strike } from '@/lib/db/schema';

interface StrikePayRecord {
  memberId: number;
  memberName: string;
  memberEmail: string;
  totalShifts: number;
  completedShifts: number;
  totalHours: number;
  shifts: {
    shiftId: number;
    date: string;
    zoneName: string;
    startTime: string;
    endTime: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    hoursWorked: number | null;
    status: string;
  }[];
}

interface StrikePaySummary {
  totalMembers: number;
  totalShiftsScheduled: number;
  totalShiftsCompleted: number;
  totalHours: number;
}

interface StrikePayTabProps {
  strikeId: number;
  strike: Strike;
}

export function StrikePayTab({ strikeId, strike }: StrikePayTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<StrikePaySummary | null>(null);
  const [records, setRecords] = useState<StrikePayRecord[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/strikes/${strikeId}/strike-pay-report`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch report');
      }

      const data = await response.json();
      setSummary(data.summary);
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [strikeId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const exportCSV = () => {
    const headers = ['Member Name', 'Email', 'Total Shifts', 'Completed Shifts', 'Total Hours'];
    const rows = records.map(r => [
      r.memberName,
      r.memberEmail,
      r.totalShifts.toString(),
      r.completedShifts.toString(),
      r.totalHours.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strike-pay-report-${strikeId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Strike Pay Report</h2>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="startDate">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={fetchReport}>
              Apply Filter
            </Button>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  fetchReport();
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participants
              </CardDescription>
              <CardTitle className="text-2xl">{summary.totalMembers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Shifts Scheduled
              </CardDescription>
              <CardTitle className="text-2xl">{summary.totalShiftsScheduled}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Shifts Completed
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">{summary.totalShiftsCompleted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Total Hours
              </CardDescription>
              <CardTitle className="text-2xl text-blue-600">{summary.totalHours}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Member Records */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No records found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No check-in data available for the selected date range.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Member Hours</CardTitle>
            <CardDescription>
              Sorted by total hours worked (highest first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {records.map((record, index) => (
                <AccordionItem
                  key={record.memberId}
                  value={`member-${record.memberId}`}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="text-left">
                          <p className="font-medium">{record.memberName}</p>
                          <p className="text-sm text-gray-500">{record.memberEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{record.totalHours} hrs</p>
                          <p className="text-xs text-gray-500">
                            {record.completedShifts}/{record.totalShifts} shifts
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Zone</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {record.shifts.map(shift => (
                          <TableRow key={shift.shiftId}>
                            <TableCell>{formatDate(shift.date)}</TableCell>
                            <TableCell>{shift.zoneName}</TableCell>
                            <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                            <TableCell>{formatTime(shift.checkInTime)}</TableCell>
                            <TableCell>{formatTime(shift.checkOutTime)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {shift.hoursWorked !== null ? `${shift.hoursWorked}` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={shift.status === 'completed' ? 'default' : 'secondary'}
                                className={
                                  shift.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : shift.status === 'checked_in'
                                    ? 'bg-blue-100 text-blue-800'
                                    : ''
                                }
                              >
                                {shift.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
