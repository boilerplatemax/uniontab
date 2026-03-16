'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextContent } from '@/components/ui/rich-text-content';
import {
  Loader2,
  Save,
  Trash2,
  PenLine,
  Eye,
} from 'lucide-react';
import type { Member } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface SignatureTabProps {
  member: MemberData;
  unionId: number;
  slug: string;
}

export function SignatureTab({ member, unionId, slug }: SignatureTabProps) {
  const [signatureHtml, setSignatureHtml] = useState(
    member.member.signatureHtml || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasSignature =
    signatureHtml.trim() !== '' && signatureHtml !== '<p></p>';

  const handleSave = async () => {
    if (!signatureHtml.trim() || signatureHtml === '<p></p>') {
      setError('Please enter a signature before saving.');
      setSuccess('');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureHtml, unionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save signature');
      }

      setSuccess('Signature saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your signature?')) return;

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/signature', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete signature');
      }

      setSignatureHtml('');
      setSuccess('Signature deleted successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Email Signature
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create a signature block that can be appended to your emails and
            posts.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Edit Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Signature Content</Label>
            <RichTextEditor
              content={signatureHtml}
              onChange={setSignatureHtml}
              placeholder="Enter your email signature..."
              className="min-h-[200px]"
            />
            <p className="text-sm text-gray-500">
              This signature will be available to append to mass emails and
              posts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Signature
                </>
              )}
            </Button>
            {hasSignature && (
              <Button
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Signature
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasSignature ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                This is how your signature will appear when appended to emails
                and posts:
              </p>
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-gray-400 text-sm italic mb-3">
                  ...email or post content above...
                </p>
                <hr className="border-t border-gray-300 my-4" />
                <RichTextContent content={signatureHtml} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <PenLine className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No signature yet
              </h3>
              <p className="text-gray-500">
                Use the editor above to create your email signature.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
