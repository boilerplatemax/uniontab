'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CreateCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  onSuccess: () => void;
}

export function CreateCycleDialog({ open, onOpenChange, unionId, onSuccess }: CreateCycleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [gracePeriodDays, setGracePeriodDays] = useState('30');
  const [isRecurring, setIsRecurring] = useState('false');
  const [recurrenceType, setRecurrenceType] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/dues/cycles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          name,
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
          amountDue: Math.round(parseFloat(amountDue) * 100), // Convert to cents
          dueDate: new Date(dueDate).toISOString(),
          gracePeriodDays: parseInt(gracePeriodDays),
          isRecurring: isRecurring === 'true',
          recurrenceType: isRecurring === 'true' ? recurrenceType : null,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create cycle');
      }

      // Reset form
      setName('');
      setPeriodStart('');
      setPeriodEnd('');
      setAmountDue('');
      setDueDate('');
      setGracePeriodDays('30');
      setIsRecurring('false');
      setRecurrenceType('');
      setNotes('');

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      alert(error.message || 'Failed to create dues cycle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Dues Cycle</DialogTitle>
          <DialogDescription>
            Create a billing period to automatically generate dues for all members
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cycle Name */}
          <div>
            <Label htmlFor="name">Cycle Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., January 2025, Q1 2025"
              required
            />
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodStart">Period Start *</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="periodEnd">Period End *</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amountDue">Amount Due ($) *</Label>
              <Input
                id="amountDue"
                type="number"
                step="0.01"
                min="0"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Grace Period */}
          <div>
            <Label htmlFor="gracePeriodDays">Grace Period (days)</Label>
            <Input
              id="gracePeriodDays"
              type="number"
              min="0"
              value={gracePeriodDays}
              onChange={(e) => setGracePeriodDays(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of days after due date before marking as overdue
            </p>
          </div>

          {/* Recurrence */}
          <div>
            <Label htmlFor="isRecurring">Recurring Cycle?</Label>
            <Select value={isRecurring} onValueChange={setIsRecurring}>
              <SelectTrigger id="isRecurring">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No - One-time cycle</SelectItem>
                <SelectItem value="true">Yes - Recurring cycle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isRecurring === 'true' && (
            <div>
              <Label htmlFor="recurrenceType">Recurrence Type *</Label>
              <Select value={recurrenceType} onValueChange={setRecurrenceType} required>
                <SelectTrigger id="recurrenceType">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information about this cycle..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Cycle'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
