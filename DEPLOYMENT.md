# WasteWatcher Backend - Deployment Guide

## Prerequisites

1. PostgreSQL database (can use services like Supabase, ElephantSQL, or Neon)
2. MQTT broker (optional - if not available, backend uses fallback mode)
3. Node.js hosting service (Render, Railway, Heroku, DigitalOcean, etc.)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=https://wastewatcher.netlify.app

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# MQTT Configuration (optional)
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=wastewatcher/#
```

## Deployment Steps

### Option 1: Render.com (Recommended)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add environment variables from the list above
5. Create a PostgreSQL database on Render and link it
6. Deploy!

### Option 2: Railway.app

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add a PostgreSQL database service
4. Configure environment variables
5. Railway will auto-detect the Node.js app and deploy

### Option 3: Heroku

1. Install Heroku CLI
2. Run:
```bash
heroku create wastewatcher-backend
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://wastewatcher.netlify.app
# Add other environment variables
git push heroku main
```

## Database Setup

After deployment, run Prisma migrations:

```bash
# For Render/Railway (add as a build command):
npx prisma migrate deploy

# Or manually via terminal:
npm run prisma:migrate
```

## Health Check

After deployment, test the health endpoint:

```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-12T...",
  "uptime": 123.456,
  "environment": "production"
}
```

## Update Frontend

After backend is deployed, update your frontend's environment variable:

**Netlify**: Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g., `https://wastewatcher-backend.onrender.com`)

## Testing

Test the API endpoints:

```bash
# Dashboard overview
curl https://your-backend-url.com/api/analytics/dashboard

# Trash bins
curl https://your-backend-url.com/api/trash-bins

# Devices
curl https://your-backend-url.com/api/devices
```

## Monitoring

- Check logs on your hosting platform
- Monitor the health endpoint
- Set up alerts for downtime

## Troubleshooting

1. **Database connection fails**: Verify DATABASE_URL format and credentials
2. **CORS errors**: Ensure FRONTEND_URL matches your deployed frontend exactly
3. **Port issues**: Most platforms set PORT automatically via environment variable
4. **Prisma errors**: Run `npx prisma generate` before deployment

## Notes

- The backend is deployment-ready without a build step (pure JavaScript)
- WebSocket support requires hosting platform that supports WebSockets
- MQTT is optional - the backend works without it using simulation mode
