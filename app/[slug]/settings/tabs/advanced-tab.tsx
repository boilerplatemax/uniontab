import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SettingsFormData } from '../settings-content';

interface AdvancedTabProps {
  formData: SettingsFormData;
  onChange: (updates: Partial<SettingsFormData>) => void;
  onNavigate: (path: string) => void;
  slug: string;
}

export function AdvancedTab({ onNavigate, slug }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      {/* Gallery */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Upload and manage photos for your union&apos;s public gallery. The gallery is visible to all members and is shown in the navigation when images are present.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate(`/${slug}/gallery`)}
          >
            Manage Gallery
          </Button>
        </CardContent>
      </Card>

      {/* Custom Pages & Navigation */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Custom Pages &amp; Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Want to add new pages, rearrange your navigation, or customize your site structure? Our team will set it up for you.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onNavigate(
                `/${slug}/support?category=site_customization&subject=${encodeURIComponent('Navigation & Page Customization Request')}`
              )
            }
          >
            Request Customization
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
