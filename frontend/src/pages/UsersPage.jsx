import { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../api/user.api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Search, Users, Shield, Mail, Calendar, Trash2, AlertCircle, CheckSquare, FolderKanban } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';


export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const fetchUsers = async (q = '') => {
    try {
      setLoading(true);
      const res = await getUsers(q);
      setUsers(res.data.data.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    if (id === user.id) return toast.error("You cannot delete your own account.");
    if (!confirm('Are you sure you want to delete this user? This action is permanent.')) return;
    
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User has been removed from the system');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm max-w-2xl mx-auto mt-12">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-slate-500 mb-8">This module is reserved for system administrators only. Please contact your manager if you believe this is an error.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8"><TableSkeleton rows={10} cols={5} /></div>;


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Governance</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage platform members and organizational roles</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-6 border-b border-slate-50 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No members found</h2>
          <p className="text-slate-500 max-w-md mx-auto">We couldn't find any team members matching your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4 font-bold">User Identity</th>
                <th className="px-6 py-4 font-bold">System Role</th>
                <th className="px-6 py-4 font-bold">Involvement</th>
                <th className="px-6 py-4 font-bold">Joined</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm uppercase">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      <Shield size={10} /> {u.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5" title="Projects Created">
                        <FolderKanban size={14} className="text-slate-300" /> {u._count?.projectsCreated ?? 0}
                      </div>
                      <div className="flex items-center gap-1.5" title="Tasks Assigned">
                        <CheckSquare size={14} className="text-slate-300" /> {u._count?.tasksAssigned ?? 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                      <Calendar size={14} className="text-slate-300" />
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className={`p-2 rounded-xl transition-all ${u.id === user.id ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100'}`}
                      onClick={() => handleDelete(u.id)}
                      disabled={u.id === user.id}
                      title={u.id === user.id ? "Cannot delete self" : "Delete User"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
