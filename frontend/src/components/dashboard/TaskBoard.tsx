import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Search, Filter, Brain } from 'lucide-react';
import TaskCard from './TaskCard';
import { useTaskManagement } from '../../hooks/useTaskManagement';

export default function TaskBoard() {
  const { tasks, loading, updateTaskStatus, assignTask } = useTaskManagement();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const columns = {
    pending: {
      title: 'Pending',
      items: tasks.filter(t => t.status === 'pending')
    },
    in_progress: {
      title: 'In Progress',
      items: tasks.filter(t => t.status === 'in_progress')
    },
    completed: {
      title: 'Completed',
      items: tasks.filter(t => t.status === 'completed')
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Update task status
    if (source.droppableId !== destination.droppableId) {
      await updateTaskStatus(
        draggableId,
        destination.droppableId as any,
        tasks.find(t => t.id === draggableId)?.progress || 0
      );
    }
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track task progress</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tasks</option>
            <option value="high">High Priority</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>
      </div>

      {/* Task Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6 h-full">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="flex flex-col bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {column.title}
              </h2>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 space-y-4"
                  >
                    {column.items.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              onStatusChange={(status) => 
                                updateTaskStatus(task.id, status as any, task.progress)
                              }
                              onAgentAssign={(agentId) => 
                                assignTask(task.id, agentId)
                              }
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}