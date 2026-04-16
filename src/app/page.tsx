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
  Shield,
  Palette,
  FolderKanban,
  Monitor,
  Lock,
  Linkedin,
  Code2,
  Heart,
  ExternalLink,
  ChevronRight,
  Zap,
  Library,
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: PenTool,
    title: 'Powerful Drawing',
    description:
      'Full-featured Excalidraw whiteboard with shapes, text, arrows, freehand drawing, and more for rich visual communication.',
  },
  {
    icon: Layers,
    title: 'Multi-Board Projects',
    description:
      'Organize your work into projects with multiple boards. Switch between boards seamlessly within each project.',
  },
  {
    icon: Users,
    title: 'User Authentication',
    description:
      'Secure login, signup, and password recovery. Your projects are private and protected with user-scoped access.',
  },
  {
    icon: Library,
    title: '398+ Library Items',
    description:
      'Pre-loaded design libraries with 23 categories including icons, diagrams, cloud shapes, stick figures, and more.',
  },
  {
    icon: Palette,
    title: 'Dark & Light Themes',
    description:
      'Beautiful dark and light modes with system preference detection. Switch themes anytime without losing your work.',
  },
  {
    icon: Shield,
    title: 'Cloud Save & Restore',
    description:
      'Save your whiteboards to the cloud and restore them anytime. Auto-saves locally for instant recovery on reload.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create your account',
    description: 'Sign up for free in seconds. No credit card required.',
  },
  {
    step: '02',
    title: 'Create a project',
    description: 'Give your project a name and a color. Add as many boards as you need.',
  },
  {
    step: '03',
    title: 'Start sketching',
    description: 'Use Excalidraw\'s powerful tools and 400+ library items to bring your ideas to life.',
  },
];

const stats = [
  { value: '398+', label: 'Library Items' },
  { value: '23', label: 'Library Categories' },
  { value: '100%', label: 'Free & Open Source' },
  { value: '∞', label: 'Whiteboards' },
];

const techStack = [
  { name: 'Next.js 16', desc: 'React Framework' },
  { name: 'TypeScript', desc: 'Type Safety' },
  { name: 'Excalidraw', desc: 'Whiteboard Engine' },
  { name: 'MongoDB Atlas', desc: 'Cloud Database' },
  { name: 'NextAuth.js', desc: 'Authentication' },
  { name: 'Tailwind CSS', desc: 'Styling' },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  const { isAuthenticated } = useAppStore();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const goToProjects = () => router.push('/projects');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── Header ─── */}
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
                <Button variant="ghost" onClick={() => router.push('/login')} className="hidden sm:inline-flex">
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

      {/* ─── Hero ─── */}
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
            A powerful whiteboard studio with Excalidraw integration, multi-board projects, user authentication, and 400+ built-in design library items.
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

      {/* ─── Stats ─── */}
      <section className="border-t border-border/40 bg-muted/20 px-4 py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            >
              <div className="text-3xl font-extrabold tracking-tight">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="border-t border-border/40 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div className="text-center mb-14" {...fadeUp}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to whiteboard
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with Excalidraw at its core, packed with features for brainstorming, diagramming, and visual collaboration.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...scaleIn}
                transition={{ ...scaleIn.transition, delay: i * 0.08 }}
              >
                <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 transition-shadow hover:shadow-lg hover:shadow-black/5 h-full">
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

      {/* ─── How it Works ─── */}
      <section className="border-t border-border/40 bg-muted/20 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div className="text-center mb-14" {...fadeUp}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get started in 3 steps
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From sign-up to your first whiteboard in under a minute.
            </p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.15 }}
              >
                <div className="relative rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{item.description}</p>
                  {i < steps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden sm:block text-muted-foreground/40">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section className="border-t border-border/40 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div className="text-center mb-14" {...fadeUp}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Code2 className="h-3.5 w-3.5" />
              Tech Stack
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built with modern technologies
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by industry-leading tools for the best developer and user experience.
            </p>
          </motion.div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              >
                <div className="rounded-xl border border-border/60 bg-card px-5 py-4 flex items-center gap-4 transition-shadow hover:shadow-md hover:shadow-black/5">
                  <Monitor className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{tech.name}</div>
                    <div className="text-xs text-muted-foreground">{tech.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-border/40 bg-muted/20 px-4 py-20 sm:py-28">
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
              <>
                <Button size="lg" onClick={() => router.push('/signup')} className="gap-2 text-base px-8">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/login')} className="text-base px-8">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {/* Top row */}
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <LayoutGrid className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold tracking-tight">Whiteboard Studio</span>
                <p className="text-xs text-muted-foreground mt-0.5">Free &amp; open source whiteboard app</p>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/akram6t/my-excalidraw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-border"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">Source Code</span>
              </a>
              <a
                href="https://github.com/akram6t"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-border"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a
                href="https://in.linkedin.com/in/akram6t"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-border"
              >
                <Linkedin className="h-4 w-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
              <a
                href="https://dev.to/akram6t"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-border"
              >
                <Code2 className="h-4 w-4" />
                <span className="hidden sm:inline">DEV.to</span>
              </a>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-8 flex flex-col items-center gap-2 border-t border-border/40 pt-6 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Whiteboard Studio. Built with{' '}
              <Heart className="inline h-3 w-3 text-red-500 mx-0.5" /> using Next.js &amp; Excalidraw.
            </p>
            <a
              href="https://github.com/akram6t/my-excalidraw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Star on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
