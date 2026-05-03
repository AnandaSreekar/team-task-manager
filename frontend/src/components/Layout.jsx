import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Format page title from pathname
  const path = location.pathname.split('/')[1] || 'dashboard';
  const pageTitle = path.charAt(0).toUpperCase() + path.slice(1);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed left */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        {/* App Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl mr-2">⚡</span>
          <span className="font-bold text-xl text-indigo-600 tracking-tight">TaskFlow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <span className="mr-3 text-lg">📊</span>
            Dashboard
          </NavLink>
          
          <NavLink 
            to="/projects" 
            className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <span className="mr-3 text-lg">📁</span>
            Projects
          </NavLink>
          
          <NavLink 
            to="/tasks" 
            className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <span className="mr-3 text-lg">✅</span>
            Tasks
          </NavLink>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <div className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {user?.role}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full">
            {currentDate}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
