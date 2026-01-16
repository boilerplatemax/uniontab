'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Plus,
  Users,
  Trash2,
  Edit,
  Calendar,
  Crown,
  Gavel,
  UserCheck,
} from 'lucide-react';
import type { Member, MemberPosition } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface PositionWithCreator {
  position: MemberPosition;
  createdBy: {
    id: number;
    name: string | null;
  } | null;
}

interface PositionsTabProps {
  member: MemberData;
  positions: PositionWithCreator[];
  unionId: number;
  currentUserId: number;
  onUpdate: () => void;
}

const POSITION_TYPES = [
  { value: 'executive', label: 'Executive Board', icon: Crown },
  { value: 'union_position', label: 'Union Position', icon: Gavel },
  { value: 'committee', label: 'Committee', icon: UserCheck },
];

export function PositionsTab({
  member,
  positions,
  unionId,
  currentUserId,
  onUpdate,
}: PositionsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<MemberPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    positionType: 'union_position',
    title: '',
    area: '',
    startDate: '',
    endDate: '',
    isCurrent: true,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      positionType: 'union_position',
      title: '',
      area: '',
      startDate: '',
      endDate: '',
      isCurrent: true,
      notes: '',
    });
    setEditingPosition(null);
  };

  const openEditDialog = (pos: MemberPosition) => {
    setEditingPosition(pos);
    setFormData({
      positionType: pos.positionType,
      title: pos.title,
      area: pos.area || '',
      startDate: pos.startDate
        ? new Date(pos.startDate).toISOString().split('T')[0]
        : '',
      endDate: pos.endDate
        ? new Date(pos.endDate).toISOString().split('T')[0]
        : '',
      isCurrent: pos.isCurrent,
      notes: pos.notes || '',
    });
    setShowAddDialog(true);
  };

  const getPositionIcon = (type: string) => {
    const posType = POSITION_TYPES.find((p) => p.value === type);
    if (posType) {
      const Icon = posType.icon;
      return <Icon className="h-5 w-5 text-blue-600" />;
    }
    return <Users className="h-5 w-5 text-blue-600" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      setError('Please enter a position title');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/members/positions', {
        method: editingPosition ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingPosition && { positionId: editingPosition.id }),
          memberId: member.member.id,
          unionId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save position');
      }

      setShowAddDialog(false);
      resetForm();
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (positionId: number) => {
    if (!confirm('Are you sure you want to delete this position?')) return;

    setDeleteLoading(positionId);
    try {
      const response = await fetch('/api/members/positions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId, unionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete position');
      }

      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const currentPositions = positions.filter((p) => p.position.isCurrent);
  const pastPositions = positions.filter((p) => !p.position.isCurrent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Positions & Committees</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Position
        </Button>
      </div>

      {positions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No positions yet</h3>
            <p className="text-gray-500 mb-4">
              Track executive roles, union positions, and committee memberships.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Position
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Current Positions */}
          {currentPositions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Positions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentPositions.map((pos) => (
                  <div
                    key={pos.position.id}
                    className="flex items-start gap-4 p-3 bg-green-50 border border-green-100 rounded-lg"
                  >
                    <div className="p-2 bg-white rounded-lg">
                      {getPositionIcon(pos.position.positionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{pos.position.title}</h3>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <Badge variant="outline" className="capitalize">
                          {pos.position.positionType.replace('_', ' ')}
                        </Badge>
                        {pos.position.area && <span>{pos.position.area}</span>}
                      </div>
                      {pos.position.startDate && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Since: {formatDate(pos.position.startDate)}
                          {pos.position.endDate && ` - ${formatDate(pos.position.endDate)}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(pos.position)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pos.position.id)}
                        disabled={deleteLoading === pos.position.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleteLoading === pos.position.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Past Positions */}
          {pastPositions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Past Positions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pastPositions.map((pos) => (
                  <div
                    key={pos.position.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 border border-gray-100 rounded-lg"
                  >
                    <div className="p-2 bg-white rounded-lg opacity-60">
                      {getPositionIcon(pos.position.positionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-700">{pos.position.title}</h3>
                        <Badge variant="outline" className="text-gray-500">
                          Past
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <Badge variant="outline" className="capitalize">
                          {pos.position.positionType.replace('_', ' ')}
                        </Badge>
                        {pos.position.area && <span>{pos.position.area}</span>}
                      </div>
                      {(pos.position.startDate || pos.position.endDate) && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(pos.position.startDate)} - {formatDate(pos.position.endDate)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(pos.position)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pos.position.id)}
                        disabled={deleteLoading === pos.position.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleteLoading === pos.position.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? 'Edit Position' : 'Add Position'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <Label htmlFor="positionType">Position Type *</Label>
              <Select
                value={formData.positionType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, positionType: value }))
                }
              >
                <SelectTrigger id="positionType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., President, Steward, Committee Member"
              />
            </div>

            <div>
              <Label htmlFor="area">Area / Region</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="e.g., Toronto, District 5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isCurrent">Currently Active</Label>
              <Switch
                id="isCurrent"
                checked={formData.isCurrent}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isCurrent: checked }))
                }
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingPosition ? (
                  'Save Changes'
                ) : (
                  'Add Position'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
