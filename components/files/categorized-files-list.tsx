'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Edit, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import type { File as FileType } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils/date';

interface CategorizedFilesListProps {
  files: (FileType & { createdBy: { name: string } })[];
  isOwner: boolean;
  isApprovedMember: boolean;
  onEdit: (file: FileType & { createdBy: { name: string } }) => void;
  onDelete: (fileId: number) => void;
  deletingFile: number | null;
}

export function CategorizedFilesList({
  files,
  isOwner,
  isApprovedMember,
  onEdit,
  onDelete,
  deletingFile,
}: CategorizedFilesListProps) {
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

  // Sort categories: Uncategorized last, others alphabetically
  const sortedCategories = Object.keys(categorizedFiles).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
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

  if (sortedCategories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sortedCategories.map((category) => {
        // Skip hidden categories
        if (isCategoryHidden(category)) {
          return null;
        }

        const categoryFiles = categorizedFiles[category];
        const isExpanded = expandedCategories.has(category);

        return (
          <Card key={category} className="shadow-sm">
            <CardContent className="p-0">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b"
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

              {/* Category Files */}
              {isExpanded && (
                <div className="divide-y">
                  {categoryFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
