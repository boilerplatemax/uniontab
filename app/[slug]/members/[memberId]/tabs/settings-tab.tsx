'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Bell, Mail, MessageSquare, Globe } from 'lucide-react';
import type { Member } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface SettingsTabProps {
  member: MemberData;
  unionId: number;
  onUpdate: () => void;
}

export function SettingsTab({ member, unionId, onUpdate }: SettingsTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    allowTextMessages: member.member.allowTextMessages ?? true,
    allowEmails: member.member.allowEmails ?? true,
    preferredLanguage: member.member.preferredLanguage || 'en',
    communicationPreference: member.member.communicationPreference || 'email',
  });

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
          section: 'settings',
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
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
        <h2 className="text-xl font-semibold text-gray-900">Member Settings</h2>
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
          Settings updated successfully.
        </div>
      )}

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control how this member receives notifications from the union.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="allowEmails" className="font-medium">
                  Allow Emails
                </Label>
                <p className="text-sm text-gray-500">
                  Member can receive email communications from the union
                </p>
              </div>
            </div>
            <Switch
              id="allowEmails"
              checked={formData.allowEmails}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, allowEmails: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="allowTextMessages" className="font-medium">
                  Allow Text Messages
                </Label>
                <p className="text-sm text-gray-500">
                  Member can receive SMS/text messages from the union
                </p>
              </div>
            </div>
            <Switch
              id="allowTextMessages"
              checked={formData.allowTextMessages}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, allowTextMessages: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferred Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Communication Preference
          </CardTitle>
          <CardDescription>
            Set the member's preferred method of communication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="communicationPreference">Preferred Contact Method</Label>
            <Select
              value={formData.communicationPreference}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, communicationPreference: value }))
              }
            >
              <SelectTrigger id="communicationPreference" className="max-w-md">
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              This is the member's preferred way to be contacted.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language Preference
          </CardTitle>
          <CardDescription>
            Set the member's preferred language for communications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="preferredLanguage">Preferred Language</Label>
            <Select
              value={formData.preferredLanguage}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, preferredLanguage: value }))
              }
            >
              <SelectTrigger id="preferredLanguage" className="max-w-md">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
