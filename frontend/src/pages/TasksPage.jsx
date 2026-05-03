import { useState, useEffect } from 'react';
import { getTasks, updateTask } from '../api/task.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [search, setSearch] = useState('');

  // Group collapsed states
  const [collapsed, setCollapsed] = useState({
    overdue: false,
    TODO: false,
    IN_PROGRESS: false,
    DONE: false
  });

  const toggleGroup = (group) => setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus !== 'ALL') filters.status = filterStatus;
      if (filterPriority !== 'ALL') filters.priority = filterPriority;
      if (search.trim()) filters.search = search.trim();

      const res = await getTasks(filters);
      setTasks(res.data.tasks || []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterStatus, filterPriority, search]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      toast.success('Task status updated');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Grouping logic
  const now = new Date();
  const overdueTasks = [];
  const todoTasks = [];
  const inProgressTasks = [];
  const doneTasks = [];

  tasks.forEach(task => {
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = due && due < now && task.status !== 'DONE';
    
    // Attach computed flags for rendering
    task._isOverdue = isOverdue;
    task._daysOverdue = isOverdue ? Math.ceil((now - due) / (1000 * 60 * 60 * 24)) : 0;
    
    if (isOverdue) overdueTasks.push(task);
    else if (task.status === 'TODO') todoTasks.push(task);
    else if (task.status === 'IN_PROGRESS') inProgressTasks.push(task);
    else if (task.status === 'DONE') doneTasks.push(task);
  });

  const priorityColors = { HIGH: 'bg-red-500', MEDIUM: 'bg-yellow-500', LOW: 'bg-green-500' };
  const statusBadges = {
    TODO: 'bg-gray-100 text-gray-700 border-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    DONE: 'bg-green-100 text-green-700 border-green-200'
  };

  const renderTask = (task) => {
    // A task can be updated if the user is a system ADMIN, project ADMIN, or assigned to the task.
    // We get 'isAdmin' context from the backend, but fallback to general rules:
    const canUpdateStatus = user?.role === 'ADMIN' || task.assignedToId === user?.id || task.project?.isAdmin;
    const due = task.dueDate ? new Date(task.dueDate) : null;

    return (
      <div key={task.id} className={`bg-white rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md ${task._isOverdue ? 'border-red-300 border-l-4 border-l-red-500 bg-red-50/20' : 'border-gray-200 border-l-4 ' + (task.priority === 'HIGH' ? 'border-l-red-400' : task.priority === 'MEDIUM' ? 'border-l-yellow-400' : 'border-l-green-400')}`}>
        <div className="flex gap-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h4 className="font-bold text-gray-900 text-base leading-snug">{task.title}</h4>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                {task.project?.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              {task.assignedTo ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-700">
                    {task.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{task.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-medium italic">Unassigned</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 shrink-0 border-t sm:border-0 border-gray-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
          {canUpdateStatus ? (
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task.id, e.target.value)}
              className={`text-xs font-bold px-3 py-1 rounded-full border outline-none cursor-pointer w-full sm:w-auto ${statusBadges[task.status]}`}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          ) : (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border text-center w-full sm:w-auto ${statusBadges[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
          )}
          
          {due && (
            <div className="text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
              <p className={`text-xs font-medium ${task._isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                Due {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              {task._isOverdue && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5 whitespace-nowrap">
                  {task._daysOverdue} days overdue
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGroup = (title, items, groupKey, colorClass, emptyMessage) => {
    // Only show Overdue section if there are actually overdue tasks or if it's currently selected as a filter?
    // Actually, always show sections unless specifically filtered out, or just hide Overdue if 0 to keep it clean.
    if (groupKey === 'overdue' && items.length === 0 && filterStatus === 'ALL') return null;

    const isCollapsed = collapsed[groupKey];

    return (
      <div className="mb-8">
        <button 
          onClick={() => toggleGroup(groupKey)}
          className="flex items-center gap-2 w-full text-left mb-3 group outline-none"
        >
          <span className={`text-lg transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
          <h2 className={`text-lg font-bold ${colorClass}`}>{title}</h2>
          <span className="bg-gray-200 text-gray-700 py-0.5 px-2.5 rounded-full text-xs font-bold ml-2">
            {items.length}
          </span>
        </button>
        
        {!isCollapsed && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="bg-white/50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 text-sm font-medium">
                {emptyMessage}
              </div>
            ) : (
              items.map(renderTask)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">All Tasks</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search tasks by title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[140px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select 
            className="border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[140px]"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse"></div>
          ))}
        </div>
      ) : tasks.length === 0 && search ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h2>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You're all clear!</h2>
          <p className="text-gray-500">There are no tasks available across your projects.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {renderGroup('🔥 Overdue', overdueTasks, 'overdue', 'text-red-600', 'No tasks here')}
          {renderGroup('📋 To Do', todoTasks, 'TODO', 'text-gray-800', 'No tasks here')}
          {renderGroup('⚡ In Progress', inProgressTasks, 'IN_PROGRESS', 'text-blue-700', 'No tasks here')}
          {renderGroup('✅ Done', doneTasks, 'DONE', 'text-green-700', 'No tasks here')}
        </div>
      )}
    </div>
  );
}
