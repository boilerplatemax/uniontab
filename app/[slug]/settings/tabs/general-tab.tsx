import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Languages } from 'lucide-react';
import type { SettingsFormData } from '../settings-content';

interface UnionPage {
  id: number;
  title: string;
  slug: string;
  isPublished: boolean;
}

interface GeneralTabProps {
  formData: SettingsFormData;
  onChange: (updates: Partial<SettingsFormData>) => void;
  unionPages?: UnionPage[];
}

export function GeneralTab({ formData, onChange, unionPages }: GeneralTabProps) {
  return (
    <div className="space-y-6">
      {/* Short Description */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">
              Short Description (One-liner)
            </Label>
            <Textarea
              id="description"
              placeholder="A brief description of your union..."
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              maxLength={200}
              rows={2}
              className="resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/200 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Public Name / Display Name */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Public Name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="publicName">Display Name</Label>
            <Input
              id="publicName"
              placeholder="e.g. Barrie Transit Union"
              value={formData.publicName}
              onChange={(e) => onChange({ publicName: e.target.value })}
            />
            <p className="text-sm text-gray-500 mt-1">
              A longer display name if you don&apos;t want to go by your union + local number (e.g. &quot;CUPE 123&quot;)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Language Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultLanguage">Default Language</Label>
            <p className="text-sm text-gray-500 mb-4">
              Set the default language for your union portal. This affects the tab name, navbar, and member-facing content.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => onChange({ defaultLanguage: 'en' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  formData.defaultLanguage === 'en'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">&#x1F1EC;&#x1F1E7;</span>
                  <div className="text-left">
                    <p className={`font-semibold ${formData.defaultLanguage === 'en' ? 'text-blue-900' : 'text-gray-900'}`}>
                      English
                    </p>
                    <p className={`text-sm ${formData.defaultLanguage === 'en' ? 'text-blue-600' : 'text-gray-500'}`}>
                      Default language
                    </p>
                  </div>
                  {formData.defaultLanguage === 'en' && (
                    <Check className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onChange({ defaultLanguage: 'fr' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  formData.defaultLanguage === 'fr'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">&#x1F1EB;&#x1F1F7;</span>
                  <div className="text-left">
                    <p className={`font-semibold ${formData.defaultLanguage === 'fr' ? 'text-blue-900' : 'text-gray-900'}`}>
                      Fran&#231;ais
                    </p>
                    <p className={`text-sm ${formData.defaultLanguage === 'fr' ? 'text-blue-600' : 'text-gray-500'}`}>
                      Langue par d&#233;faut
                    </p>
                  </div>
                  {formData.defaultLanguage === 'fr' && (
                    <Check className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home Page Selector */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Home Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="homePage">Default Home Page</Label>
            <p className="text-sm text-gray-500 mb-4">
              Choose which page visitors see first when they visit your union portal.
            </p>
            <select
              id="homePage"
              value={formData.homePage}
              onChange={(e) => onChange({ homePage: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
            >
              <option value="news">News</option>
              <option value="events">Events</option>
              <option value="about">About</option>
              {unionPages?.filter(p => p.isPublished).map((page) => (
                <option key={page.id} value={page.slug}>
                  {page.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
