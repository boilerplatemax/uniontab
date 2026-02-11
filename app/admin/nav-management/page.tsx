'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Menu,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Lock,
  Save,
  ExternalLink,
  FileText,
  Download,
  Globe,
  ChevronRight,
} from 'lucide-react';
import {
  getAllUnions,
  getNavigationItems,
  getUnionPages,
  getUnionFiles,
  saveNavigationTree,
  deleteNavigationItem,
} from './actions';

interface UnionOption {
  id: number;
  name: string;
  slug: string;
  localNumber: string | null;
  publicName: string | null;
}

interface NavItem {
  id?: number;
  parentId: number | null;
  label: string;
  sortOrder: number;
  visibility: string;
  linkType: string;
  pageId: number | null;
  fileId: number | null;
  externalUrl: string | null;
  builtInRoute: string | null;
  isEnabled: boolean;
  openInNewTab: boolean;
  isMandatory: boolean;
}

interface PageOption {
  id: number;
  title: string;
  slug: string;
  isPublished: boolean;
}

interface FileOption {
  id: number;
  name: string;
  fileUrl: string;
}

const BUILT_IN_ROUTES = [
  'news', 'about', 'events', 'files', 'elections', 'contact',
  'members', 'dues', 'grievances', 'meetings', 'announcements', 'analytics', 'settings',
];

const LINK_TYPE_LABELS: Record<string, string> = {
  built_in_route: 'Built-in',
  page: 'Page',
  file: 'File',
  external_url: 'External',
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Public',
  members_only: 'Members',
  admins_only: 'Admins',
};

const VISIBILITY_COLORS: Record<string, string> = {
  public: 'bg-green-100 text-green-800',
  members_only: 'bg-blue-100 text-blue-800',
  admins_only: 'bg-purple-100 text-purple-800',
};

function emptyNavItem(): NavItem {
  return {
    parentId: null,
    label: '',
    sortOrder: 0,
    visibility: 'public',
    linkType: 'built_in_route',
    pageId: null,
    fileId: null,
    externalUrl: null,
    builtInRoute: null,
    isEnabled: true,
    openInNewTab: false,
    isMandatory: false,
  };
}

export default function NavManagementPage() {
  const [unions, setUnions] = useState<UnionOption[]>([]);
  const [selectedUnionId, setSelectedUnionId] = useState<string>('');
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [fileOptions, setFileOptions] = useState<FileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogItem, setDialogItem] = useState<NavItem>(emptyNavItem());

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadUnions();
  }, []);

  const loadUnions = async () => {
    try {
      const data = await getAllUnions();
      setUnions(data);
    } catch (error) {
      console.error('Failed to load unions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNavItems = useCallback(async (unionId: number) => {
    setLoadingItems(true);
    try {
      const [items, pagesData, filesData] = await Promise.all([
        getNavigationItems(unionId),
        getUnionPages(unionId),
        getUnionFiles(unionId),
      ]);
      setNavItems(items as NavItem[]);
      setPages(pagesData as PageOption[]);
      setFileOptions(filesData as FileOption[]);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load navigation:', error);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUnionId) {
      loadNavItems(parseInt(selectedUnionId));
    } else {
      setNavItems([]);
      setPages([]);
      setFileOptions([]);
    }
  }, [selectedUnionId, loadNavItems]);

  const handleOpenAdd = () => {
    const maxSort = navItems.reduce((max, item) => Math.max(max, item.sortOrder), -1);
    setEditingIndex(null);
    setDialogItem({ ...emptyNavItem(), sortOrder: maxSort + 1 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setDialogItem({ ...navItems[index] });
    setDialogOpen(true);
  };

  const handleDialogSave = () => {
    if (!dialogItem.label.trim()) return;

    const updated = [...navItems];
    if (editingIndex !== null) {
      updated[editingIndex] = { ...dialogItem };
    } else {
      updated.push({ ...dialogItem });
    }
    setNavItems(updated);
    setHasChanges(true);
    setDialogOpen(false);
  };

  const handleInlineChange = (index: number, field: keyof NavItem, value: any) => {
    const updated = [...navItems];
    (updated[index] as any)[field] = value;
    setNavItems(updated);
    setHasChanges(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingIndex === null) return;
    const item = navItems[deletingIndex];

    // Remove from local state
    const updated = navItems.filter((_, i) => i !== deletingIndex);
    // Also remove children of this item
    const itemId = item.id;
    const filtered = itemId
      ? updated.filter((i) => i.parentId !== itemId)
      : updated;
    setNavItems(filtered);
    setHasChanges(true);
    setDeleteDialogOpen(false);
    setDeletingIndex(null);
  };

  const handleSaveAll = async () => {
    if (!selectedUnionId) return;
    setSaving(true);
    try {
      const result = await saveNavigationTree(parseInt(selectedUnionId), navItems);
      // Reload to get server-assigned IDs
      await loadNavItems(parseInt(selectedUnionId));
    } catch (error) {
      console.error('Failed to save navigation:', error);
    } finally {
      setSaving(false);
    }
  };

  const topLevelItems = navItems.filter((i) => !i.parentId);
  const getChildren = (parentId: number | undefined) =>
    parentId ? navItems.filter((i) => i.parentId === parentId) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Menu className="h-6 w-6" />
            Navigation Management
          </h1>
          <p className="text-gray-500 mt-1">Manage navigation items for each union&apos;s public site.</p>
        </div>
      </div>

      {/* Union Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Label htmlFor="union-select" className="mb-2 block">Select Union</Label>
          <Select value={selectedUnionId} onValueChange={setSelectedUnionId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a union..." />
            </SelectTrigger>
            <SelectContent>
              {unions.map((union) => (
                <SelectItem key={union.id} value={String(union.id)}>
                  {union.publicName || union.name}
                  {union.localNumber ? ` ${union.localNumber}` : ''}
                  {' '}
                  <span className="text-gray-400">({union.slug})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Navigation Items */}
      {selectedUnionId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Navigation Items</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Nav Item
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : navItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Menu className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No navigation items yet.</p>
                <p className="text-sm mt-1">Click &quot;Add Nav Item&quot; to create one, or seed the defaults.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {topLevelItems
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => {
                    const itemIndex = navItems.indexOf(item);
                    const children = item.id ? getChildren(item.id) : [];
                    return (
                      <div key={itemIndex}>
                        <NavItemRow
                          item={item}
                          index={itemIndex}
                          indent={0}
                          onEdit={handleOpenEdit}
                          onDelete={(idx) => {
                            setDeletingIndex(idx);
                            setDeleteDialogOpen(true);
                          }}
                          onInlineChange={handleInlineChange}
                        />
                        {children
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((child) => {
                            const childIndex = navItems.indexOf(child);
                            return (
                              <NavItemRow
                                key={childIndex}
                                item={child}
                                index={childIndex}
                                indent={1}
                                onEdit={handleOpenEdit}
                                onDelete={(idx) => {
                                  setDeletingIndex(idx);
                                  setDeleteDialogOpen(true);
                                }}
                                onInlineChange={handleInlineChange}
                              />
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Navigation Item' : 'Add Navigation Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Label *</Label>
              <Input
                value={dialogItem.label}
                onChange={(e) => setDialogItem({ ...dialogItem, label: e.target.value })}
                placeholder="Nav item label"
              />
            </div>

            <div>
              <Label>Parent</Label>
              <Select
                value={dialogItem.parentId ? String(dialogItem.parentId) : 'top'}
                onValueChange={(v) =>
                  setDialogItem({ ...dialogItem, parentId: v === 'top' ? null : parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top Level</SelectItem>
                  {topLevelItems
                    .filter((i) => i.id && (editingIndex === null || navItems[editingIndex]?.id !== i.id))
                    .map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        {i.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Link Type</Label>
              <Select
                value={dialogItem.linkType}
                onValueChange={(v) =>
                  setDialogItem({
                    ...dialogItem,
                    linkType: v,
                    pageId: null,
                    fileId: null,
                    externalUrl: null,
                    builtInRoute: null,
                  })
                }
                disabled={editingIndex !== null && dialogItem.isMandatory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="built_in_route">Built-in Route</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="external_url">External URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields based on link type */}
            {dialogItem.linkType === 'built_in_route' && (
              <div>
                <Label>Route</Label>
                <Select
                  value={dialogItem.builtInRoute || ''}
                  onValueChange={(v) => setDialogItem({ ...dialogItem, builtInRoute: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILT_IN_ROUTES.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route.charAt(0).toUpperCase() + route.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dialogItem.linkType === 'page' && (
              <div>
                <Label>Page</Label>
                <Select
                  value={dialogItem.pageId ? String(dialogItem.pageId) : ''}
                  onValueChange={(v) => setDialogItem({ ...dialogItem, pageId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select page..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={String(page.id)}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dialogItem.linkType === 'file' && (
              <div>
                <Label>File</Label>
                <Select
                  value={dialogItem.fileId ? String(dialogItem.fileId) : ''}
                  onValueChange={(v) => setDialogItem({ ...dialogItem, fileId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select file..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fileOptions.map((file) => (
                      <SelectItem key={file.id} value={String(file.id)}>
                        {file.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dialogItem.linkType === 'external_url' && (
              <div>
                <Label>URL</Label>
                <Input
                  value={dialogItem.externalUrl || ''}
                  onChange={(e) => setDialogItem({ ...dialogItem, externalUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            <div>
              <Label>Visibility</Label>
              <Select
                value={dialogItem.visibility}
                onValueChange={(v) => setDialogItem({ ...dialogItem, visibility: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members_only">Members Only</SelectItem>
                  <SelectItem value="admins_only">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={dialogItem.sortOrder}
                onChange={(e) =>
                  setDialogItem({ ...dialogItem, sortOrder: parseInt(e.target.value) || 0 })
                }
                className="w-24"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={dialogItem.openInNewTab}
                  onCheckedChange={(checked) =>
                    setDialogItem({ ...dialogItem, openInNewTab: !!checked })
                  }
                />
                <span className="text-sm">Open in new tab</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={dialogItem.isEnabled}
                  onCheckedChange={(checked) =>
                    setDialogItem({ ...dialogItem, isEnabled: !!checked })
                  }
                />
                <span className="text-sm">Enabled</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDialogSave} disabled={!dialogItem.label.trim()}>
                {editingIndex !== null ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Navigation Item</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this navigation item and any children. This action will be applied when you click &quot;Save All&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Nav Item Row ──────────────────────────────────────────────────────────

function NavItemRow({
  item,
  index,
  indent,
  onEdit,
  onDelete,
  onInlineChange,
}: {
  item: NavItem;
  index: number;
  indent: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onInlineChange: (index: number, field: keyof NavItem, value: any) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 group ${
        indent > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''
      } ${!item.isEnabled ? 'opacity-50' : ''}`}
    >
      {/* Sort order */}
      <Input
        type="number"
        value={item.sortOrder}
        onChange={(e) => onInlineChange(index, 'sortOrder', parseInt(e.target.value) || 0)}
        className="w-16 h-8 text-center text-sm"
      />

      {/* Label */}
      <Input
        value={item.label}
        onChange={(e) => onInlineChange(index, 'label', e.target.value)}
        className="w-40 h-8 text-sm"
      />

      {/* Link type badge */}
      <Badge variant="outline" className="text-xs shrink-0">
        {LINK_TYPE_LABELS[item.linkType] || item.linkType}
      </Badge>

      {/* Visibility badge */}
      <Badge className={`text-xs shrink-0 ${VISIBILITY_COLORS[item.visibility] || ''}`}>
        {VISIBILITY_LABELS[item.visibility] || item.visibility}
      </Badge>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Enabled toggle */}
      <label className="flex items-center gap-1 cursor-pointer">
        <Checkbox
          checked={item.isEnabled}
          onCheckedChange={(checked) => onInlineChange(index, 'isEnabled', !!checked)}
        />
        <span className="text-xs text-gray-500">On</span>
      </label>

      {/* Mandatory lock */}
      {item.isMandatory && (
        <Lock className="h-4 w-4 text-gray-400" title="Mandatory item" />
      )}

      {/* Edit button */}
      <Button variant="ghost" size="sm" onClick={() => onEdit(index)} className="h-8 w-8 p-0">
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(index)}
        disabled={item.isMandatory}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 disabled:text-gray-300"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
