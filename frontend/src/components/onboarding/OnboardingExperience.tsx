import React, { useState, useEffect } from 'react';
import { Brain, MessageSquare, Sparkles, Settings, User, Briefcase, Target, CheckCircle2 } from 'lucide-react';

interface OnboardingAgent {
  id: string;
  name: string;
  role: string;
  avatar: React.ElementType;
  color: string;
}

interface Message {
  id: string;
  agentId: string;
  text: string;
  type: 'message' | 'action' | 'completion';
  options?: string[];
}

export default function OnboardingExperience() {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [currentAgent, setCurrentAgent] = useState<OnboardingAgent>(agents[0]);
  const [isTyping, setIsTyping] = useState(false);
  const messageIdCounter = useRef(0);

  const addMessage = async (message: Message, delay = 1000) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
    setMessages(prev => [...prev, { ...message, id: `${message.id}-${messageIdCounter.current++}` }]);
  };

  const handleUserResponse = async (response: string) => {
    setUserResponses(prev => ({ ...prev, [step]: response }));
    
    // Add user's response as a completion message
    await addMessage({
      id: Date.now().toString(),
      agentId: currentAgent.id,
      text: response,
      type: 'completion'
    }, 0);

    // Move to next step
    setStep(prev => prev + 1);
  };

  useEffect(() => {
    const runStep = async () => {
      const currentStep = onboardingSteps[step];
      if (!currentStep) return;

      // Change agent if needed
      if (currentStep.agent && currentStep.agent !== currentAgent.id) {
        const newAgent = agents.find(a => a.id === currentStep.agent);
        if (newAgent) {
          await addMessage({
            id: Date.now().toString(),
            agentId: currentAgent.id,
            text: `Let me introduce you to ${newAgent.name}, our ${newAgent.role}.`,
            type: 'message'
          });
          setCurrentAgent(newAgent);
        }
      }

      // Add step message
      await addMessage({
        id: Date.now().toString(),
        agentId: currentStep.agent || currentAgent.id,
        text: currentStep.message,
        type: currentStep.options ? 'action' : 'message',
        options: currentStep.options
      });
    };

    runStep();
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
              style={{ width: `${(step / onboardingSteps.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-gray-400 text-sm">
            Step {step + 1} of {onboardingSteps.length}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={message.id} className="flex items-start gap-4">
                {message.type !== 'completion' && (
                  <div className={`w-10 h-10 rounded-lg ${agents.find(a => a.id === message.agentId)?.color} flex items-center justify-center`}>
                    {React.createElement(agents.find(a => a.id === message.agentId)?.avatar || Brain, {
                      className: 'w-6 h-6 text-white'
                    })}
                  </div>
                )}
                <div className={`flex-1 ${message.type === 'completion' ? 'ml-14' : ''}`}>
                  {message.type !== 'completion' && (
                    <div className="text-sm font-medium text-gray-400 mb-1">
                      {agents.find(a => a.id === message.agentId)?.name}
                    </div>
                  )}
                  <div className={`rounded-lg p-4 ${
                    message.type === 'completion' 
                      ? 'bg-blue-600/20 text-blue-200'
                      : 'bg-gray-700/50 text-gray-200'
                  }`}>
                    {message.text}
                  </div>
                  {message.options && (
                    <div className="mt-4 space-y-2">
                      {message.options.map(option => (
                        <button
                          key={option}
                          onClick={() => handleUserResponse(option)}
                          className="w-full p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-left text-gray-200 transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${currentAgent.color} flex items-center justify-center`}>
                  {React.createElement(currentAgent.avatar, {
                    className: 'w-6 h-6 text-white'
                  })}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    {currentAgent.name}
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const agents: OnboardingAgent[] = [
  {
    id: 'welcome',
    name: 'Nova',
    role: 'Onboarding Specialist',
    avatar: Brain,
    color: 'bg-blue-600'
  },
  {
    id: 'preferences',
    name: 'Echo',
    role: 'Personalization Expert',
    avatar: Settings,
    color: 'bg-purple-600'
  },
  {
    id: 'goals',
    name: 'Atlas',
    role: 'Goal Planning Assistant',
    avatar: Target,
    color: 'bg-green-600'
  }
];

const onboardingSteps = [
  {
    agent: 'welcome',
    message: "Hi there! I'm Nova, your personal AI onboarding specialist. I'll help you get started with your AI assistant team. First, what should we call you?",
    options: [
      "I'll type my name in the profile settings",
      "Just call me User for now"
    ]
  },
  {
    agent: 'welcome',
    message: "Great! Let me explain how we work. Your AI team can help with various tasks, from managing emails to organizing your schedule. What interests you most?",
    options: [
      "Personal productivity and organization",
      "Work and project management",
      "Learning and skill development",
      "All of the above"
    ]
  },
  {
    agent: 'preferences',
    message: "Hi! I'm Echo, and I'll help personalize your experience. How do you prefer to communicate with your AI assistants?",
    options: [
      "Quick, to-the-point interactions",
      "Detailed, thorough explanations",
      "A mix, depending on the task"
    ]
  },
  {
    agent: 'preferences',
    message: "What's your primary device for using our service?",
    options: [
      "Computer/Laptop",
      "Smartphone",
      "Tablet",
      "Multiple devices"
    ]
  },
  {
    agent: 'goals',
    message: "Hello! I'm Atlas, your goal planning assistant. What's your main objective for using our AI team?",
    options: [
      "Save time on daily tasks",
      "Better organize my life/work",
      "Learn new skills",
      "Increase productivity"
    ]
  },
  {
    agent: 'goals',
    message: "Based on your responses, I'll set up your initial AI team. Would you like a quick tour of the dashboard?",
    options: [
      "Yes, show me around",
      "No thanks, I'll explore on my own"
    ]
  }
];