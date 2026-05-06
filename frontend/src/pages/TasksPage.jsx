import React, { useState, useEffect } from 'react';
import { getTasks, updateTask } from '../api/task.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, Filter, CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, User } from 'lucide-react';
import Skeleton, { TableSkeleton } from '../components/Skeleton';

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
      const data = res.data?.data?.tasks || res.data?.tasks || res.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterStatus, filterPriority, search]);

  if (loading) return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <TableSkeleton rows={6} cols={3} />
    </div>
  );

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
    
    task._isOverdue = isOverdue;
    task._daysOverdue = isOverdue ? Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    if (isOverdue) overdueTasks.push(task);
    else if (task.status === 'TODO') todoTasks.push(task);
    else if (task.status === 'IN_PROGRESS') inProgressTasks.push(task);
    else if (task.status === 'DONE') doneTasks.push(task);
  });

  const priorityColors = { 
    HIGH: 'text-rose-500 bg-rose-50 border-rose-100', 
    MEDIUM: 'text-amber-500 bg-amber-50 border-amber-100', 
    LOW: 'text-emerald-500 bg-emerald-50 border-emerald-100' 
  };

  const statusIcons = {
    TODO: <Circle size={16} className="text-slate-400" />,
    IN_PROGRESS: <Clock size={16} className="text-amber-500" />,
    DONE: <CheckCircle2 size={16} className="text-emerald-500" />
  };

  const renderTask = (task) => {
    const canUpdateStatus = user?.role === 'ADMIN' || task.assignedToId === user?.id || task.project?.isAdmin;
    const due = task.dueDate ? new Date(task.dueDate) : null;

    return (
      <div key={task.id} className={`group bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-lg hover:border-indigo-200 ${task._isOverdue ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'}`}>
        <div className="flex gap-4 min-w-0 flex-1 items-start">
          <div className="mt-1">
            {task._isOverdue ? <AlertCircle size={18} className="text-rose-500 animate-pulse" /> : statusIcons[task.status]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h4 className={`font-bold text-base leading-snug transition-colors group-hover:text-indigo-600 ${task._isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>{task.title}</h4>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100">
                {task.project?.name || 'No Project'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${priorityColors[task.priority] || priorityColors.LOW}`}>
                {task.priority}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <User size={14} className="text-slate-400" />
                <span className="text-xs font-medium">{task.assignedTo?.name || 'Unassigned'}</span>
              </div>
              {due && (
                <div className={`flex items-center gap-1.5 ${task._isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                  <Clock size={14} className={task._isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 shrink-0 border-t sm:border-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
          {canUpdateStatus ? (
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task.id, e.target.value)}
              className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-auto"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>

          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {task.status?.replace('_', ' ') || 'Unknown'}
            </span>
          )}
          
          {task._isOverdue && (
            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
              {task._daysOverdue}D Overdue
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderGroup = (title, items, groupKey, colorClass, icon) => {
    if (groupKey === 'overdue' && items.length === 0 && filterStatus === 'ALL') return null;
    const isCollapsed = collapsed[groupKey];

    return (
      <div className="mb-8" key={groupKey}>
        <button 
          onClick={() => toggleGroup(groupKey)}
          className="flex items-center justify-between w-full text-left mb-4 group outline-none bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass.replace('text', 'bg').replace('500', '50').replace('600', '50').replace('700', '50').replace('800', '50')}`}>
              {icon && React.cloneElement(icon, { size: 18, className: colorClass })}
            </div>
            <h2 className={`text-sm font-bold uppercase tracking-widest ${colorClass}`}>{title}</h2>
            <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-lg text-[10px] font-bold border border-slate-200">
              {items.length}
            </span>
          </div>
          <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
        </button>

        {!isCollapsed && (
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                No tasks in this category
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global Task Manager</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Unified view of all project responsibilities</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks by title..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              className="w-full lg:w-40 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Status: All</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="relative flex-1 lg:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              className="w-full lg:w-40 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="ALL">Priority: All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {search ? 'No matches found' : 'All clear!'}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {search ? 'Try adjusting your filters or search terms.' : 'There are no active tasks to display at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 pb-12">
          {renderGroup('Overdue Attention', overdueTasks, 'overdue', 'text-rose-600', <AlertCircle />)}
          {renderGroup('Backlog / To Do', todoTasks, 'TODO', 'text-slate-600', <Circle />)}
          {renderGroup('In Active Progress', inProgressTasks, 'IN_PROGRESS', 'text-amber-500', <Clock />)}
          {renderGroup('Completed Tasks', doneTasks, 'DONE', 'text-emerald-500', <CheckCircle2 />)}
        </div>
      )}
    </div>
  );
}
