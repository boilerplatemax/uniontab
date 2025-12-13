'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  MapPin,
  Clock,
  Users,
  Check,
  X,
  LogIn,
  LogOut,
  Loader2,
  Trash2,
  Edit,
} from 'lucide-react';
import type { PicketZone, PicketShift, PicketAssignment, Member, User } from '@/lib/db/schema';

type AssignmentWithMember = PicketAssignment & {
  member: Member & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  };
};

type ShiftWithAssignments = PicketShift & {
  assignments: AssignmentWithMember[];
};

type ZoneWithShifts = PicketZone & {
  shifts: ShiftWithAssignments[];
};

interface PicketScheduleTabProps {
  strikeId: number;
  zones: ZoneWithShifts[];
  memberId: number;
  isAdmin: boolean;
}

export function PicketScheduleTab({ strikeId, zones, memberId, isAdmin }: PicketScheduleTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [zoneForm, setZoneForm] = useState({ name: '', location: '', notes: '' });
  const [shiftForm, setShiftForm] = useState({ date: '', startTime: '', endTime: '', maxMembers: '10', notes: '' });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('create-zone');
    setError(null);

    try {
      const response = await fetch(`/api/strikes/${strikeId}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create zone');
      }

      setZoneForm({ name: '', location: '', notes: '' });
      setShowZoneDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const handleCreateShift = async (e: React.FormEvent, zoneId: number) => {
    e.preventDefault();
    setIsLoading('create-shift');
    setError(null);

    try {
      const response = await fetch(`/api/strikes/zones/${zoneId}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shiftForm,
          maxMembers: parseInt(shiftForm.maxMembers),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create shift');
      }

      setShiftForm({ date: '', startTime: '', endTime: '', maxMembers: '10', notes: '' });
      setShowShiftDialog(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const handleSignUp = async (shiftId: number) => {
    setIsLoading(`signup-${shiftId}`);
    try {
      const response = await fetch(`/api/strikes/shifts/${shiftId}/signup`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign up');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const handleCancelSignUp = async (shiftId: number) => {
    setIsLoading(`cancel-${shiftId}`);
    try {
      const response = await fetch(`/api/strikes/shifts/${shiftId}/signup`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const handleCheckIn = async (shiftId: number, targetMemberId?: number) => {
    setIsLoading(`checkin-${shiftId}-${targetMemberId || memberId}`);
    try {
      const response = await fetch(`/api/strikes/shifts/${shiftId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: targetMemberId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check in');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const handleCheckOut = async (shiftId: number, targetMemberId?: number) => {
    setIsLoading(`checkout-${shiftId}-${targetMemberId || memberId}`);
    try {
      const response = await fetch(`/api/strikes/shifts/${shiftId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: targetMemberId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check out');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const isSignedUp = (shift: ShiftWithAssignments) => {
    return shift.assignments.some(a => a.memberId === memberId);
  };

  const getMyAssignment = (shift: ShiftWithAssignments) => {
    return shift.assignments.find(a => a.memberId === memberId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Picket Schedule</h2>
        {isAdmin && (
          <Button onClick={() => setShowZoneDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Zones */}
      {zones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No picket zones yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isAdmin ? 'Create zones to organize picket locations.' : 'No picket zones have been set up yet.'}
            </p>
            {isAdmin && (
              <Button onClick={() => setShowZoneDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Zone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {zones.map(zone => (
            <AccordionItem key={zone.id} value={`zone-${zone.id}`} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <h3 className="font-semibold">{zone.name}</h3>
                    {zone.location && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{zone.location}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-auto mr-4">
                    {zone.shifts.length} shift{zone.shifts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {zone.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    {zone.notes}
                  </p>
                )}

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-4"
                    onClick={() => setShowShiftDialog(zone.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Shift
                  </Button>
                )}

                {zone.shifts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No shifts scheduled yet.</p>
                ) : (
                  <div className="space-y-3">
                    {zone.shifts.map(shift => {
                      const myAssignment = getMyAssignment(shift);
                      const isFull = shift.assignments.length >= shift.maxMembers;

                      return (
                        <Card key={shift.id} className="bg-gray-50 dark:bg-gray-800/50">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {formatDate(shift.date)}
                                  </Badge>
                                  <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    {shift.startTime} - {shift.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <span className={isFull ? 'text-red-600' : ''}>
                                    {shift.assignments.length}/{shift.maxMembers} signed up
                                  </span>
                                  {isFull && <Badge variant="destructive">Full</Badge>}
                                </div>
                                {shift.notes && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{shift.notes}</p>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {!myAssignment && !isFull && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSignUp(shift.id)}
                                    disabled={isLoading === `signup-${shift.id}`}
                                  >
                                    {isLoading === `signup-${shift.id}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Sign Up
                                      </>
                                    )}
                                  </Button>
                                )}

                                {myAssignment && !myAssignment.checkInTime && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCheckIn(shift.id)}
                                      disabled={isLoading?.startsWith(`checkin-${shift.id}`)}
                                    >
                                      {isLoading === `checkin-${shift.id}-${memberId}` ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <LogIn className="w-4 h-4 mr-1" />
                                          Check In
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelSignUp(shift.id)}
                                      disabled={isLoading === `cancel-${shift.id}`}
                                    >
                                      {isLoading === `cancel-${shift.id}` ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </>
                                      )}
                                    </Button>
                                  </>
                                )}

                                {myAssignment && myAssignment.checkInTime && !myAssignment.checkOutTime && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckOut(shift.id)}
                                    disabled={isLoading?.startsWith(`checkout-${shift.id}`)}
                                  >
                                    {isLoading === `checkout-${shift.id}-${memberId}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <LogOut className="w-4 h-4 mr-1" />
                                        Check Out
                                      </>
                                    )}
                                  </Button>
                                )}

                                {myAssignment?.status === 'completed' && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    <Check className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Signed up members */}
                            {shift.assignments.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="text-sm font-medium mb-2">Signed Up:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {shift.assignments.map(assignment => (
                                    <Badge
                                      key={assignment.id}
                                      variant={assignment.status === 'completed' ? 'default' : 'secondary'}
                                      className={
                                        assignment.status === 'checked_in'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                          : assignment.status === 'completed'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                          : ''
                                      }
                                    >
                                      {assignment.member.user.name}
                                      {assignment.status === 'checked_in' && (
                                        <span className="ml-1 text-xs">(In)</span>
                                      )}
                                      {assignment.status === 'completed' && (
                                        <Check className="w-3 h-3 ml-1" />
                                      )}
                                    </Badge>
                                  ))}
                                </div>

                                {/* Admin check-in/out controls */}
                                {isAdmin && (
                                  <div className="mt-3 pt-3 border-t border-dashed">
                                    <h5 className="text-xs font-medium text-gray-500 mb-2">Admin Controls:</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {shift.assignments.map(assignment => {
                                        if (assignment.status === 'completed') return null;
                                        return (
                                          <div key={assignment.id} className="flex items-center gap-1">
                                            <span className="text-xs">{assignment.member.user.name}:</span>
                                            {!assignment.checkInTime ? (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-2 text-xs"
                                                onClick={() => handleCheckIn(shift.id, assignment.memberId)}
                                                disabled={isLoading === `checkin-${shift.id}-${assignment.memberId}`}
                                              >
                                                {isLoading === `checkin-${shift.id}-${assignment.memberId}` ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  'Check In'
                                                )}
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-2 text-xs"
                                                onClick={() => handleCheckOut(shift.id, assignment.memberId)}
                                                disabled={isLoading === `checkout-${shift.id}-${assignment.memberId}`}
                                              >
                                                {isLoading === `checkout-${shift.id}-${assignment.memberId}` ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  'Check Out'
                                                )}
                                              </Button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Create Zone Dialog */}
      <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Picket Zone</DialogTitle>
            <DialogDescription>Create a new picket zone location.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateZone}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="zone-name">Zone Name *</Label>
                <Input
                  id="zone-name"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  placeholder="e.g., Main Entrance"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-location">Location</Label>
                <Input
                  id="zone-location"
                  value={zoneForm.location}
                  onChange={(e) => setZoneForm({ ...zoneForm, location: e.target.value })}
                  placeholder="Address or description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-notes">Notes</Label>
                <Textarea
                  id="zone-notes"
                  value={zoneForm.notes}
                  onChange={(e) => setZoneForm({ ...zoneForm, notes: e.target.value })}
                  placeholder="Instructions for this zone..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowZoneDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading === 'create-zone'}>
                {isLoading === 'create-zone' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Zone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Shift Dialog */}
      <Dialog open={showShiftDialog !== null} onOpenChange={() => setShowShiftDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
            <DialogDescription>Schedule a new shift for this zone.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => showShiftDialog && handleCreateShift(e, showShiftDialog)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="shift-date">Date *</Label>
                <Input
                  id="shift-date"
                  type="date"
                  value={shiftForm.date}
                  onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shift-start">Start Time *</Label>
                  <Input
                    id="shift-start"
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shift-end">End Time *</Label>
                  <Input
                    id="shift-end"
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shift-max">Max Members</Label>
                <Input
                  id="shift-max"
                  type="number"
                  min="1"
                  value={shiftForm.maxMembers}
                  onChange={(e) => setShiftForm({ ...shiftForm, maxMembers: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shift-notes">Notes</Label>
                <Textarea
                  id="shift-notes"
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  placeholder="Special instructions for this shift..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowShiftDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading === 'create-shift'}>
                {isLoading === 'create-shift' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
