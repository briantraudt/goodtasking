import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock3,
  FolderKanban,
  Loader2,
  Target,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import appMockup from "@/assets/app-mockup.png";

const pillars = [
  {
    icon: FolderKanban,
    title: "See every software project in one place",
    description:
      "Track client work, product ideas, bugs, launches, and admin tasks without bouncing between tools.",
  },
  {
    icon: Clock3,
    title: "Know what your time should go toward today",
    description:
      "Turn an overwhelming backlog into a realistic plan for this morning, this afternoon, and this week.",
  },
  {
    icon: Brain,
    title: "Start each day with a clear next move",
    description:
      "Use AI when you want help organizing priorities, protecting focus time, and keeping important work from slipping.",
  },
];

const workflow = [
  {
    title: "Capture your projects",
    description:
      "Set up active software projects, side work, maintenance tasks, and life admin in one workspace.",
  },
  {
    title: "Choose what matters now",
    description:
      "Pull the next important tasks into today so your backlog becomes a focused plan instead of a stress pile.",
  },
  {
    title: "Work from one morning dashboard",
    description:
      "Open Good Tasking, see your priorities, and move straight into execution with less deciding and less context switching.",
  },
];

const features = [
  "Project-based task management built for people juggling multiple software efforts",
  "A morning planning flow that helps you decide what to tackle first",
  "Weekly scheduling so important work has a home on the calendar",
  "AI summaries and suggestions when you want help sorting priorities",
  "Google Calendar sync to keep meetings and focused work in the same view",
  "Natural-language task capture for getting ideas out of your head quickly",
];

const Landing = () => {
  const [isGetStartedLoading, setIsGetStartedLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById("how-it-works");
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleGetStarted = () => {
    setIsGetStartedLoading(true);

    setTimeout(() => {
      window.location.href = "/signup";
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Target className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Good Tasking</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="hover:bg-primary hover:text-primary-foreground">
                Dashboard
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-success text-success-foreground hover:bg-primary hover:text-primary-foreground">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute right-0 top-0 h-1/3 w-1/3 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-1/4 w-1/4 rounded-full bg-gradient-to-tr from-accent/10 to-transparent blur-3xl" />

        <div className="container relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">
                <Zap className="mr-1 h-3 w-3" />
                Daily planning for builders and busy operators
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Run your projects and
                <span className="text-primary"> know exactly what to work on every morning</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Good Tasking is your daily command center for software projects, priorities, and time. Open it in the morning and get a clear plan for what matters today.
              </p>

              <div className="my-8 grid grid-cols-1 gap-4 rounded-lg border border-border/20 bg-muted/20 p-6 sm:grid-cols-3">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Plan Faster</h3>
                    <p className="text-xs text-muted-foreground">Turn a messy backlog into a clear daily plan</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Stay Oriented</h3>
                    <p className="text-xs text-muted-foreground">See projects, tasks, and time in one place</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Sync Your Calendar</h3>
                    <p className="text-xs text-muted-foreground">Keep meetings and focused work in the same view</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className={`px-8 transition-all duration-300 hover:scale-105 hover:bg-success hover:text-success-foreground active:scale-95 ${showPulse ? "animate-pulse" : ""}`}
                  onClick={handleGetStarted}
                  disabled={isGetStartedLoading}
                  aria-label="Create your workspace"
                >
                  {isGetStartedLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating your workspace...
                    </>
                  ) : (
                    <>
                      Start Planning My Day
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 transition-all duration-300 hover:scale-105 hover:bg-success hover:text-success-foreground active:scale-95"
                  onClick={scrollToHowItWorks}
                  aria-label="See how Good Tasking works"
                >
                  See How It Works
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-border/20 bg-white shadow-2xl transition-transform duration-300 hover:rotate-0 lg:rotate-1">
                <div className="flex items-center space-x-2 border-b border-border/20 bg-muted/30 px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center text-sm text-muted-foreground">goodtasking.com</div>
                </div>
                <img
                  src={appMockup}
                  alt="Good Tasking dashboard showing calendar, tasks organized by project, and daily planning interface"
                  className="h-auto w-full"
                />
              </div>
              <div className="absolute -right-4 -top-4 h-8 w-8 animate-pulse rounded-full bg-primary/20" />
              <div className="absolute -bottom-6 -left-6 h-12 w-12 animate-pulse rounded-full bg-accent/20 delay-1000" />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              A simple rhythm for staying on top of your work
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {workflow.map((step, index) => (
              <Card key={step.title} className="p-6 text-center transition-shadow hover:shadow-lg">
                <CardContent className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Built around the real job to be done</h2>
            <p className="text-xl text-muted-foreground">
              Good Tasking works best when it answers three questions fast.
            </p>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-6">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;

                return (
                  <div key={pillar.title} className="flex items-start space-x-3">
                    <Icon className="mt-1 h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">{pillar.title}</h3>
                      <p className="text-muted-foreground">{pillar.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-8 text-center">
              <CheckSquare className="mx-auto mb-4 h-24 w-24 text-primary" />
              <h3 className="mb-2 text-2xl font-bold">One place to land every morning</h3>
              <p className="text-muted-foreground">
                Less hunting, less deciding, less forgetting. More clarity on the work that actually moves your projects forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">What Good Tasking helps you do</h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              The product gets stronger when every feature supports the same daily workflow.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature} className="bg-background/80 p-6 backdrop-blur">
                <CardContent className="flex items-start gap-3 p-0">
                  <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-base leading-7">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">A sharper product direction</h2>
            <p className="text-xl text-muted-foreground">
              The strongest version of Good Tasking is not everything for productivity. It is the place you trust to decide your next best move.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 p-6">
              <CardContent className="space-y-3 p-0">
                <h3 className="text-xl font-semibold">Morning clarity</h3>
                <p className="text-muted-foreground">
                  Open one screen and immediately understand what deserves your energy today.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 p-6">
              <CardContent className="space-y-3 p-0">
                <h3 className="text-xl font-semibold">Project momentum</h3>
                <p className="text-muted-foreground">
                  Keep every active software project moving without losing the thread between sessions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 p-6">
              <CardContent className="space-y-3 p-0">
                <h3 className="text-xl font-semibold">Time awareness</h3>
                <p className="text-muted-foreground">
                  Balance deep work, deadlines, and meetings so your plan matches the day you actually have.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-primary/5 px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">Start every day knowing what matters.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Good Tasking should feel like opening your workday with a plan, not opening another app that demands one from you.
          </p>
          <Link to="/signup">
            <Button size="lg" className="px-12 py-6 text-lg bg-success text-success-foreground hover:bg-primary hover:text-primary-foreground">
              Create My Workspace
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/40 px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 flex items-center space-x-2 md:mb-0">
              <Target className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Good Tasking</span>
            </div>
            <div className="flex flex-col items-center space-y-2 md:flex-row md:space-x-6 md:space-y-0">
              <div className="flex items-center space-x-4 text-sm">
                <Link to="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
                  Privacy Policy
                </Link>
                <Link to="/termsofservice" className="text-muted-foreground transition-colors hover:text-primary">
                  Terms of Service
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">© 2026 Good Tasking. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
