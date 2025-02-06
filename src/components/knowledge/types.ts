export interface GraphNode {
  id: string;
  label: string;
  group: 'idea' | 'task' | 'agent' | 'skill';
  data: {
    type: string;
    xp?: number;
    status?: string;
    createdAt: Date;
    metadata: Record<string, unknown>;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}