import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AgentStats() {
  const data = [
    { agent: 'Agent Smith', tasks: 45, success: 0.92 },
    { agent: 'Agent Johnson', tasks: 38, success: 0.88 },
    { agent: 'Agent Brown', tasks: 32, success: 0.95 },
    { agent: 'Agent Davis', tasks: 28, success: 0.86 },
    { agent: 'Agent Wilson', tasks: 25, success: 0.90 },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="agent" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="tasks" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}