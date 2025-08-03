import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using Good Tasking, you accept and agree to be bound by the terms and provision 
                  of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Use License</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Permission is granted to temporarily use Good Tasking for personal, non-commercial transitory 
                  viewing only. This is the grant of a license, not a transfer of title, and under this license 
                  you may not:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When you create an account with us, you must provide information that is accurate, complete, and 
                  current at all times. You are responsible for safeguarding the password and for all activities 
                  that occur under your account.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to refuse service, terminate accounts, or cancel orders in our sole discretion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You may not use our service:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Service Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to withdraw or amend our service, and any service or material we provide 
                  via the website, in our sole discretion without notice. We will not be liable if for any reason 
                  all or any part of the service is unavailable at any time or for any period.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The information on this website is provided on an 'as is' basis. To the fullest extent permitted 
                  by law, Good Tasking excludes all representations, warranties, conditions and terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In no event shall Good Tasking or its suppliers be liable for any damages (including, without 
                  limitation, damages for loss of data or profit, or due to business interruption) arising out of 
                  the use or inability to use the materials on Good Tasking's website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Revisions and Errata</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The materials appearing on Good Tasking's website could include technical, typographical, or 
                  photographic errors. Good Tasking does not warrant that any of the materials on its website are 
                  accurate, complete, or current.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@goodtasking.com" className="text-primary hover:underline">
                    legal@goodtasking.com
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

export default TermsOfService;