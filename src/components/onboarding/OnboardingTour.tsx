import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button, Card, Typography } from '../design/DesignSystem';

interface TourStep {
  id: string;
  title: string;
  description: string;
  element: string;
  placement: 'top' | 'right' | 'bottom' | 'left';
  action?: () => void;
}

export default function OnboardingTour() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(true);

  const tourSteps: TourStep[] = [
    {
      id: 'dashboard',
      title: 'Welcome to Your AI Team',
      description: 'This is your command center where you can monitor all AI activities and performance metrics.',
      element: '#dashboard-overview',
      placement: 'bottom',
    },
    {
      id: 'agents',
      title: 'Meet Your AI Agents',
      description: 'These are your AI team members, each specialized in different tasks.',
      element: '#agent-list',
      placement: 'right',
    },
    {
      id: 'tasks',
      title: 'Task Management',
      description: 'View and manage all tasks assigned to your AI team here.',
      element: '#task-list',
      placement: 'left',
    },
    {
      id: 'knowledge',
      title: 'Knowledge Graph',
      description: 'Explore how ideas, tasks, and agents are connected in this interactive visualization.',
      element: '#knowledge-graph',
      placement: 'left',
    },
  ];

  useEffect(() => {
    // Highlight current element
    const element = document.querySelector(tourSteps[currentStep].element);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-primary-500', 'ring-opacity-50');
    }

    return () => {
      // Clean up highlight
      if (element) {
        element.classList.remove('ring-4', 'ring-primary-500', 'ring-opacity-50');
      }
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/dashboard');
  };

  if (!showTour) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary-600" />
          </div>
          <Typography.H2 className="mb-2">{tourSteps[currentStep].title}</Typography.H2>
          <p className="text-neutral-600">{tourSteps[currentStep].description}</p>
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={completeTour}
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleNext}
            icon={currentStep === tourSteps.length - 1 ? <CheckCircle2 className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          >
            {currentStep === tourSteps.length - 1 ? 'Complete Tour' : 'Next'}
          </Button>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-primary-600' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}