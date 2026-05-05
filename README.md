🚀 TaskFlow — Enterprise Team Task Manager

TaskFlow is a production-ready full-stack project management system built for high-performance teams.
It follows a Security-First and AI-Enhanced approach, combining real-time analytics with intelligent insights.

🔗 Live Demo
🌐 Frontend: https://taskflow-me.netlify.app
⚙️ Backend API: https://team-task-manager-production-5374.up.railway.app
📂 Repository: https://github.com/AnandaSreekar/team-task-manager
✨ Features
🧠 AI-Powered Workspace Insights
Google Gemini integration
Generates automated Pulse Reports
Provides actionable summaries based on team activity
📊 Real-Time Analytics Dashboard
Built with Recharts
Includes:
Velocity charts (task completion trends)
Status distribution (To-Do / In-Progress / Done)
🛡️ Enterprise-Grade Security
JWT-based authentication
Role-Based Access Control (RBAC):
ADMIN → Full access
MEMBER → Limited access
Auto admin detection (@admin.com)
🎨 Modern UI/UX
Smooth animations (Framer Motion)
Fully responsive (Mobile + Desktop)
Error boundaries to prevent crashes
🧰 Tech Stack
Frontend
React 19
Vite
Tailwind CSS
Framer Motion
Recharts
Backend
Node.js
Express.js
Prisma ORM
Database
PostgreSQL (Railway)
AI Integration
Google Gemini API
🧱 API Structure
Auth:
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

Projects:
CRUD operations + team allocation

Tasks:
Task lifecycle + overdue detection

Analytics:
GET /api/tasks/dashboard
⚙️ Local Setup
1. Clone Repository
git clone https://github.com/AnandaSreekar/team-task-manager.git
cd team-task-manager
2. Environment Variables

Frontend (.env)

VITE_API_URL=your_api_url
VITE_GEMINI_API_KEY=your_api_key

Backend (.env)

DATABASE_URL=your_database_url
JWT_SECRET=your_secret
3. Install Dependencies
npm install
cd backend
npm install
4. Database Setup
npx prisma migrate dev
5. Run Project
npm run dev
🔑 Demo Credentials

Admin

Email: admin@admin.com
Password: Admin@123

Member

Register with any email
📌 Key Highlights
Full-stack scalable architecture
AI integration for real-world insights
Clean UI with production-level polish
Secure authentication and role management
