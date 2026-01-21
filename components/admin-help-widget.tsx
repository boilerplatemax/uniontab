'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  HelpCircle,
  LifeBuoy,
  BookOpen,
  MessageSquare,
  Settings,
  Users,
  Mail,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface AdminHelpWidgetProps {
  slug: string;
  isAdmin: boolean;
}

export function AdminHelpWidget({ slug, isAdmin }: AdminHelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render if not admin or not mounted
  if (!isAdmin || !mounted) {
    return null;
  }

  const quickLinks = [
    {
      href: `/${slug}/support`,
      icon: LifeBuoy,
      label: 'Support Tickets',
      description: 'Get help from our team',
      color: 'bg-blue-500',
    },
    {
      href: `/${slug}/help`,
      icon: BookOpen,
      label: 'Help Center',
      description: 'Tutorials & FAQs',
      color: 'bg-green-500',
    },
    {
      href: `/${slug}/settings`,
      icon: Settings,
      label: 'Settings',
      description: 'Configure your union',
      color: 'bg-purple-500',
    },
    {
      href: `/${slug}/members`,
      icon: Users,
      label: 'Members',
      description: 'Manage membership',
      color: 'bg-orange-500',
    },
    {
      href: `/${slug}/mass-email`,
      icon: Mail,
      label: 'Mass Email',
      description: 'Send bulk emails',
      color: 'bg-pink-500',
    },
  ];

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen ? (
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
            aria-label="Open admin help"
            title="Admin Help"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        ) : (
          <Card className="shadow-xl w-80 max-h-[85vh] overflow-hidden flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Admin Help</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                  aria-label="Close admin help"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Support Ticket CTA */}
              <Link href={`/${slug}/support`} onClick={() => setIsOpen(false)}>
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 transition-all">
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="h-8 w-8" />
                    <div>
                      <h4 className="font-semibold">Need Help?</h4>
                      <p className="text-sm text-blue-100">Open a support ticket</p>
                    </div>
                    <ChevronRight className="h-5 w-5 ml-auto" />
                  </div>
                </div>
              </Link>

              {/* Quick Links */}
              <div className="flex-1 overflow-y-auto space-y-2">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Quick Links</p>
                {quickLinks.slice(1).map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`p-2 ${link.color} rounded-lg`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{link.label}</p>
                          <p className="text-xs text-gray-500">{link.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t mt-4">
                <Link href={`/${slug}/help`} onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All Help Resources
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
