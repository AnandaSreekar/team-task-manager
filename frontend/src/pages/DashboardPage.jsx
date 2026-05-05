import React from 'react';

const DashboardPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', value: '24', trend: '+12%' },
          { label: 'Completed', value: '18', progress: 75 },
          { label: 'Overdue', value: '3', alert: true },
          { label: 'Active Projects', value: '5', avatars: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end justify-between mt-4">
              <h3 className={`text-3xl font-bold ${stat.alert ? 'text-rose-600' : 'text-slate-800'}`}>{stat.value}</h3>
              {stat.trend && <span className="text-indigo-600 text-[10px] font-bold bg-indigo-50 px-2 py-1 rounded-full">{stat.trend}</span>}
              {stat.progress && (
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500" style={{ width: `${stat.progress}%` }}></div>
                </div>
              )}
              {stat.alert && <span className="text-rose-500 text-[10px] font-bold animate-pulse">Needs Review</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Assignments</h3>
            <button className="text-xs text-indigo-600 font-bold hover:underline">View All</button>
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'API Integration - Payment Gateway', status: 'In Progress', dot: 'bg-amber-400', date: 'Oct 24' },
                { name: 'Database Schema Audit', status: 'Overdue', dot: 'bg-rose-500', date: 'Oct 20', critical: true },
                { name: 'Frontend Redesign', status: 'Pending', dot: 'bg-blue-400', date: 'Oct 28' },
              ].map((task, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className={`px-6 py-4 font-medium ${task.critical ? 'text-rose-600' : 'text-slate-800'}`}>{task.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                      <div className={`w-2 h-2 rounded-full ${task.dot}`}></div>
                      {task.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-medium">{task.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h3 className="font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Sprint Health</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
                <span>Backend Progress</span>
                <span className="text-emerald-600">100%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full"><div className="w-full h-full bg-emerald-500 rounded-full"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
                <span>Frontend UI</span>
                <span className="text-indigo-600">85%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full"><div className="w-[85%] h-full bg-indigo-500 rounded-full"></div></div>
            </div>
          </div>
          <div className="mt-12 bg-slate-900 rounded-xl p-4 shadow-lg shadow-slate-200">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Weekly Insight</p>
            <p className="text-xs text-slate-300 leading-relaxed italic">"3 critical tasks are unassigned. Please check the 'Unallocated' queue."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;