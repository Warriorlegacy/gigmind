import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { GigMindIcon } from '@/components/shared/Logo'
import { MessageSquare, Search, Handshake, ArrowRight, Star, Shield, Zap } from 'lucide-react'

const CATEGORIES = [
  { slug: 'real-estate', name: 'Real Estate', hindi: 'रियल एस्टेट', icon: '🏠' },
  { slug: 'medical', name: 'Medical', hindi: 'चिकित्सा', icon: '🏥' },
  { slug: 'home-repair', name: 'Home Repair', hindi: 'घर मरम्मत', icon: '🔧' },
  { slug: 'office-assistance', name: 'Office Help', hindi: 'कार्यालय', icon: '🏢' },
  { slug: 'interior-design', name: 'Interior Design', hindi: 'इंटीरियर', icon: '🎨' },
  { slug: 'security', name: 'Security', hindi: 'सुरक्षा', icon: '🔐' },
  { slug: 'human-resources', name: 'HR Services', hindi: 'मानव संसाधन', icon: '👥' },
  { slug: 'cleaning', name: 'Cleaning', hindi: 'सफाई', icon: '🧹' },
  { slug: 'transport', name: 'Transport', hindi: 'परिवहन', icon: '🚚' },
  { slug: 'education', name: 'Education', hindi: 'शिक्षा', icon: '📚' },
  { slug: 'event-management', name: 'Events', hindi: 'इवेंट', icon: '🎉' },
  { slug: 'it-services', name: 'IT Services', hindi: 'आईटी', icon: '💻' },
]

const TESTIMONIALS = [
  {
    name: 'Rajan Sharma',
    role: 'Business Owner, Kanpur',
    text: 'I needed a security guard urgently for my warehouse. GigMind\'s AI understood my requirement in one chat and matched me with a verified guard within hours.',
    rating: 5,
  },
  {
    name: 'Priya Verma',
    role: 'Interior Designer, Lucknow',
    text: 'As a provider, GigMind brings clients to me. The AI-generated proposals save me 30 minutes per application. My earnings have doubled in 3 months.',
    rating: 5,
  },
  {
    name: 'Suresh Yadav',
    role: 'Property Agent, Lucknow',
    text: 'No more paying for listings on multiple sites. I post once on GigMind and the AI matches me with genuine buyers. The escrow payment gives everyone confidence.',
    rating: 4,
  },
]

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Chat with AI',
    description: 'Tell our AI what service you need — in Hindi, English, or Hinglish. No forms, no hassle.',
  },
  {
    icon: Search,
    title: 'Get Matched',
    description: 'Our AI finds the best providers near you based on skills, ratings, and location.',
  },
  {
    icon: Handshake,
    title: 'Hire & Pay Securely',
    description: 'Chat with providers, agree on terms, and pay through secure escrow. Payment released only when you\'re satisfied.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(108,71,255,0.15)_0%,_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" /> AI-Powered Service Marketplace
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Hire Anything.<br />
            <span className="gradient-text">Chat Everything.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Real Estate &bull; Medical &bull; Home Repair &bull; Security &bull; Interior Design &bull; HR &amp; More
          </p>
          <p className="text-muted-foreground mb-10 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            Just tell our AI what you need. We handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/ai-chat"
              className="px-8 py-4 rounded-xl bg-brand-gradient text-white font-display font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-brand/25"
            >
              Start Chatting <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/jobs"
              className="px-8 py-4 rounded-xl border border-surface-border text-muted-foreground font-medium hover:text-white hover:border-surface-hover transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-4 border-y border-surface-border">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          {[
            { value: '12+', label: 'Service Categories' },
            { value: '₹0', label: 'Platform Fee to Browse' },
            { value: 'AI', label: 'Powered Matching' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">Three simple steps to get any service done — no forms, no searching, no hassle.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative p-8 rounded-2xl bg-surface-card border border-surface-border hover:border-brand/30 transition-all group">
                <div className="absolute top-4 right-4 font-display text-5xl font-bold text-surface-hover">{i + 1}</div>
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-6 group-hover:bg-brand/20 transition-colors">
                  <step.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 bg-surface-card/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-4">Services for Every Need</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">From property deals to home repairs, find verified professionals across 12+ categories.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/jobs?category=${cat.slug}`}
                className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-brand/30 hover:scale-[1.02] transition-all text-center group"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <div className="font-medium text-white text-sm group-hover:text-brand transition-colors">{cat.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{cat.hindi}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-4">Trusted by Thousands</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Real stories from hirers and providers on GigMind.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-surface-card border border-surface-border">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-warning text-warning' : 'text-surface-border'}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-medium text-white text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-brand-gradient relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">Whether you need a service or provide one, GigMind makes it effortless with AI.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/ai-chat" className="px-8 py-4 rounded-xl bg-white text-brand font-display font-bold hover:bg-white/90 transition-colors flex items-center gap-2">
                  Hire a Service <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/signup?role=provider" className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-medium hover:bg-white/10 transition-colors">
                  Join as Provider
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-surface-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-0 mb-4">
                <GigMindIcon size={30} />
              </div>
              <p className="text-sm text-muted-foreground">AI-powered service marketplace for India.</p>
            </div>
            <div>
              <h4 className="font-medium text-white text-sm mb-3">For Hirers</h4>
              <div className="space-y-2">
                <Link href="/ai-chat" className="block text-sm text-muted-foreground hover:text-white transition-colors">Post a Job</Link>
                <Link href="/jobs" className="block text-sm text-muted-foreground hover:text-white transition-colors">Browse Jobs</Link>
                <Link href="/providers" className="block text-sm text-muted-foreground hover:text-white transition-colors">Find Providers</Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white text-sm mb-3">For Providers</h4>
              <div className="space-y-2">
                <Link href="/signup?role=provider" className="block text-sm text-muted-foreground hover:text-white transition-colors">Create Profile</Link>
                <Link href="/jobs" className="block text-sm text-muted-foreground hover:text-white transition-colors">Find Work</Link>
                <Link href="/settings/provider" className="block text-sm text-muted-foreground hover:text-white transition-colors">Manage Profile</Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white text-sm mb-3">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-muted-foreground hover:text-white transition-colors">About</Link>
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-surface-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GigMind. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
