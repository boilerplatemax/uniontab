'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, X, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface Receipt {
  id: number;
  receiptNumber: string;
  amount: number;
  generatedAt: Date;
  dues: {
    amount: number;
    dueDate: Date;
    paymentMethod: string | null;
    checkNumber: string | null;
    paidDate: Date | null;
    notes: string | null;
  };
  member: {
    user: {
      name: string;
      email: string;
    };
    memberId: string | null;
  };
  union: {
    name: string;
    localNumber: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    logoUrl: string | null;
  };
  generatedBy: {
    name: string;
  };
}

interface ReceiptViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: Receipt | null;
}

export function ReceiptViewerDialog({ open, onOpenChange, receiptData }: ReceiptViewerDialogProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    showAddress: true,
    showEmail: true,
    showPhone: true,
    showRecordedBy: true,
  });

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountInCents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const capitalizeUnionName = (name: string) => {
    // Common union acronyms that should be all caps
    const acronyms = ['atu', 'uaw', 'ufcw', 'seiu', 'afscme', 'ibew', 'iam', 'ue', 'usw', 'cwa', 'aft', 'nea'];

    const words = name.split(' ');
    return words.map(word => {
      const lowerWord = word.toLowerCase();
      if (acronyms.includes(lowerWord)) {
        return word.toUpperCase();
      }
      return word;
    }).join(' ');
  };

  const handlePrint = () => {
    // Update document title for print
    const originalTitle = document.title;
    document.title = `Receipt-${receiptData?.receiptNumber}`;

    setTimeout(() => {
      window.print();
      // Restore original title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }, 100);
  };

  if (!receiptData) {
    return null;
  }

  const displayUnionName = capitalizeUnionName(receiptData.union.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>
            Receipt #{receiptData.receiptNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4 print:hidden">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print / Save as PDF
          </Button>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Print Settings
          </Button>
        </div>

        {/* Print Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50 print:hidden">
            <h3 className="font-semibold mb-3">Choose what to include in print:</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-address"
                  checked={printSettings.showAddress}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showAddress: checked })
                  }
                />
                <Label htmlFor="show-address">Union Address</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-email"
                  checked={printSettings.showEmail}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showEmail: checked })
                  }
                />
                <Label htmlFor="show-email">Union Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-phone"
                  checked={printSettings.showPhone}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showPhone: checked })
                  }
                />
                <Label htmlFor="show-phone">Union Phone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-recorded-by"
                  checked={printSettings.showRecordedBy}
                  onCheckedChange={(checked) =>
                    setPrintSettings({ ...printSettings, showRecordedBy: checked })
                  }
                />
                <Label htmlFor="show-recorded-by">Recorded By</Label>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Content */}
        <div className="receipt-content bg-white p-8 border border-gray-200 rounded-lg">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            {receiptData.union.logoUrl && (
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24">
                  <Image
                    src={receiptData.union.logoUrl}
                    alt={`${displayUnionName} Logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {displayUnionName}
            </h1>
            {receiptData.union.localNumber && (
              <p className="text-gray-600">Local {receiptData.union.localNumber}</p>
            )}
            {printSettings.showAddress && receiptData.union.address && (
              <p className="text-sm text-gray-600">{receiptData.union.address}</p>
            )}
            <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
              {printSettings.showPhone && receiptData.union.phone && <span>{receiptData.union.phone}</span>}
              {printSettings.showEmail && receiptData.union.email && <span>{receiptData.union.email}</span>}
            </div>
          </div>

          {/* Receipt Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">PAYMENT RECEIPT</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Receipt #: <span className="font-semibold">{receiptData.receiptNumber}</span></p>
              <p>Date Issued: <span className="font-semibold">{formatDate(receiptData.generatedAt)}</span></p>
            </div>
          </div>

          <hr className="my-6 border-gray-300" />

          {/* Member Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Received From:</h3>
            <div className="space-y-1 text-gray-700">
              <p className="font-medium">{receiptData.member.user.name}</p>
              {receiptData.member.memberId && (
                <p className="text-sm">Member ID: {receiptData.member.memberId}</p>
              )}
              <p className="text-sm">{receiptData.member.user.email}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details:</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold text-xl">{formatCurrency(receiptData.amount)}</span>
              </div>
              {receiptData.dues.paymentMethod && (
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">{receiptData.dues.paymentMethod.replace('_', ' ')}</span>
                </div>
              )}
              {receiptData.dues.paidDate && (
                <div className="flex justify-between">
                  <span>Payment Date:</span>
                  <span className="font-medium">{formatDate(receiptData.dues.paidDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Period Covered:</span>
                <span className="font-medium">{formatDate(receiptData.dues.dueDate)}</span>
              </div>
              {receiptData.dues.checkNumber && (
                <div className="flex justify-between">
                  <span>Check/Reference #:</span>
                  <span className="font-medium">{receiptData.dues.checkNumber}</span>
                </div>
              )}
            </div>
          </div>

          <hr className="my-6 border-gray-300" />

          {/* PAID Stamp */}
          <div className="text-center my-8">
            <div className="inline-block border-4 border-green-600 rounded-lg px-12 py-6">
              <p className="text-4xl font-bold text-green-600">PAID</p>
            </div>
          </div>

          <hr className="my-6 border-gray-300" />

          {/* Footer Information */}
          <div className="space-y-2 text-sm text-gray-600">
            {printSettings.showRecordedBy && (
              <>
                <div className="flex justify-between">
                  <span>Recorded By:</span>
                  <span>{receiptData.generatedBy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date Recorded:</span>
                  <span>{formatDate(receiptData.generatedAt)}</span>
                </div>
              </>
            )}
            {receiptData.dues.notes && (
              <div className="mt-4">
                <p className="font-semibold mb-1">Notes:</p>
                <p className="text-gray-700">{receiptData.dues.notes}</p>
              </div>
            )}
          </div>

          <hr className="my-6 border-gray-300" />

          {/* Thank You Message */}
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p className="font-medium">Thank you for your continued membership and support!</p>
            <p>This receipt is valid for your records.</p>
            {printSettings.showEmail && receiptData.union.email && (
              <p>For questions, contact us at {receiptData.union.email}</p>
            )}
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: letter;
          }

          /* Hide everything except receipt */
          body > *:not(#__next) {
            display: none !important;
          }

          /* Hide all dialogs and overlays */
          [role="dialog"],
          [data-radix-portal],
          .fixed,
          .absolute {
            position: static !important;
          }

          /* Hide dialog chrome */
          .print\\:hidden,
          button,
          [aria-hidden="true"] {
            display: none !important;
          }

          /* Make receipt content visible and properly positioned */
          .receipt-content {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1rem !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          .receipt-content * {
            visibility: visible !important;
          }

          /* Ensure images print */
          .receipt-content img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Remove any links from printing */
          a[href]:after {
            content: "" !important;
          }

          a {
            text-decoration: none !important;
            color: inherit !important;
          }

          /* Ensure colors print */
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Hide page URL in footer */
          @page {
            @bottom-right {
              content: none;
            }
            @bottom-left {
              content: none;
            }
            @bottom-center {
              content: none;
            }
          }
        }
      `}</style>
    </Dialog>
  );
}
