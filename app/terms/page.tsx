import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-sm text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using UnionTab ("the Service", "Platform", or "Application"), you accept and agree to be
                bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
              <p className="text-gray-700">
                UnionTab provides a digital platform for labor unions and their members to communicate, share information,
                organize events, conduct elections, and manage union activities. The Service is provided "as is" and
                "as available" without warranties of any kind.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You must be at least 18 years old to create an account</li>
                <li>One person may not maintain multiple accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Upload or transmit viruses, malware, or other harmful code</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Spam or send unsolicited communications</li>
                <li>Attempt to gain unauthorized access to the Service or other user accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Scrape, crawl, or extract data from the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. User Content</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You retain ownership of content you post on the Platform</li>
                <li>By posting content, you grant us a license to use, display, and distribute that content within the Service</li>
                <li>You are solely responsible for the content you post</li>
                <li>We reserve the right to remove any content that violates these Terms or is otherwise objectionable</li>
                <li>You represent that you have the right to post the content and that it does not violate any laws or third-party rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700">
                The Service, including its original content, features, and functionality, is owned by UnionTab and is
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                You may not copy, modify, distribute, sell, or lease any part of our Service without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data and Privacy</h2>
              <p className="text-gray-700">
                Your use of the Service is also governed by our Privacy Policy. We do not sell your personal data to third parties.
                Please review our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> to
                understand how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-gray-800 font-semibold">IMPORTANT LIMITATION</p>
              </div>
              <p className="text-gray-700 mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>The Service is provided "AS IS" and "AS AVAILABLE"</strong> without warranties of any kind,
                  either express or implied, including but not limited to warranties of merchantability, fitness for a
                  particular purpose, or non-infringement
                </li>
                <li>
                  <strong>We do not guarantee</strong> that the Service will be uninterrupted, secure, or error-free
                </li>
                <li>
                  <strong>We are not responsible for data loss</strong> - You should maintain your own backups of
                  important information
                </li>
                <li>
                  <strong>We shall not be liable</strong> for any indirect, incidental, special, consequential, or
                  punitive damages, including loss of profits, data, use, or other intangible losses
                </li>
                <li>
                  <strong>Our total liability</strong> to you for any claims arising from your use of the Service
                  shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or $100,
                  whichever is greater
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify, defend, and hold harmless UnionTab, its officers, directors, employees, and agents
                from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising
                from your use of the Service, your violation of these Terms, or your violation of any rights of another party.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We may terminate or suspend your account at any time, with or without notice, for any reason</li>
                <li>You may terminate your account at any time through account settings</li>
                <li>Upon termination, your right to use the Service will immediately cease</li>
                <li>We are not liable for any loss or damage resulting from termination</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Payment and Subscriptions</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Some features of the Service may require payment</li>
                <li>You agree to pay all fees associated with your subscription</li>
                <li>Subscription fees are non-refundable except as required by law</li>
                <li>We reserve the right to change pricing with reasonable notice</li>
                <li>Failure to pay may result in suspension or termination of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Third-Party Services</h2>
              <p className="text-gray-700">
                The Service may contain links to third-party websites or services. We are not responsible for the content,
                privacy policies, or practices of third-party sites. You access third-party services at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Dispute Resolution</h2>
              <p className="text-gray-700 mb-3">
                In the event of any dispute arising from these Terms or your use of the Service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You agree to first attempt to resolve the dispute informally by contacting us</li>
                <li>Any unresolved disputes shall be governed by the laws of the jurisdiction where UnionTab operates</li>
                <li>You agree to resolve disputes through binding arbitration or small claims court, rather than through class actions or jury trials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by
                posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the
                Service after changes become effective constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited
                or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">16. Entire Agreement</h2>
              <p className="text-gray-700">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and UnionTab
                regarding the Service and supersede all prior agreements and understandings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">17. Contact Information</h2>
              <p className="text-gray-700">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p className="text-gray-700">
                  Email: <a href="mailto:support@uniontab.com" className="text-blue-600 hover:underline">support@uniontab.com</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
