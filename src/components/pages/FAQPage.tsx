import React from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Shield, Zap, Brain } from 'lucide-react';

export default function FAQPage() {
  const [openSection, setOpenSection] = React.useState<string | null>('getting-started');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            How Can We Help?
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Find answers to common questions about your AI assistants
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {faqSections.map(section => (
          <div key={section.id} className="mb-8">
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-6 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center">
                  {section.icon}
                </div>
                <span className="text-lg font-semibold text-white">{section.title}</span>
              </div>
              {openSection === section.id ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {openSection === section.id && (
              <div className="mt-4 space-y-4">
                {section.questions.map((qa, index) => (
                  <div key={index} className="bg-gray-800/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">{qa.question}</h3>
                    <p className="text-gray-400">{qa.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl p-8 backdrop-blur-sm border border-blue-500/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-400 mb-8">
            Our support team is here to help you get the most out of your AI assistants
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

const faqSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Brain className="w-6 h-6 text-blue-400" />,
    questions: [
      {
        question: "How do I start using my AI assistants?",
        answer: "Getting started is easy! Just sign up for a free account and you'll be guided through a simple setup process where you can choose your first AI assistants and customize them to your needs."
      },
      {
        question: "Can I use the service on my phone?",
        answer: "Yes! Our service works on any device with a web browser. We also have mobile apps available for iOS and Android for an even better experience on the go."
      },
      {
        question: "How long does it take to set up?",
        answer: "Basic setup takes less than 5 minutes. Your AI assistants will then learn and adapt to your preferences over time, becoming more helpful with each interaction."
      }
    ]
  },
  {
    id: 'features',
    title: 'Features & Capabilities',
    icon: <Zap className="w-6 h-6 text-purple-400" />,
    questions: [
      {
        question: "What tasks can my AI assistants help with?",
        answer: "Our AI assistants can help with email management, scheduling, research, task organization, note-taking, and much more. They learn from your preferences and can handle both simple and complex tasks."
      },
      {
        question: "Can AI assistants work together?",
        answer: "Yes! One of our key features is the ability for AI assistants to collaborate. They can share information and work together to complete complex tasks more efficiently."
      },
      {
        question: "Do they work with my existing tools?",
        answer: "We integrate with popular services like Gmail, Calendar, Slack, and more. Your AI assistants can seamlessly work with the tools you already use."
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: <Shield className="w-6 h-6 text-green-400" />,
    questions: [
      {
        question: "How is my data protected?",
        answer: "We use enterprise-grade encryption for all data, both in transit and at rest. Your information is never shared with third parties, and you have complete control over what data your AI assistants can access."
      },
      {
        question: "Can I delete my data?",
        answer: "Yes, you have full control over your data. You can delete individual items or your entire account at any time. When you delete data, it's permanently removed from our systems."
      },
      {
        question: "Who can see my information?",
        answer: "Only you and your authorized team members can access your information. Our AI assistants process your data securely and automatically - no humans are involved unless you specifically request support."
      }
    ]
  },
  {
    id: 'support',
    title: 'Support & Training',
    icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
    questions: [
      {
        question: "How can I get help if I need it?",
        answer: "We offer multiple support channels including in-app chat, email support, and comprehensive documentation. Pro and Business plans include priority support with faster response times."
      },
      {
        question: "Is there training available?",
        answer: "Yes! We provide free video tutorials, documentation, and regular webinars to help you get the most out of your AI assistants. Business plans also include personalized training sessions."
      },
      {
        question: "Can I suggest new features?",
        answer: "Absolutely! We love hearing from our users. You can submit feature requests through our feedback portal, and we regularly incorporate user suggestions into our product updates."
      }
    ]
  }
];