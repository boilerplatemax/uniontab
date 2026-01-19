'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, ShieldCheck, Info } from 'lucide-react';
import {
  ADMIN_PERMISSION_CATEGORIES,
  DEFAULT_ADMIN_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  type AdminPermissionKey,
} from '@/lib/admin-permissions';
import type { AdminPermissions } from '@/lib/db/schema';

interface AdminPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'make-admin' | 'edit-permissions';
  memberName: string;
  memberId: number;
  currentPermissions?: AdminPermissions | null;
  onConfirm: (permissions: AdminPermissions) => Promise<void>;
}

export function AdminPermissionsDialog({
  open,
  onOpenChange,
  mode,
  memberName,
  memberId,
  currentPermissions,
  onConfirm,
}: AdminPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<AdminPermissions>(
    currentPermissions || DEFAULT_ADMIN_PERMISSIONS
  );
  const [isLoading, setIsLoading] = useState(false);

  // Reset permissions when dialog opens with different member
  useEffect(() => {
    if (open) {
      setPermissions(currentPermissions || DEFAULT_ADMIN_PERMISSIONS);
    }
  }, [open, currentPermissions]);

  const togglePermission = (key: AdminPermissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAll = () => {
    const allEnabled: AdminPermissions = {};
    ALL_PERMISSION_KEYS.forEach(key => {
      allEnabled[key] = true;
    });
    setPermissions(allEnabled);
  };

  const selectNone = () => {
    const allDisabled: AdminPermissions = {};
    ALL_PERMISSION_KEYS.forEach(key => {
      allDisabled[key] = false;
    });
    setPermissions(allDisabled);
  };

  const enabledCount = ALL_PERMISSION_KEYS.filter(key => permissions[key]).length;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(permissions);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'make-admin' ? (
              <>
                <Shield className="h-5 w-5 text-purple-600" />
                Make Admin
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                Edit Permissions
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'make-admin'
              ? `Select which features ${memberName} can access as an admin.`
              : `Edit the permissions for ${memberName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {enabledCount} of {ALL_PERMISSION_KEYS.length} permissions enabled
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="h-7 px-2 text-xs"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectNone}
                className="h-7 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Permissions List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {ALL_PERMISSION_KEYS.map(key => {
              const category = ADMIN_PERMISSION_CATEGORIES[key];
              return (
                <div
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    permissions[key]
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => togglePermission(key)}
                >
                  <Checkbox
                    id={`permission-${key}`}
                    checked={permissions[key] || false}
                    onCheckedChange={() => togglePermission(key)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`permission-${key}`}
                      className="font-medium text-gray-900 cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {category.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              {mode === 'make-admin'
                ? 'You can always edit these permissions later from the member list.'
                : 'Changes will take effect immediately.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : mode === 'make-admin' ? (
              'Make Admin'
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
