'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  FileText,
  Download,
  Trash2,
  Upload,
  File,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';
import type { Member, MemberDocument } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface DocumentWithUploader {
  document: MemberDocument;
  uploadedBy: {
    id: number;
    name: string | null;
  } | null;
}

interface DocumentsTabProps {
  member: MemberData;
  documents: DocumentWithUploader[];
  unionId: number;
  currentUserId: number;
  onUpdate: () => void;
}

const DOCUMENT_CATEGORIES = [
  { value: 'contract', label: 'Contract' },
  { value: 'id', label: 'ID Document' },
  { value: 'certification', label: 'Certification' },
  { value: 'grievance', label: 'Grievance' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

export function DocumentsTab({
  member,
  documents,
  unionId,
  currentUserId,
  onUpdate,
}: DocumentsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    notes: '',
  });

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-8 w-8 text-gray-400" />;
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel'))
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-400" />;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      contract: 'bg-blue-100 text-blue-800',
      id: 'bg-purple-100 text-purple-800',
      certification: 'bg-green-100 text-green-800',
      grievance: 'bg-red-100 text-red-800',
      medical: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.name) {
        setFormData((prev) => ({ ...prev, name: selectedFile.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, upload the file
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('unionId', unionId.toString());

      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();

      // Then, create the document record
      const response = await fetch('/api/members/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.member.id,
          unionId,
          name: formData.name || file.name,
          category: formData.category,
          notes: formData.notes,
          fileUrl: uploadData.url,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save document');
      }

      setShowAddDialog(false);
      setFile(null);
      setFormData({ name: '', category: 'other', notes: '' });
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setDeleteLoading(documentId);
    try {
      const response = await fetch('/api/members/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, unionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">
              Upload documents like contracts, IDs, or certifications for this member.
            </p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.document.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(doc.document.fileType)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{doc.document.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryBadge(doc.document.category)}>
                        {DOCUMENT_CATEGORIES.find((c) => c.value === doc.document.category)?.label ||
                          doc.document.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(doc.document.fileSize)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Uploaded {new Date(doc.document.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {doc.document.notes && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{doc.document.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.document.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.document.id)}
                      disabled={deleteLoading === doc.document.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleteLoading === doc.document.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: PDF, Word, Excel, Images (max 10MB)
              </p>
            </div>

            <div>
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter document name"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this document"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !file} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
