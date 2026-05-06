import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[600px] flex items-center justify-center p-6 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-white rounded-[40px] border border-slate-200 shadow-2xl p-12 text-center relative z-10"
          >
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-inner">
              <AlertCircle size={40} />
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">System Interruption</h2>
            <p className="text-slate-500 leading-relaxed mb-10 text-sm">
              An unexpected exception occurred during application execution. Our diagnostic systems have logged the incident. Please attempt to refresh the workspace.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
              >
                <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                Recover Workspace
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
              >
                <Home size={16} />
                Return Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-12 pt-8 border-t border-slate-100 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Diagnostic Trace</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-x-auto">
                  <code className="text-[10px] text-rose-600 font-mono">
                    {this.state.error?.toString()}
                  </code>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

