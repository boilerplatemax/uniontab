'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Edit, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen, Pencil, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import type { File as FileType, FileCategory } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils/date';
import { RenameCategoryDialog } from './rename-category-dialog';

interface CategorizedFilesListProps {
  files: (FileType & { createdBy: { name: string } })[];
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: FileType & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  unionId: number;
}

// File Item Component
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
}: {
  file: FileType & { createdBy: { name: string } };
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: FileType & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      {isOwner && (
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={isFirst}
            className="h-6 w-6 p-0"
            title="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={isLast}
            className="h-6 w-6 p-0"
            title="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
      <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {file.originalName}
        </p>
        <p className="text-sm text-gray-500">
          Uploaded by {file.createdBy.name} •{' '}
          {formatDate(file.createdAt)} •{' '}
          {(file.fileSize / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <div className="flex items-center gap-2">
        {file.isPrivate && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            Private
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(file.fileUrl, '_blank')}
          title="Preview/Open"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
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
        >
          <Download className="h-4 w-4" />
        </Button>
        {isOwner && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(file)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(file.id)}
              disabled={deletingFile === file.id}
              title="Delete"
            >
              {deletingFile === file.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Category Component
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
}: {
  category: string;
  categoryFiles: (FileType & { createdBy: { name: string } })[];
  isExpanded: boolean;
  onToggle: () => void;
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: FileType & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  onMoveFileUp: (fileId: number) => void;
  onMoveFileDown: (fileId: number) => void;
  onRenameCategory: (category: string) => void;
  onMoveCategoryUp: () => void;
  onMoveCategoryDown: () => void;
  isFirstCategory: boolean;
  isLastCategory: boolean;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-0">
        {/* Category Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          {isOwner && (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveCategoryUp}
                disabled={isFirstCategory}
                className="h-6 w-6 p-0"
                title="Move category up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveCategoryDown}
                disabled={isLastCategory}
                className="h-6 w-6 p-0"
                title="Move category down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          )}
          <button
            onClick={onToggle}
            className="flex-1 flex items-center gap-3 hover:bg-gray-50 transition-colors rounded px-2 py-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            )}
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">
              {category}
            </span>
            <span className="ml-auto text-sm text-gray-500">
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
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4 text-gray-600" />
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
}: CategorizedFilesListProps) {
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
  }, {} as Record<string, (FileType & { createdBy: { name: string } })[]>);

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

  const handleMoveCategoryUp = async (categoryIndex: number) => {
    if (categoryIndex === 0) return;

    const reorderedCategories = [...sortedCategories];
    [reorderedCategories[categoryIndex - 1], reorderedCategories[categoryIndex]] =
      [reorderedCategories[categoryIndex], reorderedCategories[categoryIndex - 1]];

    // Update category orders in database
    const categoryOrders = reorderedCategories.map((name, index) => ({
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

  const handleMoveCategoryDown = async (categoryIndex: number) => {
    if (categoryIndex === sortedCategories.length - 1) return;

    const reorderedCategories = [...sortedCategories];
    [reorderedCategories[categoryIndex], reorderedCategories[categoryIndex + 1]] =
      [reorderedCategories[categoryIndex + 1], reorderedCategories[categoryIndex]];

    // Update category orders in database
    const categoryOrders = reorderedCategories.map((name, index) => ({
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
    const category = Object.keys(categorizedFiles).find((cat) =>
      categorizedFiles[cat].some((f) => f.id === fileId)
    );

    if (!category) return;

    const categoryFiles = [...categorizedFiles[category]];
    const fileIndex = categoryFiles.findIndex((f) => f.id === fileId);

    if (fileIndex === 0) return;

    [categoryFiles[fileIndex - 1], categoryFiles[fileIndex]] =
      [categoryFiles[fileIndex], categoryFiles[fileIndex - 1]];

    // Update file sort orders in database
    const fileUpdates = categoryFiles.map((file, index) => ({
      fileId: file.id,
      sortOrder: index,
    }));

    try {
      await fetch('/api/files/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUpdates }),
      });

      // Update local state
      categorizedFiles[category] = categoryFiles;
      // Force re-render
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error reordering files:', error);
    }
  };

  const handleMoveFileDown = async (fileId: number) => {
    const category = Object.keys(categorizedFiles).find((cat) =>
      categorizedFiles[cat].some((f) => f.id === fileId)
    );

    if (!category) return;

    const categoryFiles = [...categorizedFiles[category]];
    const fileIndex = categoryFiles.findIndex((f) => f.id === fileId);

    if (fileIndex === categoryFiles.length - 1) return;

    [categoryFiles[fileIndex], categoryFiles[fileIndex + 1]] =
      [categoryFiles[fileIndex + 1], categoryFiles[fileIndex]];

    // Update file sort orders in database
    const fileUpdates = categoryFiles.map((file, index) => ({
      fileId: file.id,
      sortOrder: index,
    }));

    try {
      await fetch('/api/files/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUpdates }),
      });

      // Update local state
      categorizedFiles[category] = categoryFiles;
      // Force re-render
      setRefreshKey((prev) => prev + 1);
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

  return (
    <div className="space-y-4">
      {sortedCategories.map((category, index) => {
        // Skip hidden categories
        if (isCategoryHidden(category)) {
          return null;
        }

        const categoryFiles = categorizedFiles[category];
        const isExpanded = expandedCategories.has(category);

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
            onMoveCategoryUp={() => handleMoveCategoryUp(index)}
            onMoveCategoryDown={() => handleMoveCategoryDown(index)}
            isFirstCategory={index === 0}
            isLastCategory={index === sortedCategories.length - 1}
          />
        );
      })}
      <RenameCategoryDialog
        open={renameCategoryDialog !== null}
        onOpenChange={(open) => !open && setRenameCategoryDialog(null)}
        category={renameCategoryDialog}
        unionId={unionId}
        onSuccess={handleRenameSuccess}
      />
    </div>
  );
}
