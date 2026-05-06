import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById, addMember, removeMember } from '../api/project.api';
import { createTask, updateTask, deleteTask } from '../api/task.api';
import { getUsers } from '../api/user.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
  Users, CheckSquare, Plus, ChevronLeft, Trash2, 
  Calendar, Clock, AlertCircle, CheckCircle2, Circle, 
  UserPlus, UserMinus, BarChart3, Mail, Shield
} from 'lucide-react';
import { TableSkeleton, DashboardSkeleton } from '../components/Skeleton';


export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('TASKS');
  
  // State for adding members
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'MEMBER' });
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState('');

  // State for creating tasks
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToId: '' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Task filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const fetchProject = async () => {
    try {
      const res = await getProjectById(id);
      setProject(res.data.project);
    } catch (err) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (isMemberModalOpen && allUsers.length === 0) {
      getUsers().then(res => setAllUsers(res.data.users)).catch(() => toast.error('Failed to load users'));
    }
  }, [isMemberModalOpen]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberForm.userId) return setMemberError('Please select a user');
    try {
      setMemberSubmitting(true);
      await addMember(id, memberForm);
      toast.success('Member added successfully!');
      setIsMemberModalOpen(false);
      setMemberForm({ userId: '', role: 'MEMBER' });
      fetchProject();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember(id, userId);
      toast.success('Member removed');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return setTaskError('Task title is required');
    try {
      setTaskSubmitting(true);
      await createTask({ ...taskForm, projectId: id });
      toast.success('Task created successfully!');
      setIsTaskModalOpen(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToId: '' });
      fetchProject();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      toast.success('Status updated');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  if (loading) return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center mb-8">
        <TableSkeleton rows={4} cols={3} />
      </div>
      <DashboardSkeleton />
    </div>
  );


  if (!project) return (
    <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Project Not Found</h2>
      <p className="text-slate-500 mb-8">The project you are looking for does not exist or you do not have permission to view it.</p>
      <Link to="/projects" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">Back to Projects</Link>
    </div>
  );

  const isAdmin = project.isAdmin || user?.role === 'ADMIN';

  const priorityStyles = { 
    HIGH: 'text-rose-500 bg-rose-50 border-rose-100', 
    MEDIUM: 'text-amber-500 bg-amber-50 border-amber-100', 
    LOW: 'text-emerald-500 bg-emerald-50 border-emerald-100' 
  };

  const statusBadges = {
    TODO: 'bg-slate-100 text-slate-600 border-slate-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
    DONE: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const filteredTasks = (project.tasks || []).filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    return true;
  });

  const completionRate = project.tasks?.length > 0 
    ? Math.round((project.tasks.filter(t => t.status === 'DONE').length / project.tasks.length) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-12">
      {/* Breadcrumb & Navigation */}
      <div>
        <Link to="/projects" className="group inline-flex items-center text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors mb-4">
          <ChevronLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <BarChart3 size={20} />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{project.name}</h1>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{project.description || 'No description provided for this workspace.'}</p>
          </div>
          
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm min-w-[200px]">
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
              <span>Overall Progress</span>
              <span className="text-emerald-600">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'TASKS', label: 'Tasks', icon: CheckSquare, count: project.tasks?.length },
          { id: 'MEMBERS', label: 'Team', icon: Users, count: project.members?.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-indigo-50' : 'bg-slate-200 text-slate-600'}`}>
              {tab.count || 0}
            </span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Collaborators</h2>
            {isAdmin && (
              <button 
                onClick={() => setIsMemberModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                <UserPlus size={16} /> ADD MEMBER
              </button>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4 font-bold">Member</th>
                  <th className="px-6 py-4 font-bold">Access Level</th>
                  {isAdmin && <th className="px-6 py-4 font-bold text-right">Management</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {project.members?.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {m.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{m.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Mail size={10} /> {m.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${m.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        <Shield size={10} /> {m.role}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleRemoveMember(m.userId)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition-all flex items-center gap-1 ml-auto text-[10px] font-bold uppercase tracking-widest"
                        >
                          <UserMinus size={14} /> Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TASKS */}
      {activeTab === 'TASKS' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex gap-3">
              <select 
                className="bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Status: All</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <select 
                className="bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="ALL">Priority: All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 whitespace-nowrap"
              >
                <Plus size={16} /> NEW TASK
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
                  <CheckSquare size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No tasks in view</h3>
                <p className="text-sm text-slate-500">Try clearing filters or adding a new task to this project.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const now = new Date();
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = due && due < now && task.status !== 'DONE';
                const canUpdateStatus = isAdmin || task.assignedToId === user?.id;

                return (
                  <div key={task.id} className={`group bg-white rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-lg hover:border-indigo-200 ${isOverdue ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'}`}>
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="mt-1 flex-shrink-0">
                        {task.status === 'DONE' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-slate-300" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className={`font-bold text-base transition-colors group-hover:text-indigo-600 ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>{task.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${priorityStyles[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <UserPlus size={12} />
                            <span>{task.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                          {due && (
                            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                              <Calendar size={12} />
                              <span>{due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto self-end sm:self-center border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                      {canUpdateStatus ? (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border outline-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all ${statusBadges[task.status]}`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border ${statusBadges[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      )}
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      
      {/* Add Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMemberModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Team Access</h2>
            <p className="text-sm text-slate-500 mb-8">Grant project permissions to a registered user.</p>
            
            <form onSubmit={handleAddMember} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select User</label>
                <select 
                  className={`w-full bg-slate-50 border ${memberError && !memberForm.userId ? 'border-rose-500' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all`}
                  value={memberForm.userId}
                  onChange={(e) => setMemberForm({...memberForm, userId: e.target.value})}
                >
                  <option value="">-- Choose User --</option>
                  {allUsers.filter(u => !project.members?.find(m => m.userId === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Permission Role</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({...memberForm, role: e.target.value})}
                >
                  <option value="MEMBER">Standard Member</option>
                  <option value="ADMIN">Project Manager</option>
                </select>
              </div>
              {memberError && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">{memberError}</p>}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={memberSubmitting} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-100 disabled:opacity-70">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsTaskModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">New Responsibility</h2>
            <p className="text-sm text-slate-500 mb-8">Define a new task and assign it to a team member.</p>
            
            <form onSubmit={handleCreateTask} className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Task Title</label>
                <input 
                  type="text" autoFocus
                  className={`w-full bg-slate-50 border ${taskError && !taskForm.title ? 'border-rose-500' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all`}
                  value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="e.g. Implement Auth Flow"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Context / Description</label>
                <textarea 
                  rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                  value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Additional details..."
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assignee</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={taskForm.assignedToId} onChange={(e) => setTaskForm({...taskForm, assignedToId: e.target.value})}>
                  <option value="">-- Unassigned --</option>
                  {project.members?.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              {taskError && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">{taskError}</p>}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={taskSubmitting} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-100 disabled:opacity-70 transition-all">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

