import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import type { SettingsFormData } from '../settings-content';

interface ContactTabProps {
  formData: SettingsFormData;
  onChange: (updates: Partial<SettingsFormData>) => void;
}

export function ContactTab({ formData, onChange }: ContactTabProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@union.org"
              value={formData.email}
              onChange={(e) => onChange({ email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Textarea
              id="address"
              placeholder="123 Union St, City, State 12345"
              value={formData.address}
              onChange={(e) => onChange({ address: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.union.org"
              value={formData.website}
              onChange={(e) => onChange({ website: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
