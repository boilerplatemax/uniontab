import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Switch } from '@/components/ui/switch';
import { Palette, Check, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import type { ThemeConfig } from '@/lib/themes/config';
import type { SettingsFormData } from '../settings-content';

interface AppearanceTabProps {
  formData: SettingsFormData;
  onChange: (updates: Partial<SettingsFormData>) => void;
  themeOptions: ThemeConfig[];
  canAccessTheme: (themeId: string, planName?: string | null) => boolean;
  planName?: string | null;
}

export function AppearanceTab({
  formData,
  onChange,
  themeOptions,
  canAccessTheme,
  planName,
}: AppearanceTabProps) {
  const isPaidPlan = planName && planName !== 'Free';

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="theme">Homepage Theme</Label>
            <p className="text-sm text-gray-500 mb-4">
              Choose how your union&apos;s homepage and tabs are displayed to visitors
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {themeOptions.map((theme) => {
                const hasAccess = canAccessTheme(theme.id, planName);
                const isLocked = theme.isPremium && !hasAccess;

                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      if (!isLocked) {
                        onChange({ theme: theme.id });
                      }
                    }}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      isLocked
                        ? 'cursor-not-allowed opacity-75 border-gray-200'
                        : 'cursor-pointer'
                    } ${
                      !isLocked && formData.theme === theme.id
                        ? theme.isPremium
                          ? 'border-amber-500 ring-2 ring-amber-200'
                          : 'border-blue-500 ring-2 ring-blue-200'
                        : !isLocked
                        ? 'border-gray-200 hover:border-blue-300'
                        : ''
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image
                        src={`/assets/themes/${theme.id}.svg`}
                        alt={`${theme.name} theme preview`}
                        fill
                        className={`object-cover ${isLocked ? 'grayscale' : ''}`}
                      />

                      {/* Premium Badge */}
                      {theme.isPremium && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full px-2.5 py-1 flex items-center gap-1 shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          <span className="text-xs font-semibold">PREMIUM</span>
                        </div>
                      )}

                      {/* Locked Overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                            <Lock className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Base or Plus Plan</span>
                          </div>
                        </div>
                      )}

                      {/* Selected Badge */}
                      {formData.theme === theme.id && !isLocked && (
                        <div className={`absolute top-2 right-2 ${theme.isPremium ? 'bg-amber-500' : 'bg-blue-500'} text-white rounded-full p-1.5`}>
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Theme Info */}
                    <div className={`p-4 ${
                      formData.theme === theme.id && !isLocked
                        ? theme.isPremium
                          ? 'bg-amber-50 border-t-2 border-amber-500'
                          : 'bg-blue-50 border-t-2 border-blue-500'
                        : 'bg-white border-t-2 border-gray-100'
                    }`}>
                      <h3 className={`font-semibold mb-1 flex items-center gap-2 ${
                        formData.theme === theme.id && !isLocked
                          ? theme.isPremium
                            ? 'text-amber-900'
                            : 'text-blue-900'
                          : 'text-gray-900'
                      }`}>
                        {theme.name}
                      </h3>
                      <p className={`text-sm ${
                        formData.theme === theme.id && !isLocked
                          ? theme.isPremium
                            ? 'text-amber-700'
                            : 'text-blue-700'
                          : 'text-gray-600'
                      }`}>
                        {theme.description}
                      </p>
                      {theme.isPremium && theme.requiredPlans && (
                        <p className={`text-xs mt-2 ${
                          formData.theme === theme.id && !isLocked
                            ? 'text-amber-600'
                            : 'text-gray-400'
                        }`}>
                          Requires {theme.requiredPlans.join(' or ')} plan
                        </p>
                      )}
                    </div>

                    {/* Hidden radio input for form */}
                    <input
                      type="radio"
                      name="theme"
                      value={theme.id}
                      checked={formData.theme === theme.id}
                      onChange={() => {}}
                      className="sr-only"
                      disabled={isLocked}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brand Color Picker */}
          <div className="border-t pt-6 mt-6">
            <Label htmlFor="themeColor">Brand Color</Label>
            <p className="text-sm text-gray-500 mb-4">
              Choose a custom brand color for banners, posters, and email headers
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  id="themeColor"
                  value={formData.themeColor}
                  onChange={(e) => onChange({ themeColor: e.target.value })}
                  className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  style={{ padding: '2px' }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    type="text"
                    value={formData.themeColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        onChange({ themeColor: value });
                      }
                    }}
                    placeholder="#2563eb"
                    className="w-28 font-mono"
                    maxLength={7}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ themeColor: '#2563eb' })}
                  >
                    Reset to Default
                  </Button>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Color preview:</span>
                  <div
                    className="h-8 rounded"
                    style={{
                      backgroundColor: formData.themeColor,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            onFileSelect={(file, url) => {
              if (url) {
                onChange({ logoUrl: url });
              } else if (file === null) {
                onChange({ logoUrl: '' });
              }
            }}
            accept="image/*"
            maxSize={5}
            currentUrl={formData.logoUrl}
            label="Logo Image"
            hint="Click to browse or drag and drop your logo"
            bucket="union-files"
            path="logos"
            recommendedDimensions={{ width: 400, height: 400 }}
            autoResize={true}
          />

          <FileUpload
            onFileSelect={(file, url) => {
              if (url) {
                onChange({ coverPhotoUrl: url });
              } else if (file === null) {
                onChange({ coverPhotoUrl: '' });
              }
            }}
            accept="image/*"
            maxSize={10}
            currentUrl={formData.coverPhotoUrl}
            label="Cover Photo / Banner"
            hint="Click to browse or drag and drop your cover image"
            bucket="union-files"
            path="covers"
            recommendedDimensions={{ width: 1500, height: 500 }}
            autoResize={true}
          />
        </CardContent>
      </Card>

      {/* White Label Branding - Only for Paid Plans */}
      {isPaidPlan && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.hidePoweredBy ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              White Label
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hidePoweredBy" className="text-base font-medium">
                  Hide &quot;Powered by UnionTab&quot;
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Remove the UnionTab branding from your union&apos;s footer
                </p>
              </div>
              <Switch
                id="hidePoweredBy"
                checked={formData.hidePoweredBy}
                onCheckedChange={(checked) => onChange({ hidePoweredBy: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
