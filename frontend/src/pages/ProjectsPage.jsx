import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject } from '../api/project.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      setProjects(res.data.projects || []);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Modal handlers
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Project Name is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError('');
      await createProject(formData);
      toast.success('Project created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create project');
      toast.error('Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h1>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> New Project
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white h-40 rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="w-2/3 h-6 bg-gray-200 rounded mb-3"></div>
              <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-4/5 h-4 bg-gray-200 rounded mb-6"></div>
              <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm mt-8">
          <div className="text-6xl mb-6">📁</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Get started by creating a new workspace for your team.</p>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-colors"
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="block group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col relative">
                {p.isAdmin && (
                  <span className="absolute top-5 right-5 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md">
                    Admin
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-800 mb-2 pr-12 line-clamp-1">{p.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">
                  {p.description || 'No description provided.'}
                </p>
                <div className="flex items-center text-sm font-medium text-gray-500 pt-4 border-t border-gray-100 gap-4 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span>👥</span> {p._count?.members || 0} members
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>✅</span> {p._count?.tasks || 0} tasks
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  autoFocus
                  className={`w-full border ${formError && !formData.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-xl px-4 py-2.5 outline-none focus:ring-2`}
                  placeholder="e.g. Website Redesign"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows="3"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="What is this project about?"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              {formError && (
                <p className="text-red-500 text-sm font-medium flex items-center gap-1.5">
                  <span className="text-lg leading-none">⚠️</span> {formError}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
