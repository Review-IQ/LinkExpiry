import { Link } from 'react-router-dom';
import { Link as LinkIcon, Clock, Eye, Lock, BarChart3, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">LinkExpiry</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Links That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {' '}Expire Automatically
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Perfect for recruiters, sales teams, and creators. Share links that automatically
            deactivate after a time limit or view count.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 font-medium text-lg transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-50 font-medium text-lg border border-gray-200 transition-colors"
            >
              Learn More
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 10 free links per month
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Modern Teams
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Clock className="h-8 w-8" />}
              title="Time-Based Expiry"
              description="Set links to expire after a specific date and time. Perfect for limited-time offers."
            />
            <FeatureCard
              icon={<Eye className="h-8 w-8" />}
              title="View-Based Expiry"
              description="Links automatically expire after reaching a set number of views or clicks."
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8" />}
              title="Password Protection"
              description="Add an extra layer of security with password-protected links."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Detailed Analytics"
              description="Track clicks, locations, devices, and more with comprehensive analytics."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Lightning Fast"
              description="Sub-50ms redirects ensure your users never wait. Optimized for speed."
            />
            <FeatureCard
              icon={<LinkIcon className="h-8 w-8" />}
              title="Custom Messages"
              description="Show custom messages when links expire. Perfect for user communication."
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Built for Your Workflow
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <UseCaseCard
              title="Recruiters"
              description="Share job postings with expiry dates. Links automatically close when positions are filled."
              gradient="from-blue-500 to-cyan-500"
            />
            <UseCaseCard
              title="Sales Teams"
              description="Create time-limited proposal links. Add urgency to close deals faster."
              gradient="from-purple-500 to-pink-500"
            />
            <UseCaseCard
              title="Content Creators"
              description="Share exclusive content with view limits. Perfect for limited releases."
              gradient="from-orange-500 to-red-500"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Simple, Transparent Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            name="FREE"
            price="$0"
            features={[
              '10 links per month',
              '100 views per link',
              '7 days analytics',
              'Basic support',
            ]}
          />
          <PricingCard
            name="STARTER"
            price="$9"
            features={[
              '100 links per month',
              '10,000 views per link',
              '30 days analytics',
              'Priority support',
            ]}
            highlighted
          />
          <PricingCard
            name="PRO"
            price="$29"
            features={[
              '1,000 links per month',
              '100,000 views per link',
              '90 days analytics',
              'Premium support',
            ]}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams using LinkExpiry to manage their temporary links.
          </p>
          <Link
            to="/register"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-medium text-lg inline-block transition-colors"
          >
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <LinkIcon className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">LinkExpiry</span>
          </div>
          <p className="text-sm">
            © 2025 LinkExpiry. Built with Claude Code.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseCard({ title, description, gradient }: { title: string; description: string; gradient: string }) {
  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} mb-4`} />
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, features, highlighted = false }: { name: string; price: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`bg-white p-8 rounded-xl border-2 ${highlighted ? 'border-indigo-600 shadow-xl scale-105' : 'border-gray-200'} transition-transform hover:scale-105`}>
      {highlighted && (
        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium inline-block mb-4">
          Most Popular
        </span>
      )}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600">/month</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/register"
        className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
          highlighted
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
