'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';
import { Loader2, Search, User, Users, UserPlus, X } from 'lucide-react';
import { GrievancePriority } from '@/lib/db/schema';

interface CreateGrievanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  unionSlug: string;
  onSuccess: () => void;
  categories?: Array<{ id: number; name: string }>;
  isAdmin?: boolean;
  allMembers?: Array<{ member: { id: number; role: string }; user: { id: number; name: string; email: string } }>;
}

interface GrievanceAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function CreateGrievanceDialog({
  open,
  onOpenChange,
  unionId,
  unionSlug,
  onSuccess,
  categories = [],
  isAdmin = false,
  allMembers = [],
}: CreateGrievanceDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState(GrievancePriority.MEDIUM);
  const [attachments, setAttachments] = useState<GrievanceAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // Grievors state (admin-only)
  const [selectedGrievors, setSelectedGrievors] = useState<Array<{ memberId: number; name: string; email: string }>>([]);
  const [grievorSearch, setGrievorSearch] = useState('');
  const [showGrievorDropdown, setShowGrievorDropdown] = useState(false);

  const selectedGrievorMemberIds = new Set(selectedGrievors.map((g) => g.memberId));
  const availableGrievors = allMembers.filter((m) => !selectedGrievorMemberIds.has(m.member.id));
  const filteredGrievors = grievorSearch
    ? availableGrievors.filter(
        (m) =>
          m.user.name.toLowerCase().includes(grievorSearch.toLowerCase()) ||
          m.user.email.toLowerCase().includes(grievorSearch.toLowerCase())
      )
    : availableGrievors;

  const handleSelectGrievor = (m: typeof allMembers[0]) => {
    setSelectedGrievors((prev) => [
      ...prev,
      { memberId: m.member.id, name: m.user.name, email: m.user.email },
    ]);
    setGrievorSearch('');
    setShowGrievorDropdown(false);
  };

  const handleRemoveGrievor = (memberId: number) => {
    setSelectedGrievors((prev) => prev.filter((g) => g.memberId !== memberId));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setPriority(GrievancePriority.MEDIUM);
    setAttachments([]);
    setSelectedGrievors([]);
    setGrievorSearch('');
    setShowGrievorDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsDraft(saveAsDraft);

    try {
      const response = await fetch('/api/grievances/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          title,
          description,
          category: category || null,
          priority,
          status: saveAsDraft ? 'draft' : 'submitted',
          attachments,
          grievorMemberIds: isAdmin ? selectedGrievors.map((g) => g.memberId) : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create grievance');
      }

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsDraft(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File a New Grievance</DialogTitle>
          <DialogDescription>
            Provide details about your workplace concern or issue. You can save as a draft or submit it for review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="title">Grievance Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                required
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of your grievance, including dates, times, locations, and people involved..."
                required
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workplace">Workplace Issue</SelectItem>
                    <SelectItem value="disciplinary">Disciplinary Action</SelectItem>
                    <SelectItem value="contract">Contract Violation</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="safety">Safety Concern</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GrievancePriority.LOW}>Low</SelectItem>
                    <SelectItem value={GrievancePriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={GrievancePriority.HIGH}>High</SelectItem>
                    <SelectItem value={GrievancePriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grievors (admin-only) */}
            {isAdmin && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-semibold">Grievors</Label>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Add members on whose behalf this grievance is being filed. They will be able to see this grievance in their grievances page.
                </p>

                {/* Selected grievors */}
                {selectedGrievors.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {selectedGrievors.map((g) => (
                      <div key={g.memberId} className="flex items-center justify-between p-2 rounded-lg bg-white border">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{g.name}</span>
                          <span className="text-sm text-muted-foreground">({g.email})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGrievor(g.memberId)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search to add grievors */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={grievorSearch}
                      onChange={(e) => {
                        setGrievorSearch(e.target.value);
                        setShowGrievorDropdown(true);
                      }}
                      onFocus={() => setShowGrievorDropdown(true)}
                      onBlur={() => setTimeout(() => setShowGrievorDropdown(false), 150)}
                      placeholder="Search members to add..."
                      className="pl-9"
                    />
                    {showGrievorDropdown && filteredGrievors.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredGrievors.map((m) => (
                          <button
                            key={m.member.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex flex-col"
                            onMouseDown={() => handleSelectGrievor(m)}
                          >
                            <span className="font-medium">
                              {m.user.name}
                              {m.member.role === 'admin' || m.member.role === 'owner' ? (
                                <span className="ml-1 text-xs text-muted-foreground font-normal">(Admin)</span>
                              ) : null}
                            </span>
                            <span className="text-xs text-muted-foreground">{m.user.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showGrievorDropdown && grievorSearch && filteredGrievors.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground">
                        No members found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Supporting Documents</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload any relevant documents, emails, photos, or other evidence
              </p>
              <MultiFileUpload
                path="grievances"
                onFilesChange={(files) => {
                  setAttachments(prev => [...prev, ...files]);
                }}
                maxFiles={10}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); onOpenChange(false); }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || !title || !description}
            >
              {loading && isDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Draft...
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button
              type="submit"
              disabled={loading || !title || !description}
            >
              {loading && !isDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Grievance'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
