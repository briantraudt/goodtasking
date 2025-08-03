import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Good Tasking. We respect your privacy and are committed to protecting your personal data. 
                  This privacy policy will inform you as to how we look after your personal data when you visit our 
                  website and tell you about your privacy rights and how the law protects you.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We may collect, use, store and transfer different kinds of personal data about you which we have 
                  grouped together as follows:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Identity Data includes first name, last name, username or similar identifier</li>
                  <li>Contact Data includes email address</li>
                  <li>Technical Data includes internet protocol (IP) address, browser type and version</li>
                  <li>Usage Data includes information about how you use our website and services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We will only use your personal data when the law allows us to. Most commonly, we will use your 
                  personal data in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>To provide and maintain our service</li>
                  <li>To notify you about changes to our service</li>
                  <li>To allow you to participate in interactive features when you choose to do so</li>
                  <li>To provide customer support</li>
                  <li>To monitor usage of our service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We have put in place appropriate security measures to prevent your personal data from being 
                  accidentally lost, used or accessed in an unauthorised way, altered or disclosed. We limit access 
                  to your personal data to those employees, agents, contractors and other third parties who have a 
                  business need to know.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Your Legal Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Under certain circumstances, you have rights under data protection laws in relation to your personal data:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Request access to your personal data</li>
                  <li>Request correction of your personal data</li>
                  <li>Request erasure of your personal data</li>
                  <li>Object to processing of your personal data</li>
                  <li>Request restriction of processing your personal data</li>
                  <li>Request transfer of your personal data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@goodtasking.com" className="text-primary hover:underline">
                    privacy@goodtasking.com
                  </a>
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;