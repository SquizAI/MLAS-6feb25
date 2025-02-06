import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function KnowledgeGraph() {
  const graphData = {
    nodes: [
      { id: 'idea1', group: 'idea', label: 'Customer Feedback Analysis' },
      { id: 'task1', group: 'task', label: 'Analyze Sentiment' },
      { id: 'task2', group: 'task', label: 'Extract Patterns' },
      { id: 'agent1', group: 'agent', label: 'NLP Specialist' },
      { id: 'agent2', group: 'agent', label: 'Data Analyst' },
    ],
    links: [
      { source: 'idea1', target: 'task1' },
      { source: 'idea1', target: 'task2' },
      { source: 'task1', target: 'agent1' },
      { source: 'task2', target: 'agent2' },
    ],
  };

  return (
    <div className="h-96 bg-gray-50 rounded-lg">
      <ForceGraph2D
        graphData={graphData}
        nodeAutoColorBy="group"
        nodeLabel="label"
        linkDirectionalParticles={2}
      />
    </div>
  );
}