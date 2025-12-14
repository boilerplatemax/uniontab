'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import Image from 'next/image';

interface Meeting {
  id: number;
  title: string;
  description: string | null;
  agenda: string | null;
  scheduledDate: Date;
  startTime: string;
  endTime: string | null;
  timezone: string;
  platform: string;
  meetingLink: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
}

interface UnionInfo {
  id: number;
  name: string;
  localNumber: string | null;
  logoUrl: string | null;
  slug: string;
}

interface MeetingPosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting;
  unionInfo: UnionInfo;
}

export function MeetingPosterDialog({ open, onOpenChange, meeting, unionInfo }: MeetingPosterDialogProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return 'Zoom';
      case 'google_meet':
        return 'Google Meet';
      default:
        return 'Video Conference';
    }
  };

  const getTimezoneAbbr = (timezone: string) => {
    const abbrs: Record<string, string> = {
      'America/New_York': 'ET',
      'America/Chicago': 'CT',
      'America/Denver': 'MT',
      'America/Los_Angeles': 'PT',
      'America/Anchorage': 'AKT',
      'Pacific/Honolulu': 'HT',
      'UTC': 'UTC',
    };
    return abbrs[timezone] || timezone;
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Meeting-Poster-${meeting.title.replace(/\s+/g, '-')}`;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }, 100);
  };

  const unionDisplayName = `${unionInfo.name.toUpperCase()}${unionInfo.localNumber ? ` ${unionInfo.localNumber}` : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Meeting Poster</DialogTitle>
          <DialogDescription>
            Print or save as PDF to share with members
          </DialogDescription>
        </DialogHeader>

        {/* Action Button */}
        <div className="flex gap-2 mb-4 print:hidden">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print / Save as PDF
          </Button>
        </div>

        {/* Poster Content */}
        <div className="poster-content bg-white rounded-lg overflow-hidden" style={{ aspectRatio: '8.5/11' }}>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
            {unionInfo.logoUrl && (
              <div className="flex justify-center mb-4">
                <div className="relative w-20 h-20 bg-white rounded-full p-2">
                  <Image
                    src={unionInfo.logoUrl}
                    alt={`${unionInfo.name} Logo`}
                    fill
                    unoptimized
                    className="object-contain p-1"
                    priority
                  />
                </div>
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-wide">
              {unionDisplayName}
            </h1>
            <p className="mt-2 text-blue-100">Online Meeting</p>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {/* Meeting Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {meeting.title}
              </h2>
              {meeting.description && (
                <p className="text-gray-600 max-w-xl mx-auto">
                  {meeting.description}
                </p>
              )}
            </div>

            {/* Date, Time, Platform */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl mb-2">&#128197;</div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Date</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(meeting.scheduledDate)}
                  </p>
                </div>
                <div>
                  <div className="text-4xl mb-2">&#128336;</div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Time</p>
                  <p className="font-semibold text-gray-900">
                    {formatTime(meeting.startTime)}
                    {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                    <span className="text-gray-500 ml-1">({getTimezoneAbbr(meeting.timezone)})</span>
                  </p>
                </div>
                <div>
                  <div className="text-4xl mb-2">&#128187;</div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Platform</p>
                  <p className="font-semibold text-gray-900">
                    {getPlatformName(meeting.platform)}
                  </p>
                </div>
              </div>
            </div>

            {/* Join Info */}
            {meeting.meetingLink && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 text-center">
                <p className="text-sm text-blue-600 uppercase tracking-wide mb-2 font-medium">
                  Join the Meeting
                </p>
                <p className="font-mono text-sm break-all text-gray-700 mb-4">
                  {meeting.meetingLink}
                </p>
                {meeting.meetingId && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Meeting ID:</span> {meeting.meetingId}
                  </p>
                )}
                {meeting.meetingPassword && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Password:</span> {meeting.meetingPassword}
                  </p>
                )}
              </div>
            )}

            {/* Agenda */}
            {meeting.agenda && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                  Agenda
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {meeting.agenda}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto bg-gray-100 px-8 py-4 text-center border-t">
            <p className="text-sm text-gray-600">
              All members are encouraged to attend. For questions, contact union leadership.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              &copy; {new Date().getFullYear()} {unionDisplayName}
            </p>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: letter portrait;
          }

          /* Hide everything except poster content */
          body > *:not([data-radix-portal]) {
            display: none !important;
          }

          [data-radix-portal] > *:not([role="dialog"]) {
            display: none !important;
          }

          [data-radix-overlay],
          [data-radix-dialog-overlay] {
            display: none !important;
          }

          [role="dialog"] {
            position: static !important;
            transform: none !important;
            border: none !important;
            box-shadow: none !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            background: transparent !important;
          }

          [role="dialog"] > *:not(.poster-content) {
            display: none !important;
          }

          .poster-content {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            max-width: 7.5in !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            aspect-ratio: auto !important;
          }

          .poster-content,
          .poster-content * {
            visibility: visible !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Ensure proper font sizes for print */
          .poster-content h1 {
            font-size: 18pt !important;
          }

          .poster-content h2 {
            font-size: 22pt !important;
          }

          .poster-content h3 {
            font-size: 14pt !important;
          }

          .poster-content p {
            font-size: 10pt !important;
          }

          .poster-content .text-4xl {
            font-size: 24pt !important;
          }

          /* Compact spacing for print */
          .poster-content .p-8 {
            padding: 0.4in !important;
          }

          .poster-content .mb-8 {
            margin-bottom: 0.25in !important;
          }

          .poster-content .mb-4 {
            margin-bottom: 0.15in !important;
          }

          .poster-content .gap-6 {
            gap: 0.2in !important;
          }

          a {
            text-decoration: none !important;
            color: inherit !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
