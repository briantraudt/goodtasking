import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Blocks,
  Bot,
  FolderKanban,
  GitBranch,
  Laptop2,
  Layers3,
  Loader2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import homepageBackground from "@/assets/homepage-background.avif";

const coreMessages = [
  {
    icon: FolderKanban,
    title: "All your projects in one workspace",
    description:
      "Track client work, product ideas, side projects, launches, fixes, and experiments without scattering notes across tabs.",
  },
  {
    icon: Layers3,
    title: "Tasks tied to real project context",
    description:
      "Keep each task attached to the project it belongs to, with stack details, links, and metadata that help you re-enter flow fast.",
  },
  {
    icon: Blocks,
    title: "Built for vibe coders",
    description:
      "Good Tasking is for people shipping quickly, juggling lots of moving pieces, and needing one place to stay oriented.",
  },
];

const workflow = [
  "Create a project for every active app, client, tool, or experiment.",
  "Store the key details: description, logo, repo, website, and tech stack.",
  "Add tasks as they come up and work from one simple running list.",
  "Stay in motion without forgetting what each project is, where it lives, or what comes next.",
];

const stackExamples = [
  "React",
  "Next.js",
  "TypeScript",
  "Supabase",
  "Stripe",
  "Twilio",
  "Resend",
  "PostHog",
  "Sentry",
  "Vercel",
];

const featureCards = [
  {
    icon: GitBranch,
    title: "Project memory",
    description:
      "Keep repo links, URLs, stack choices, and notes with the project so context is always one click away.",
  },
  {
    icon: Target,
    title: "Simple running list",
    description:
      "Focus on open work across all projects or drill into one project when it is time to ship.",
  },
  {
    icon: Laptop2,
    title: "Clean operator view",
    description:
      "Less planner clutter, less ceremony, more clarity on what is active and what needs attention.",
  },
  {
    icon: Bot,
    title: "AI as support, not noise",
    description:
      "Use AI when it helps, but keep the product centered on project management and forward motion.",
  },
];

const Landing = () => {
  const [isGetStartedLoading, setIsGetStartedLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const scrollToHowItWorks = () => {
    const target = document.getElementById("how-it-works");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGetStarted = () => {
    setIsGetStartedLoading(true);

    setTimeout(() => {
      window.location.href = "/signup";
    }, 700);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-950">

      <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Good Tasking</p>
              <p className="text-xs text-slate-500">Project OS for vibe coders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 md:inline">
              Login
            </Link>
            <Button
              onClick={handleGetStarted}
              className="rounded-full bg-[#1f9d55] px-5 text-white hover:bg-[#18874a]"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <section
        className="relative min-h-[72vh] overflow-hidden px-4 pb-20 pt-20"
        style={{
          backgroundImage: `url(${homepageBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center py-16 md:min-h-[62vh] md:py-28">
          <div className="max-w-4xl text-center lg:text-left">
            <h1 className="text-5xl font-semibold tracking-tight text-slate-950 md:text-7xl md:leading-[0.98]">
              One place for vibe coders to manage every project and task.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-800 md:text-xl lg:mx-0">
              Good Tasking gives you a calm home base for active software projects, open tasks,
              and the details that help you pick work back up fast.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {coreMessages.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="rounded-[28px] border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-slate-50 px-4 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              How It Works
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Less planning theater. More shipping.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Good Tasking is strongest when it acts like your home base for projects in motion:
              not just a to-do list, and not just a planner.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {workflow.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1f9d55]/12 text-lg font-semibold text-[#167846]">
                  {index + 1}
                </div>
                <p className="pt-1 text-base leading-8 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Why It Feels Different
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              The product promise is simple: one place to manage the work around your code.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="rounded-[28px] border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-7xl rounded-[36px] bg-slate-950 px-8 py-14 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] md:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
              Final Word
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              If you’re a vibe coder with too many projects open, this should feel like coming home.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/80">
              Capture the project. Store the context. Add the tasks. Keep shipping without
              rebuilding your mental model every time you switch gears.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="rounded-full bg-[#1f9d55] px-8 text-base text-white hover:bg-[#18874a]"
                onClick={handleGetStarted}
              >
                Create My Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full border-white/25 bg-transparent px-8 text-base text-white hover:bg-white/10 sm:w-auto"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-slate-950">Good Tasking</p>
              <p>Project OS for vibe coders</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-950">
              Privacy
            </Link>
            <Link to="/termsofservice" className="hover:text-slate-950">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
