import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionalProcessingUnit } from './EmotionalProcessing';
import { KnowledgeGraphService } from './KnowledgeGraph';

describe('EmotionalProcessingUnit', () => {
  let epu: EmotionalProcessingUnit;
  let knowledgeGraph: KnowledgeGraphService;

  beforeEach(() => {
    knowledgeGraph = new KnowledgeGraphService();
    epu = new EmotionalProcessingUnit(knowledgeGraph);
  });

  describe('processEmotionalContent', () => {
    it('should extract emotional context from text', async () => {
      const content = "I'm really excited about this new project and looking forward to working with the team!";
      
      const result = await epu.processEmotionalContent(content);
      
      expect(result.primaryEmotion).toBe('joy');
      expect(result.emotionalState.valence).toBeGreaterThan(0);
      expect(result.emotionalState.arousal).toBeGreaterThan(0.5);
      expect(result.socialContext.groupDynamics).toContain('team_context');
    });

    it('should handle negative emotions', async () => {
      const content = "I'm very frustrated and disappointed with the lack of progress on this task.";
      
      const result = await epu.processEmotionalContent(content);
      
      expect(result.primaryEmotion).toBe('anger');
      expect(result.emotionalState.valence).toBeLessThan(0);
      expect(result.emotionalState.arousal).toBeGreaterThan(0.5);
    });

    it('should detect social dynamics', async () => {
      const content = "We need to work together as a team to resolve this conflict and find a solution.";
      
      const result = await epu.processEmotionalContent(content);
      
      expect(result.socialContext.groupDynamics).toContain('team_context ```
      expect(result.socialContext.groupDynamics).toContain('conflict_resolution');
    });

    it('should maintain emotional memory', async () => {
      const content1 = "This is a great achievement!";
      const content2 = "But there are still some concerns.";
      
      await epu.processEmotionalContent(content1);
      const result = await epu.processEmotionalContent(content2);
      
      expect(result.temporalDynamics.trend).toBe('decreasing');
    });
  });

  describe('task integration', () => {
    it('should enrich tasks with emotional context', async () => {
      const content = "This urgent issue needs immediate attention from the team lead.";
      const emotionalContext = await epu.processEmotionalContent(content);
      
      const task = {
        id: '123',
        title: 'Handle urgent issue',
        description: content,
      };
      
      const enrichedTask = await epu.enrichTaskWithEmotionalContext(task, emotionalContext);
      
      expect(enrichedTask.metadata.emotional.urgency).toBeGreaterThan(0.8);
      expect(enrichedTask.metadata.emotional.priority).toBeGreaterThan(0.7);
      expect(enrichedTask.metadata.emotional.handlingRequirements).toContain('urgent_attention');
    });
  });

  describe('agent recommendations', () => {
    it('should recommend appropriate agent characteristics', async () => {
      const content = "The team is feeling anxious about the upcoming deadline and needs support.";
      const emotionalContext = await epu.processEmotionalContent(content);
      
      const characteristics = await epu.recommendAgentCharacteristics(emotionalContext);
      
      expect(characteristics.empathy).toBeGreaterThan(0.7);
      expect(characteristics.patience).toBeGreaterThan(0.6);
      expect(characteristics.adaptability).toBeGreaterThan(0.5);
    });
  });
});