import React from 'react';
import FeatureWrapper from './FeatureWrapper';
import ScheduleManager from '../dashboard/ScheduleManager';
import MealPlanner from '../dashboard/MealPlanner';
import TravelPlanner from '../dashboard/TravelPlanner';
import EmailManager from '../dashboard/EmailManager';

interface FeatureContainerProps {
  type: 'schedule' | 'meals' | 'travel' | 'email';
}

const featureConfigs = {
  schedule: {
    id: 'schedule-manager',
    type: 'schedule' as const,
    agentId: 'task-coordinator',
    component: ScheduleManager
  },
  meals: {
    id: 'meal-planner',
    type: 'meals' as const,
    agentId: 'data-analyzer',
    component: MealPlanner
  },
  travel: {
    id: 'travel-planner',
    type: 'travel' as const,
    agentId: 'research-agent',
    component: TravelPlanner
  },
  email: {
    id: 'email-manager',
    type: 'email' as const,
    agentId: 'data-analyzer',
    component: EmailManager
  }
};

export default function FeatureContainer({ type }: FeatureContainerProps) {
  const config = featureConfigs[type];
  const FeatureComponent = config.component;

  return (
    <FeatureWrapper feature={config}>
      <FeatureComponent />
    </FeatureWrapper>
  );
}