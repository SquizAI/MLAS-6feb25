import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  element: string;
  placement: 'top' | 'right' | 'bottom' | 'left';
  action?: () => void;
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
}

export function Onboarding({ steps, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  useEffect(() => {
    const element = document.querySelector(steps[currentStep].element);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedElement(element);
    }
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Highlight current element */}
      {highlightedElement && (
        <div
          className="absolute bg-white/10 border-2 border-blue-500 rounded-lg pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute pointer-events-auto bg-white rounded-lg shadow-xl p-6 max-w-md"
          style={{
            ...getStepPosition(steps[currentStep].placement, highlightedElement),
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function getStepPosition(
  placement: OnboardingStep['placement'],
  element: Element | null
) {
  if (!element) return {};

  const rect = element.getBoundingClientRect();
  const margin = 20;

  switch (placement) {
    case 'top':
      return {
        bottom: window.innerHeight - rect.top + margin,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'right':
      return {
        left: rect.right + margin,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      };
    case 'bottom':
      return {
        top: rect.bottom + margin,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        right: window.innerWidth - rect.left + margin,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      };
  }
}