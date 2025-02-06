import React from 'react';
import { 
  Brain, 
  Sparkles, 
  Clock, 
  Calendar, 
  Mail, 
  FileText, 
  MessageSquare, 
  BookOpen,
  Briefcase,
  Users,
  Zap,
  Shield
} from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Your AI Team's Superpowers
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover all the ways your AI assistants can help make your life easier and more productive
          </p>
        </div>
      </div>

      {/* Core Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
              <div className="w-16 h-16 rounded-xl bg-blue-600/20 flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Smart Email Management</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <span>Automatically categorize and prioritize emails</span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <span>Draft personalized responses for your review</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <span>Create follow-up reminders and tasks</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
              <div className="w-16 h-16 rounded-xl bg-purple-600/20 flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Schedule Optimization</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                  <span>Find the best times for meetings and tasks</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                  <span>Coordinate schedules with your team</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                  <span>Block time for focused work and breaks</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
              <div className="w-16 h-16 rounded-xl bg-pink-600/20 flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Research & Learning</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-pink-400 mt-1 shrink-0" />
                  <span>Summarize articles and documents</span>
                </li>
                <li className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-pink-400 mt-1 shrink-0" />
                  <span>Create study plans and materials</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-pink-400 mt-1 shrink-0" />
                  <span>Track progress and provide feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Details */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-400">
              Our AI assistants work together seamlessly to handle your tasks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {featureDetails.map((feature, index) => (
              <div key={index} className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
                <div className="relative bg-gray-800 rounded-lg p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const featureDetails = [
  {
    icon: <Brain className="w-6 h-6 text-blue-400" />,
    title: "Smart Task Management",
    description: "Let your AI assistants handle the details while you focus on what matters most.",
    benefits: [
      "Automatic task prioritization",
      "Smart deadline suggestions",
      "Progress tracking and reminders",
      "Task dependencies management"
    ]
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-purple-400" />,
    title: "Natural Communication",
    description: "Talk to your AI team just like you would with human assistants.",
    benefits: [
      "Simple, conversational interface",
      "Context-aware responses",
      "Multiple communication channels",
      "Voice and text support"
    ]
  },
  {
    icon: <Sparkles className="w-6 h-6 text-pink-400" />,
    title: "Continuous Learning",
    description: "Your AI assistants get better at helping you over time.",
    benefits: [
      "Learns your preferences",
      "Adapts to your work style",
      "Improves task efficiency",
      "Personalized suggestions"
    ]
  },
  {
    icon: <Shield className="w-6 h-6 text-green-400" />,
    title: "Privacy & Security",
    description: "Your data is always protected and under your control.",
    benefits: [
      "End-to-end encryption",
      "Data privacy controls",
      "Secure authentication",
      "Regular security audits"
    ]
  }
];