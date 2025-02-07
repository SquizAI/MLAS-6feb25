import React, { useState, useEffect } from 'react';
import { Brain, MessageSquare, CheckCircle, Clock, ArrowRight, Play as PlayIcon, Zap, GitBranch } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'working' | 'complete';
  progress: number;
  messages: string[];
  output?: any;
}

export default function AgentSystemDemo() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Data Analyzer',
      role: 'Analysis Specialist',
      status: 'idle',
      progress: 0,
      messages: [],
    },
    {
      id: '2',
      name: 'Pattern Detector',
      role: 'Pattern Recognition',
      status: 'idle',
      progress: 0,
      messages: [],
    },
    {
      id: '3',
      name: 'Insight Generator',
      role: 'Insight Synthesis',
      status: 'idle',
      progress: 0,
      messages: [],
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(0);

  const scenarios = [
    {
      title: "Email Organization",
      steps: [
        {
          agentId: '1',
          action: 'analyze',
          message: "Analyzing email patterns and priorities...",
          duration: 2000,
          output: {
            type: 'email-analysis',
            content: {
              highPriority: [
                { subject: "Urgent: Client Meeting Tomorrow", from: "client@example.com", priority: "High", action: "Response needed within 2 hours" },
                { subject: "Project Deadline Update", from: "manager@example.com", priority: "High", action: "Review and confirm new timeline" }
              ],
              categories: {
                "Client Communication": 35,
                "Internal Updates": 25,
                "Project Management": 20,
                "General Inquiries": 20
              },
              actionItems: 8,
              suggestedResponses: 5
            }
          }
        },
        {
          agentId: '2',
          action: 'process',
          message: "Detecting communication patterns...",
          duration: 2000,
          output: {
            type: 'communication-patterns',
            content: {
              peakTimes: [
                { time: "9:00 AM - 11:00 AM", volume: "High", type: "Client Messages" },
                { time: "2:00 PM - 4:00 PM", volume: "Medium", type: "Team Updates" }
              ],
              commonThreads: [
                { topic: "Project Status Updates", frequency: "Daily", participants: 5 },
                { topic: "Client Feedback", frequency: "Weekly", participants: 3 }
              ],
              responseMetrics: {
                averageResponseTime: "45 minutes",
                responseRate: "92%",
                satisfactionScore: "4.5/5"
              }
            }
          }
        },
        {
          agentId: '3',
          action: 'generate',
          message: "Creating smart email workflow...",
          duration: 2000,
          output: {
            type: 'workflow-creation',
            content: {
              automatedRules: [
                { rule: "Client emails → Priority Inbox", condition: "From: @clientdomain.com" },
                { rule: "Meeting invites → Calendar check", condition: "Contains: calendar invite" },
                { rule: "Team updates → Project folders", condition: "From: team@company.com" }
              ],
              templates: [
                { name: "Meeting Follow-up", usage: "Post-meeting summary and action items" },
                { name: "Project Update", usage: "Weekly status reports to stakeholders" }
              ],
              schedule: {
                "8:00 AM": "Email triage and prioritization",
                "12:00 PM": "Follow-up reminders",
                "4:00 PM": "Status update compilation"
              }
            }
          }
        }
      ]
    },
    {
      title: "Project Planning",
      steps: [
        {
          agentId: '1',
          action: 'analyze',
          message: "Analyzing project requirements...",
          duration: 2000,
          output: {
            type: 'project-analysis',
            content: {
              scope: {
                mainObjectives: [
                  "Website redesign",
                  "Content migration",
                  "Performance optimization"
                ],
                deliverables: 12,
                estimatedDuration: "8 weeks"
              },
              resources: {
                required: ["UI Designer", "Frontend Dev", "Backend Dev", "Content Writer"],
                availability: {
                  "UI Designer": "80%",
                  "Frontend Dev": "100%",
                  "Backend Dev": "60%",
                  "Content Writer": "40%"
                }
              },
              risks: [
                { risk: "Content migration delays", impact: "High", mitigation: "Early content audit" },
                { risk: "Browser compatibility", impact: "Medium", mitigation: "Cross-browser testing plan" }
              ]
            }
          }
        },
        {
          agentId: '2',
          action: 'process',
          message: "Creating project timeline...",
          duration: 2000,
          output: {
            type: 'project-timeline',
            content: {
              phases: [
                {
                  name: "Discovery",
                  duration: "1 week",
                  tasks: ["Stakeholder interviews", "Requirements gathering", "Technical audit"],
                  dependencies: []
                },
                {
                  name: "Design",
                  duration: "2 weeks",
                  tasks: ["Wireframes", "UI Design", "Design review"],
                  dependencies: ["Discovery"]
                },
                {
                  name: "Development",
                  duration: "4 weeks",
                  tasks: ["Frontend development", "Backend integration", "Content migration"],
                  dependencies: ["Design"]
                },
                {
                  name: "Testing",
                  duration: "1 week",
                  tasks: ["QA", "Performance testing", "User acceptance"],
                  dependencies: ["Development"]
                }
              ],
              milestones: [
                { name: "Design Approval", date: "Week 3" },
                { name: "Beta Launch", date: "Week 7" },
                { name: "Final Launch", date: "Week 8" }
              ]
            }
          }
        },
        {
          agentId: '3',
          action: 'generate',
          message: "Optimizing resource allocation...",
          duration: 2000,
          output: {
            type: 'resource-optimization',
            content: {
              schedule: {
                "UI Designer": [
                  { task: "Wireframes", weeks: "1-2", allocation: "100%" },
                  { task: "UI Design", weeks: "2-3", allocation: "100%" },
                  { task: "Design Support", weeks: "4-8", allocation: "20%" }
                ],
                "Frontend Dev": [
                  { task: "Component Development", weeks: "4-6", allocation: "100%" },
                  { task: "Integration", weeks: "6-7", allocation: "100%" },
                  { task: "Bug Fixes", weeks: "7-8", allocation: "50%" }
                ]
              },
              recommendations: [
                "Schedule design reviews on Tuesdays for maximum attendance",
                "Front-load content writing to prevent migration delays",
                "Allocate 20% buffer for unexpected issues"
              ],
              efficiency: {
                resourceUtilization: "85%",
                projectedCompletion: "On schedule",
                costOptimization: "+15%"
              }
            }
          }
        }
      ]
    }
  ];

  const renderOutput = (output: any) => {
    if (!output) return null;

    switch (output.type) {
      case 'email-analysis':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">High Priority Emails</h4>
              <div className="space-y-2">
                {output.content.highPriority.map((email: any, index: number) => (
                  <div key={index} className="bg-gray-700/50 p-3 rounded">
                    <div className="font-medium text-white">{email.subject}</div>
                    <div className="text-sm text-gray-400">From: {email.from}</div>
                    <div className="text-sm text-blue-400">{email.action}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Category Distribution</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(output.content.categories).map(([category, percentage]) => (
                  <div key={category} className="bg-gray-700/50 p-2 rounded">
                    <div className="text-sm text-gray-300">{category}</div>
                    <div className="text-lg font-medium text-white">{percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'communication-patterns':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Peak Communication Times</h4>
              <div className="space-y-2">
                {output.content.peakTimes.map((peak: any, index: number) => (
                  <div key={index} className="bg-gray-700/50 p-3 rounded">
                    <div className="font-medium text-white">{peak.time}</div>
                    <div className="text-sm text-gray-400">{peak.type} - {peak.volume} Volume</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Response Metrics</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-700/50 p-2 rounded text-center">
                  <div className="text-sm text-gray-400">Avg Response</div>
                  <div className="text-lg font-medium text-white">{output.content.responseMetrics.averageResponseTime}</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded text-center">
                  <div className="text-sm text-gray-400">Response Rate</div>
                  <div className="text-lg font-medium text-white">{output.content.responseMetrics.responseRate}</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded text-center">
                  <div className="text-sm text-gray-400">Satisfaction</div>
                  <div className="text-lg font-medium text-white">{output.content.responseMetrics.satisfactionScore}</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'workflow-creation':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Automated Rules</h4>
              <div className="space-y-2">
                {output.content.automatedRules.map((rule: any, index: number) => (
                  <div key={index} className="bg-gray-700/50 p-3 rounded">
                    <div className="font-medium text-white">{rule.rule}</div>
                    <div className="text-sm text-gray-400">When: {rule.condition}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Daily Schedule</h4>
              <div className="space-y-2">
                {Object.entries(output.content.schedule).map(([time, task]) => (
                  <div key={time} className="bg-gray-700/50 p-2 rounded flex justify-between">
                    <span className="text-blue-400">{time}</span>
                    <span className="text-gray-300">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const startDemo = async () => {
    setIsRunning(true);
    const scenario = scenarios[currentScenario];
    
    for (const step of scenario.steps) {
      // Update agent status
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: agent.id === step.agentId ? 'working' : agent.status,
        progress: agent.id === step.agentId ? 0 : agent.progress,
        messages: agent.id === step.agentId 
          ? [...agent.messages, step.message]
          : agent.messages
      })));

      // Animate progress
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, step.duration / 20));
        setAgents(prev => prev.map(agent => ({
          ...agent,
          progress: agent.id === step.agentId ? i : agent.progress
        })));
      }

      // Show output
      if (step.output) {
        setAgents(prev => prev.map(agent => ({
          ...agent,
          status: agent.id === step.agentId ? 'complete' : agent.status,
          messages: agent.id === step.agentId 
            ? [...agent.messages]
            : agent.messages,
          output: agent.id === step.agentId ? step.output : agent.output
        })));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Reset for next scenario
    setCurrentScenario((prev) => (prev + 1) % scenarios.length);
    setIsRunning(false);
    
    // Reset agents after delay
    setTimeout(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: 'idle',
        progress: 0,
        messages: [],
        output: undefined
      })));
    }, 3000);
  };

  return (
    <div className="relative bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm">
      {/* Scenario Title */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-white">
          {scenarios[currentScenario].title}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {agents.map(agent => (
          <div
            key={agent.id}
            className="bg-gray-900/50 rounded-lg p-6 border border-gray-700/50"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                <p className="text-sm text-gray-400">{agent.role}</p>
              </div>
              <div className={`
                w-3 h-3 rounded-full
                ${agent.status === 'idle' ? 'bg-gray-500' :
                  agent.status === 'thinking' ? 'bg-yellow-500 animate-pulse' :
                  agent.status === 'working' ? 'bg-blue-500 animate-pulse' :
                  'bg-green-500'}
              `} />
            </div>

            <div className="h-2 bg-gray-700 rounded-full mb-4">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                style={{ width: `${agent.progress}%` }}
              />
            </div>

            <div className="space-y-4">
              {agent.messages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <MessageSquare className="w-4 h-4 text-blue-400 mt-1" />
                  <p className="text-gray-300">{message}</p>
                </div>
              ))}
              {agent.output && renderOutput(agent.output)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={startDemo}
          disabled={isRunning}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-lg
            ${isRunning
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'}
            text-white font-medium transition-all transform hover:scale-105 disabled:hover:scale-100
          `}
        >
          {isRunning ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <PlayIcon className="w-5 h-5" />
              Run {scenarios[currentScenario].title} Demo
            </>
          )}
        </button>
      </div>
    </div>
  );
}