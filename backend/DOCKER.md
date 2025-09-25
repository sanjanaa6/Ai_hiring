# Backend Docker Setup

This guide will help you set up the AI Hiring Platform backend using Docker.

## Quick Start

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Update environment variables** in `.env` file:
   - Add your OpenAI API key
   - Add your Gemini API key
   - Update email configuration
   - Update JWT secret
   - Update any other required variables

4. **Build and run backend with MongoDB**:
   ```bash
   docker-compose up --build
   ```

5. **Access the backend**:
   - API: http://localhost:5000
   - MongoDB: localhost:27017

## Services

- **mongodb**: MongoDB database
- **backend**: Node.js Express API server

## Commands

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose build

# Access container shell
docker-compose exec backend sh
```

## Environment Variables

Required environment variables (set in `.env` file):
- `OPENAI_API_KEY`: Your OpenAI API key
- `GEMINI_API_KEY`: Your Gemini API key
- `JWT_SECRET`: JWT secret for authentication
- `EMAIL_USER`: Email service username
- `EMAIL_PASS`: Email service password
- `CLIENT_URL`: Frontend URL (default: http://localhost:3000)
