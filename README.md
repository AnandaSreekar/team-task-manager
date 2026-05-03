# TaskFlow - Team Task Manager

## Live Demo
- Frontend: https://YOUR-NETLIFY-URL.netlify.app
- Backend API: https://team-task-manager-production-5374.up.railway.app
- Demo credentials:
  - Admin: admin@admin.com / Admin@123
  - Member: Register a new account

## Features
- JWT Authentication with role-based access (Admin/Member)
- Project management with team collaboration
- Task creation, assignment and status tracking
- Real-time dashboard with overdue detection
- Admin controls vs Member permissions

## Tech Stack
- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: React, Vite, Tailwind CSS
- Auth: JWT + bcrypt
- Deploy: Railway

## Setup Instructions
### Backend
```bash
cd backend
cp .env.example .env
# Fill in your DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run dev
```

### Frontend  
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm install
npm run dev
```

## API Endpoints
### Auth
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

### Projects
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id

### Tasks
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/dashboard
PATCH  /api/tasks/:id
DELETE /api/tasks/:id

## Default Admin Account
Email: admin@admin.com
Password: Admin@123
