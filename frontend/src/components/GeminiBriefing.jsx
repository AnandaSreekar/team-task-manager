import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sparkles, BrainCircuit, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GeminiBriefing = ({ stats }) => {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateBriefing = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Gemini API Key missing. Please set VITE_GEMINI_API_KEY in .env');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        You are an intelligent project management assistant. 
        Analyze the following project stats and provide a professional, encouraging 3-sentence summary of project health and potential blockers.
        
        Stats:
        - Total Tasks: ${stats.totalTasks}
        - Tasks by Status: ${JSON.stringify(stats.tasksByStatus)}
        - Overdue Tasks: ${stats.overdueTasks.length}
        - Total Projects: ${stats.totalProjects}
        
        Format: Return only the 3 sentences. No Markdown formatting.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setBriefing(response.text());
    } catch (err) {
      console.error('Gemini Error:', err);
      setError('Failed to reach Gemini AI. Please check your connection or API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <BrainCircuit className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Intelligence Briefing</h2>
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Powered by Gemini 1.5 Pro</p>
            </div>
          </div>
          
          <button 
            onClick={generateBriefing}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-70 group"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover:animate-pulse" />}
            {briefing ? 'REFRESH INSIGHTS' : 'GET AI BRIEFING'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {briefing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
            >
              <p className="text-sm leading-relaxed font-medium text-indigo-50">
                {briefing}
              </p>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center gap-3 text-rose-200 text-xs font-bold uppercase tracking-wider bg-rose-500/20 p-4 rounded-2xl border border-rose-500/30"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!briefing && !loading && !error && (
          <p className="mt-6 text-indigo-100 text-sm opacity-60 italic">
            Click the button above to generate an AI-powered summary of your current project landscape.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default GeminiBriefing;
