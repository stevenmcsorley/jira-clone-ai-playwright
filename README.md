# Jira Clone

A modern project management tool built with React, TypeScript, NestJS, and PostgreSQL.

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
- Node.js 18+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd jira-clone
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - MinIO Console: http://localhost:9001 (minio/minio123)

### Database Setup

The database will be automatically created and synchronized when you start the backend.

To seed with sample data:
```bash
docker-compose exec backend npm run seed
```

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