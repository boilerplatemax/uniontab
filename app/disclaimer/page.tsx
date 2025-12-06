import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DisclaimerPage() {
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
          <h1 className="text-4xl font-bold text-gray-900">Disclaimer</h1>
          <p className="text-sm text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">General Information</h2>
              <p className="text-gray-700">
                The information provided by UnionTab ("we," "us," or "our") on our platform is for general informational
                purposes only. All information on the platform is provided in good faith; however, we make no representation
                or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability,
                availability, or completeness of any information on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">No Professional Advice</h2>
              <p className="text-gray-700 mb-3">
                UnionTab is a communication and organizational platform for labor unions. The content available through
                the Service should not be construed as:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Legal advice or counsel</li>
                <li>Financial or investment advice</li>
                <li>Employment or labor law advice</li>
                <li>Professional consultation of any kind</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Always seek the advice of qualified professionals for specific questions related to your situation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">User-Generated Content</h2>
              <p className="text-gray-700">
                Content posted by union administrators, members, or other users represents their own views and opinions.
                UnionTab does not endorse, verify, or assume responsibility for user-generated content. We are not liable
                for any statements, representations, or content provided by users of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Service Availability</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-gray-800 font-semibold">IMPORTANT NOTICE</p>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>No Guarantee of Uptime:</strong> We do not guarantee that the platform will be available
                  at all times. The Service may experience downtime for maintenance, updates, or technical issues
                </li>
                <li>
                  <strong>Interruptions:</strong> We are not liable for any disruption, interruption, or unavailability
                  of the Service
                </li>
                <li>
                  <strong>Data Loss:</strong> While we implement reasonable backup procedures, we cannot guarantee
                  against data loss. Users are responsible for maintaining their own backups of critical information
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 mb-3">
                UNDER NO CIRCUMSTANCES SHALL UNIONTAB BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Any direct, indirect, incidental, consequential, or punitive damages</li>
                <li>Loss of data, revenue, profits, or business opportunities</li>
                <li>System failures, security breaches, or unauthorized access</li>
                <li>Errors, mistakes, or inaccuracies in content</li>
                <li>Personal injury or property damage resulting from use of the Service</li>
                <li>Actions or inactions of other users</li>
                <li>Any bugs, viruses, or harmful code transmitted through the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">External Links</h2>
              <p className="text-gray-700">
                The platform may contain links to external websites or resources. These links are provided for convenience
                only. We have no control over and assume no responsibility for the content, privacy policies, or practices
                of third-party sites or services. You acknowledge and agree that we shall not be liable for any damage or
                loss caused by use of or reliance on any content, goods, or services available through external sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Election and Voting Disclaimer</h2>
              <p className="text-gray-700">
                UnionTab provides electronic voting and election tools as a convenience. However:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Unions are responsible for ensuring elections comply with applicable laws and union bylaws</li>
                <li>We do not guarantee the security, integrity, or accuracy of election results</li>
                <li>Unions should implement their own verification and validation procedures</li>
                <li>We are not responsible for disputed elections or voting irregularities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Security Disclaimer</h2>
              <p className="text-gray-700">
                While we implement industry-standard security measures to protect user data, no system is completely secure.
                We cannot guarantee that unauthorized access, hacking, data loss, or other security breaches will never occur.
                You are responsible for maintaining the security of your account credentials and for any activity that occurs
                under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Email Communications</h2>
              <p className="text-gray-700">
                UnionTab provides email communication tools for unions to contact their members. Users of these tools are
                responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Complying with anti-spam laws and regulations</li>
                <li>Obtaining proper consent before sending communications</li>
                <li>The content and accuracy of messages sent</li>
                <li>Providing opt-out mechanisms as required by law</li>
              </ul>
              <p className="text-gray-700 mt-3">
                We are not responsible for how union administrators use the email communication features or for the
                content of messages sent through the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Accuracy of Information</h2>
              <p className="text-gray-700">
                UnionTab makes no representations about the accuracy or completeness of information posted by unions or
                members. Information may be outdated, incomplete, or inaccurate. Users should verify important information
                through independent sources.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Changes to Disclaimer</h2>
              <p className="text-gray-700">
                We reserve the right to modify this disclaimer at any time. Changes will be posted on this page with an
                updated "Last Updated" date. Your continued use of the Service constitutes acceptance of any changes to
                this disclaimer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Acknowledgment</h2>
              <p className="text-gray-700">
                BY USING UNIONTAB, YOU ACKNOWLEDGE THAT YOU HAVE READ THIS DISCLAIMER AND AGREE TO ALL ITS TERMS AND
                CONDITIONS. IF YOU DO NOT AGREE WITH ANY PART OF THIS DISCLAIMER, YOU MUST NOT USE THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this disclaimer, please contact us at:
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
