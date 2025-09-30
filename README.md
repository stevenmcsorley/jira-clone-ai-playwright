# Jira Clone

A modern project management tool built with React, TypeScript, NestJS, and PostgreSQL.

![Sprint](/sprint.png "Sprint")

## 🚀 Features

- **Kanban Board**: Drag-and-drop interface for managing issues
- **Real-time Updates**: WebSocket-powered live collaboration
- **Project Management**: Create and manage multiple projects
- **Issue Tracking**: Comprehensive issue management with priorities, types, and assignments
- **User Management**: Team collaboration with role-based access
- **Modern UI**: Clean, responsive design with TailwindCSS

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Query for server state management
- Zustand for client state
- @dnd-kit for drag-and-drop

### Backend
- NestJS + TypeScript
- PostgreSQL with TypeORM
- Redis for caching and sessions
- Socket.IO for real-time features
- MinIO for file storage

### Infrastructure
- Docker & Docker Compose
- NGINX for reverse proxy
- Let's Encrypt for SSL (production)

## 🏃 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd jira-clone-ai-playwright
   ```

2. **Install dependencies locally**

   **Important**: You MUST install dependencies on your local machine first, even when using Docker. This ensures native modules (like bcrypt) are compiled for the correct platform.

   ```bash
   # Install backend dependencies
   cd backend
   npm install
   cd ..

   # Install frontend dependencies
   cd frontend
   npm install --legacy-peer-deps
   cd ..
   ```

3. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

4. **Import database schema and seed data**

   The database schema needs to be imported on first setup:

   ```bash
   # Import the database schema (only needed on first setup)
   docker-compose exec -T postgres psql -U jira_clone -d jira_clone < db_schema_dump.sql

   # Rebuild bcrypt for Linux (required after installing dependencies locally)
   docker-compose exec backend npm rebuild bcrypt

   # Rebuild TypeScript
   docker-compose exec backend npx nest build

   # Restart backend to apply changes
   docker-compose restart backend

   # Seed the database with sample data
   docker-compose exec backend node seed.js
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - MinIO Console: http://localhost:9001 (minio/minio123)

### Default Users

After seeding, you can use these test accounts:
- **Email**: john@example.com (Project Lead)
- **Email**: jane@example.com
- **Email**: mike@example.com

*Note: Passwords are hashed in the seed file. You'll need to implement login or update the seed script with proper password hashing.*

### Troubleshooting

**Issue: Backend shows "Error loading shared library bcrypt_lib.node"**
- Solution: Run `docker-compose exec backend npm rebuild bcrypt` and restart the backend

**Issue: Backend shows "Cannot find module 'bcrypt'"**
- Solution: Run `docker-compose exec backend npm install bcrypt` and restart the backend

**Issue: Frontend shows dependency conflicts**
- Solution: Use `npm install --legacy-peer-deps` when installing frontend dependencies

**Issue: Node modules from different OS**
- Solution: Delete `node_modules` and `package-lock.json` from both frontend and backend directories, then reinstall dependencies

### Moving to Another Computer

When moving this project to a new machine:

1. **DO NOT commit node_modules** - The `.gitignore` is configured to exclude them
2. Clone the repo on the new machine
3. Follow the "Install dependencies locally" step above
4. Run Docker commands as normal
5. The database schema and seed data will need to be imported again (unless you backup the PostgreSQL volume)

## 📁 Project Structure

```
jira-clone/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   └── Dockerfile
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── users/           # User management
│   │   ├── projects/        # Project management
│   │   ├── issues/          # Issue tracking
│   │   └── auth/            # Authentication
│   └── Dockerfile
└── docker-compose.yml       # Development environment
```

## 🔧 Environment Variables

Create `.env` files in both frontend and backend directories:

### Backend (.env)
```env
DATABASE_URL=postgres://jira_clone:secret@postgres:5432/jira_clone
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm run test

# Backend tests
cd backend && npm run test

# E2E tests
npm run test:e2e
```

## 🚢 Production Deployment

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy with SSL**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📝 API Documentation

The API documentation is available at `/api/docs` when running the backend.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.