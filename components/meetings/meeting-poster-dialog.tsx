'use client';

import { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import Image from 'next/image';
import { getContrastColor, DEFAULT_THEME_COLOR } from '@/lib/utils/color';

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
  themeColor?: string | null;
}

interface MeetingPosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting;
  unionInfo: UnionInfo;
}

export function MeetingPosterDialog({ open, onOpenChange, meeting, unionInfo }: MeetingPosterDialogProps) {
  const posterRef = useRef<HTMLDivElement>(null);

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
    if (!posterRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the poster');
      return;
    }

    const posterContent = posterRef.current.innerHTML;
    const fileName = `Meeting-Poster-${meeting.title.replace(/\s+/g, '-')}`;
    const themeColor = unionInfo.themeColor || DEFAULT_THEME_COLOR;
    const textColor = getContrastColor(themeColor);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            @page {
              margin: 0;
              size: letter portrait;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              margin: 0;
              padding: 0;
            }
            .poster-wrapper {
              width: 100%;
              min-height: 100vh;
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
            }
            .poster-content {
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            .header-banner {
              background: ${themeColor};
              color: ${textColor};
              padding: 1.5rem 2rem;
              text-align: center;
            }
            .logo-container {
              display: flex;
              justify-content: center;
              margin-bottom: 0.75rem;
            }
            .logo-wrapper {
              width: 4rem;
              height: 4rem;
              background: white;
              border-radius: 50%;
              padding: 0.25rem;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-wrapper img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .union-name {
              font-size: 1.25rem;
              font-weight: bold;
              letter-spacing: 0.05em;
            }
            .subtitle {
              margin-top: 0.25rem;
              color: ${textColor};
              opacity: 0.8;
              font-size: 0.875rem;
            }
            .main-content {
              flex: 1;
              padding: 1.25rem 1.5rem;
            }
            .meeting-title-section {
              text-align: center;
              margin-bottom: 1rem;
            }
            .meeting-title {
              font-size: 1.5rem;
              font-weight: bold;
              color: #111827;
              margin-bottom: 0.25rem;
            }
            .meeting-description {
              color: #4b5563;
              font-size: 0.875rem;
              max-width: 32rem;
              margin: 0 auto;
            }
            .info-grid {
              background: #f9fafb;
              border-radius: 0.75rem;
              padding: 1rem;
              margin-bottom: 1rem;
            }
            .info-items {
              display: flex;
              justify-content: space-around;
              text-align: center;
              gap: 0.5rem;
            }
            .info-item {
              flex: 1;
            }
            .info-icon {
              font-size: 1.5rem;
              margin-bottom: 0.25rem;
            }
            .info-label {
              font-size: 0.625rem;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 0.125rem;
            }
            .info-value {
              font-weight: 600;
              color: #111827;
              font-size: 0.75rem;
            }
            .join-section {
              background: ${themeColor}15;
              border: 2px solid ${themeColor}40;
              border-radius: 0.75rem;
              padding: 1rem;
              margin-bottom: 1rem;
              text-align: center;
            }
            .join-label {
              font-size: 0.625rem;
              color: ${themeColor};
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-weight: 500;
              margin-bottom: 0.5rem;
            }
            .join-link {
              font-family: monospace;
              font-size: 0.75rem;
              word-break: break-all;
              color: #374151;
              margin-bottom: 0.5rem;
            }
            .join-details {
              font-size: 0.75rem;
              color: #4b5563;
            }
            .agenda-section {
              margin-bottom: 1rem;
            }
            .agenda-title {
              font-size: 0.875rem;
              font-weight: 600;
              color: #111827;
              margin-bottom: 0.5rem;
              text-align: center;
            }
            .agenda-content {
              background: #f9fafb;
              border-radius: 0.5rem;
              padding: 0.75rem;
            }
            .agenda-text {
              color: #374151;
              white-space: pre-wrap;
              font-size: 0.7rem;
              line-height: 1.4;
            }
            .footer {
              background: #f3f4f6;
              padding: 0.75rem 1.5rem;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              margin-top: auto;
            }
            .footer-text {
              font-size: 0.75rem;
              color: #4b5563;
            }
            .footer-copyright {
              font-size: 0.625rem;
              color: #9ca3af;
              margin-top: 0.25rem;
            }
          </style>
        </head>
        <body>
          <div class="poster-wrapper">
            ${posterContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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

        {/* Poster Content - uses classes that match the print CSS */}
        <div ref={posterRef} className="poster-content bg-white rounded-lg overflow-hidden border">
          {/* Header Banner */}
          <div
            className="header-banner p-6 text-center"
            style={{
              backgroundColor: unionInfo.themeColor || DEFAULT_THEME_COLOR,
              color: getContrastColor(unionInfo.themeColor || DEFAULT_THEME_COLOR)
            }}
          >
            {unionInfo.logoUrl && (
              <div className="logo-container flex justify-center mb-3">
                <div className="logo-wrapper relative w-16 h-16 bg-white rounded-full p-1 flex items-center justify-center">
                  <Image
                    src={unionInfo.logoUrl}
                    alt={`${unionInfo.name} Logo`}
                    width={56}
                    height={56}
                    unoptimized
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            )}
            <h1 className="union-name text-xl font-bold tracking-wide">
              {unionDisplayName}
            </h1>
            <p className="subtitle mt-1 text-sm" style={{ opacity: 0.8 }}>Online Meeting</p>
          </div>

          {/* Main Content */}
          <div className="main-content p-5">
            {/* Meeting Title */}
            <div className="meeting-title-section text-center mb-4">
              <h2 className="meeting-title text-2xl font-bold text-gray-900 mb-1">
                {meeting.title}
              </h2>
              {meeting.description && (
                <p className="meeting-description text-gray-600 max-w-xl mx-auto text-sm">
                  {meeting.description}
                </p>
              )}
            </div>

            {/* Date, Time, Platform */}
            <div className="info-grid bg-gray-50 rounded-xl p-4 mb-4">
              <div className="info-items grid grid-cols-3 gap-4 text-center">
                <div className="info-item">
                  <div className="info-icon text-2xl mb-1">📅</div>
                  <p className="info-label text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="info-value font-semibold text-gray-900 text-sm">
                    {formatDate(meeting.scheduledDate)}
                  </p>
                </div>
                <div className="info-item">
                  <div className="info-icon text-2xl mb-1">🕐</div>
                  <p className="info-label text-xs text-gray-500 uppercase tracking-wide">Time</p>
                  <p className="info-value font-semibold text-gray-900 text-sm">
                    {formatTime(meeting.startTime)}
                    {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                    <span className="text-gray-500 ml-1">({getTimezoneAbbr(meeting.timezone)})</span>
                  </p>
                </div>
                <div className="info-item">
                  <div className="info-icon text-2xl mb-1">💻</div>
                  <p className="info-label text-xs text-gray-500 uppercase tracking-wide">Platform</p>
                  <p className="info-value font-semibold text-gray-900 text-sm">
                    {getPlatformName(meeting.platform)}
                  </p>
                </div>
              </div>
            </div>

            {/* Join Info */}
            {meeting.meetingLink && (
              <div
                className="join-section rounded-xl p-4 mb-4 text-center"
                style={{
                  backgroundColor: `${unionInfo.themeColor || DEFAULT_THEME_COLOR}15`,
                  border: `2px solid ${unionInfo.themeColor || DEFAULT_THEME_COLOR}40`
                }}
              >
                <p
                  className="join-label text-xs uppercase tracking-wide mb-2 font-medium"
                  style={{ color: unionInfo.themeColor || DEFAULT_THEME_COLOR }}
                >
                  Join the Meeting
                </p>
                <p className="join-link font-mono text-sm break-all text-gray-700 mb-2">
                  {meeting.meetingLink}
                </p>
                <div className="join-details">
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
              </div>
            )}

            {/* Agenda - compact for long agendas */}
            {meeting.agenda && (
              <div className="agenda-section mb-4">
                <h3 className="agenda-title text-base font-semibold text-gray-900 mb-2 text-center">
                  Agenda
                </h3>
                <div className="agenda-content bg-gray-50 rounded-lg p-3">
                  <p className="agenda-text text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">
                    {meeting.agenda}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer bg-gray-100 px-6 py-3 text-center border-t">
            <p className="footer-text text-sm text-gray-600">
              All members are encouraged to attend. For questions, contact union leadership.
            </p>
            <p className="footer-copyright text-xs text-gray-400 mt-1">
              © {new Date().getFullYear()} {unionDisplayName}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
