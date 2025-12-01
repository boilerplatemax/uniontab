'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Edit, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen, GripVertical } from 'lucide-react';
import type { File as FileType, FileCategory } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils/date';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategorizedFilesListProps {
  files: (FileType & { createdBy: { name: string } })[];
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: FileType & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  unionId: number;
}

// Sortable File Item Component
function SortableFileItem({
  file,
  isOwner,
  isApprovedMember,
  onEdit,
  onDelete,
  deletingFile,
}: {
  file: FileType & { createdBy: { name: string } };
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: FileType & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
    >
      {isOwner && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </button>
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

// Sortable Category Component
function SortableCategory({
  category,
  categoryFiles,
  isExpanded,
  onToggle,
  isOwner,
  isApprovedMember,
  onEdit,
  onDelete,
  deletingFile,
  onReorderFiles,
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
  onReorderFiles: (category: string, files: (FileType & { createdBy: { name: string } })[]) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categoryFiles.findIndex((f) => f.id.toString() === active.id);
      const newIndex = categoryFiles.findIndex((f) => f.id.toString() === over.id);

      const reorderedFiles = arrayMove(categoryFiles, oldIndex, newIndex);
      onReorderFiles(category, reorderedFiles);
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="shadow-sm">
      <CardContent className="p-0">
        {/* Category Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          {isOwner && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="h-5 w-5" />
            </button>
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
        </div>

        {/* Category Files */}
        {isExpanded && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categoryFiles.map((f) => f.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y">
                {categoryFiles.map((file) => (
                  <SortableFileItem
                    key={file.id}
                    file={file}
                    isOwner={isOwner}
                    isApprovedMember={isApprovedMember}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletingFile={deletingFile}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
  }, [unionId]);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedCategories.findIndex((c) => c === active.id);
      const newIndex = sortedCategories.findIndex((c) => c === over.id);

      const reorderedCategories = arrayMove(sortedCategories, oldIndex, newIndex);

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
    }
  };

  const handleFileReorder = async (
    category: string,
    reorderedFiles: (FileType & { createdBy: { name: string } })[]
  ) => {
    // Update file sort orders in database
    const fileUpdates = reorderedFiles.map((file, index) => ({
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
      categorizedFiles[category] = reorderedFiles;
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleCategoryDragEnd}
    >
      <SortableContext
        items={sortedCategories}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {sortedCategories.map((category) => {
            // Skip hidden categories
            if (isCategoryHidden(category)) {
              return null;
            }

            const categoryFiles = categorizedFiles[category];
            const isExpanded = expandedCategories.has(category);

            return (
              <SortableCategory
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
                onReorderFiles={handleFileReorder}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
