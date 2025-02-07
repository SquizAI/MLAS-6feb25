import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { tokenize, analyzeSentiment, extractKeywords, calculateSimilarity } from '../lib/nlp/sentiment';
import type { Idea } from '../lib/types';
import { KnowledgeGraphService } from './KnowledgeGraph';
import { logger } from '../lib/logger';

interface EmotionalState {
  valence: number;     // -1 to 1: negative to positive
  arousal: number;     // 0 to 1: calm to excited
  dominance: number;   // 0 to 1: submissive to dominant
  intensity: number;   // 0 to 1: strength of emotion
  confidence: number;  // 0 to 1: confidence in assessment
}

interface EmotionalContext {
  primaryEmotion: string;
  secondaryEmotions: string[];
  emotionalState: EmotionalState;
  temporalDynamics: {
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
    duration: number;
  };
  socialContext: {
    interpersonal: string[];
    groupDynamics: string[];
    powerRelations: string[];
  };
}

interface SynapticWeight {
  id: string;
  sourceNeuron: string;
  targetNeuron: string;
  weight: number;
  lastUpdate: Date;
  metadata: {
    emotionalPathway: string;
    confidence: number;
    adaptationRate: number;
  };
}

interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  emotions: string[];
  socialContext: {
    groupDynamics: string[];
  };
}

export class EmotionalProcessingUnit extends EventEmitter {
  private snn: Map<string, number>;  // Spiking Neural Network state
  private synapticWeights: Map<string, SynapticWeight>;
  private emotionalMemory: Map<string, EmotionalContext[]>;
  private adaptationRates: Map<string, number>;
  private afinn: Record<string, number>;
  
  // Temporal integration parameters
  private readonly tau: number = 20;  // Time constant (ms)
  private readonly threshold: number = 0.5;
  private readonly refractoryPeriod: number = 5;
  private readonly decayRate: number = 0.95;

  constructor(private knowledgeGraph: KnowledgeGraphService) {
    super();
    this.snn = new Map();
    this.synapticWeights = new Map();
    this.emotionalMemory = new Map();
    this.adaptationRates = new Map();
    this.afinn = this.loadAfinnLexicon();
    this.initializeNetwork();
  }

  private loadAfinnLexicon(): Record<string, number> {
    // Simplified AFINN lexicon with common emotional words
    return {
      'good': 3,
      'great': 4,
      'excellent': 5,
      'bad': -3,
      'terrible': -4,
      'awful': -5,
      'happy': 4,
      'sad': -4,
      'angry': -4,
      'excited': 3,
      'love': 4,
      'hate': -4,
      'wonderful': 4,
      'horrible': -4,
      'amazing': 4,
      'urgent': -2,
      'important': 2,
      'critical': -2,
      'success': 3,
      'failure': -3,
      'help': 2,
      'problem': -2,
      'easy': 2,
      'difficult': -2,
      'perfect': 5,
      'worst': -5
    };
  }

  private analyzeSentiment(tokens: string[]): number {
    let total = 0;
    let words = 0;
    
    tokens.forEach(token => {
      const word = token.toLowerCase();
      if (this.afinn[word]) {
        total += this.afinn[word];
        words++;
      }
    });
    
    return words > 0 ? Math.max(-1, Math.min(1, total / (words * 5))) : 0;
  }

  private initializeNetwork() {
    // Initialize core emotional pathways
    const emotionalPathways = [
      'valence', 'arousal', 'dominance',
      'joy', 'sadness', 'anger', 'fear',
      'trust', 'disgust', 'anticipation', 'surprise'
    ];

    // Create neuronal populations for each pathway
    emotionalPathways.forEach(pathway => {
      // Input layer neurons
      for (let i = 0; i < 50; i++) {
        this.createNeuron(`${pathway}_input_${i}`, pathway);
      }

      // Hidden layer neurons
      for (let i = 0; i < 100; i++) {
        this.createNeuron(`${pathway}_hidden_${i}`, pathway);
      }

      // Output layer neurons
      for (let i = 0; i < 25; i++) {
        this.createNeuron(`${pathway}_output_${i}`, pathway);
      }
    });

    // Initialize synaptic connections
    this.initializeSynapticConnections();

    logger.info('Emotional processing network initialized');
  }

  private createNeuron(id: string, pathway: string) {
    this.snn.set(id, 0);  // Initial membrane potential
    this.adaptationRates.set(id, 0.1);  // Initial adaptation rate
  }

  private initializeSynapticConnections() {
    // Create connections between neurons
    for (const [sourceId] of this.snn) {
      for (const [targetId] of this.snn) {
        if (sourceId !== targetId && Math.random() < 0.1) {  // 10% connectivity
          const weight: SynapticWeight = {
            id: uuidv4(),
            sourceNeuron: sourceId,
            targetNeuron: targetId,
            weight: (Math.random() * 2 - 1) * 0.1,  // Small initial weights
            lastUpdate: new Date(),
            metadata: {
              emotionalPathway: sourceId.split('_')[0],
              confidence: 0.5,
              adaptationRate: 0.1
            }
          };
          this.synapticWeights.set(weight.id, weight);
        }
      }
    }
  }

  async processEmotionalContent(
    content: string,
    context?: Record<string, unknown>
  ): Promise<EmotionalContext> {
    try {
      logger.debug({ content }, 'Processing emotional content');

      // Tokenize and prepare input
      const tokens = await this.preprocessInput(content);
      
      // Extract base emotional features
      const baseEmotions = await this.extractBaseEmotions(tokens);
      
      // Process through SNN
      const emotionalState = await this.processThroughSNN(baseEmotions);
      
      // Analyze temporal dynamics
      const temporalDynamics = this.analyzeTemporalDynamics(
        emotionalState,
        context?.previousStates as EmotionalState[]
      );

      // Extract social context
      const socialContext = await this.extractSocialContext(content);

      // Combine into emotional context
      const emotionalContext: EmotionalContext = {
        primaryEmotion: this.determinePrimaryEmotion(emotionalState),
        secondaryEmotions: this.determineSecondaryEmotions(emotionalState),
        emotionalState,
        temporalDynamics,
        socialContext
      };

      // Update emotional memory
      this.updateEmotionalMemory(content, emotionalContext);

      // Emit event for monitoring
      this.emit('emotional:processed', {
        contentId: uuidv4(),
        emotionalContext
      });

      logger.info({
        primaryEmotion: emotionalContext.primaryEmotion,
        emotionalState: emotionalContext.emotionalState
      }, 'Emotional content processed');

      return emotionalContext;

    } catch (error) {
      logger.error({ error }, 'Failed to process emotional content');
      throw error;
    }
  }

  private async preprocessInput(content: string): Promise<string[]> {
    return tokenize(content);
  }

  private async extractBaseEmotions(
    tokens: string[]
  ): Promise<Record<string, number>> {
    const emotions: Record<string, number> = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      trust: 0,
      disgust: 0,
      anticipation: 0,
      surprise: 0
    };

    // Emotion lexicon matching
    const emotionLexicon = new Map([
      ['joy', ['happy', 'delighted', 'excited', 'pleased']],
      ['sadness', ['sad', 'disappointed', 'unhappy', 'depressed']],
      ['anger', ['angry', 'furious', 'irritated', 'annoyed']],
      ['fear', ['afraid', 'scared', 'worried', 'anxious']],
      ['trust', ['trust', 'believe', 'confident', 'reliable']],
      ['disgust', ['disgusted', 'repulsed', 'revolted']],
      ['anticipation', ['expect', 'anticipate', 'await']],
      ['surprise', ['surprised', 'amazed', 'astonished']]
    ]);

    // Calculate emotion scores
    tokens.forEach(token => {
      const word = token.toLowerCase();
      for (const [emotion, keywords] of emotionLexicon) {
        if (keywords.includes(word)) {
          emotions[emotion] += 1;
        }
      }
    });

    // Normalize scores
    const maxScore = Math.max(...Object.values(emotions));
    if (maxScore > 0) {
      for (const emotion in emotions) {
        emotions[emotion] /= maxScore;
      }
    }

    return emotions;
  }

  private async processThroughSNN(
    baseEmotions: Record<string, number>
  ): Promise<EmotionalState> {
    // Reset network state
    for (const [neuronId] of this.snn) {
      this.snn.set(neuronId, 0);
    }

    // Input phase - inject emotional signals
    for (const [emotion, intensity] of Object.entries(baseEmotions)) {
      const inputNeurons = Array.from(this.snn.keys())
        .filter(id => id.startsWith(`${emotion}_input_`));
      
      inputNeurons.forEach(neuronId => {
        this.snn.set(neuronId, intensity);
      });
    }

    // Process through network
    const iterations = 50;  // Number of time steps
    for (let t = 0; t < iterations; t++) {
      // Update each neuron
      for (const [neuronId, potential] of this.snn) {
        // Get incoming connections
        const incomingConnections = Array.from(this.synapticWeights.values())
          .filter(w => w.targetNeuron === neuronId);

        // Calculate input current
        const inputCurrent = incomingConnections.reduce((sum, connection) => {
          const sourcePotential = this.snn.get(connection.sourceNeuron) || 0;
          return sum + sourcePotential * connection.weight;
        }, 0);

        // Update membrane potential
        const newPotential = this.updateNeuronPotential(
          potential,
          inputCurrent,
          this.adaptationRates.get(neuronId) || 0.1
        );

        this.snn.set(neuronId, newPotential);
      }
    }

    // Extract emotional state from output layer
    return this.extractEmotionalState();
  }

  private updateNeuronPotential(
    current: number,
    input: number,
    adaptationRate: number
  ): number {
    // Leaky integrate-and-fire model
    const leak = current * this.decayRate;
    const newPotential = leak + input * adaptationRate;

    // Apply threshold and refractory period
    if (newPotential > this.threshold) {
      return 0;  // Reset after spike
    }

    return Math.max(0, Math.min(1, newPotential));
  }

  private extractEmotionalState(): EmotionalState {
    // Calculate average output activations for each dimension
    const dimensions = ['valence', 'arousal', 'dominance'];
    const state: Partial<EmotionalState> = {};

    dimensions.forEach(dim => {
      const outputNeurons = Array.from(this.snn.entries())
        .filter(([id]) => id.startsWith(`${dim}_output_`));
      
      const avgActivation = outputNeurons.reduce(
        (sum, [_, value]) => sum + value, 0
      ) / outputNeurons.length;

      state[dim as keyof EmotionalState] = avgActivation;
    });

    // Calculate intensity and confidence
    const intensity = Math.sqrt(
      Object.values(state).reduce((sum, val) => sum + val * val, 0)
    );

    const confidence = this.calculateConfidence(state as EmotionalState);

    return {
      valence: state.valence || 0,
      arousal: state.arousal || 0,
      dominance: state.dominance || 0,
      intensity,
      confidence
    };
  }

  private calculateConfidence(state: EmotionalState): number {
    // Confidence based on:
    // 1. Consistency of neuron responses
    // 2. Strength of emotional signals
    // 3. Historical accuracy

    const signalStrength = state.intensity;
    const consistency = this.calculateNeuronConsistency();
    const historicalAccuracy = this.getHistoricalAccuracy();

    return (signalStrength * 0.4 + consistency * 0.4 + historicalAccuracy * 0.2);
  }

  private calculateNeuronConsistency(): number {
    // Calculate variance in neuron populations
    const variances = new Map<string, number>();

    for (const pathway of ['valence', 'arousal', 'dominance']) {
      const neurons = Array.from(this.snn.entries())
        .filter(([id]) => id.startsWith(pathway));
      
      const values = neurons.map(([_, val]) => val);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce(
        (sum, val) => sum + Math.pow(val - mean, 2), 0
      ) / values.length;

      variances.set(pathway, variance);
    }

    // Lower variance indicates higher consistency
    const avgVariance = Array.from(variances.values())
      .reduce((sum, val) => sum + val, 0) / variances.size;

    return Math.max(0, 1 - avgVariance);
  }

  private getHistoricalAccuracy(): number {
    // Placeholder - would be based on feedback and validation
    return 0.8;
  }

  private analyzeTemporalDynamics(
    currentState: EmotionalState,
    previousStates?: EmotionalState[]
  ) {
    if (!previousStates || previousStates.length === 0) {
      return {
        trend: 'stable' as const,
        volatility: 0,
        duration: 0
      };
    }

    // Calculate emotional trajectory
    const valenceChanges = previousStates.map((state, i) => {
      if (i === 0) return 0;
      return state.valence - previousStates[i - 1].valence;
    });

    // Determine trend
    const recentChange = currentState.valence - previousStates[previousStates.length - 1].valence;
    const trend = Math.abs(recentChange) < 0.1 
      ? 'stable' 
      : recentChange > 0 
        ? 'increasing' 
        : 'decreasing';

    // Calculate volatility
    const volatility = Math.sqrt(
      valenceChanges.reduce((sum, change) => sum + change * change, 0) / 
      valenceChanges.length
    );

    // Estimate duration of current emotional state
    const similarStates = previousStates.filter(state => 
      Math.abs(state.valence - currentState.valence) < 0.2
    );
    const duration = similarStates.length;

    return { trend, volatility, duration };
  }

  private async extractSocialContext(
    content: string
  ): Promise<EmotionalContext['socialContext']> {
    return {
      interpersonal: this.extractInterpersonalDynamics(content),
      groupDynamics: this.extractGroupDynamics(content),
      powerRelations: this.extractPowerRelations(content)
    };
  }

  private extractInterpersonalDynamics(content: string): string[] {
    const dynamics: string[] = [];
    
    // Check for relationship indicators
    if (content.match(/\b(agree|disagree|support|oppose)\b/i)) {
      dynamics.push('agreement_disagreement');
    }
    
    if (content.match(/\b(help|assist|collaborate|work together)\b/i)) {
      dynamics.push('collaboration');
    }
    
    if (content.match(/\b(trust|doubt|believe|skeptical)\b/i)) {
      dynamics.push('trust_dynamics');
    }

    return dynamics;
  }

  private extractGroupDynamics(content: string): string[] {
    const dynamics: string[] = [];
    
    // Check for group-level indicators
    if (content.match(/\b(team|group|everyone|all of us)\b/i)) {
      dynamics.push('team_context');
    }
    
    if (content.match(/\b(consensus|agree|alignment|vision)\b/i)) {
      dynamics.push('group_alignment');
    }
    
    if (content.match(/\b(conflict|tension|resolution|mediate)\b/i)) {
      dynamics.push('conflict_resolution');
    }

    return dynamics;
  }

  private extractPowerRelations(content: string): string[] {
    const relations: string[] = [];
    
    // Check for hierarchy and authority indicators
    if (content.match(/\b(approve|authorize|permission|allow)\b/i)) {
      relations.push('authority_dynamic');
    }
    
    if (content.match(/\b(lead|direct|assign|delegate)\b/i)) {
      relations.push('leadership_dynamic');
    }
    
    if (content.match(/\b(report|update|status|progress)\b/i)) {
      relations.push('reporting_dynamic');
    }

    return relations;
  }

  private determinePrimaryEmotion(state: EmotionalState): string {
    // Map emotional state to discrete emotion
    const emotions = new Map([
      ['joy', { valence: 0.8, arousal: 0.6, dominance: 0.7 }],
      ['sadness', { valence: -0.8, arousal: -0.4, dominance: -0.5 }],
      ['anger', { valence: -0.6, arousal: 0.8, dominance: 0.7 }],
      ['fear', { valence: -0.7, arousal: 0.7, dominance: -0.6 }],
      ['trust', { valence: 0.6, arousal: 0.2, dominance: 0.3 }],
      ['disgust', { valence: -0.8, arousal: 0.3, dominance: 0.4 }],
      ['anticipation', { valence: 0.4, arousal: 0.5, dominance: 0.3 }],
      ['surprise', { valence: 0.1, arousal: 0.8, dominance: 0.0 }],
    ]);

    let closestEmotion = '';
    let minDistance = Infinity;

    for (const [emotion, prototype] of emotions) {
      const distance = Math.sqrt(
        Math.pow(state.valence - prototype.valence, 2) +
        Math.pow(state.arousal - prototype.arousal, 2) +
        Math.pow(state.dominance - prototype.dominance, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestEmotion = emotion;
      }
    }

    return closestEmotion;
  }

  private determineSecondaryEmotions(state: EmotionalState): string[] {
    // Similar to primary emotion but returns multiple emotions
    // that are within a certain threshold distance
    const threshold = 0.3;
    const emotions = new Map([
      ['joy', { valence: 0.8, arousal: 0.6, dominance: 0.7 }],
      ['sadness', { valence: -0.8, arousal: -0.4, dominance: -0.5 }],
      ['anger', { valence: -0.6, arousal: 0.8, dominance: 0.7 }],
      ['fear', { valence: -0.7, arousal: 0.7, dominance: -0.6 }],
      ['trust', { valence: 0.6, arousal: 0.2, dominance: 0.3 }],
      ['disgust', { valence: -0.8, arousal: 0.3, dominance: 0.4 }],
      ['anticipation', { valence: 0.4, arousal: 0.5, dominance: 0.3 }],
      ['surprise', { valence: 0.1, arousal: 0.8, dominance: 0.0 }],
    ]);

    const secondaryEmotions: string[] = [];

    for (const [emotion, prototype] of emotions) {
      const distance = Math.sqrt(
        Math.pow(state.valence - prototype.valence, 2) +
        Math.pow(state.arousal - prototype.arousal, 2) +
        Math.pow(state.dominance - prototype.dominance, 2)
      );

      if (distance < threshold) {
        secondaryEmotions.push(emotion);
      }
    }

    return secondaryEmotions;
  }

  private updateEmotionalMemory(
    content: string,
    context: EmotionalContext
  ) {
    // Generate content hash or ID
    const contentId = uuidv4();
    
    // Get existing memory
    const memory = this.emotionalMemory.get(contentId) || [];
    
    // Add new context
    memory.push(context);
    
    // Keep only recent history
    if (memory.length > 100) {
      memory.shift();
    }
    
    this.emotionalMemory.set(contentId, memory);

    // Update synaptic weights based on new emotional context
    this.updateSynapticWeights(context);
  }

  private updateSynapticWeights(context: EmotionalContext) {
    // Hebbian learning: neurons that fire together, wire together
    for (const [weightId, weight] of this.synapticWeights) {
      const sourceActivity = this.snn.get(weight.sourceNeuron) || 0;
      const targetActivity = this.snn.get(weight.targetNeuron) || 0;
      
      // Calculate weight update based on correlated activity
      const update = sourceActivity * targetActivity * weight.metadata.adaptationRate;
      
      // Update weight with decay
      const newWeight = (weight.weight + update) * this.decayRate;
      
      // Update confidence based on emotional context
      const confidenceUpdate = context.emotionalState.confidence * 0.1;
      
      this.synapticWeights.set(weightId, {
        ...weight,
        weight: newWeight,
        lastUpdate: new Date(),
        metadata: {
          ...weight.metadata,
          confidence: Math.min(1, weight.metadata.confidence + confidenceUpdate)
        }
      });
    }
  }

  // Integration with task decomposition
  async enrichTaskWithEmotionalContext(task: any, emotionalContext: EmotionalContext) {
    // Add emotional metadata to task
    return {
      ...task,
      metadata: {
        ...task.metadata,
        emotional: {
          urgency: this.calculateTaskUrgency(emotionalContext),
          priority: this.calculateTaskPriority(emotionalContext),
          sensitivity: this.calculateTaskSensitivity(emotionalContext),
          handlingRequirements: this.determineHandlingRequirements(emotionalContext)
        }
      }
    };
  }

  private calculateTaskUrgency(context: EmotionalContext): number {
    // Combine arousal and dominance with temporal dynamics
    const baseUrgency = (context.emotionalState.arousal + context.emotionalState.dominance) / 2;
    
    // Adjust based on temporal trend
    const trendMultiplier = context.temporalDynamics.trend === 'increasing' ? 1.2 :
                           context.temporalDynamics.trend === 'decreasing' ? 0.8 : 1;
    
    return Math.min(1, baseUrgency * trendMultiplier);
  }

  private calculateTaskPriority(context: EmotionalContext): number {
    // Consider emotional intensity and social context
    let priority = context.emotionalState.intensity;
    
    // Adjust for power relations
    if (context.socialContext.powerRelations.includes('authority_dynamic')) {
      priority *= 1.2;
    }
    
    // Adjust for group impact
    if (context.socialContext.groupDynamics.includes('team_context')) {
      priority *= 1.1;
    }
    
    return Math.min(1, priority);
  }

  private calculateTaskSensitivity(context: EmotionalContext): number {
    // Higher sensitivity for negative emotions or complex social dynamics
    let sensitivity = 0;
    
    if (context.emotionalState.valence < 0) {
      sensitivity += Math.abs(context.emotionalState.valence);
    }
    
    if (context.socialContext.interpersonal.includes('trust_dynamics')) {
      sensitivity += 0.3;
    }
    
    if (context.socialContext.groupDynamics.includes('conflict_resolution')) {
      sensitivity += 0.4;
    }
    
    return Math.min(1, sensitivity);
  }

  private determineHandlingRequirements(
    context: EmotionalContext
  ): string[] {
    const requirements: string[] = [];
    
    // Add requirements based on emotional context
    if (context.emotionalState.valence < -0.5) {
      requirements.push('emotional_support');
    }
    
    if (context.emotionalState.arousal > 0.7) {
      requirements.push('urgent_attention');
    }
    
    if (context.socialContext.groupDynamics.includes('conflict_resolution')) {
      requirements.push('mediation_skills');
    }
    
    return requirements;
  }

  // Integration with agent formation
  async recommendAgentCharacteristics(
    emotionalContext: EmotionalContext
  ): Promise<Record<string, number>> {
    return {
      empathy: this.calculateRequiredEmpathy(emotionalContext),
      patience: this.calculateRequiredPatience(emotionalContext),
      assertiveness: this.calculateRequiredAssertiveness(emotionalContext),
      adaptability: this.calculateRequiredAdaptability(emotionalContext)
    };
  }

  private calculateRequiredEmpathy(context: EmotionalContext): number {
    // Higher empathy for negative emotions and interpersonal dynamics
    let empathy = 0.5;  // Base level
    
    if (context.emotionalState.valence < 0) {
      empathy += Math.abs(context.emotionalState.valence) * 0.3;
    }
    
    if (context.socialContext.interpersonal.length > 0) {
      empathy += 0.2;
    }
    
    return Math.min(1, empathy);
  }

  private calculateRequiredPatience(context: EmotionalContext): number {
    // Higher patience for high arousal or complex situations
    let patience = 0.5;  // Base level
    
    if (context.emotionalState.arousal > 0.7) {
      patience += 0.3;
    }
    
    if (context.temporalDynamics.volatility > 0.5) {
      patience += 0.2;
    }
    
    return Math.min(1, patience);
  }

  private calculateRequiredAssertiveness(context: EmotionalContext): number {
    // Higher assertiveness for high dominance or leadership contexts
    let assertiveness = 0.5;  // Base level
    
    if (context.emotionalState.dominance > 0.7) {
      assertiveness += 0.3;
    }
    
    if (context.socialContext.powerRelations.includes('leadership_ dynamic')) {
      assertiveness += 0.2;
    }
    
    return Math.min(1, assertiveness);
  }

  private calculateRequiredAdaptability(context: EmotionalContext): number {
    // Higher adaptability for volatile or complex situations
    let adaptability = 0.5;  // Base level
    
    if (context.temporalDynamics.volatility > 0.5) {
      adaptability += 0.3;
    }
    
    if (context.socialContext.groupDynamics.length > 1) {
      adaptability += 0.2;
    }
    
    return Math.min(1, adaptability);
  }

  async analyze(text: string): Promise<AnalysisResult> {
    // Implementation would typically call an AI service or use a sentiment analysis library
    return {
      sentiment: 'mixed',
      emotions: ['satisfaction', 'concern'],
      socialContext: {
        groupDynamics: ['team_context', 'conflict_resolution']
      }
    };
  }
}