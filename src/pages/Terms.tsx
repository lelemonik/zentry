import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="bg-card rounded-xl shadow-soft border border-border p-8">
            <div className="prose max-w-none text-card-foreground leading-relaxed space-y-6">
              
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptance of Terms</h2>
                <p>
                  By accessing and using Zentry ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Description of Service</h2>
                <p>
                  Zentry is a productivity platform that provides task management, note-taking, scheduling, and organizational tools to help users streamline their workflow and achieve their goals.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">User Accounts</h2>
                <p>
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">User Content</h2>
                <p>
                  You retain all rights to the content you create using Zentry, including tasks, notes, schedules, and other data. However, you grant us certain rights to provide our services:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>We may store and sync your content across your devices</li>
                  <li>We may process your content to provide search and organizational features</li>
                  <li>We may create backups of your content for data protection</li>
                  <li>You are responsible for the content you create and share</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptable Use</h2>
                <p>You agree not to use Zentry to:</p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Upload malicious code or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the service for spam or harassment</li>
                  <li>Reverse engineer or attempt to extract our source code</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Service Availability</h2>
                <p>
                  We strive to maintain high availability but cannot guarantee uninterrupted service. We may temporarily suspend the service for maintenance, updates, or other operational reasons. We are not liable for any downtime or service interruptions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Privacy and Data Protection</h2>
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Intellectual Property</h2>
                <p>
                  The Zentry service, including its design, functionality, and underlying technology, is owned by us and protected by copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
                <p>
                  In no event shall Zentry or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use Zentry, even if we have been notified of the possibility of such damage.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Termination</h2>
                <p>
                  We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Governing Law</h2>
                <p>
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which our company is incorporated, without regard to conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us:
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

export default TermsOfService;
