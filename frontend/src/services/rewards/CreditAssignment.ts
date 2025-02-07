import { EventEmitter } from 'events';
import pino from 'pino';
import type { Task, Agent } from '../../lib/types';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

interface CreditShare {
  agentId: string;
  share: number;
  reason: string;
}

export class CreditAssignment extends EventEmitter {
  private contributionHistory: Map<string, Map<string, number>> = new Map();
  private readonly decayFactor = 0.95;
  private readonly minContribution = 0.1;

  assignCredit(
    task: Task,
    totalReward: number,
    participants: {
      agentId: string;
      contribution: number;
      role: 'primary' | 'helper' | 'reviewer';
    }[]
  ): CreditShare[] {
    // Normalize contributions
    const totalContribution = participants.reduce(
      (sum, p) => sum + p.contribution,
      0
    );
    
    // Calculate base shares using hierarchical softmax
    const baseShares = this.calculateHierarchicalShares(
      participants,
      totalContribution
    );

    // Apply role-based adjustments
    const roleMultipliers = {
      primary: 1.0,
      helper: 0.7,
      reviewer: 0.5
    };

    // Calculate final shares with historical contribution adjustment
    const shares = baseShares.map(share => {
      const participant = participants.find(p => p.agentId === share.agentId)!;
      const roleMultiplier = roleMultipliers[participant.role];
      const historicalFactor = this.getHistoricalContribution(
        share.agentId,
        task.id
      );

      return {
        agentId: share.agentId,
        share: share.share * roleMultiplier * (1 + historicalFactor),
        reason: `${participant.role} contributor with ${
          Math.round(participant.contribution / totalContribution * 100)
        }% contribution`
      };
    });

    // Normalize final shares
    const totalShares = shares.reduce((sum, s) => sum + s.share, 0);
    const normalizedShares = shares.map(share => ({
      ...share,
      share: (share.share / totalShares) * totalReward
    }));

    // Update contribution history
    this.updateContributionHistory(task.id, normalizedShares);

    logger.debug({
      taskId: task.id,
      totalReward,
      shares: normalizedShares
    }, 'Credit assignment completed');

    return normalizedShares;
  }

  private calculateHierarchicalShares(
    participants: {
      agentId: string;
      contribution: number;
      role: string;
    }[],
    totalContribution: number
  ): { agentId: string; share: number }[] {
    // Sort participants by contribution
    const sorted = [...participants].sort(
      (a, b) => b.contribution - a.contribution
    );

    // Apply hierarchical softmax
    let remainingShare = 1.0;
    const shares: { agentId: string; share: number }[] = [];

    sorted.forEach((participant, index) => {
      const relativeContribution = participant.contribution / totalContribution;
      let share: number;

      if (index === sorted.length - 1) {
        // Last participant gets remaining share
        share = remainingShare;
      } else {
        // Calculate share using softmax
        share = remainingShare * relativeContribution;
        remainingShare -= share;
      }

      shares.push({
        agentId: participant.agentId,
        share: Math.max(this.minContribution, share)
      });
    });

    return shares;
  }

  private getHistoricalContribution(
    agentId: string,
    taskId: string
  ): number {
    const history = this.contributionHistory.get(taskId);
    if (!history) return 0;

    const contribution = history.get(agentId) || 0;
    return Math.log1p(contribution) * 0.1; // Small boost based on history
  }

  private updateContributionHistory(
    taskId: string,
    shares: CreditShare[]
  ): void {
    if (!this.contributionHistory.has(taskId)) {
      this.contributionHistory.set(taskId, new Map());
    }

    const history = this.contributionHistory.get(taskId)!;

    // Apply decay to existing contributions
    for (const [agentId, value] of history) {
      history.set(agentId, value * this.decayFactor);
    }

    // Add new contributions
    shares.forEach(share => {
      const current = history.get(share.agentId) || 0;
      history.set(share.agentId, current + share.share);
    });
  }

  getContributionStats(taskId: string) {
    const history = this.contributionHistory.get(taskId);
    if (!history) return null;

    return {
      contributions: Array.from(history.entries()).map(([agentId, value]) => ({
        agentId,
        value,
      })),
      totalValue: Array.from(history.values()).reduce((a, b) => a + b, 0),
    };
  }
}