'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import type { Member } from '@/lib/db/schema';

interface CreateDuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  members: {
    member: Member;
    user: {
      id: number;
      name: string | null;
      email: string;
    };
  }[];
  onSuccess: () => void;
}

export function CreateDuesDialog({ open, onOpenChange, unionId, members, onSuccess }: CreateDuesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    dueDate: '',
    paymentStatus: 'unpaid',
    paidAmount: '0',
    paidDate: '',
    paymentMethod: '',
    checkNumber: '',
    notes: '',
  });

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter((m) => {
      const name = m.user.name?.toLowerCase() || '';
      const email = m.user.email.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [members, searchQuery]);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setSearchQuery('');
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/dues/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: parseInt(formData.memberId),
          unionId,
          amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
          dueDate: formData.dueDate,
          paymentStatus: formData.paymentStatus,
          paidAmount: Math.round(parseFloat(formData.paidAmount || '0') * 100),
          paidDate: formData.paidDate || null,
          paymentMethod: formData.paymentMethod || null,
          checkNumber: formData.checkNumber || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create dues');
      }

      setFormData({
        memberId: '',
        amount: '',
        dueDate: '',
        paymentStatus: 'unpaid',
        paidAmount: '0',
        paidDate: '',
        paymentMethod: '',
        checkNumber: '',
        notes: '',
      });
      setSearchQuery('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating dues:', error);
      alert(error.message || 'Failed to create dues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Dues Record</DialogTitle>
          <DialogDescription>
            Create a new dues record for a member. Enter the amount, due date, and payment status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member">Select Member *</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) => setFormData({ ...formData, memberId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Search and select a member" />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 bg-white p-2 border-b z-10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-8"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-gray-500">
                      No members found
                    </div>
                  ) : (
                    filteredMembers.map((m) => (
                      <SelectItem key={m.member.id} value={m.member.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{m.user.name}</span>
                          <span className="text-xs text-gray-500">{m.user.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status *</Label>
            <Select
              value={formData.paymentStatus}
              onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.paymentStatus === 'paid' || formData.paymentStatus === 'partial') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Paid Amount ($)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    placeholder="100.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paidDate">Paid Date</Label>
                  <Input
                    id="paidDate"
                    type="date"
                    value={formData.paidDate}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="money_order">Money Order</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.paymentMethod === 'check' && (
                  <div className="space-y-2">
                    <Label htmlFor="checkNumber">Check Number</Label>
                    <Input
                      id="checkNumber"
                      type="text"
                      value={formData.checkNumber}
                      onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                      placeholder="1234"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Dues Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
