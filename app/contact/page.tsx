'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    role: 'member' as 'executive' | 'member',
    unionName: '',
    localNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        message: '',
        role: 'member',
        unionName: '',
        localNumber: '',
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navbar - Same as info page */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                UnionTab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create my website
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600">
            Have a question? We're here to help. Fill out the form below and we'll get back to you soon.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Send us a message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="name" className="required">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <select
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'executive' | 'member' })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              {/* Union Name (Optional) */}
              <div>
                <Label htmlFor="unionName">Union Name (Optional)</Label>
                <Input
                  id="unionName"
                  type="text"
                  value={formData.unionName}
                  onChange={(e) => setFormData({ ...formData, unionName: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., International Brotherhood of Electrical Workers"
                />
              </div>

              {/* Local Number (Optional) */}
              <div>
                <Label htmlFor="localNumber">Local Number (Optional)</Label>
                <Input
                  id="localNumber"
                  type="text"
                  value={formData.localNumber}
                  onChange={(e) => setFormData({ ...formData, localNumber: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., 123"
                />
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-1"
                  rows={6}
                  placeholder="Tell us how we can help..."
                />
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>

              {/* Success/Error Messages */}
              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">
                    Thank you for your message! We'll get back to you soon.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">
                    Sorry, there was an error sending your message. Please try again later.
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
