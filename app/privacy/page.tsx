import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-700">
                Welcome to UnionTab. We respect your privacy and are committed to protecting your personal data.
                This privacy policy explains how we collect, use, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
              <p className="text-gray-700 mb-3">We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                <li><strong>Union Information:</strong> Union name, local number, and organizational details</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and login activity</li>
                <li><strong>Communications:</strong> Messages, posts, and other content you create within the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>To provide and maintain our services</li>
                <li>To authenticate users and secure accounts</li>
                <li>To communicate with you about your account and our services</li>
                <li>To send important notifications and updates</li>
                <li>To improve our platform and develop new features</li>
                <li>To ensure compliance with our Terms of Service</li>
                <li>To prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-3">
                <strong>We do not sell your personal data to third parties.</strong> We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Within Your Union:</strong> Information you share within your union portal is visible to other approved members and administrators of that union</li>
                <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist in operating our platform (e.g., hosting, email delivery, payment processing)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law, court order, or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate technical and organizational security measures to protect your personal data.
                However, no method of transmission over the internet or electronic storage is 100% secure.
                While we strive to protect your information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal data for as long as necessary to provide our services and fulfill the purposes
                outlined in this privacy policy. When you delete your account, we will remove or anonymize your personal
                information, except where we are required by law to retain certain data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Withdrawal:</strong> Withdraw consent at any time where we rely on consent</li>
              </ul>
              <p className="text-gray-700 mt-3">
                To exercise these rights, please contact your union administrator or email us at support@uniontab.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to maintain your session, remember your preferences,
                and analyze platform usage. You can control cookies through your browser settings, but disabling cookies
                may affect platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal
                information from children. If we become aware that we have collected data from a child, we will take
                steps to delete such information promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any material changes by
                posting the new policy on this page and updating the "Last Updated" date. Your continued use of our
                services after such changes constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this privacy policy or our data practices, please contact us at:
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
