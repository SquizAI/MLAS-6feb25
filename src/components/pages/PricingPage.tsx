import React from 'react';
import { Check, Zap } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Start for free and upgrade as your needs grow
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="relative bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-semibold text-white mb-2">Personal</h3>
            <p className="text-gray-400 mb-6">Perfect for getting started</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {personalFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-gradient-to-b from-blue-600/10 to-purple-600/10 rounded-xl p-8 backdrop-blur-sm border border-blue-500/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-sm font-medium text-white">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
            <p className="text-gray-400 mb-6">For individuals and small teams</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$19</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-colors">
              Start Pro Trial
            </button>
          </div>

          {/* Business Plan */}
          <div className="relative bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-semibold text-white mb-2">Business</h3>
            <p className="text-gray-400 mb-6">For larger teams and organizations</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$49</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {businessFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {pricingFAQs.map((faq, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
              <p className="text-gray-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const personalFeatures = [
  "3 AI assistants",
  "Basic task management",
  "Email integration",
  "Calendar management",
  "5GB storage",
  "Community support"
];

const proFeatures = [
  "Everything in Personal, plus:",
  "10 AI assistants",
  "Advanced task automation",
  "Custom workflows",
  "50GB storage",
  "Priority support",
  "API access"
];

const businessFeatures = [
  "Everything in Pro, plus:",
  "Unlimited AI assistants",
  "Team collaboration features",
  "Advanced security controls",
  "500GB storage",
  "24/7 premium support",
  "Custom integrations"
];

const pricingFAQs = [
  {
    question: "Can I try before I buy?",
    answer: "Yes! You can start with our free Personal plan to explore the features. We also offer a 14-day trial of our Pro plan with no credit card required."
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time. We'll prorate any payments automatically."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and offer invoice payment options for Business plans."
  },
  {
    question: "Is there a long-term contract?",
    answer: "No, all our plans are month-to-month. You can cancel anytime without any cancellation fees."
  }
];