import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Network, 
  GitBranch, 
  Award, 
  BarChart3, 
  Lock,
  Users,
  ArrowRight,
  CheckCircle2,
  Globe,
  Cpu,
  Sparkles,
  Bot,
  LineChart,
  Shield,
  Boxes,
  Code,
  Workflow,
  Database,
  Mail,
  MessageSquare,
  FileText,
  BookOpen
} from 'lucide-react';
import KnowledgeGraphDemo from './KnowledgeGraphDemo';
import AgentSystemDemo from './AgentSystemDemo';

export default function LandingPage() {
  const navigate = useNavigate();
  const networkRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Create network animation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !networkRef.current) return;

    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.opacity = '0.15';
    networkRef.current.appendChild(canvas);

    const resizeCanvas = () => {
      canvas.width = networkRef.current?.offsetWidth || 0;
      canvas.height = networkRef.current?.offsetHeight || 0;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Enhanced nodes for network animation
    const nodes: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      pulse: number;
      pulseSpeed: number;
    }[] = [];

    const colors = ['#60A5FA', '#C084FC', '#F472B6', '#34D399'];
    
    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      });
    }

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach(node => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Update pulse
        node.pulse += node.pulseSpeed;
        const pulseFactor = (Math.sin(node.pulse) + 1) * 0.5;

        // Draw connections
        nodes.forEach(otherNode => {
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = node.color;
            ctx.globalAlpha = (1 - distance / 150) * 0.5 * pulseFactor;
            ctx.lineWidth = 1;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.globalAlpha = 0.5 + pulseFactor * 0.5;
        ctx.fillStyle = node.color;
        ctx.arc(node.x, node.y, node.size * (1 + pulseFactor * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div ref={networkRef} className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className={`relative z-10 text-center max-w-6xl mx-auto transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute inset-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-75"></div>
              <div className="absolute inset-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-150"></div>
              <Brain className="relative w-32 h-32 text-blue-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Your Personal AI Team
          </h1>
          <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Imagine having a team of AI assistants that understand you, learn from you, and help you get more done. 
            Whether you're a busy parent, student, or professional - we're here to make your life easier.
          </p>
          <div className="flex justify-center gap-6">
            <button 
              onClick={() => navigate('/signup')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-white transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <span className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-white transition-all transform hover:scale-105 border border-gray-700 hover:border-gray-600">
              Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              How Can We Help You?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our AI assistants can help with all kinds of tasks, big and small
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Personal */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
              <div className="w-16 h-16 rounded-xl bg-blue-600/20 flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Personal Life</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <span>Schedule management and reminders for family activities</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <span>Meal planning and grocery list organization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <span>Travel planning and itinerary creation</span>
                </li>
              </ul>
            </div>

            {/* Work */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
              <div className="w-16 h-16 rounded-xl bg-purple-600/20 flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Work & Projects</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                  <span>Email management and response drafting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                  <span>Meeting summaries and follow-up tasks</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                  <span>Project organization and deadline tracking</span>
                </li>
              </ul>
            </div>

            {/* Learning */}
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
              <div className="w-16 h-16 rounded-xl bg-pink-600/20 flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Learning & Growth</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-pink-400 mt-1 shrink-0" />
                  <span>Study planning and research assistance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-pink-400 mt-1 shrink-0" />
                  <span>Skill development tracking and recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-pink-400 mt-1 shrink-0" />
                  <span>Language learning and practice support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Your AI assistants learn and adapt to help you better every day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Understands You</h3>
              <p className="text-gray-400">
                Your assistants learn your preferences, habits, and needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Communicates Clearly</h3>
              <p className="text-gray-400">
                Simple conversations to get things done, no tech jargon
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-pink-600/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Takes Action</h3>
              <p className="text-gray-400">
                Handles tasks automatically while keeping you in control
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Gets Smarter</h3>
              <p className="text-gray-400">
                Improves over time to serve you even better
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Graph Demo */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Advanced Knowledge Graph
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Watch our intelligent system map relationships between ideas, tasks, and agents in real-time
            </p>
          </div>
          
          <KnowledgeGraphDemo />
        </div>
      </section>

      {/* Agent System Demo */}
      <section className="py-32 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Intelligent Agent System
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience our autonomous agents working together to solve complex problems
            </p>
          </div>
          
          <AgentSystemDemo />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready for Your Personal AI Team?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of people who are getting more done with their AI assistants
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="group px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold text-xl text-white transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center gap-3 mx-auto"
          >
            Start Free Trial
            <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-gray-400">No credit card required</p>
        </div>
      </section>
    </div>
    </>
  );
}