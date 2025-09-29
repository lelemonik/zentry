import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="bg-card rounded-xl shadow-soft border border-border p-8">
            <div className="prose max-w-none text-card-foreground leading-relaxed space-y-6">
              
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
                <p>
                  At Zentry, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our productivity platform and related services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-foreground mb-3">Personal Information</h3>
                <p>We may collect personal information that you voluntarily provide to us when you:</p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Register for an account</li>
                  <li>Use our services</li>
                  <li>Contact us for support</li>
                  <li>Subscribe to our newsletter</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3 mt-6">Usage Information</h3>
                <p>We automatically collect certain information when you use our services, including:</p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Device information and identifiers</li>
                  <li>Log data and usage patterns</li>
                  <li>Location information (with your consent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send administrative information and updates</li>
                  <li>Respond to your comments and questions</li>
                  <li>Personalize your experience</li>
                  <li>Monitor usage and detect fraudulent activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Information Sharing</h2>
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Service providers who assist us in operating our platform</li>
                  <li>Legal compliance and protection of rights</li>
                  <li>Business transfers (mergers, acquisitions, etc.)</li>
                  <li>With your explicit consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
                <p>
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Access to your personal information</li>
                  <li>Correction of inaccurate data</li>
                  <li>Deletion of your personal information</li>
                  <li>Objection to processing</li>
                  <li>Data portability</li>
                  <li>Withdrawal of consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies and Tracking</h2>
                <p>
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can manage your cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p><strong>Email:</strong> gaylemonique21@gmail.com</p>
                  <p><strong>Address:</strong> Quezon City, PH</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
