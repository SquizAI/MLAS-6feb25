import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen,
  Lightbulb,
  CheckSquare,
  Trophy,
  Activity,
  Settings,
  Brain
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const location = useLocation();
  
  const links = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: FolderOpen, label: 'Documents', path: '/dashboard/documents' },
    { icon: Lightbulb, label: 'Ideas', path: '/dashboard/ideas' },
    { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
    { icon: Users, label: 'Agents', path: '/dashboard/agents' },
    { icon: Brain, label: 'Knowledge Graph', path: '/dashboard/knowledge' },
    { icon: Trophy, label: 'Achievements', path: '/dashboard/achievements' },
    { icon: Activity, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <aside className={`
      ${open ? 'w-64' : 'w-20'} 
      transition-all duration-300 ease-in-out
      bg-white border-r border-gray-200 p-4 min-h-[calc(100vh-4rem)]
    `}>
      <nav className="space-y-2">
        {links.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg
              ${location.pathname === path 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <Icon className="w-6 h-6 shrink-0" />
            {open && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}