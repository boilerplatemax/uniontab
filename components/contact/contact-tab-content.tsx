'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock, Settings, Users, Plus } from 'lucide-react';
import { EditContactInfoDialog } from './edit-contact-info-dialog';
import { ExecutiveList } from './executive-list';
import { ContactForm } from './contact-form';
import type { Union, UnionContactInfo, UnionExecutive } from '@/lib/db/schema';

interface ContactTabContentProps {
  union: Union;
  isOwner: boolean;
}

export function ContactTabContent({ union, isOwner }: ContactTabContentProps) {
  const [contactInfo, setContactInfo] = useState<UnionContactInfo | null>(null);
  const [executives, setExecutives] = useState<UnionExecutive[]>([]);
  const [loading, setLoading] = useState(true);
  const [editContactOpen, setEditContactOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [contactRes, execRes] = await Promise.all([
        fetch('/api/contact-info/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unionId: union.id }),
        }),
        fetch('/api/executives/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unionId: union.id }),
        }),
      ]);

      if (contactRes.ok) {
        const contactData = await contactRes.json();
        setContactInfo(contactData.contactInfo);
      }

      if (execRes.ok) {
        const execData = await execRes.json();
        setExecutives(execData.executives);
      }
    } catch (error) {
      console.error('Error fetching contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [union.id]);

  const handleContactInfoUpdate = () => {
    fetchData();
    setEditContactOpen(false);
  };

  const handleExecutivesChange = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const hasContactInfo = contactInfo?.contactEmail || contactInfo?.contactPhone ||
                         contactInfo?.contactAddress || contactInfo?.officeHours;
  const contactFormEnabled = contactInfo?.contactFormEnabled ?? true;

  return (
    <div className="space-y-6">
      {/* Edit Button for Owners */}
      {isOwner && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setEditContactOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Contact Settings
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasContactInfo ? (
              <div className="space-y-4">
                {contactInfo?.contactEmail && (
                  <a
                    href={`mailto:${contactInfo.contactEmail}`}
                    className="flex items-start gap-3 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{contactInfo.contactEmail}</span>
                  </a>
                )}
                {contactInfo?.contactPhone && (
                  <a
                    href={`tel:${contactInfo.contactPhone}`}
                    className="flex items-start gap-3 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{contactInfo.contactPhone}</span>
                  </a>
                )}
                {contactInfo?.contactAddress && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="whitespace-pre-line">{contactInfo.contactAddress}</span>
                  </div>
                )}
                {contactInfo?.officeHours && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="whitespace-pre-line">{contactInfo.officeHours}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">
                {isOwner
                  ? 'No contact information set. Click "Edit Contact Settings" to add your contact details.'
                  : 'Contact information coming soon.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contact Form */}
        {contactFormEnabled && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm unionId={union.id} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Executive Team */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Our Leadership Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutiveList
            unionId={union.id}
            executives={executives}
            isOwner={isOwner}
            onExecutivesChange={handleExecutivesChange}
          />
        </CardContent>
      </Card>

      {/* Edit Contact Info Dialog */}
      <EditContactInfoDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        unionId={union.id}
        contactInfo={contactInfo}
        onSuccess={handleContactInfoUpdate}
      />
    </div>
  );
}
