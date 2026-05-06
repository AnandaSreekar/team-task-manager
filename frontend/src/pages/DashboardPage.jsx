import React, { useEffect, useState } from 'react';
import { getDashboard } from '../api/task.api';
import GeminiBriefing from '../components/GeminiBriefing';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle2, AlertCircle, Layout, ArrowUpRight } from 'lucide-react';
import { DashboardSkeleton } from '../components/Skeleton';
import TaskModal from '../components/TaskModal';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getDashboard();
        // Check for common API response structures
        const data = res.data?.data || res.data;
        if (!data) throw new Error("No data received from server");
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-12 text-center max-w-lg mx-auto mt-12">
        <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Error</h2>
        <p className="text-slate-500 text-sm mb-8">{error || 'Unable to fetch dashboard statistics.'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-bold text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 uppercase tracking-widest"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Safe destructuring with defaults
  const {
    totalTasks = 0,
    tasksByStatus = {},
    overdueTasks = [],
    totalProjects = 0,
    myAssignedTasks = [],
    weeklyCompletion = []
  } = stats;

  const completedCount = tasksByStatus?.DONE || 0;
  
  // Data for Pie Chart
  const pieData = [
    { name: 'To Do', value: tasksByStatus?.TODO || 0, color: '#94a3b8' },
    { name: 'In Progress', value: tasksByStatus?.IN_PROGRESS || 0, color: '#f59e0b' },
    { name: 'Done', value: tasksByStatus?.DONE || 0, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Overview of your team's progress</p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 uppercase tracking-widest"
          >
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {showTaskModal && (
        <TaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />
      )}

      {/* AI Briefing Section */}
      {user?.role === 'ADMIN' && <GeminiBriefing stats={stats} />}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          user?.role === 'ADMIN' ? { label: 'Platform Load', value: totalTasks, icon: Activity, color: 'indigo' } : null,
          { label: 'Active Focus', value: myAssignedTasks.length, icon: Layout, color: 'blue' },
          { label: 'Completion Rate', value: `${totalTasks > 0 ? Math.round((completedCount/totalTasks)*100) : 0}%`, icon: CheckCircle2, color: 'emerald' },
          user?.role === 'ADMIN' ? { label: 'Risk Factor', value: overdueTasks.length, icon: Clock, color: 'rose', alert: overdueTasks.length > 0 } : null,
        ].filter(Boolean).map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors bg-${stat.color}-50 group-hover:bg-${stat.color}-100`}>
              <stat.icon className={`text-${stat.color}-600`} size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <h3 className={`text-2xl font-bold ${stat.alert ? 'text-rose-600' : 'text-slate-800'}`}>{stat.value}</h3>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      {user?.role === 'ADMIN' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Area Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Velocity Overview</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tasks completed over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyCompletion.length > 0 ? weeklyCompletion : [
                {day: 'Mon', completed: 0}, {day: 'Tue', completed: 0}, {day: 'Wed', completed: 0},
                {day: 'Thu', completed: 0}, {day: 'Fri', completed: 0}, {day: 'Sat', completed: 0}, {day: 'Sun', completed: 0}
              ]}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                  itemStyle={{fontSize: '12px', fontWeight: 700}}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorComp)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-1">Status Distribution</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Workload balance across stages</p>
          
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{name: 'Empty', value: 1, color: '#f1f5f9'}]}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={500}
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  {pieData.length === 0 && <Cell key="empty" fill="#f1f5f9" />}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800">{totalTasks}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Tasks</span>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{d.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      )}

      {/* Assignment Table & Sprint Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Critical Assignments</h3>
            <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">View All Assignments</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsibility</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stage</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myAssignedTasks.length > 0 ? (
                  myAssignedTasks.slice(0, 4).map((task, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className={`font-bold text-sm ${task.isOverdue ? 'text-rose-600' : 'text-slate-800'} group-hover:text-indigo-600 transition-colors`}>{task.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{task.project?.name}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            task.status === 'DONE' ? 'bg-emerald-500' : 
                            task.status === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-indigo-400'
                          }`}></div>
                          {task.status.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right text-slate-500 font-bold text-xs uppercase tracking-wider">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Flexible'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <CheckCircle2 size={32} className="text-slate-300" />
                        <p className="text-xs font-bold uppercase tracking-widest">No pending assignments</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {user?.role === 'ADMIN' && (
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-8">Team Health Metrics</h3>
          <div className="space-y-8">
            {[
              { label: 'Workload Efficiency', value: totalTasks > 0 ? Math.round((completedCount/totalTasks)*100) : 0, color: 'emerald' },
              { label: 'Resource Allocation', value: 85, color: 'indigo' },
              { label: 'System Uptime', value: 99, color: 'blue' },
            ].map((bar, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  <span>{bar.label}</span>
                  <span className={`text-${bar.color}-600`}>{bar.value}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.value}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + (i*0.2) }}
                    className={`h-full bg-${bar.color}-500 rounded-full shadow-sm shadow-${bar.color}-200`}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Current Roadmap</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">Phase 2 architecture review scheduled for Friday 3PM.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">System-wide performance audit complete (Score: A+).</p>
              </li>
            </ul>
          </div>
        </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardPage;