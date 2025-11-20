/**
 * Deployment Readiness Checker
 *
 * This script checks if the backend is ready for deployment
 * Run: node scripts/check_deployment_ready.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking Backend Deployment Readiness...\n');
console.log('='.repeat(60));

let allChecks = [];
let passedChecks = 0;
let failedChecks = 0;

function check(name, testFn) {
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${name}`);
      passedChecks++;
      allChecks.push({ name, status: 'PASS' });
    } else {
      console.log(`❌ ${name}`);
      failedChecks++;
      allChecks.push({ name, status: 'FAIL' });
    }
  } catch (error) {
    console.log(`❌ ${name} - ${error.message}`);
    failedChecks++;
    allChecks.push({ name, status: 'FAIL', error: error.message });
  }
}

// Check 1: package.json exists
check('package.json exists', () => {
  return fs.existsSync(path.join(__dirname, '../package.json'));
});

// Check 2: node_modules installed
check('Dependencies installed (node_modules)', () => {
  return fs.existsSync(path.join(__dirname, '../node_modules'));
});

// Check 3: Prisma schema exists
check('Prisma schema exists', () => {
  return fs.existsSync(path.join(__dirname, '../prisma/schema.prisma'));
});

// Check 4: Prisma client generated
check('Prisma client generated', () => {
  return fs.existsSync(path.join(__dirname, '../src/generated/prisma'));
});

// Check 5: Server file exists
check('Server file exists (src/server.js)', () => {
  return fs.existsSync(path.join(__dirname, '../src/server.js'));
});

// Check 6: MQTT service exists
check('MQTT service exists', () => {
  return fs.existsSync(path.join(__dirname, '../src/services/mqttService.js'));
});

// Check 7: Device controller exists
check('Device controller exists', () => {
  return fs.existsSync(path.join(__dirname, '../src/controllers/deviceController.js'));
});

// Check 8: Battery routes added
check('Battery routes configured', () => {
  const routesFile = fs.readFileSync(path.join(__dirname, '../src/routes/deviceRoutes.js'), 'utf8');
  return routesFile.includes('battery/status') && routesFile.includes('battery/reset');
});

// Check 9: .env file exists
check('.env file exists', () => {
  return fs.existsSync(path.join(__dirname, '../.env'));
});

// Check 10: DATABASE_URL in .env
check('DATABASE_URL configured', () => {
  if (!fs.existsSync(path.join(__dirname, '../.env'))) return false;
  const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  return envFile.includes('DATABASE_URL=');
});

// Check 11: Battery migration exists
check('Battery migration exists', () => {
  const migrationsDir = path.join(__dirname, '../prisma/migrations');
  if (!fs.existsSync(migrationsDir)) return false;

  const migrations = fs.readdirSync(migrationsDir);
  return migrations.some(m => m.includes('initialize_battery_system'));
});

// Check 12: Battery seed script exists
check('Battery seed script exists', () => {
  return fs.existsSync(path.join(__dirname, '../scripts/seed_battery_initial.js'));
});

// Check 13: Battery test script exists
check('Battery test script exists', () => {
  return fs.existsSync(path.join(__dirname, '../scripts/test_battery_reduction.js'));
});

// Check 14: Documentation exists
check('Battery documentation exists', () => {
  return fs.existsSync(path.join(__dirname, '../docs/BATTERY_SYSTEM.md'));
});

// Check 15: Deployment guide exists
check('Deployment guide exists', () => {
  return fs.existsSync(path.join(__dirname, '../DEPLOYMENT_GUIDE.md'));
});

// Check 16: Required npm scripts
check('Required npm scripts configured', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const scripts = packageJson.scripts || {};
  return scripts.start && scripts.dev && scripts.build;
});

// Check 17: Node version check
check('Node.js version >= 18', () => {
  const version = process.version.replace('v', '');
  const major = parseInt(version.split('.')[0]);
  return major >= 18;
});

// Check 18: Prisma in dependencies
check('Prisma in dependencies', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return deps['prisma'] && deps['@prisma/client'];
});

// Check 19: MQTT in dependencies
check('MQTT client in dependencies', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  return packageJson.dependencies && packageJson.dependencies['mqtt'];
});

// Check 20: Express in dependencies
check('Express in dependencies', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  return packageJson.dependencies && packageJson.dependencies['express'];
});

console.log('='.repeat(60));
console.log(`\n📊 Results: ${passedChecks} passed, ${failedChecks} failed\n`);

if (failedChecks === 0) {
  console.log('🎉 Backend is READY for deployment!\n');
  console.log('Next steps:');
  console.log('1. Set production environment variables in .env');
  console.log('2. Run: npm run prisma:migrate');
  console.log('3. Run: node scripts/seed_battery_initial.js');
  console.log('4. Run: npm start');
  console.log('\nSee DEPLOYMENT_GUIDE.md for detailed instructions.');
  process.exit(0);
} else {
  console.log('⚠️  Backend has issues that need to be fixed before deployment.\n');
  console.log('Failed checks:');
  allChecks.filter(c => c.status === 'FAIL').forEach(c => {
    console.log(`  - ${c.name}${c.error ? ': ' + c.error : ''}`);
  });
  console.log('\nPlease fix the issues above and run this script again.');
  process.exit(1);
}
