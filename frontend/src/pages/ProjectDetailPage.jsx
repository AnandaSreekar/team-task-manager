import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById, addMember, removeMember } from '../api/project.api';
import { createTask, updateTask, deleteTask } from '../api/task.api';
import { getUsers } from '../api/user.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MEMBERS');
  
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

  // Modal ESC handlers
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsMemberModalOpen(false);
        setIsTaskModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
    <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
      <div className="h-20 bg-gray-200 rounded-xl w-1/2"></div>
      <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
      <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
    </div>
  );

  if (!project) return (
    <div className="p-8 text-center"><h2 className="text-2xl text-gray-500">Project not found</h2></div>
  );

  const isAdmin = project.isAdmin || user?.role === 'ADMIN';

  const priorityColors = { HIGH: 'bg-red-500', MEDIUM: 'bg-yellow-500', LOW: 'bg-green-500' };
  const statusBadges = {
    TODO: 'bg-gray-100 text-gray-700 border-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    DONE: 'bg-green-100 text-green-700 border-green-200'
  };

  // Filter tasks
  const filteredTasks = (project.tasks || []).filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8">
        <Link to="/projects" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-4 transition-colors">
          <span className="mr-1">←</span> Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{project.name}</h1>
        <p className="text-gray-500 text-lg max-w-3xl">{project.description || 'No description provided.'}</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'MEMBERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          👥 Members ({project.members?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('TASKS')}
          className={`py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'TASKS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          ✅ Tasks ({project.tasks?.length || 0})
        </button>
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setIsMemberModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                + Add Member
              </button>
            </div>
          )}
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Role</th>
                  {isAdmin && <th className="p-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {project.members?.map((m) => {
                  const initial = m.user.name.charAt(0).toUpperCase();
                  return (
                    <tr key={m.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {initial}
                        </div>
                        <span className="font-semibold text-gray-900">{m.user.name}</span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{m.user.email}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${m.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {m.role}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleRemoveMember(m.userId)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TASKS */}
      {activeTab === 'TASKS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-4">
              <select 
                className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <select 
                className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
              >
                + New Task
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                <span className="text-4xl mb-3 block">📝</span>
                <p className="font-medium text-lg text-gray-800">No tasks found</p>
                <p className="text-sm mt-1">Create the first task to get started!</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const now = new Date();
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = due && due < now && task.status !== 'DONE';
                const daysOverdue = due ? Math.ceil((now - due) / (1000 * 60 * 60 * 24)) : 0;
                const canUpdateStatus = isAdmin || task.assignedToId === user?.id;

                return (
                  <div key={task.id} className={`bg-white rounded-xl border p-5 flex items-center justify-between gap-4 transition-all hover:shadow-md ${isOverdue ? 'border-red-300 border-l-4 border-l-red-500 bg-red-50/30' : 'border-gray-200 border-l-4 ' + (task.priority === 'HIGH' ? 'border-l-red-400' : task.priority === 'MEDIUM' ? 'border-l-yellow-400' : 'border-l-green-400')}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${priorityColors[task.priority]}`}></div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-base leading-snug truncate">{task.title}</h4>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{task.assignedTo?.name ? `Assigned to: ${task.assignedTo.name}` : 'Unassigned'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {canUpdateStatus ? (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border outline-none cursor-pointer ${statusBadges[task.status]}`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadges[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      )}
                      
                      {task.dueDate && (
                        <div className="text-right">
                          <p className={`text-xs font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            Due {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          {isOverdue && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{daysOverdue} days overdue</p>}
                        </div>
                      )}
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                        >
                          Delete
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMemberModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-5">Add Project Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Select User <span className="text-red-500">*</span></label>
                <select 
                  className={`w-full border ${memberError && !memberForm.userId ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
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
                <label className="block text-sm font-semibold mb-1.5">Role</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({...memberForm, role: e.target.value})}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {memberError && <p className="text-red-500 text-sm font-medium">{memberError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={memberSubmitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-70">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-5">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Task Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" autoFocus
                  className={`w-full border ${taskError && !taskForm.title ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2`}
                  value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <textarea 
                  rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
                  value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">Priority</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">Due Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Assign To</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={taskForm.assignedToId} onChange={(e) => setTaskForm({...taskForm, assignedToId: e.target.value})}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              {taskError && <p className="text-red-500 text-sm font-medium">{taskError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={taskSubmitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-70">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
