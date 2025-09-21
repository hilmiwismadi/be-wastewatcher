# WasteWatcher Backend API

Backend API for WasteWatcher Smart Waste Management System built with Express.js and PostgreSQL.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Configuration**
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env` file:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=wastewatcher_db
     DB_USER=your_username
     DB_PASSWORD=your_password
     ```

3. **Database Setup**
   - Create PostgreSQL database
   - Run database setup script: `database_setup.sql`
   - Run seeding script: `database_seed.sql`

4. **Start Server**
   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

5. **Test Database Connection**
   ```bash
   npm test
   ```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Trash Bins
- `GET /api/trash-bins` - Get all trash bins
- `GET /api/trash-bins/status` - Get bins with current status
- `GET /api/trash-bins/:id` - Get specific trash bin
- `GET /api/trash-bins/location/:area` - Get bins by location

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/health` - Get devices with health status
- `GET /api/devices/statistics` - Get device statistics
- `GET /api/devices/:id` - Get specific device
- `GET /api/devices/:id/status` - Get device current status

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/waste-distribution` - Waste category distribution
- `GET /api/analytics/hourly-patterns` - Hourly waste patterns
- `GET /api/analytics/daily` - Daily analytics for charts
- `GET /api/analytics/fill-levels` - Fill level distribution
- `GET /api/analytics/locations` - Location-based analytics
- `GET /api/analytics/devices/:id/realtime` - Real-time device data
- `GET /api/analytics/collection-trends` - Collection frequency trends
- `GET /api/analytics/health-trends` - Device health trends
- `GET /api/analytics/alert-statistics` - Alert statistics

## 🔧 Configuration

### Environment Variables
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Database Connection String Format
For manual connection testing:
```
postgresql://username:password@localhost:5432/wastewatcher_db
```

## 📊 Database Schema

The API works with these main tables:
- **TrashBin** - Physical trash bin containers
- **Device** - IoT devices in bins
- **Sensor** - Individual sensors (load_cell, ultrasonic)
- **WeightData** - Weight measurements
- **VolumeData** - Volume/distance measurements
- **BinStatus** - Current bin status
- **DailyAnalytics** - Aggregated daily data
- **AlertLog** - System alerts

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request limiting
- **Input Validation** - Request validation
- **Environment Variables** - Secret management

## 📈 Monitoring

- Health check endpoint at `/health`
- Request logging with Morgan
- Error handling and logging
- Database connection monitoring

## 🚦 Server Status

When server starts successfully, you'll see:
```
✅ Database connected successfully
🚀 Server running on port 3001
📊 Health check: http://localhost:3001/health
```

## 🔍 Troubleshooting

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Kill process using the port

3. **Missing Tables**
   - Run `database_setup.sql` first
   - Then run `database_seed.sql`