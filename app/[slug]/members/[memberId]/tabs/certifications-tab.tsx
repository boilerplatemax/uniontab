'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  Award,
  Trash2,
  Edit,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { Member, MemberCertification } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface CertificationWithCreator {
  certification: MemberCertification;
  createdBy: {
    id: number;
    name: string | null;
  } | null;
}

interface CertificationsTabProps {
  member: MemberData;
  certifications: CertificationWithCreator[];
  unionId: number;
  currentUserId: number;
  onUpdate: () => void;
}

const CERTIFICATION_TYPES = [
  { value: 'license', label: 'License' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'training', label: 'Training' },
  { value: 'safety', label: 'Safety Certification' },
  { value: 'professional', label: 'Professional Certification' },
];

export function CertificationsTab({
  member,
  certifications,
  unionId,
  currentUserId,
  onUpdate,
}: CertificationsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCert, setEditingCert] = useState<MemberCertification | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'certificate',
    issuingBody: '',
    completedDate: '',
    expiryDate: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'certificate',
      issuingBody: '',
      completedDate: '',
      expiryDate: '',
      notes: '',
    });
    setEditingCert(null);
  };

  const openEditDialog = (cert: MemberCertification) => {
    setEditingCert(cert);
    setFormData({
      name: cert.name,
      type: cert.type || 'certificate',
      issuingBody: cert.issuingBody || '',
      completedDate: cert.completedDate
        ? new Date(cert.completedDate).toISOString().split('T')[0]
        : '',
      expiryDate: cert.expiryDate
        ? new Date(cert.expiryDate).toISOString().split('T')[0]
        : '',
      notes: cert.notes || '',
    });
    setShowAddDialog(true);
  };

  const getStatusInfo = (cert: MemberCertification) => {
    if (!cert.expiryDate) {
      return { status: 'valid', label: 'No Expiry', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }

    const expiry = new Date(cert.expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (expiry < now) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    if (expiry < thirtyDaysFromNow) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    return { status: 'valid', label: 'Valid', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Please enter a certification name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/members/certifications', {
        method: editingCert ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingCert && { certificationId: editingCert.id }),
          memberId: member.member.id,
          unionId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save certification');
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

  const handleDelete = async (certificationId: number) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    setDeleteLoading(certificationId);
    try {
      const response = await fetch('/api/members/certifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificationId, unionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete certification');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Training & Certifications</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {certifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications yet</h3>
            <p className="text-gray-500 mb-4">
              Track training, licenses, and certifications for this member.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Certification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certifications.map((cert) => {
            const statusInfo = getStatusInfo(cert.certification);
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={cert.certification.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{cert.certification.name}</h3>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        {cert.certification.type && (
                          <span className="capitalize">{cert.certification.type}</span>
                        )}
                        {cert.certification.issuingBody && (
                          <span>Issued by: {cert.certification.issuingBody}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {cert.certification.completedDate && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            Completed: {formatDate(cert.certification.completedDate)}
                          </div>
                        )}
                        {cert.certification.expiryDate && (
                          <div
                            className={`flex items-center gap-1 ${
                              statusInfo.status === 'expired'
                                ? 'text-red-600'
                                : statusInfo.status === 'expiring'
                                ? 'text-yellow-600'
                                : 'text-gray-500'
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            Expires: {formatDate(cert.certification.expiryDate)}
                          </div>
                        )}
                      </div>
                      {cert.certification.notes && (
                        <p className="text-sm text-gray-500 mt-2">{cert.certification.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(cert.certification)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cert.certification.id)}
                        disabled={deleteLoading === cert.certification.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleteLoading === cert.certification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              {editingCert ? 'Edit Certification' : 'Add Certification'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <Label htmlFor="name">Certification Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Forklift License"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="issuingBody">Issuing Body</Label>
              <Input
                id="issuingBody"
                value={formData.issuingBody}
                onChange={(e) => setFormData((prev) => ({ ...prev, issuingBody: e.target.value }))}
                placeholder="e.g., OSHA, Provincial Government"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="completedDate">Completed Date</Label>
                <Input
                  id="completedDate"
                  type="date"
                  value={formData.completedDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, completedDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                />
              </div>
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
                ) : editingCert ? (
                  'Save Changes'
                ) : (
                  'Add Certification'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
