'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, User, Phone, MapPin, Heart } from 'lucide-react';
import type { Member } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface PersonalInfoTabProps {
  member: MemberData;
  unionId: number;
  onUpdate: () => void;
}

export function PersonalInfoTab({ member, unionId, onUpdate }: PersonalInfoTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: member.member.firstName || '',
    lastName: member.member.lastName || '',
    middleName: member.member.middleName || '',
    preferredName: member.member.preferredName || '',
    personalEmail: member.member.personalEmail || '',
    homePhone: member.member.homePhone || '',
    cellPhone: member.member.cellPhone || member.member.phone || '',
    address: member.member.address || '',
    city: member.member.city || '',
    province: member.member.province || '',
    postalCode: member.member.postalCode || '',
    dateOfBirth: member.member.dateOfBirth
      ? new Date(member.member.dateOfBirth).toISOString().split('T')[0]
      : '',
    emergencyContactName: member.member.emergencyContactName || '',
    emergencyContactPhone: member.member.emergencyContactPhone || '',
    emergencyContactRelation: member.member.emergencyContactRelation || '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/members/update-profile-extended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.member.id,
          unionId,
          section: 'personal',
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update personal information');
      }

      setSuccess(true);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          Personal information updated successfully.
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => updateField('middleName', e.target.value)}
              placeholder="Robert"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Doe"
            />
          </div>
          <div>
            <Label htmlFor="preferredName">Preferred Name</Label>
            <Input
              id="preferredName"
              value={formData.preferredName}
              onChange={(e) => updateField('preferredName', e.target.value)}
              placeholder="Johnny"
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="personalEmail">Personal Email</Label>
            <Input
              id="personalEmail"
              type="email"
              value={formData.personalEmail}
              onChange={(e) => updateField('personalEmail', e.target.value)}
              placeholder="john@personal.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cellPhone">Cell Phone</Label>
            <Input
              id="cellPhone"
              type="tel"
              value={formData.cellPhone}
              onChange={(e) => updateField('cellPhone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="homePhone">Home Phone</Label>
            <Input
              id="homePhone"
              type="tel"
              value={formData.homePhone}
              onChange={(e) => updateField('homePhone', e.target.value)}
              placeholder="(555) 987-6543"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Toronto"
              />
            </div>
            <div>
              <Label htmlFor="province">Province/State</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => updateField('province', e.target.value)}
                placeholder="Ontario"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal/ZIP Code</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                placeholder="M5V 1A1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => updateField('emergencyContactName', e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
              placeholder="(555) 111-2222"
            />
          </div>
          <div>
            <Label htmlFor="emergencyContactRelation">Relationship</Label>
            <Input
              id="emergencyContactRelation"
              value={formData.emergencyContactRelation}
              onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
              placeholder="Spouse"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
