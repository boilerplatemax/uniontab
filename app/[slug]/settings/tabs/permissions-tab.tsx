import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Lock, Check, MessageSquare } from 'lucide-react';
import type { SettingsFormData } from '../settings-content';

interface PermissionsTabProps {
  formData: SettingsFormData;
  onChange: (updates: Partial<SettingsFormData>) => void;
}

export function PermissionsTab({ formData, onChange }: PermissionsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Post Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Post Comments</h4>
              <p className="text-sm text-gray-500">Allow approved members to comment on news posts</p>
            </div>
            <Switch
              checked={formData.commentsEnabled}
              onCheckedChange={(checked) => onChange({ commentsEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Grievance Filing Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Control who can file grievances for your union.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onChange({ grievanceFilingPermission: 'all' })}
              className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                formData.grievanceFilingPermission === 'all'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <p className={`font-semibold mb-1 ${formData.grievanceFilingPermission === 'all' ? 'text-blue-900' : 'text-gray-900'}`}>
                Anyone
              </p>
              <p className={`text-sm ${formData.grievanceFilingPermission === 'all' ? 'text-blue-600' : 'text-gray-500'}`}>
                Any approved member or admin can file a grievance
              </p>
              {formData.grievanceFilingPermission === 'all' && (
                <Check className="h-4 w-4 text-blue-600 mt-2" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onChange({ grievanceFilingPermission: 'admins_only' })}
              className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                formData.grievanceFilingPermission === 'admins_only'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <p className={`font-semibold mb-1 ${formData.grievanceFilingPermission === 'admins_only' ? 'text-blue-900' : 'text-gray-900'}`}>
                Admins Only
              </p>
              <p className={`text-sm ${formData.grievanceFilingPermission === 'admins_only' ? 'text-blue-600' : 'text-gray-500'}`}>
                Only admins can file grievances. Members can still view grievances they are added to.
              </p>
              {formData.grievanceFilingPermission === 'admins_only' && (
                <Check className="h-4 w-4 text-blue-600 mt-2" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
