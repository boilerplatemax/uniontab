'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Edit, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen, Pencil, ArrowUp, ArrowDown, File, FileImage, FileSpreadsheet, FileArchive, FileVideo, FileAudio, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { File as FileType, FileCategory } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils/date';
import { RenameCategoryDialog } from './rename-category-dialog';
import { useRouter } from 'next/navigation';

interface CategorizedFilesListProps {
  files: (Omit<FileType, 'createdBy'> & { createdBy: { name: string } })[];
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: Omit<FileType, 'createdBy'> & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  unionId: number;
  slug: string;
}

// Get appropriate icon and color based on file extension
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const spreadsheetExts = ['xls', 'xlsx', 'csv', 'numbers'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  const docExts = ['doc', 'docx', 'txt', 'rtf', 'odt'];
  const pdfExts = ['pdf'];

  if (imageExts.includes(ext)) return { icon: FileImage, color: 'text-pink-500', bg: 'bg-pink-50' };
  if (spreadsheetExts.includes(ext)) return { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' };
  if (archiveExts.includes(ext)) return { icon: FileArchive, color: 'text-amber-600', bg: 'bg-amber-50' };
  if (videoExts.includes(ext)) return { icon: FileVideo, color: 'text-purple-600', bg: 'bg-purple-50' };
  if (audioExts.includes(ext)) return { icon: FileAudio, color: 'text-indigo-600', bg: 'bg-indigo-50' };
  if (pdfExts.includes(ext)) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' };
  if (docExts.includes(ext)) return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
  return { icon: File, color: 'text-gray-500', bg: 'bg-gray-50' };
}

// Format file size in a human-readable way
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// File Item Component with Arrow Controls
function FileItem({
  file,
  isOwner,
  isApprovedMember,
  onEdit,
  onDelete,
  deletingFile,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  slug,
}: {
  file: Omit<FileType, 'createdBy'> & { createdBy: { name: string } };
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: Omit<FileType, 'createdBy'> & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  slug: string;
}) {
  const { icon: FileIcon, color: iconColor, bg: iconBg } = getFileIcon(file.originalName);
  const ext = file.originalName.split('.').pop()?.toUpperCase() || '';

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors">
      {isOwner && (
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={isFirst}
            className="h-5 w-5 p-0"
            title="Move up"
          >
            <ArrowUp className={`h-3 w-3 ${isFirst ? 'text-gray-300' : 'text-gray-500'}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={isLast}
            className="h-5 w-5 p-0"
            title="Move down"
          >
            <ArrowDown className={`h-3 w-3 ${isLast ? 'text-gray-300' : 'text-gray-500'}`} />
          </Button>
        </div>
      )}

      {/* File icon */}
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <FileIcon className={`h-5 w-5 ${iconColor}`} />
      </div>

      {/* File info - clickable name */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => window.open(file.fileUrl, '_blank')}
          className="text-left max-w-full"
          title={file.originalName}
        >
          <p className="font-medium text-gray-900 truncate max-w-[280px] sm:max-w-[360px] md:max-w-[440px] hover:text-blue-600 transition-colors text-sm">
            {file.originalName}
          </p>
        </button>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs text-gray-400">{formatDate(file.createdAt)}</span>
          {ext && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs font-medium text-gray-400 uppercase">{ext}</span>
            </>
          )}
          {file.isPrivate && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                Private
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions - compact */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const a = document.createElement('a');
            a.href = file.fileUrl;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          title="Download"
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => window.open(file.fileUrl, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const a = document.createElement('a');
                a.href = file.fileUrl;
                a.download = file.originalName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => onEdit(file)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(file.id)}
                  disabled={deletingFile === file.id}
                  className="text-red-600 focus:text-red-600"
                >
                  {deletingFile === file.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Category Component with Arrow Controls
function CategorySection({
  category,
  categoryFiles,
  isExpanded,
  onToggle,
  isOwner,
  isApprovedMember,
  onEdit,
  onDelete,
  deletingFile,
  onMoveFileUp,
  onMoveFileDown,
  onRenameCategory,
  onMoveCategoryUp,
  onMoveCategoryDown,
  isFirstCategory,
  isLastCategory,
  slug,
}: {
  category: string;
  categoryFiles: (Omit<FileType, 'createdBy'> & { createdBy: { name: string } })[];
  isExpanded: boolean;
  onToggle: () => void;
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: Omit<FileType, 'createdBy'> & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  onMoveFileUp: (fileId: number) => void;
  onMoveFileDown: (fileId: number) => void;
  onRenameCategory: (category: string) => void;
  onMoveCategoryUp: () => void;
  onMoveCategoryDown: () => void;
  isFirstCategory: boolean;
  isLastCategory: boolean;
  slug: string;
}) {
  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Category Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/60 border-b border-gray-100">
          {isOwner && category !== 'Uncategorized' && (
            <div className="flex flex-col gap-0.5 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveCategoryUp}
                disabled={isFirstCategory}
                className="h-5 w-5 p-0"
                title="Move category up"
              >
                <ArrowUp className={`h-3 w-3 ${isFirstCategory ? 'text-gray-300' : 'text-gray-500'}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveCategoryDown}
                disabled={isLastCategory}
                className="h-5 w-5 p-0"
                title="Move category down"
              >
                <ArrowDown className={`h-3 w-3 ${isLastCategory ? 'text-gray-300' : 'text-gray-500'}`} />
              </Button>
            </div>
          )}
          <button
            onClick={onToggle}
            className="flex-1 flex items-center gap-2.5 hover:bg-gray-100/60 transition-colors rounded-md px-2 py-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <FolderOpen className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">
              {category}
            </span>
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {categoryFiles.length} {categoryFiles.length === 1 ? 'file' : 'files'}
            </span>
          </button>
          {isOwner && category !== 'Uncategorized' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRenameCategory(category);
              }}
              title="Rename category"
              className="h-7 w-7 p-0 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <Pencil className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          )}
        </div>

        {/* Category Files */}
        {isExpanded && (
          <div className="divide-y">
            {categoryFiles.map((file, index) => (
              <FileItem
                key={file.id}
                file={file}
                isOwner={isOwner}
                isApprovedMember={isApprovedMember}
                onEdit={onEdit}
                onDelete={onDelete}
                deletingFile={deletingFile}
                onMoveUp={() => onMoveFileUp(file.id)}
                onMoveDown={() => onMoveFileDown(file.id)}
                isFirst={index === 0}
                isLast={index === categoryFiles.length - 1}
                slug={slug}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CategorizedFilesList({
  files,
  isOwner,
  isApprovedMember,
  onEdit,
  onDelete,
  deletingFile,
  unionId,
  slug,
}: CategorizedFilesListProps) {
  const router = useRouter();
  const [categoryOrders, setCategoryOrders] = useState<FileCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameCategoryDialog, setRenameCategoryDialog] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch and sync category orders
  useEffect(() => {
    const syncCategories = async () => {
      try {
        const response = await fetch('/api/files/categories/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unionId }),
        });

        if (response.ok) {
          const data = await response.json();
          setCategoryOrders(data.categories || []);
        }
      } catch (error) {
        console.error('Error syncing categories:', error);
      } finally {
        setLoading(false);
      }
    };

    syncCategories();
  }, [unionId, refreshKey]);

  const handleRenameSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    // Trigger a refresh in the parent component
    window.location.reload();
  };

  // Group files by category
  const categorizedFiles = files.reduce((acc, file) => {
    // Hide private files from non-approved members
    if (file.isPrivate && !isApprovedMember) {
      return acc;
    }

    const category = file.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {} as Record<string, (Omit<FileType, 'createdBy'> & { createdBy: { name: string } })[]>);

  // Sort files within each category by sortOrder
  Object.keys(categorizedFiles).forEach((category) => {
    categorizedFiles[category].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  });

  // Sort categories based on category orders from database
  const categoryOrderMap = new Map(categoryOrders.map((c) => [c.name, c.sortOrder]));
  const sortedCategories = Object.keys(categorizedFiles).sort((a, b) => {
    const orderA = categoryOrderMap.get(a) ?? 999;
    const orderB = categoryOrderMap.get(b) ?? 999;

    // Uncategorized always last
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;

    return orderA - orderB;
  });

  // Track which categories are expanded (all expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(sortedCategories)
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Check if category should be hidden (all files are private and viewer is not approved)
  const isCategoryHidden = (category: string) => {
    const categoryFiles = categorizedFiles[category];
    return !isApprovedMember && categoryFiles.every((file) => file.isPrivate);
  };

  const handleMoveCategoryUp = async (category: string) => {
    const currentIndex = sortedCategories.indexOf(category);
    if (currentIndex <= 0) return;

    const newCategories = [...sortedCategories];
    [newCategories[currentIndex - 1], newCategories[currentIndex]] =
      [newCategories[currentIndex], newCategories[currentIndex - 1]];

    const categoryOrders = newCategories.map((name, index) => ({
      name,
      sortOrder: index,
    }));

    try {
      await fetch('/api/files/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unionId, categoryOrders }),
      });

      // Refresh category orders
      const response = await fetch('/api/files/categories/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCategoryOrders(data.categories || []);
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  const handleMoveCategoryDown = async (category: string) => {
    const currentIndex = sortedCategories.indexOf(category);
    if (currentIndex < 0 || currentIndex >= sortedCategories.length - 1) return;

    const newCategories = [...sortedCategories];
    [newCategories[currentIndex], newCategories[currentIndex + 1]] =
      [newCategories[currentIndex + 1], newCategories[currentIndex]];

    const categoryOrders = newCategories.map((name, index) => ({
      name,
      sortOrder: index,
    }));

    try {
      await fetch('/api/files/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unionId, categoryOrders }),
      });

      // Refresh category orders
      const response = await fetch('/api/files/categories/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCategoryOrders(data.categories || []);
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  const handleMoveFileUp = async (fileId: number) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const category = file.category || 'Uncategorized';
    const categoryFiles = categorizedFiles[category];
    const currentIndex = categoryFiles.findIndex((f) => f.id === fileId);

    if (currentIndex <= 0) return;

    const newFiles = [...categoryFiles];
    [newFiles[currentIndex - 1], newFiles[currentIndex]] =
      [newFiles[currentIndex], newFiles[currentIndex - 1]];

    const fileUpdates = newFiles.map((file, index) => ({
      fileId: file.id,
      sortOrder: index,
    }));

    try {
      const response = await fetch('/api/files/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUpdates }),
      });

      if (response.ok) {
        // Trigger a Next.js refresh to show updated order
        router.refresh();
      }
    } catch (error) {
      console.error('Error reordering files:', error);
    }
  };

  const handleMoveFileDown = async (fileId: number) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const category = file.category || 'Uncategorized';
    const categoryFiles = categorizedFiles[category];
    const currentIndex = categoryFiles.findIndex((f) => f.id === fileId);

    if (currentIndex < 0 || currentIndex >= categoryFiles.length - 1) return;

    const newFiles = [...categoryFiles];
    [newFiles[currentIndex], newFiles[currentIndex + 1]] =
      [newFiles[currentIndex + 1], newFiles[currentIndex]];

    const fileUpdates = newFiles.map((file, index) => ({
      fileId: file.id,
      sortOrder: index,
    }));

    try {
      const response = await fetch('/api/files/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUpdates }),
      });

      if (response.ok) {
        // Trigger a Next.js refresh to show updated order
        router.refresh();
      }
    } catch (error) {
      console.error('Error reordering files:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (sortedCategories.length === 0) {
    return null;
  }

  // Filter out "Uncategorized" for first/last checks
  const reorderableCategories = sortedCategories.filter((c) => c !== 'Uncategorized');

  return (
    <>
      <div className="space-y-4">
        {sortedCategories.map((category) => {
          // Skip hidden categories
          if (isCategoryHidden(category)) {
            return null;
          }

          const categoryFiles = categorizedFiles[category];
          const isExpanded = expandedCategories.has(category);

          // Calculate if this category is first or last (excluding Uncategorized)
          const reorderableIndex = reorderableCategories.indexOf(category);
          const isFirstCategory = reorderableIndex === 0;
          const isLastCategory = reorderableIndex === reorderableCategories.length - 1;

          return (
            <CategorySection
              key={category}
              category={category}
              categoryFiles={categoryFiles}
              isExpanded={isExpanded}
              onToggle={() => toggleCategory(category)}
              isOwner={isOwner}
              isApprovedMember={isApprovedMember}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingFile={deletingFile}
              onMoveFileUp={handleMoveFileUp}
              onMoveFileDown={handleMoveFileDown}
              onRenameCategory={(cat) => setRenameCategoryDialog(cat)}
              onMoveCategoryUp={() => handleMoveCategoryUp(category)}
              onMoveCategoryDown={() => handleMoveCategoryDown(category)}
              isFirstCategory={isFirstCategory}
              isLastCategory={isLastCategory}
              slug={slug}
            />
          );
        })}
      </div>
      <RenameCategoryDialog
        open={renameCategoryDialog !== null}
        onOpenChange={(open) => !open && setRenameCategoryDialog(null)}
        category={renameCategoryDialog}
        unionId={unionId}
        onSuccess={handleRenameSuccess}
      />
    </>
  );
}
