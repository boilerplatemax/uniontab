'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Code,
  Monitor,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  getAllUnions,
  getUnionPages,
  createPage,
  updatePage,
  deletePage,
  copyPage,
} from './actions';

interface UnionOption {
  id: number;
  name: string;
  slug: string;
  localNumber: string | null;
  publicName: string | null;
}

interface PageData {
  id: number;
  unionId: number;
  title: string;
  slug: string;
  content: string | null;
  isPublished: boolean;
  isMembersOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PageManagementPage() {
  const [unions, setUnions] = useState<UnionOption[]>([]);
  const [selectedUnionId, setSelectedUnionId] = useState<string>('');
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageData | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorSlug, setEditorSlug] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorPublished, setEditorPublished] = useState(false);
  const [editorMembersOnly, setEditorMembersOnly] = useState(false);
  const [editorMode, setEditorMode] = useState<'code' | 'preview'>('code');
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const loadPages = useCallback(async (unionId: number) => {
    setLoadingPages(true);
    try {
      const data = await getUnionPages(unionId);
      setPages(data as PageData[]);
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUnionId) {
      loadPages(parseInt(selectedUnionId));
    } else {
      setPages([]);
    }
  }, [selectedUnionId, loadPages]);

  const handleCreateNew = () => {
    setEditingPage(null);
    setEditorTitle('');
    setEditorSlug('');
    setEditorContent('');
    setEditorPublished(false);
    setEditorMembersOnly(false);
    setEditorMode('code');
    setSlugManuallyEdited(false);
    setEditorOpen(true);
  };

  const handleEdit = (page: PageData) => {
    setEditingPage(page);
    setEditorTitle(page.title);
    setEditorSlug(page.slug);
    setEditorContent(page.content || '');
    setEditorPublished(page.isPublished);
    setEditorMembersOnly(page.isMembersOnly);
    setEditorMode('code');
    setSlugManuallyEdited(true);
    setEditorOpen(true);
  };

  const handleTitleChange = (value: string) => {
    setEditorTitle(value);
    if (!slugManuallyEdited) {
      setEditorSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setEditorSlug(value);
    setSlugManuallyEdited(true);
  };

  const handleSave = async () => {
    if (!editorTitle.trim() || !editorSlug.trim()) {
      alert('Title and slug are required');
      return;
    }

    setSaving(true);
    try {
      if (editingPage) {
        await updatePage(editingPage.id, {
          title: editorTitle,
          slug: editorSlug,
          content: editorContent,
          isPublished: editorPublished,
          isMembersOnly: editorMembersOnly,
        });
      } else {
        await createPage(parseInt(selectedUnionId), {
          title: editorTitle,
          slug: editorSlug,
          content: editorContent,
          isPublished: editorPublished,
          isMembersOnly: editorMembersOnly,
        });
      }
      setEditorOpen(false);
      loadPages(parseInt(selectedUnionId));
    } catch (error: any) {
      console.error('Failed to save page:', error);
      alert(error.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPageId) return;
    setDeleting(true);
    try {
      await deletePage(deletingPageId);
      setDeleteDialogOpen(false);
      setDeletingPageId(null);
      loadPages(parseInt(selectedUnionId));
    } catch (error: any) {
      console.error('Failed to delete page:', error);
      alert(error.message || 'Failed to delete page');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = async (pageId: number) => {
    try {
      await copyPage(pageId);
      loadPages(parseInt(selectedUnionId));
    } catch (error: any) {
      console.error('Failed to copy page:', error);
      alert(error.message || 'Failed to copy page');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const selectedUnion = unions.find((u) => u.id === parseInt(selectedUnionId));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Page Management
          </h1>
          <p className="text-gray-500 mt-1">
            Create and manage custom pages for unions
          </p>
        </div>
      </div>

      {/* Union Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">
              Select Union:
            </Label>
            <Select value={selectedUnionId} onValueChange={setSelectedUnionId}>
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Choose a union..." />
              </SelectTrigger>
              <SelectContent>
                {unions.map((union) => (
                  <SelectItem key={union.id} value={union.id.toString()}>
                    {union.publicName || union.name}
                    {union.localNumber ? ` (${union.localNumber})` : ''} —{' '}
                    {union.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pages List */}
      {selectedUnionId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Pages for{' '}
              {selectedUnion?.publicName || selectedUnion?.name || 'Union'}
            </CardTitle>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Button>
          </CardHeader>
          <CardContent>
            {loadingPages ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No pages yet. Create your first page.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        {page.title}
                      </TableCell>
                      <TableCell className="text-gray-500 font-mono text-sm">
                        /p/{page.slug}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={page.isPublished ? 'default' : 'secondary'}
                          className={
                            page.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {page.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            page.isMembersOnly
                              ? 'border-amber-300 text-amber-700'
                              : ''
                          }
                        >
                          {page.isMembersOnly ? 'Members Only' : 'Public'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(page.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(page)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopy(page.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingPageId(page.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Page Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? 'Edit Page' : 'Create Page'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Title & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page-title">Title</Label>
                <Input
                  id="page-title"
                  value={editorTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Page title"
                />
              </div>
              <div>
                <Label htmlFor="page-slug">Slug</Label>
                <Input
                  id="page-slug"
                  value={editorSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="page-slug"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editorPublished}
                  onCheckedChange={setEditorPublished}
                />
                <Label className="flex items-center gap-1.5">
                  {editorPublished ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  {editorPublished ? 'Published' : 'Draft'}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editorMembersOnly}
                  onCheckedChange={setEditorMembersOnly}
                />
                <Label>
                  {editorMembersOnly ? 'Members Only' : 'Public'}
                </Label>
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Content</Label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditorMode('code')}
                    className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      editorMode === 'code'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      editorMode === 'preview'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Preview
                  </button>
                </div>
              </div>

              {editorMode === 'code' ? (
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="w-full min-h-[500px] p-4 font-mono text-sm bg-gray-950 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Paste HTML content here..."
                  spellCheck={false}
                />
              ) : (
                <div className="min-h-[500px] p-6 border rounded-lg bg-white overflow-auto">
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: editorContent || '<p class="text-gray-400">No content yet</p>',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditorOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Page'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This will also remove
              any navigation items linking to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
