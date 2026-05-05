# TaskFlow - Elite Team Task Manager 🚀

A high-performance, full-stack project management suite built with a focus on intelligent insights, premium UX, and robust architecture.

**Live URL:** https://taskflow-me.netlify.app  
**API Status:** https://team-task-manager-production-5374.up.railway.app/api/health

## 🌟 Why This Standing Ahead of Others?
Unlike standard submissions, this version of TaskFlow includes:
- **🧠 AI Pulse Check**: Integrated Google Gemini AI to provide real-time executive briefings on team velocity and blockers.
- **📊 Interactive Analytics**: Professional-grade data visualizations using Recharts to track weekly task completion trends.
- **💎 Premium UX**: Framer Motion staggered animations, glassmorphism UI elements, and a responsive "SaaS-style" dashboard.
- **🛡️ Resilience**: Implemented a Global Error Boundary and custom loading skeletons to ensure the app never "breaks" for the user.

## ✨ Core Features
- **Role-Based Access (RBAC)**: Distinct permissions for `ADMIN` (manage team/projects) vs `MEMBER`.
- **Dynamic Dashboard**: Real-time stats for "Overdue", "In Progress", and "Completed" tasks.
- **Project Hub**: Full CRUD for projects with member allocation and task threading.
- **Overdue Detection**: Automated logic to identify and highlight high-risk tasks.
- **SPA Stability**: Configured `_redirects` for 100% routing stability on Netlify.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Intelligence**: Google Generative AI (Gemini SDK).
- **Security**: JWT (JSON Web Tokens) with secure localStorage persistence.

## 🔑 Demo Credentials
- **Admin**: `admin@admin.com` / `Admin@123`
- **Member**: Register any email or use `member@gmail.com` / `Member@123`

## 🚀 Setup Instructions
1. **Frontend**: Set `VITE_API_URL` and `VITE_GEMINI_API_KEY` in `.env`.
2. **Backend**: Configure `DATABASE_URL` and `JWT_SECRET`.
3. **Deployment**: Automatic CI/CD via GitHub to Netlify (Frontend) and Railway (Backend).
