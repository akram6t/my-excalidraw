'use client';

import { useAppStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  PenTool,
  Layers,
  Users,
  Sparkles,
  ArrowRight,
  Moon,
  Sun,
  Github,
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: PenTool,
    title: 'Powerful Drawing',
    description: 'Full-featured Excalidraw whiteboard with shapes, text, arrows, and more for rich visual communication.',
  },
  {
    icon: Layers,
    title: 'Multi-Board Projects',
    description: 'Organize your work into projects with multiple boards. Switch between boards seamlessly.',
  },
  {
    icon: Users,
    title: 'User Authentication',
    description: 'Secure login, signup, and password recovery. Your projects are private and protected.',
  },
  {
    icon: Sparkles,
    title: '398+ Library Items',
    description: 'Pre-loaded design libraries including icons, diagrams, cloud shapes, stick figures, and more.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  const { isAuthenticated } = useAppStore();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const goToProjects = () => router.push('/projects');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <LayoutGrid className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Whiteboard Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated ? (
              <Button onClick={goToProjects} className="gap-2">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => router.push('/signup')} className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-20 sm:py-28 lg:py-36">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 -right-20 h-[300px] w-[300px] rounded-full bg-pink-500/5 blur-3xl" />
          <div className="absolute bottom-10 -left-20 h-[250px] w-[250px] rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Free &amp; Open Source Whiteboard
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
          >
            Sketch ideas.{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Build projects.
            </span>{' '}
            Collaborate visually.
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
          >
            A powerful whiteboard studio with Excalidraw integration, multi-board projects, and 400+ built-in design library items.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
          >
            {isAuthenticated ? (
              <Button size="lg" onClick={goToProjects} className="gap-2 text-base px-8 py-6">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push('/signup')} className="gap-2 text-base px-8 py-6">
                  Start Creating — Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/login')} className="text-base px-8 py-6">
                  Sign In
                </Button>
              </>
            )}
          </motion.div>

          {/* Mini preview card */}
          <motion.div
            className="mt-16 mx-auto max-w-2xl"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.4 }}
          >
            <div className="relative rounded-2xl border border-border/60 bg-card/50 shadow-2xl shadow-black/5 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/40">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground">whiteboard-studio.app</div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="rounded-xl bg-primary/10 p-4">
                    <PenTool className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Excalidraw-powered whiteboard</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 bg-muted/20 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div className="text-center mb-14" {...fadeUp}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to whiteboard
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with Excalidraw at its core, packed with features for brainstorming, diagramming, and visual collaboration.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              >
                <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 transition-shadow hover:shadow-lg hover:shadow-black/5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 px-4 py-20 sm:py-28">
        <motion.div className="mx-auto max-w-2xl text-center" {...fadeUp}>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start sketching?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Create your free account and start building visual projects in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Button size="lg" onClick={goToProjects} className="gap-2 text-base px-8">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => router.push('/signup')} className="gap-2 text-base px-8">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 mt-auto">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <LayoutGrid className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            Whiteboard Studio
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/akram6t/my-excalidraw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <span className="text-sm text-muted-foreground">
              Built with Excalidraw &amp; Next.js
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
