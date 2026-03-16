'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextContent } from '@/components/ui/rich-text-content';
import {
  ArrowLeft,
  PenLine,
  Save,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface SignatureContentProps {
  slug: string;
  unionId: number;
  unionName: string;
  initialSignatureHtml: string;
}

export function SignatureContent({
  slug,
  unionId,
  unionName,
  initialSignatureHtml,
}: SignatureContentProps) {
  const [signatureHtml, setSignatureHtml] = useState(initialSignatureHtml);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSave = async () => {
    if (!signatureHtml.trim() || signatureHtml === '<p></p>') {
      setResult({ success: false, message: 'Please enter a signature before saving.' });
      return;
    }

    setIsSaving(true);
    setResult(null);

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

      setResult({ success: true, message: 'Signature saved successfully!' });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your signature?')) return;

    setIsDeleting(true);
    setResult(null);

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
      setResult({ success: true, message: 'Signature deleted successfully.' });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSignature = signatureHtml.trim() !== '' && signatureHtml !== '<p></p>';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Union
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <PenLine className="h-8 w-8" />
            Email Signature
          </h1>
          <p className="text-gray-600 mt-2">
            Create a signature block that can be appended to your emails and posts.
          </p>
        </div>

        {/* Result Alert */}
        {result && (
          <Card className={`mb-6 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <p className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Signature</CardTitle>
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
                This signature will be available to append to mass emails and posts.
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
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasSignature ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  This is how your signature will appear when appended to emails and posts:
                </p>
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-gray-400 text-sm italic mb-3">...email or post content above...</p>
                  <hr className="border-t border-gray-300 my-4" />
                  <RichTextContent content={signatureHtml} />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <PenLine className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No signature yet</h3>
                <p className="text-gray-500">
                  Use the editor above to create your email signature.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
