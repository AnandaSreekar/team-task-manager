import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Provide safe default state
  const [data, setData] = useState({
    totalTasks: 0,
    totalProjects: 0,
    tasksByStatus: {},
    overdueTasks: [],
    myAssignedTasks: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/tasks/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const resData = response.data?.data || response.data || {};
        
        setData({
          totalTasks: resData.totalTasks ?? 0,
          totalProjects: resData.totalProjects ?? 0,
          tasksByStatus: resData.tasksByStatus || {},
          overdueTasks: resData.overdueTasks || [],
          myAssignedTasks: resData.myAssignedTasks || []
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || '';

  console.log('Dashboard rendering, loading state:', loading);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="flex gap-6">
          <div className="w-[60%] h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-[40%] h-64 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl flex items-center gap-3">
          <span className="text-2xl">⚠️</span> {error}
        </div>
      </div>
    );
  }

  // Calculate completion percentage safely
  const doneTasks = data?.tasksByStatus?.DONE || 0;
  const totalTasks = data?.totalTasks || 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Safe arrays for mapping
  const overdueList = data?.overdueTasks || [];
  const assignedList = data?.myAssignedTasks || [];

  // Priority color map
  const priorityColor = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700'
  };

  // Status color dot map
  const statusColorDot = {
    TODO: 'bg-gray-400',
    IN_PROGRESS: 'bg-blue-500',
    DONE: 'bg-green-500'
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white space-y-8 animate-fade-in pb-8">
      <div style={{color: 'red', fontSize: '32px', background: 'white', padding: '20px', position: 'fixed', top: 0, left: 0, zIndex: 9999}}>
        DASHBOARD IS RENDERING
      </div>
      
      {/* SECTION A: Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-gray-500">Here's what's happening with your projects today.</p>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
            {user?.role === 'ADMIN' ? 'Team Overview' : 'My Overview'}
          </span>
        </div>
      </div>

      {/* SECTION B: Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Projects" 
          value={data?.totalProjects ?? 0} 
          icon="📁" 
          bgColor="bg-blue-100" 
          textColor="text-gray-900" 
          subtitle="Active workspaces" 
        />
        <StatsCard 
          title="Total Tasks" 
          value={data?.totalTasks ?? 0} 
          icon="✅" 
          bgColor="bg-indigo-100" 
          textColor="text-indigo-600" 
          subtitle="Across all projects" 
        />
        <StatsCard 
          title="Completed" 
          value={doneTasks} 
          icon="🎯" 
          bgColor="bg-green-100" 
          textColor="text-green-600" 
          subtitle="From all assigned tasks" 
        />
        <StatsCard 
          title="Overdue" 
          value={overdueList.length} 
          icon={overdueList.length > 0 ? "🔥" : "✨"} 
          bgColor={overdueList.length > 0 ? "bg-red-100" : "bg-green-100"} 
          textColor={overdueList.length > 0 ? "text-red-600" : "text-green-600"} 
          subtitle="Need attention now" 
          animatePulse={overdueList.length > 0}
        />
      </div>

      {/* SECTION C: Two Column Layout */}
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* LEFT COLUMN: Overdue Tasks (60%) */}
        <div className="xl:w-[60%] flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold text-red-600">🔥 Overdue Tasks</h2>
            <span className="bg-red-100 text-red-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
              {overdueList.length}
            </span>
          </div>

          {overdueList.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-3">✅</span>
              <h3 className="text-green-800 font-bold text-lg">You're all caught up! Great work 🎉</h3>
              <p className="text-green-600 text-sm mt-1">No overdue tasks at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {overdueList.map((task) => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-transform duration-200 hover:-translate-y-1">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{task?.title || 'Untitled'}</h3>
                    <p className="text-sm text-gray-500">{task?.project?.name || 'Unknown Project'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${priorityColor[task?.priority] || 'bg-gray-100'}`}>
                      {task?.priority || 'NONE'}
                    </span>
                    <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {task?.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'} 
                      <span className="mx-1">•</span> 
                      {(task?.daysUntilDue ?? 0) < 0 ? `${Math.abs(task.daysUntilDue)} days overdue` : 'Due soon'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: My Tasks (40%) */}
        <div className="xl:w-[40%] flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold text-gray-800">📋 My Tasks</h2>
            <span className="bg-gray-200 text-gray-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
              {assignedList.length}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            {assignedList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-3xl mb-2 block">📝</span>
                <p>No tasks assigned to you yet.</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100 flex-1">
                  {assignedList.slice(0, 6).map((task) => (
                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${statusColorDot[task?.status] || 'bg-gray-300'}`}></div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{task?.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{task?.project?.name || 'Unknown Project'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {assignedList.length > 6 && (
                  <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <Link to="/tasks" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                      View all tasks →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION D: Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overall Progress</h2>
        
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">Task Completion</span>
          <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
        </div>
        
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-3">
          <div 
            className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500 font-medium">
          {doneTasks} of {totalTasks} tasks completed
        </p>
      </div>

    </div>
  );
}
