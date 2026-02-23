'use client';

import { useState } from 'react';
import { RegistrationShareWidget } from '../../registration-share-widget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Mail, CheckCircle, Clock, Send, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { UnionNavbar } from '../../union-navbar';

interface InvitePageContentProps {
  unionName: string;
  localNumber?: string | null;
  registrationUrl: string;
  slug: string;
  membership: {
    user: { name: string | null };
    member: { role: string };
  };
  handleSignOut: () => Promise<void>;
  logoUrl?: string | null;
  themeColor?: string | null;
  unionId: number;
  canBulkInvite: boolean;
  navigationItems?: any[];
  isApprovedMember?: boolean;
}

export default function InvitePageContent({
  unionName,
  localNumber,
  registrationUrl,
  slug,
  membership,
  handleSignOut,
  logoUrl,
  themeColor,
  unionId,
  canBulkInvite,
  navigationItems,
  isApprovedMember,
}: InvitePageContentProps) {
  const fullUnionName = localNumber
    ? `${unionName} Local ${localNumber}`
    : unionName;

  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  const handleSendInvites = async () => {
    if (!emailInput.trim()) {
      setResult({
        type: 'error',
        message: 'Please enter an email address',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/members/invite-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: emailInput,
          unionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          type: 'error',
          message: data.error || 'Failed to send invites',
        });
        return;
      }

      // Success
      const sentCount = data.sent || 0;
      const failedCount = data.failed || 0;
      const invalidCount = data.invalidEmails?.length || 0;

      let message = `Successfully sent ${sentCount} invite${sentCount !== 1 ? 's' : ''}!`;
      let details = '';

      if (failedCount > 0) {
        details += `${failedCount} email${failedCount !== 1 ? 's' : ''} failed to send. `;
      }
      if (invalidCount > 0) {
        details += `${invalidCount} invalid email${invalidCount !== 1 ? 's were' : ' was'} skipped.`;
      }

      setResult({
        type: 'success',
        message,
        details: details || undefined,
      });

      // Clear input on success
      setEmailInput('');
    } catch (error) {
      console.error('Error sending invites:', error);
      setResult({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <UnionNavbar
        slug={slug}
        unionName={unionName}
        localNumber={localNumber ?? null}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={0}
        announcementId={null}
        isApprovedMember={isApprovedMember}
        navigationItems={navigationItems}
      />

      {/* Spacing for fixed navbar */}
      <div className="h-14" />

      <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invite New Members</h1>
        <p className="text-gray-600">
          Share your registration link with potential members to join {fullUnionName}
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Invite Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Email Invites
            </CardTitle>
            <CardDescription>
              {canBulkInvite
                ? 'Send invitation emails to potential members. Enter multiple emails separated by new lines.'
                : 'Send an invitation email to a potential member.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {canBulkInvite ? (
                <Textarea
                  placeholder="Enter email addresses (one per line)&#10;example1@email.com&#10;example2@email.com&#10;example3@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                  disabled={isLoading}
                />
              ) : (
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendInvites();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      <strong className="text-amber-700">Upgrade for bulk invites!</strong> Paid plans can send up to 500 invites at once.
                    </span>
                  </div>
                </div>
              )}

              {/* Result message */}
              {result && (
                <div
                  className={`p-3 rounded-md flex items-start gap-2 ${
                    result.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {result.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{result.message}</p>
                    {result.details && (
                      <p className="text-sm mt-1 opacity-80">{result.details}</p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendInvites}
                disabled={isLoading || !emailInput.trim()}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {canBulkInvite ? 'Send Invites' : 'Send Invite'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registration Link Widget */}
        <RegistrationShareWidget
          slug={slug}
          unionName={unionName}
          localNumber={localNumber}
          logoUrl={logoUrl}
          themeColor={themeColor}
        />

        {/* Registration Process Information */}
        <Card>
          <CardHeader>
            <CardTitle>How Member Registration Works</CardTitle>
            <CardDescription>
              New members go through a verification and approval process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">1. Member Signs Up</h3>
                  <p className="text-sm text-gray-600">
                    New members create an account using their personal email address and password.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">2. Email Verification</h3>
                  <p className="text-sm text-gray-600">
                    Members receive a verification email and must click the link to verify their email address. This ensures authenticity and security.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">3. Pending Admin Approval</h3>
                  <p className="text-sm text-gray-600">
                    The member's application appears in the Members section with "Pending" status. Admins can review and approve or reject the application.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">4. Admin Decision Notification</h3>
                  <p className="text-sm text-gray-600">
                    Members receive an email notification when their application is approved or rejected. Approved members gain full access to the union platform.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Copy the link and share it via email, text message, or social media</li>
              <li>Generate PDF instructions to print and distribute at meetings or events</li>
              <li>Remind members to check their spam folder for verification emails</li>
              <li>Let members know their application requires admin approval</li>
              <li>Check the Members page regularly to approve new member applications</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
