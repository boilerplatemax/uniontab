'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  BookOpen,
  Mail,
  FileText,
  Video,
  Users,
  Settings,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
} from 'lucide-react';
import type { Union, Member, User } from '@/lib/db/schema';

interface HelpContentProps {
  union: Union;
  membership: { user: User; member: Member } | null;
  handleSignOut: () => Promise<void>;
  slug: string;
  navigationItems?: any[];
}

const tutorials = [
  {
    id: 'how-to-send-bulk-emails',
    title: 'How to Send Bulk Emails to Members',
    description: 'Learn how to efficiently communicate with your entire membership using the bulk email feature.',
    icon: Mail,
    readTime: '5 min read',
  },
  {
    id: 'uploading-files-and-creating-posts',
    title: 'Sharing Files & Posts: Public vs Private',
    description: 'Understand the difference between public and private content and learn how to share documents and updates effectively.',
    icon: FileText,
    readTime: '7 min read',
  },
  {
    id: 'zoom-meetings-and-posters',
    title: 'Schedule Zoom Meetings & Create Posters',
    description: 'Learn how to schedule virtual meetings, automatically generate promotional posters, and invite your members.',
    icon: Video,
    readTime: '8 min read',
  },
];

const faqs = [
  {
    question: 'How do I add new members to my union?',
    answer: 'Members can join by visiting your union page and signing up. You can also send email invites from the Members section. Once they sign up, you can approve their membership from the pending members list.',
  },
  {
    question: 'How do I change my union\'s theme or colors?',
    answer: 'Go to Settings from your dashboard sidebar. In the Appearance section, you can select a theme (Classic, Modern, or Prestige) and customize your brand color. The Prestige theme requires a paid plan.',
  },
  {
    question: 'Can I make some content visible only to members?',
    answer: 'Yes! When creating posts, files, or events, you can toggle the "Members Only" or "Private" option. This ensures only logged-in and approved members can see that content.',
  },
  {
    question: 'How do I set up dues tracking?',
    answer: 'Navigate to Dues from your dashboard. You can create dues cycles, set amounts and due dates, and track payments for each member. You can also generate receipts and send payment reminders.',
  },
  {
    question: 'How do I run an election or survey?',
    answer: 'Go to Elections in your dashboard and click "Create Election." You can add various question types including multiple choice, ranking, and yes/no questions. Set open/close times and manage voter eligibility.',
  },
  {
    question: 'How can I send mass emails or SMS to members?',
    answer: 'From Communications, select "Send Email" or "Send SMS." You can choose to send to all members, specific groups, or hand-pick recipients. Note: SMS requires a paid plan and member phone numbers.',
  },
  {
    question: 'How do I give another member admin access?',
    answer: 'Go to Members, find the member you want to promote, click on their profile, and change their role to "Admin." You can also customize which specific permissions they have access to.',
  },
  {
    question: 'Can members file grievances through UnionTab?',
    answer: 'Yes! The Grievances feature allows members to submit grievances, attach documents, and track the status. Admins can assign grievances to stewards and manage the resolution process.',
  },
];

export function HelpContent({
  union,
  membership,
  handleSignOut,
  slug,
  navigationItems,
}: HelpContentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        navigationItems={navigationItems}
      />
      <NavbarSpacer />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          </div>
          <p className="text-gray-600">
            Find tutorials, FAQs, and support resources to help you manage your union effectively.
          </p>
        </div>

        {/* Support Ticket Highlight */}
        <Link href={`/${slug}/support`}>
          <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 rounded-xl">
                  <LifeBuoy className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Need Personalized Help?</h3>
                  <p className="text-gray-600">Submit a support ticket and our team will assist you directly with any questions or issues.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Support Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href={`/${slug}/settings`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-600">Configure your union</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${slug}/members`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Members</h3>
                  <p className="text-sm text-gray-600">Manage your members</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tutorials Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Tutorials & Guides
            </CardTitle>
            <CardDescription>
              Step-by-step instructions for using UnionTab features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tutorials.map((tutorial) => {
                const Icon = tutorial.icon;
                return (
                  <Link
                    key={tutorial.id}
                    href={`/blogs/${tutorial.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-2 border-transparent hover:border-blue-200">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                              {tutorial.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {tutorial.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                              <span>{tutorial.readTime}</span>
                              <ExternalLink className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQs Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-8 text-center">
            <LifeBuoy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Still need help?
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Can't find the answer you're looking for? Submit a support ticket and our team will get back to you as soon as possible.
            </p>
            <Link href={`/${slug}/support`}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
