import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateBriefing = async (stats) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please configure VITE_GEMINI_API_KEY in your .env file.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const completedCount = stats?.tasksByStatus?.DONE || 0;
    const totalCount = stats?.totalTasks || 0;
    const completionRate = totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0;

    const prompt = `
      You are an expert AI productivity assistant for a project management dashboard.
      Analyze the following team statistics and provide a professional, concise 3-sentence briefing.
      Focus on actionable insights such as high-priority delays, completion rate (${completionRate}%), or workload distribution.
      Make it sound human, encouraging, and highly actionable.

      Current Statistics:
      - Total Platform Tasks: ${stats?.totalTasks || 0}
      - Tasks Completed: ${completedCount}
      - Tasks In Progress: ${stats?.tasksByStatus?.IN_PROGRESS || 0}
      - Tasks Overdue: ${stats?.overdueTasks?.length || 0}
      - Total Projects: ${stats?.totalProjects || 0}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error('Failed to generate AI briefing. Please check your connection or API key.');
  }
};
