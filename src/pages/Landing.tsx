import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Brain, Target, Zap, ArrowRight, Star, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import appMockup from "@/assets/app-mockup.png";

const Landing = () => {
  const [isGetStartedLoading, setIsGetStartedLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    // Hide pulse animation after 3 seconds
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleGetStarted = () => {
    setIsGetStartedLoading(true);
    // Optional: Add analytics tracking
    // analytics.track('Clicked Get Started Free');
    
    // Simulate brief loading before redirect
    setTimeout(() => {
      window.location.href = '/signup';
    }, 800);
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Good Tasking</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="hover:bg-primary hover:text-primary-foreground">Dashboard</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-success text-success-foreground hover:bg-primary hover:text-primary-foreground">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">
                <Zap className="h-3 w-3 mr-1" />
                AI-Powered Task Management
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                The first to-do app that{" "}
                <span className="text-primary">builds your perfect day — automatically</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Organize by project, drag into your calendar, and let AI prioritize your tasks hour by hour.
              </p>
              
              {/* Quick Benefits Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 p-6 bg-muted/20 rounded-lg border border-border/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Plan Faster</h3>
                    <p className="text-xs text-muted-foreground">Add tasks and let AI map your day instantly</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Stay Focused</h3>
                    <p className="text-xs text-muted-foreground">Stick to one project at a time</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Syncs with Google Calendar</h3>
                    <p className="text-xs text-muted-foreground">Never miss a beat</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button 
                  size="lg" 
                  className={`px-8 transition-all duration-300 hover:scale-105 hover:bg-success hover:text-success-foreground active:scale-95 ${showPulse ? 'animate-pulse' : ''}`}
                  onClick={handleGetStarted}
                  disabled={isGetStartedLoading}
                  aria-label="Try the AI for free"
                >
                  {isGetStartedLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating your workspace...
                    </>
                  ) : (
                    <>
                      Try the AI Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 transition-all duration-300 hover:scale-105 hover:bg-success hover:text-success-foreground active:scale-95"
                  onClick={scrollToHowItWorks}
                  aria-label="Plan your day with AI"
                >
                  Plan Your Day with AI
                </Button>
              </div>
            </div>

            {/* Right Column - App Mockup */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-border/20 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="bg-muted/30 px-4 py-3 border-b border-border/20 flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center text-sm text-muted-foreground">
                    goodtasking.com
                  </div>
                </div>
                <img 
                  src="/lovable-uploads/4394b170-cd90-4d9c-8558-dc3d0b1f28d0.png" 
                  alt="Good Tasking dashboard showing calendar, tasks organized by project, and daily planning interface"
                  className="w-full h-auto"
                />
              </div>
              {/* Floating elements for visual appeal */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-accent/20 rounded-full animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to transform your productivity
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Create Your Projects</h3>
                <p className="text-muted-foreground">
                  Group tasks by what matters: work, family, side hustles.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Drag Tasks to Days</h3>
                <p className="text-muted-foreground">
                  Visualize your week at a glance. Stay clear and focused.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Let AI Guide You</h3>
                <p className="text-muted-foreground">
                  Each morning, get a smart summary of what to tackle first.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Personal Productivity Assistant
            </h2>
            <p className="text-xl text-muted-foreground">
              AI-powered features that actually help you get things done
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Smart Daily Summaries</h3>
                  <p className="text-muted-foreground">Get AI-powered insights about your day ahead</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Natural Language Task Input</h3>
                  <p className="text-muted-foreground">Just tell the AI what you need to do, and it organizes everything</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Weekly Progress Insights</h3>
                  <p className="text-muted-foreground">Understand your productivity patterns and improve</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Priority Suggestions</h3>
                  <p className="text-muted-foreground">AI analyzes context to recommend what to focus on</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Auto Re-schedule Missed Tasks</h3>
                  <p className="text-muted-foreground">Never lose track of important tasks again</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8 text-center">
              <Brain className="h-24 w-24 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">AI That Understands You</h3>
              <p className="text-muted-foreground">
                Our AI learns your work patterns and helps you stay focused on what matters most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Early Users Are Saying</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real feedback from people using Good Tasking to stay focused and get more done.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur">
              <CardContent className="space-y-4">
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-lg italic leading-relaxed">
                  "This app keeps my head clear. I finally feel like I'm in control of my week."
                </p>
                <div className="flex items-center space-x-3 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                    SL
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah L.</div>
                    <div className="text-xs text-muted-foreground">Copywriter</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur">
              <CardContent className="space-y-4">
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-lg italic leading-relaxed">
                  "It's like having a personal assistant that knows what I should be working on."
                </p>
                <div className="flex items-center space-x-3 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
                    JR
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Jamal R.</div>
                    <div className="text-xs text-muted-foreground">Developer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur">
              <CardContent className="space-y-4">
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-lg italic leading-relaxed">
                  "Every other task app made me feel overwhelmed. This one simplifies everything."
                </p>
                <div className="flex items-center space-x-3 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                    BT
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Beth T.</div>
                    <div className="text-xs text-muted-foreground">Teacher</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave a Testimonial CTA */}
          <div className="text-center">
            <Button variant="outline" className="hover:scale-105 transition-transform duration-200 hover:bg-success hover:text-success-foreground">
              <Star className="mr-2 h-4 w-4" />
              Leave a Testimonial
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 border-2">
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">Free</h3>
                  <p className="text-3xl font-bold mt-2">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Up to 3 projects</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Basic task management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Weekly calendar view</span>
                  </li>
                </ul>
                <Link to="/signup" className="w-full">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 border-primary relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">Pro</h3>
                  <p className="text-3xl font-bold mt-2">$9<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>AI-powered features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Smart daily summaries</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Priority recommendations</span>
                  </li>
                </ul>
                <Link to="/signup" className="w-full">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Less planning. More doing.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of productive people who've found their flow with Good Tasking.
          </p>
          <Link to="/signup">
            <Button size="lg" className="px-12 py-6 text-lg">
              Start Free – No Credit Card Required
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Target className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Good Tasking</span>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <div className="flex items-center space-x-4 text-sm">
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/termsofservice" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                © 2024 Good Tasking. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;