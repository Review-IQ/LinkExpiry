import { Link } from 'react-router-dom';
import {
  Link as LinkIcon,
  Clock,
  Eye,
  Lock,
  BarChart3,
  Zap,
  Palette,
  QrCode,
  Mail,
  Shield,
  Globe,
  TrendingUp,
  Check,
  ArrowRight,
  Users,
  Briefcase,
  Video,
  ShoppingBag,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                <LinkIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">LinkExpiry</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </a>
              <a href="#use-cases" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Use Cases
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition-all shadow-md hover:shadow-lg"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-70" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-indigo-200 rounded-full px-4 py-2 mb-8 shadow-sm">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Smart Link Management with Expiration</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Build stronger connections
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                with intelligent links
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Create time-sensitive links that expire automatically, track engagement with detailed analytics,
              and show custom branded pages when links expire. Perfect for modern teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-50 font-semibold text-lg border-2 border-gray-200 transition-all flex items-center gap-2 shadow-sm"
              >
                See How It Works
                <ChevronRight className="h-5 w-5" />
              </a>
            </div>

            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              No credit card required
              <span className="text-gray-300">•</span>
              5 free links per month
              <span className="text-gray-300">•</span>
              Cancel anytime
            </p>
          </div>

          {/* Stats Bar */}
          <div className="max-w-4xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem number="256M+" label="Links Created" />
            <StatItem number="600K+" label="Active Users" />
            <StatItem number="99.9%" label="Uptime" />
            <StatItem number="<50ms" label="Redirect Speed" />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-12 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-6">TRUSTED BY TEAMS AT</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            <CompanyLogo name="Google" />
            <CompanyLogo name="Microsoft" />
            <CompanyLogo name="Amazon" />
            <CompanyLogo name="Meta" />
            <CompanyLogo name="Netflix" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to manage smart links
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed for modern teams who need control, insights, and flexibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Clock className="h-8 w-8" />}
              title="Time-Based Expiry"
              description="Set links to automatically expire after a specific date and time. Perfect for limited-time offers, event registrations, and time-sensitive content."
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Eye className="h-8 w-8" />}
              title="View-Based Expiry"
              description="Links automatically deactivate after reaching your set view limit. Ideal for exclusive content, beta access, and controlled distribution."
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<Palette className="h-8 w-8" />}
              title="Custom Expiry Pages"
              description="Show beautiful branded pages when links expire. Add your logo, custom message, call-to-action buttons, and social media links."
              gradient="from-indigo-500 to-purple-500"
            />
            <FeatureCard
              icon={<QrCode className="h-8 w-8" />}
              title="QR Code Generation"
              description="Instantly generate QR codes for any link. Perfect for print materials, presentations, and offline-to-online campaigns."
              gradient="from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={<Mail className="h-8 w-8" />}
              title="Email Capture"
              description="Capture visitor emails on expired link pages. Build your mailing list and send automatic notifications via Mailgun integration."
              gradient="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Advanced Analytics"
              description="Track clicks, locations, devices, browsers, and referrers. Get insights into your audience with comprehensive real-time analytics."
              gradient="from-pink-500 to-rose-500"
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8" />}
              title="Password Protection"
              description="Add an extra layer of security with password-protected links. Control who can access your content with encrypted passwords."
              gradient="from-red-500 to-orange-500"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Lightning Fast"
              description="Sub-50ms redirects with 99.9% uptime. Your users never wait. Optimized infrastructure built for speed and reliability."
              gradient="from-yellow-500 to-amber-500"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Geolocation Tracking"
              description="See exactly where your clicks are coming from. Track country, region, and city-level data for geographic insights."
              gradient="from-teal-500 to-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Get started in seconds
              </h2>
              <p className="text-xl text-gray-600">
                No complex setup. Just paste, configure, and share.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <Step
                number="1"
                title="Paste Your Link"
                description="Simply paste any long URL into LinkExpiry. No account required to try it out."
              />
              <Step
                number="2"
                title="Set Expiration Rules"
                description="Choose time-based, view-based, or both. Add password protection and custom messages."
              />
              <Step
                number="3"
                title="Share & Track"
                description="Share your smart link and watch real-time analytics as your audience engages."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for your workflow
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by professionals across industries
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <UseCaseCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Recruiters & HR"
              description="Share job postings with expiry dates. Links automatically close when positions are filled or applications end."
              gradient="from-blue-500 to-cyan-500"
            />
            <UseCaseCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Sales Teams"
              description="Create time-limited proposal links. Add urgency to close deals faster with expiring offers and quotes."
              gradient="from-purple-500 to-pink-500"
            />
            <UseCaseCard
              icon={<Video className="h-6 w-6" />}
              title="Content Creators"
              description="Share exclusive content with view limits. Perfect for early access, beta releases, and VIP content."
              gradient="from-orange-500 to-red-500"
            />
            <UseCaseCard
              icon={<ShoppingBag className="h-6 w-6" />}
              title="E-commerce"
              description="Flash sales, limited-time discounts, and exclusive offers. Drive urgency with automatic expiration."
              gradient="from-green-500 to-emerald-500"
            />
            <UseCaseCard
              icon={<Users className="h-6 w-6" />}
              title="Event Organizers"
              description="Share registration links that expire after your event. Control access to event materials and recordings."
              gradient="from-indigo-500 to-purple-500"
            />
            <UseCaseCard
              icon={<FileText className="h-6 w-6" />}
              title="Document Sharing"
              description="Share sensitive documents with time limits. Ensure confidential files don't remain accessible forever."
              gradient="from-pink-500 to-rose-500"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for you. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <PricingCard
              name="FREE"
              price="$0"
              period="forever"
              description="Perfect for trying out LinkExpiry"
              features={[
                '5 links per month',
                '100 views per link',
                '7 days analytics retention',
                'Basic analytics',
                'Email support',
                'QR code generation',
              ]}
              cta="Get Started Free"
            />
            <PricingCard
              name="STARTER"
              price="$5"
              period="per month"
              description="For individuals and small teams"
              features={[
                '100 links per month',
                '10,000 views per link',
                '30 days analytics retention',
                'Advanced analytics',
                'Priority support',
                'Custom expiry pages',
                'Password protection',
                'Email capture',
              ]}
              highlighted
              cta="Start Free Trial"
            />
            <PricingCard
              name="PRO"
              price="$29"
              period="per month"
              description="For growing businesses"
              features={[
                '1,000 links per month',
                '100,000 views per link',
                '90 days analytics retention',
                'Custom domains',
                'Premium support',
                'White-label branding',
                'API access',
                'Team collaboration',
              ]}
              cta="Start Free Trial"
            />
            <PricingCard
              name="ENTERPRISE"
              price="Custom"
              period="contact us"
              description="For large organizations"
              features={[
                'Unlimited links',
                'Unlimited views',
                '365 days analytics retention',
                'Dedicated account manager',
                '24/7 phone support',
                'Custom integrations',
                'SLA guarantee',
                'Advanced security',
              ]}
              cta="Contact Sales"
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 flex items-center justify-center gap-2 flex-wrap">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">All plans include:</span>
              SSL encryption, GDPR compliance, 99.9% uptime SLA, and no credit card required to start
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

        <div className="container mx-auto px-4 py-20 md:py-28 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to create smarter links?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of teams using LinkExpiry to manage their time-sensitive links.
            Start free, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group bg-white text-indigo-600 px-8 py-4 rounded-xl hover:bg-gray-100 font-semibold text-lg inline-flex items-center justify-center gap-2 transition-all shadow-xl"
            >
              Start Free Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="bg-transparent text-white px-8 py-4 rounded-xl hover:bg-white/10 font-semibold text-lg border-2 border-white transition-all inline-flex items-center justify-center gap-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <LinkIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">LinkExpiry</span>
              </div>
              <p className="text-sm text-gray-500">
                Smart link management with automatic expiration, analytics, and custom branding.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2025 LinkExpiry. All rights reserved. Built with Claude Code.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{number}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function CompanyLogo({ name }: { name: string }) {
  return (
    <div className="text-2xl font-bold text-gray-400">
      {name}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold mb-4 shadow-lg">
        {number}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group">
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  cta,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}) {
  return (
    <div
      className={`relative bg-white p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col ${
        highlighted
          ? 'border-indigo-600 shadow-2xl scale-105 z-10'
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-xl'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="flex items-end gap-1">
          <span className="text-5xl font-bold text-gray-900">{price}</span>
          {price !== 'Custom' && <span className="text-gray-600 pb-2">/{period.split(' ')[0]}</span>}
        </div>
        {price === 'Custom' && <p className="text-sm text-gray-600 mt-1">{period}</p>}
      </div>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/register"
        className={`block w-full text-center py-4 rounded-xl font-semibold transition-all ${
          highlighted
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
