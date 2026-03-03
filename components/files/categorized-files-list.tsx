'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Edit, Trash2, Loader2, FolderOpen, Folder, Pencil, ArrowUp, ArrowDown, File, FileImage, FileSpreadsheet, FileArchive, FileVideo, FileAudio, MoreHorizontal, LayoutGrid } from 'lucide-react';
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
  showThumbnails?: boolean;
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

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']);

function isImageFile(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTS.has(ext);
}

// File Grid Card Component
function FileGridCard({
  file,
  isOwner,
  onEdit,
  onDelete,
  deletingFile,
  showThumbnails = false,
}: {
  file: Omit<FileType, 'createdBy'> & { createdBy: { name: string } };
  isOwner: boolean;
  onEdit: (file: Omit<FileType, 'createdBy'> & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
  showThumbnails?: boolean;
}) {
  const { icon: FileIcon, color: iconColor, bg: iconBg } = getFileIcon(file.originalName);
  const ext = file.originalName.split('.').pop()?.toUpperCase() || '';
  const showImagePreview = showThumbnails && isImageFile(file.originalName);

  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
      onClick={() => window.open(file.fileUrl, '_blank')}
    >
      {/* File preview area */}
      <div className={`${showImagePreview ? '' : iconBg} rounded-t-xl flex items-center justify-center h-28 overflow-hidden`}>
        {showImagePreview ? (
          <img
            src={file.fileUrl}
            alt={file.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileIcon className={`h-10 w-10 ${iconColor}`} />
        )}
      </div>

      {/* File info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate" title={file.originalName}>
          {file.originalName}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
          {ext && (
            <>
              <span className="text-gray-300 text-xs">&middot;</span>
              <span className="text-xs text-gray-400 uppercase">{ext}</span>
            </>
          )}
        </div>
        {file.isPrivate && (
          <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
            Private
          </span>
        )}
      </div>

      {/* Actions overlay */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
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
            {isOwner && (
              <>
                <DropdownMenuSeparator />
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

export function CategorizedFilesList({
  files,
  isOwner,
  isApprovedMember,
  onEdit,
  onDelete,
  deletingFile,
  unionId,
  slug,
  showThumbnails = false,
}: CategorizedFilesListProps) {
  const router = useRouter();
  const [categoryOrders, setCategoryOrders] = useState<FileCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameCategoryDialog, setRenameCategoryDialog] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    window.location.reload();
  };

  // Group files by category
  const categorizedFiles = files.reduce((acc, file) => {
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

    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;

    return orderA - orderB;
  });

  // Check if category should be hidden
  const isCategoryHidden = (category: string) => {
    const categoryFiles = categorizedFiles[category];
    return !isApprovedMember && categoryFiles.every((file) => file.isPrivate);
  };

  const visibleCategories = sortedCategories.filter((c) => !isCategoryHidden(c));

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

  // Get files for the selected category (or all files)
  const displayFiles = selectedCategory
    ? categorizedFiles[selectedCategory] || []
    : files.filter((f) => !f.isPrivate || isApprovedMember);

  // Count all visible files
  const totalFileCount = files.filter((f) => !f.isPrivate || isApprovedMember).length;

  // Determine if we have multiple categories (to show sidebar)
  const hasCategories = visibleCategories.length > 1 ||
    (visibleCategories.length === 1 && visibleCategories[0] !== 'Uncategorized');

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

  const reorderableCategories = sortedCategories.filter((c) => c !== 'Uncategorized');

  return (
    <>
      <div className={`flex gap-0 ${hasCategories ? 'min-h-[400px]' : ''}`}>
        {/* Folder Sidebar */}
        {hasCategories && (
          <div className="w-52 flex-shrink-0 border-r border-gray-200 pr-0">
            <nav className="space-y-0.5 py-1">
              {/* All Files button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                  selectedCategory === null
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">All Files</span>
                <span className="ml-auto text-xs text-gray-400">{totalFileCount}</span>
              </button>

              {/* Divider */}
              <div className="border-t border-gray-100 my-1.5 mx-3" />

              {/* Category folders */}
              {visibleCategories.map((category) => {
                const fileCount = categorizedFiles[category]?.length || 0;
                const isSelected = selectedCategory === category;
                const reorderableIndex = reorderableCategories.indexOf(category);
                const isFirstCategory = reorderableIndex === 0;
                const isLastCategory = reorderableIndex === reorderableCategories.length - 1;

                return (
                  <div key={category} className="group relative">
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {isSelected ? (
                        <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-500" />
                      ) : (
                        <Folder className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      )}
                      <span className="truncate">{category}</span>
                      <span className="ml-auto text-xs text-gray-400">{fileCount}</span>
                    </button>

                    {/* Admin controls on hover */}
                    {isOwner && category !== 'Uncategorized' && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategoryUp(category);
                          }}
                          disabled={isFirstCategory}
                          className="h-5 w-5 p-0"
                          title="Move up"
                        >
                          <ArrowUp className={`h-3 w-3 ${isFirstCategory ? 'text-gray-300' : 'text-gray-500'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategoryDown(category);
                          }}
                          disabled={isLastCategory}
                          className="h-5 w-5 p-0"
                          title="Move down"
                        >
                          <ArrowDown className={`h-3 w-3 ${isLastCategory ? 'text-gray-300' : 'text-gray-500'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameCategoryDialog(category);
                          }}
                          className="h-5 w-5 p-0"
                          title="Rename"
                        >
                          <Pencil className="h-3 w-3 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        )}

        {/* Files Grid */}
        <div className={`flex-1 ${hasCategories ? 'pl-6' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
              {selectedCategory || 'All Files'}
              <span className="ml-2 text-gray-400">({displayFiles.length})</span>
            </h3>
          </div>

          {/* Grid */}
          {displayFiles.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {displayFiles.map((file) => (
                <FileGridCard
                  key={file.id}
                  file={file}
                  isOwner={isOwner}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  deletingFile={deletingFile}
                  showThumbnails={showThumbnails}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <File className="h-12 w-12 mb-3" />
              <p className="text-sm">No files in this folder</p>
            </div>
          )}
        </div>
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
