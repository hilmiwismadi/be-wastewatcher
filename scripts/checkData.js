const { prisma } = require('../src/config/prisma');

async function checkData() {
  try {
    const weightCount = await prisma.weightData.count();
    const volumeCount = await prisma.volumeData.count();
    const dailyCount = await prisma.dailyAnalytics.count();

    console.log('Weight data:', weightCount, 'records');
    console.log('Volume data:', volumeCount, 'records');
    console.log('Daily analytics:', dailyCount, 'records');

    // Check latest weight and volume data
    const latestWeight = await prisma.weightData.findFirst({
      orderBy: { timestamp: 'desc' },
      take: 1
    });

    const latestVolume = await prisma.volumeData.findFirst({
      orderBy: { timestamp: 'desc' },
      take: 1
    });

    console.log('\nLatest weight:', latestWeight?.weight_kg, 'kg at', latestWeight?.timestamp);
    console.log('Latest volume:', latestVolume?.fill_percentage, '% at', latestVolume?.timestamp);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
