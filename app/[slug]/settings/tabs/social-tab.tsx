import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Share2 } from 'lucide-react';
import type { SettingsFormData } from '../settings-content';

interface SocialPlatform {
  id: string;
  label: string;
  placeholder: string;
}

interface SocialTabProps {
  formData: SettingsFormData;
  onChange: (updates: Partial<SettingsFormData>) => void;
  socialPlatforms: readonly SocialPlatform[];
}

export function SocialTab({ formData, onChange, socialPlatforms }: SocialTabProps) {
  return (
    <div className="space-y-6">
      {/* Social Media Links */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Add your social media profiles to display in the footer and contact page
          </p>

          <div className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id}>
                <Label htmlFor={`social-${platform.id}`}>{platform.label}</Label>
                <Input
                  id={`social-${platform.id}`}
                  type="url"
                  placeholder={platform.placeholder}
                  value={formData.socialLinks[platform.id] || ''}
                  onChange={(e) =>
                    onChange({
                      socialLinks: {
                        ...formData.socialLinks,
                        [platform.id]: e.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>

          {/* Show in Hero Toggle */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showSocialInHero" className="text-base font-medium">
                  Show in Hero Section
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Display social icons prominently in your homepage hero area
                </p>
              </div>
              <Switch
                id="showSocialInHero"
                checked={formData.showSocialInHero}
                onCheckedChange={(checked) => onChange({ showSocialInHero: checked })}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Social icons always appear in the footer. This option adds them to the hero section as well.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
