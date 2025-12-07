'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EditDuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dues: any;
  onSuccess: () => void;
}

export function EditDuesDialog({ open, onOpenChange, dues, onSuccess }: EditDuesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    dueDate: '',
    paymentStatus: 'unpaid',
    paidAmount: '0',
    paidDate: '',
    paymentMethod: '',
    checkNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (dues) {
      setFormData({
        amount: (dues.amount / 100).toFixed(2),
        dueDate: new Date(dues.dueDate).toISOString().split('T')[0],
        paymentStatus: dues.paymentStatus || 'unpaid',
        paidAmount: (dues.paidAmount / 100).toFixed(2),
        paidDate: dues.paidDate ? new Date(dues.paidDate).toISOString().split('T')[0] : '',
        paymentMethod: dues.paymentMethod || '',
        checkNumber: dues.checkNumber || '',
        notes: dues.notes || '',
      });
    }
  }, [dues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/dues/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duesId: dues.id,
          amount: Math.round(parseFloat(formData.amount) * 100),
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
        throw new Error(error.error || 'Failed to update dues');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating dues:', error);
      alert(error.message || 'Failed to update dues');
    } finally {
      setLoading(false);
    }
  };

  if (!dues) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dues Record</DialogTitle>
          <DialogDescription>
            Update the dues record for {dues.member?.user?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Dues Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
