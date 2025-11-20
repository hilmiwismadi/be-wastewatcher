# Backend Deployment Guide - WasteWatcher API

## ✅ Pre-Deployment Checklist

### 1. ✅ Dependencies Installed
```bash
cd be-wastewatcher
npm install
```

### 2. ✅ Prisma Client Generated
```bash
npm run build
# or
npx prisma generate
```

### 3. ✅ Environment Variables Configured
Check `.env` file contains:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MQTT_BROKER_URL` - MQTT broker URL
- `MQTT_USERNAME` & `MQTT_PASSWORD` (if required)

### 4. ✅ Database Migrations Applied
```bash
npm run prisma:migrate
# or
npx prisma migrate deploy
```

### 5. ✅ Battery System Initialized
```bash
# Initialize all devices to 94% battery
node scripts/seed_battery_initial.js

# OR reset existing batteries
curl -X POST http://localhost:5000/api/devices/battery/reset
```

---

## 🚀 Deployment Options

### Option 1: Local Production Deployment

```bash
# Start the server
npm start
```

The server will run on the port specified in `.env` (default: 5000).

**Access:**
- API Base: `http://localhost:5000/api`
- Battery Status: `http://localhost:5000/api/devices/battery/status`
- Battery Reset: `POST http://localhost:5000/api/devices/battery/reset`

---

### Option 2: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - MQTT_BROKER_URL=${MQTT_BROKER_URL}
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=wastewatcher
      - POSTGRES_PASSWORD=your_password
      - POSTGRES_DB=wastewatcher_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

### Option 3: Cloud Deployment (Railway/Heroku/Render)

#### Railway Deployment

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize:**
   ```bash
   railway login
   railway init
   ```

3. **Add PostgreSQL Database:**
   ```bash
   railway add postgresql
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Run Migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

7. **Initialize Batteries:**
   ```bash
   railway run node scripts/seed_battery_initial.js
   ```

---

#### Heroku Deployment

1. **Create Heroku App:**
   ```bash
   heroku create wastewatcher-api
   ```

2. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
   ```

4. **Add `Procfile`:**
   ```
   web: npm start
   release: npx prisma migrate deploy
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

6. **Initialize Batteries:**
   ```bash
   heroku run node scripts/seed_battery_initial.js
   ```

---

## 🔧 Post-Deployment Steps

### 1. Verify Server is Running

```bash
# Check server health
curl http://your-domain.com/api/devices

# Should return list of devices
```

### 2. Test Battery System

```bash
# Check battery status
curl http://your-domain.com/api/devices/battery/status

# Should show all devices with 94% battery
```

### 3. Test MQTT Connection

Check server logs for:
```
✅ Connected to MQTT broker
📡 Subscribed to topic: CapsE6/Lt2SGLC/#
📡 Subscribed to topic: CapsE6/KantinSGLC/#
```

### 4. Test Battery Reduction

Send test MQTT message:
```bash
mosquitto_pub -h broker.hivemq.com -t "CapsE6/KantinSGLC" \
  -m '{"DISTANCE":[60,59,75,73],"WEIGHT":892}'
```

Check logs for:
```
🔋 Battery updated for DEV_KANTIN_LT1_ORGANIC: 94.000% → 93.986% (-0.014%)
```

### 5. Verify Frontend Connection

Update frontend `.env`:
```env
NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

Test from browser:
```
http://localhost:3001/realdata/kantinlt1
```

Battery should show ~94% and decrease over time.

---

## 📊 Monitoring

### Key Metrics to Monitor

1. **Battery Levels**
   ```bash
   curl http://your-domain.com/api/devices/battery/status
   ```

2. **MQTT Connection Status**
   - Check logs for connection errors
   - Monitor MQTT message rate

3. **Database Performance**
   ```bash
   # Check latest battery updates
   psql $DATABASE_URL -c "SELECT deviceid, battery_percentage, timestamp
                          FROM devicehealth
                          ORDER BY timestamp DESC
                          LIMIT 10;"
   ```

4. **API Response Times**
   - Monitor `/api/devices` endpoint
   - Monitor `/api/devices/battery/status` endpoint

### Log Monitoring

**Production logs:**
```bash
# Local
tail -f logs/app.log

# Docker
docker logs -f wastewatcher-backend

# Railway
railway logs

# Heroku
heroku logs --tail
```

**Look for:**
- ✅ `🔋 Battery updated` - Battery reduction working
- ✅ `📊 Received MQTT data` - MQTT messages arriving
- ⚠️ `⚠️ LOW BATTERY WARNING` - Devices need attention
- 🚨 `🚨 CRITICAL: Device battery depleted` - Urgent action needed

---

## 🔄 Maintenance

### Reset All Batteries

```bash
curl -X POST http://your-domain.com/api/devices/battery/reset
```

### Reset Specific Device

```bash
curl -X POST http://your-domain.com/api/devices/DEV_KANTIN_LT1_ORGANIC/battery/reset
```

### Database Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250120.sql
```

### Update Dependencies

```bash
npm update
npx prisma migrate deploy
npm restart
```

---

## 🐛 Troubleshooting

### Issue: Server Won't Start

**Error:** `EPERM: operation not permitted`
**Solution:** Stop running dev server before building
```bash
# Find process
netstat -ano | findstr :5000
# Kill process (replace PID)
taskkill /PID 20496 /F
# Rebuild
npm run build
```

---

### Issue: Prisma Client Not Found

**Error:** `@prisma/client did not initialize yet`
**Solution:** Generate Prisma client
```bash
npx prisma generate
```

---

### Issue: Battery Not Decreasing

**Symptoms:** Battery stays at 94% despite MQTT messages

**Check:**
1. MQTT connection established?
   ```bash
   # Check logs for: ✅ Connected to MQTT broker
   ```

2. Device mapping correct?
   ```javascript
   // src/services/mqttService.js
   locationToDeviceMapping = {
     'KantinSGLC': {
       'organic': 'DEV_KANTIN_LT1_ORGANIC',
       ...
     }
   }
   ```

3. MQTT messages arriving?
   ```bash
   # Check logs for: 📊 Received MQTT data from ...
   ```

4. Battery update logs?
   ```bash
   # Check logs for: 🔋 Battery updated for ...
   ```

---

### Issue: Frontend Shows Wrong Battery

**Symptoms:** Frontend shows old battery percentage

**Solution:**
1. Clear browser cache
2. Check API response:
   ```bash
   curl http://your-domain.com/api/devices?trashbinid=TB_KANTIN_LT1
   ```
3. Verify `battery_percentage` field in response
4. Check frontend is using correct API URL

---

## 📦 Deployment Artifacts

### Files Included in Deployment:

✅ **Required:**
- `src/` - Source code
- `prisma/` - Database schema and migrations
- `scripts/` - Utility scripts
- `package.json` - Dependencies
- `.env` - Environment variables (create for production)

✅ **Generated (create during deployment):**
- `node_modules/` - Dependencies (run `npm install`)
- `src/generated/prisma/` - Prisma client (run `npx prisma generate`)

❌ **Exclude from deployment:**
- `.git/` - Git history
- `.env.example` - Example env file
- `*.log` - Log files
- `node_modules/` - Will be reinstalled

### `.gitignore` Recommended:

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production

# Generated
src/generated/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
```

---

## ✅ Deployment Checklist Summary

- [ ] Install dependencies (`npm install`)
- [ ] Generate Prisma client (`npm run build`)
- [ ] Set environment variables (`.env`)
- [ ] Run database migrations (`npm run prisma:migrate`)
- [ ] Initialize batteries (`node scripts/seed_battery_initial.js`)
- [ ] Start server (`npm start`)
- [ ] Test API endpoints
- [ ] Test MQTT connection
- [ ] Verify battery reduction
- [ ] Update frontend API URL
- [ ] Test end-to-end flow
- [ ] Set up monitoring
- [ ] Configure backups

---

## 📞 Support

For issues or questions:
- **Documentation:** `docs/BATTERY_SYSTEM.md`
- **Battery Summary:** `BATTERY_IMPLEMENTATION_SUMMARY.md`
- **GitHub Issues:** https://github.com/wastewatcher/issues

---

**Last Updated:** November 20, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
