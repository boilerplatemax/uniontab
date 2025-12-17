'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { UnionContactInfo } from '@/lib/db/schema';

interface EditContactInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  contactInfo: UnionContactInfo | null;
  onSuccess: () => void;
}

export function EditContactInfoDialog({
  open,
  onOpenChange,
  unionId,
  contactInfo,
  onSuccess,
}: EditContactInfoDialogProps) {
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [contactFormEnabled, setContactFormEnabled] = useState(true);
  const [contactFormEmail, setContactFormEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && contactInfo) {
      setContactEmail(contactInfo.contactEmail || '');
      setContactPhone(contactInfo.contactPhone || '');
      setContactAddress(contactInfo.contactAddress || '');
      setOfficeHours(contactInfo.officeHours || '');
      setContactFormEnabled(contactInfo.contactFormEnabled ?? true);
      setContactFormEmail(contactInfo.contactFormEmail || '');
    } else if (open && !contactInfo) {
      // Reset to defaults for new contact info
      setContactEmail('');
      setContactPhone('');
      setContactAddress('');
      setOfficeHours('');
      setContactFormEnabled(true);
      setContactFormEmail('');
    }
  }, [open, contactInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch('/api/contact-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactPhone.trim() || null,
          contactAddress: contactAddress.trim() || null,
          officeHours: officeHours.trim() || null,
          contactFormEnabled,
          contactFormEmail: contactFormEmail.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update contact info');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact Information</DialogTitle>
          <DialogDescription>
            Update your union&apos;s contact details and form settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email Address</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@union.org"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone Number</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactAddress">Address</Label>
            <Textarea
              id="contactAddress"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder="123 Union Street&#10;City, State 12345"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="officeHours">Office Hours</Label>
            <Textarea
              id="officeHours"
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              placeholder="Monday - Friday: 9:00 AM - 5:00 PM&#10;Saturday: Closed&#10;Sunday: Closed"
              rows={3}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Contact Form Settings</h4>

            <div className="flex items-center justify-between mb-4">
              <div>
                <Label htmlFor="contactFormEnabled" className="cursor-pointer">
                  Enable Contact Form
                </Label>
                <p className="text-sm text-gray-500">
                  Allow visitors to send messages through the contact form
                </p>
              </div>
              <Switch
                id="contactFormEnabled"
                checked={contactFormEnabled}
                onCheckedChange={setContactFormEnabled}
              />
            </div>

            {contactFormEnabled && (
              <div className="space-y-2">
                <Label htmlFor="contactFormEmail">
                  Form Submissions Email
                </Label>
                <Input
                  id="contactFormEmail"
                  type="email"
                  value={contactFormEmail}
                  onChange={(e) => setContactFormEmail(e.target.value)}
                  placeholder="inbox@union.org"
                />
                <p className="text-xs text-gray-500">
                  Where should contact form submissions be sent? Leave blank to use the contact email above.
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
