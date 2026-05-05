TaskFlow — Enterprise Team Task Manager

TaskFlow is a production-ready, full-stack project management system designed for high-performance teams. It follows a Security-First and AI-Enhanced architecture, going beyond basic CRUD applications by integrating intelligent insights and real-time analytics for better decision-making.

Live Access
Production Frontend: https://taskflow-me.netlify.app
Production API Hub: https://team-task-manager-production-5374.up.railway.app
GitHub Repository: https://github.com/AnandaSreekar/team-task-manager
Key Features
1. Intelligent AI Briefing
Integrated Google Gemini API
Generates automated “Pulse Reports” for team leads
Analyzes project velocity and workspace activity
Produces structured, actionable summaries of team performance
2. Advanced Analytics Engine
Built using Recharts
Real-time visualization of project data:
Velocity Charts: Track task completion trends over time
Status Distribution: Identify bottlenecks (To-Do / In-Progress / Done)
3. Enterprise Security Model
JWT Authentication: Secure session handling with token-based auth
RBAC (Role-Based Access Control):
ADMIN → Full access
MEMBER → Restricted access
Auto Admin Detection: Emails with @admin.com automatically assigned admin role
4. Professional UI/UX Design
Built with Framer Motion
Smooth animations and transitions
Modular architecture with Error Boundaries (prevents crashes)
Fully responsive (Desktop + Mobile optimized)
Tech Stack

Frontend:

React 19
Vite
Tailwind CSS
Framer Motion
Lucide Icons
Recharts

Backend:

Node.js
Express.js
Prisma ORM

Database:

PostgreSQL (Railway Hosting)

AI Integration:

Google Gemini API
API Structure
Authentication
/api/auth/register
/api/auth/login
/api/auth/me
Projects
Full CRUD operations
Team member assignment
Tasks
Task lifecycle management
Overdue detection (isOverdue)
Analytics
/api/tasks/dashboard
Generates workspace-level metrics
Local Setup Instructions

Clone Repository

git clone https://github.com/AnandaSreekar/team-task-manager.git

Environment Configuration

Frontend (.env):

VITE_API_URL=<your_api_url>
VITE_GEMINI_API_KEY=<your_gemini_api_key>

Backend (.env):

DATABASE_URL=<your_database_url>
JWT_SECRET=<your_secret_key>

Install Dependencies

npm install
cd backend
npm install

Database Migration

npx prisma migrate dev

Run Application

npm run dev
Demo Credentials
Admin Access
Email: admin@admin.com
Password: Admin@123
Member Access
Register using any valid email
