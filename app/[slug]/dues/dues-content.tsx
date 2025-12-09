'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, AlertCircle, CheckCircle, Clock, Receipt, Filter, Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CreateDuesDialog } from './create-dues-dialog';
import { EditDuesDialog } from './edit-dues-dialog';
import { PaymentHistoryDialog } from './payment-history-dialog';
import { ReceiptViewerDialog } from './receipt-viewer-dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
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
  isOwnerOrAdmin: boolean;
}

export function DuesContent({ slug, union, dues: initialDues, summary, members, isOwnerOrAdmin }: DuesContentProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'overview' | 'delinquent'>('overview');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedDues, setSelectedDues] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'partial' | 'overdue'>('all');
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [duesIdToDelete, setDuesIdToDelete] = useState<number | null>(null);

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
    setIsGeneratingReceipt(true);
    try {
      // Generate the receipt
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
      const receiptId = data.receipt.id;

      // Fetch the full receipt data
      const receiptResponse = await fetch(`/api/dues/receipt/${receiptId}`);

      if (!receiptResponse.ok) {
        throw new Error('Failed to load receipt');
      }

      const receiptData = await receiptResponse.json();

      // Show the receipt viewer
      setSelectedReceipt(receiptData.receipt);
      setReceiptViewerOpen(true);
      router.refresh();
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      alert(error.message || 'Failed to generate receipt');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleDeleteDues = async () => {
    if (!duesIdToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/dues/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duesId: duesIdToDelete }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete dues record');
      }

      setDeleteConfirmOpen(false);
      setDuesIdToDelete(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting dues:', error);
      alert(error.message || 'Failed to delete dues record');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirmation = (duesId: number) => {
    setDuesIdToDelete(duesId);
    setDeleteConfirmOpen(true);
  };

  const filteredDues = initialDues.filter(d => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return d.paymentStatus === 'paid';
    if (filterStatus === 'unpaid') return d.paymentStatus === 'unpaid' && new Date(d.dueDate) >= new Date();
    if (filterStatus === 'partial') return d.paymentStatus === 'partial';
    if (filterStatus === 'overdue') return d.paymentStatus === 'unpaid' && new Date(d.dueDate) < new Date();
    return true;
  });

  // Calculate delinquent members
  const delinquentMembers = members
    .map(m => {
      const memberDues = initialDues.filter(d => d.memberId === m.member.id);
      const overdueDues = memberDues.filter(d => d.paymentStatus !== 'paid' && new Date(d.dueDate) < new Date());
      const totalOwed = overdueDues.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
      const lastPaid = memberDues
        .filter(d => d.paidDate)
        .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime())[0];

      // Calculate months overdue
      const oldestOverdue = overdueDues.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
      const monthsOverdue = oldestOverdue
        ? Math.floor((new Date().getTime() - new Date(oldestOverdue.dueDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0;

      // Delinquency level
      let level: 'low' | 'medium' | 'high' | null = null;
      if (monthsOverdue >= 6) level = 'high';
      else if (monthsOverdue >= 3) level = 'medium';
      else if (monthsOverdue >= 1) level = 'low';

      return {
        ...m,
        totalOwed,
        overdueDues,
        lastPaidDate: lastPaid?.paidDate || null,
        monthsOverdue,
        delinquencyLevel: level,
        isDelinquent: m.member.isDelinquent || overdueDues.length > 0
      };
    })
    .filter(m => m.isDelinquent)
    .sort((a, b) => b.totalOwed - a.totalOwed);

  const getDelinquencyBadge = (level: 'low' | 'medium' | 'high' | null, monthsOverdue: number) => {
    if (level === 'high') {
      return <Badge className="bg-red-600"><AlertCircle className="h-3 w-3 mr-1" />{monthsOverdue}+ months</Badge>;
    }
    if (level === 'medium') {
      return <Badge className="bg-orange-500"><AlertCircle className="h-3 w-3 mr-1" />{monthsOverdue} months</Badge>;
    }
    if (level === 'low') {
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />{monthsOverdue} month{monthsOverdue !== 1 ? 's' : ''}</Badge>;
    }
    return <Badge variant="secondary">New</Badge>;
  };

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

      {/* View Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveView('delinquent')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'delinquent'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Delinquent Members
          {delinquentMembers.length > 0 && (
            <Badge className="ml-2 bg-red-500">{delinquentMembers.length}</Badge>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <>
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
                              disabled={isGeneratingReceipt}
                              title="Generate Receipt"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                          {isOwnerOrAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteConfirmation(d.id)}
                              disabled={isDeleting}
                              title="Delete Dues Record"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </>
      )}

      {/* Delinquent Members Tab */}
      {activeView === 'delinquent' && (
        <Card>
          <CardHeader>
            <CardTitle>Delinquent Members</CardTitle>
            <CardDescription>
              Members with overdue dues payments ({delinquentMembers.length} member{delinquentMembers.length !== 1 ? 's' : ''})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {delinquentMembers.length > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <div className="text-sm text-red-700 mb-1">Total Delinquent</div>
                    <div className="text-2xl font-bold text-red-900">{delinquentMembers.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-red-700 mb-1">Total Owed</div>
                    <div className="text-2xl font-bold text-red-900">
                      {formatCurrency(delinquentMembers.reduce((sum, m) => sum + m.totalOwed, 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-red-700 mb-1">Breakdown</div>
                    <div className="text-sm text-red-900">
                      <div>🔴 High: {delinquentMembers.filter(m => m.delinquencyLevel === 'high').length}</div>
                      <div>🟠 Medium: {delinquentMembers.filter(m => m.delinquencyLevel === 'medium').length}</div>
                      <div>🟡 Low: {delinquentMembers.filter(m => m.delinquencyLevel === 'low').length}</div>
                    </div>
                  </div>
                </div>

                {/* Delinquent Members Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-sm">Severity</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Member</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Amount Owed</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Overdue Periods</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Last Payment</th>
                        <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delinquentMembers.map((m: any) => (
                        <tr key={m.member.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {getDelinquencyBadge(m.delinquencyLevel, m.monthsOverdue)}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{m.user.name}</div>
                              <div className="text-sm text-gray-500">{m.user.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-red-600">{formatCurrency(m.totalOwed)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {m.overdueDues.length} period{m.overdueDues.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {m.lastPaidDate ? (
                              <div className="text-sm">{formatDate(m.lastPaidDate)}</div>
                            ) : (
                              <span className="text-gray-400 text-sm">Never</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Find first unpaid dues for this member
                                  const unpaidDues = initialDues.find(
                                    d => d.memberId === m.member.id && d.paymentStatus !== 'paid'
                                  );
                                  if (unpaidDues) {
                                    setSelectedDues(unpaidDues);
                                    setEditDialogOpen(true);
                                  }
                                }}
                              >
                                Record Payment
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Delinquent Members</h3>
                <p className="text-gray-500">All members are in good standing!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      <ReceiptViewerDialog
        open={receiptViewerOpen}
        onOpenChange={setReceiptViewerOpen}
        receiptData={selectedReceipt}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteDues}
        title="Delete Dues Record"
        description="Are you sure you want to delete this dues record? This action cannot be undone and will also delete any associated receipts."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
