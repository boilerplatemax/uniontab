'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, AlertCircle, CheckCircle, Clock, Receipt, Filter, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CreateDuesDialog } from './create-dues-dialog';
import { EditDuesDialog } from './edit-dues-dialog';
import { PaymentHistoryDialog } from './payment-history-dialog';
import { useRouter } from 'next/navigation';
import type { Union, Member } from '@/lib/db/schema';

interface DuesContentProps {
  slug: string;
  union: Union;
  dues: any[];
  summary: {
    totalDues: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOverdue: number;
    paidCount: number;
    unpaidCount: number;
    partialCount: number;
    overdueCount: number;
  };
  members: {
    member: Member;
    user: {
      id: number;
      name: string | null;
      email: string;
    };
  }[];
  isOwner: boolean;
}

export function DuesContent({ slug, union, dues: initialDues, summary, members, isOwner }: DuesContentProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [selectedDues, setSelectedDues] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'partial' | 'overdue'>('all');

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

  const handleGenerateReceipt = async (duesId: number) => {
    try {
      const response = await fetch('/api/dues/generate-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duesId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate receipt');
      }

      const data = await response.json();
      alert(`Receipt generated: ${data.receipt.receiptNumber}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      alert(error.message || 'Failed to generate receipt');
    }
  };

  const filteredDues = initialDues.filter(d => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return d.paymentStatus === 'paid';
    if (filterStatus === 'unpaid') return d.paymentStatus === 'unpaid' && new Date(d.dueDate) >= new Date();
    if (filterStatus === 'partial') return d.paymentStatus === 'partial';
    if (filterStatus === 'overdue') return d.paymentStatus === 'unpaid' && new Date(d.dueDate) < new Date();
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dues Management</h1>
        <p className="text-gray-600">Track and manage member dues payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalDues)}</div>
            <p className="text-xs text-gray-500 mt-1">{initialDues.length} records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.paidCount} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalUnpaid)}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.unpaidCount} unpaid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.overdueCount} overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All ({initialDues.length})
          </Button>
          <Button
            variant={filterStatus === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('paid')}
          >
            Paid ({summary.paidCount})
          </Button>
          <Button
            variant={filterStatus === 'unpaid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('unpaid')}
          >
            Unpaid ({summary.unpaidCount})
          </Button>
          <Button
            variant={filterStatus === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('overdue')}
          >
            Overdue ({summary.overdueCount})
          </Button>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Dues Record
        </Button>
      </div>

      {/* Dues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dues Records</CardTitle>
          <CardDescription>All dues records for union members</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Member</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Paid</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDues.map((d: any) => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{d.member.user.name}</div>
                          <div className="text-sm text-gray-500">{d.member.user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(d.amount)}</td>
                      <td className="py-3 px-4">{formatDate(d.dueDate)}</td>
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDues(d);
                              setEditDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          {d.paymentStatus !== 'unpaid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateReceipt(d.id)}
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dues records found</h3>
              <p className="text-gray-500 mb-4">
                {filterStatus === 'all'
                  ? 'Get started by creating your first dues record.'
                  : `No ${filterStatus} dues records.`}
              </p>
              {filterStatus === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dues Record
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateDuesDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        unionId={union.id}
        members={members}
        onSuccess={() => router.refresh()}
      />

      <EditDuesDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        dues={selectedDues}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
