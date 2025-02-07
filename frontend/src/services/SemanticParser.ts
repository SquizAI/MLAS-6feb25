import { EventEmitter } from 'events';
import natural from 'natural';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import type { Idea } from '../lib/types';

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

interface Entity {
  id: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'concept' | 'action';
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  metadata: Record<string, unknown>;
}

interface Relationship {
  id: string;
  type: string;
  sourceEntityId: string;
  targetEntityId: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

interface SemanticAnalysis {
  entities: Entity[];
  relationships: Relationship[];
  keywords: string[];
  summary: string;
  sentiment: {
    score: number;  // Range: -1 to 1
    magnitude: number;  // Range: 0 to 1
    aspects: Array<{
      text: string;
      score: number;
    }>;
  };
  intent: {
    primary: string;
    confidence: number;
    secondary: string[];
  };
  language: {
    detected: string;
    confidence: number;
  };
  domainSpecific: {
    terms: Array<{
      term: string;
      type: string;
      confidence: number;
    }>;
    concepts: string[];
  };
}

export class SemanticParserService extends EventEmitter {
  private tokenizer: natural.WordTokenizer;
  private tagger: natural.BrillPOSTagger;
  private stemmer: natural.PorterStemmer;
  private sentimentAnalyzer: natural.SentimentAnalyzer;
  private tfidf: natural.TfIdf;
  private domainDictionary: Map<string, string[]>;

  constructor() {
    super();
    this.initializeNLPComponents();
    this.loadDomainDictionary();
  }

  private initializeNLPComponents() {
    logger.info('Initializing NLP components');
    
    this.tokenizer = new natural.WordTokenizer();
    this.tagger = new natural.BrillPOSTagger();
    this.stemmer = natural.PorterStemmer;
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', this.stemmer, 'afinn');
    this.tfidf = new natural.TfIdf();
  }

  private loadDomainDictionary() {
    // Initialize domain-specific terminology
    this.domainDictionary = new Map([
      ['technical', ['api', 'database', 'server', 'cloud', 'deployment']],
      ['business', ['revenue', 'client', 'project', 'deadline', 'budget']],
      ['action', ['implement', 'develop', 'review', 'analyze', 'optimize']],
    ]);
  }

  async parseIdea(idea: Idea): Promise<SemanticAnalysis> {
    try {
      logger.info({ ideaId: idea.id }, 'Starting semantic analysis');

      const tokens = this.tokenizer.tokenize(idea.content);
      const taggedTokens = this.tagger.tag(tokens);

      // Parallel processing of different analysis aspects
      const [
        entities,
        keywords,
        sentiment,
        intent,
        domainTerms
      ] = await Promise.all([
        this.extractEntities(taggedTokens, idea.content),
        this.extractKeywords(tokens),
        this.analyzeSentiment(tokens),
        this.detectIntent(tokens, taggedTokens),
        this.extractDomainTerms(tokens)
      ]);

      // Extract relationships after we have entities
      const relationships = await this.identifyRelationships(entities, idea.content);

      const analysis: SemanticAnalysis = {
        entities,
        relationships,
        keywords,
        summary: await this.generateSummary(tokens, entities),
        sentiment,
        intent,
        language: {
          detected: 'en', // TODO: Implement language detection
          confidence: 1.0
        },
        domainSpecific: {
          terms: domainTerms,
          concepts: await this.extractConcepts(entities, relationships)
        }
      };

      logger.info({ 
        ideaId: idea.id,
        entityCount: entities.length,
        relationshipCount: relationships.length
      }, 'Semantic analysis completed');

      return analysis;

    } catch (error) {
      logger.error({ error, ideaId: idea.id }, 'Semantic analysis failed');
      throw error;
    }
  }

  private async extractEntities(
    taggedTokens: natural.BrillPOSTagger.TaggedWord[],
    originalText: string
  ): Promise<Entity[]> {
    const entities: Entity[] = [];
    let currentEntity: Partial<Entity> | null = null;

    for (let i = 0; i < taggedTokens.length; i++) {
      const { token, tag } = taggedTokens[i];
      
      // Named entity recognition based on POS tags
      if (tag.startsWith('NN')) { // Noun
        if (!currentEntity) {
          currentEntity = {
            id: uuidv4(),
            text: token,
            startIndex: originalText.indexOf(token),
            endIndex: originalText.indexOf(token) + token.length,
            confidence: 0.8,
            metadata: {}
          };
        } else {
          currentEntity.text += ` ${token}`;
          currentEntity.endIndex = originalText.indexOf(token) + token.length;
        }
      } else if (currentEntity) {
        entities.push(this.classifyEntity(currentEntity));
        currentEntity = null;
      }
    }

    // Don't forget the last entity
    if (currentEntity) {
      entities.push(this.classifyEntity(currentEntity));
    }

    return entities;
  }

  private classifyEntity(entity: Partial<Entity>): Entity {
    // Simple rule-based entity classification
    const text = entity.text?.toLowerCase() || '';
    let type: Entity['type'] = 'concept';

    if (this.domainDictionary.get('action')?.some(term => text.includes(term))) {
      type = 'action';
    } else if (/\d{4}-\d{2}-\d{2}/.test(text)) {
      type = 'date';
    } else if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(entity.text || '')) {
      type = 'person';
    }

    return {
      id: entity.id!,
      type,
      text: entity.text!,
      startIndex: entity.startIndex!,
      endIndex: entity.endIndex!,
      confidence: entity.confidence!,
      metadata: entity.metadata || {}
    };
  }

  private async extractKeywords(tokens: string[]): Promise<string[]> {
    this.tfidf.addDocument(tokens);
    
    return this.tfidf
      .listTerms(0)
      .slice(0, 10)
      .map(item => item.term);
  }

  private async analyzeSentiment(tokens: string[]): Promise<SemanticAnalysis['sentiment']> {
    const score = this.sentimentAnalyzer.getSentiment(tokens);
    
    // Analyze aspect-based sentiment
    const aspects: Array<{ text: string; score: number }> = [];
    const windowSize = 5;
    
    for (let i = 0; i < tokens.length - windowSize; i++) {
      const window = tokens.slice(i, i + windowSize);
      const windowScore = this.sentimentAnalyzer.getSentiment(window);
      
      if (Math.abs(windowScore) > 0.3) { // Only include significant sentiment
        aspects.push({
          text: window.join(' '),
          score: windowScore
        });
      }
    }

    return {
      score: Math.max(-1, Math.min(1, score)), // Normalize to [-1, 1]
      magnitude: Math.abs(score),
      aspects: aspects.slice(0, 5) // Top 5 most significant aspects
    };
  }

  private async detectIntent(
    tokens: string[],
    taggedTokens: natural.BrillPOSTagger.TaggedWord[]
  ): Promise<SemanticAnalysis['intent']> {
    // Simple rule-based intent detection
    const actionVerbs = taggedTokens
      .filter(({ tag }) => tag.startsWith('VB'))
      .map(({ token }) => token.toLowerCase());

    const intents = new Map([
      ['request', ['need', 'want', 'request', 'please']],
      ['inform', ['tell', 'inform', 'notify', 'announce']],
      ['question', ['what', 'why', 'how', 'when', 'where']],
      ['task', ['do', 'make', 'create', 'implement']],
    ]);

    let primaryIntent = 'unknown';
    let maxConfidence = 0;
    const secondaryIntents: string[] = [];

    for (const [intent, keywords] of intents) {
      const matches = actionVerbs.filter(verb => keywords.includes(verb));
      const confidence = matches.length / keywords.length;
      
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        primaryIntent = intent;
      } else if (confidence > 0.3) {
        secondaryIntents.push(intent);
      }
    }

    return {
      primary: primaryIntent,
      confidence: maxConfidence,
      secondary: secondaryIntents
    };
  }

  private async extractDomainTerms(tokens: string[]): Promise<SemanticAnalysis['domainSpecific']['terms']> {
    const terms: SemanticAnalysis['domainSpecific']['terms'] = [];

    for (const [domain, keywords] of this.domainDictionary) {
      const matches = tokens.filter(token => 
        keywords.some(keyword => 
          natural.JaroWinklerDistance(token.toLowerCase(), keyword) > 0.9
        )
      );

      matches.forEach(match => {
        terms.push({
          term: match,
          type: domain,
          confidence: 0.8 // Could be improved with more sophisticated matching
        });
      });
    }

    return terms;
  }

  private async identifyRelationships(
    entities: Entity[],
    originalText: string
  ): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    // Find entities that are close to each other in the text
    for (let i = 0; i < entities.length - 1; i++) {
      const source = entities[i];
      const target = entities[i + 1];
      
      // If entities are within 10 words of each other
      if (target.startIndex - source.endIndex < 50) {
        const relationText = originalText.slice(
          source.endIndex,
          target.startIndex
        ).trim();

        if (relationText) {
          relationships.push({
            id: uuidv4(),
            type: this.classifyRelationship(relationText),
            sourceEntityId: source.id,
            targetEntityId: target.id,
            confidence: 0.7,
            metadata: {
              text: relationText
            }
          });
        }
      }
    }

    return relationships;
  }

  private classifyRelationship(text: string): string {
    // Simple rule-based relationship classification
    const relationTypes = new Map([
      ['depends_on', ['requires', 'needs', 'depends']],
      ['part_of', ['contains', 'includes', 'part of']],
      ['follows', ['after', 'following', 'then']],
      ['causes', ['causes', 'leads to', 'results in']],
    ]);

    for (const [type, keywords] of relationTypes) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return type;
      }
    }

    return 'related_to';
  }

  private async generateSummary(
    tokens: string[],
    entities: Entity[]
  ): Promise<string> {
    // Simple extractive summarization
    const sentences = natural.SentenceTokenizer.tokenize(tokens.join(' '));
    
    // Score sentences based on entity presence
    const sentenceScores = sentences.map(sentence => {
      const score = entities.filter(entity => 
        sentence.toLowerCase().includes(entity.text.toLowerCase())
      ).length;
      return { sentence, score };
    });

    // Return top sentence as summary
    return sentenceScores
      .sort((a, b) => b.score - a.score)
      [0].sentence;
  }

  private async extractConcepts(
    entities: Entity[],
    relationships: Relationship[]
  ): Promise<string[]> {
    // Extract high-level concepts based on entity and relationship patterns
    const concepts = new Set<string>();

    // Add all action entities as concepts
    entities
      .filter(e => e.type === 'action')
      .forEach(e => concepts.add(e.text));

    // Add strongly connected entities (those with multiple relationships)
    const entityConnections = new Map<string, number>();
    
    relationships.forEach(rel => {
      entityConnections.set(
        rel.sourceEntityId,
        (entityConnections.get(rel.sourceEntityId) || 0) + 1
      );
      entityConnections.set(
        rel.targetEntityId,
        (entityConnections.get(rel.targetEntityId) || 0) + 1
      );
    });

    // Add entities with multiple connections as concepts
    for (const [entityId, count] of entityConnections) {
      if (count > 1) {
        const entity = entities.find(e => e.id === entityId);
        if (entity) {
          concepts.add(entity.text);
        }
      }
    }

    return Array.from(concepts);
  }
}