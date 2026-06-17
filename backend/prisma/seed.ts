import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.kpi.deleteMany();
  await prisma.chartData.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.mapData.deleteMany();
  await prisma.watchlist.deleteMany();

  console.log('Seeding KPIs...');
  const kpis = [
    {
      title: 'Global GDP Growth',
      period: '2025 Forecast',
      value: '2.8%',
      subtitle: '+0.1% vs prev',
      trend: 'up',
      sparkline: JSON.stringify([2.1, 2.3, 2.5, 2.6, 2.8, 2.8, 2.9]),
      sparklineColor: '#6D5DFC'
    },
    {
      title: 'US Core Inflation',
      period: 'Apr YoY',
      value: '3.6%',
      subtitle: 'Higher than expected',
      trend: 'down',
      sparkline: JSON.stringify([4.1, 4.0, 3.9, 3.8, 3.7, 3.5, 3.6]),
      sparklineColor: '#EF4444'
    },
    {
      title: 'Unemployment Rate',
      period: 'US - Apr',
      value: '3.9%',
      subtitle: 'Unchanged',
      trend: 'neutral',
      sparkline: JSON.stringify([3.8, 3.8, 3.7, 3.9, 3.9, 3.8, 3.9]),
      sparklineColor: '#94A3B8'
    }
  ];

  for (const kpi of kpis) {
    await prisma.kpi.create({ data: kpi });
  }

  console.log('Seeding Chart Data...');
  const chartData = [
    { year: '2019', value: 100 },
    { year: '2020', value: 95 },
    { year: '2021', value: 105 },
    { year: '2022', value: 108 },
    { year: '2023', value: 110 },
    { year: '2024', value: 115 },
    { year: '2025', value: 118 },
  ];

  for (const data of chartData) {
    await prisma.chartData.create({ data });
  }

  console.log('Seeding Insights...');
  const insights = [
    {
      title: 'ECB Cuts Interest Rates',
      content: 'The European Central Bank cut rates by 25 bps, citing easing inflation pressures.',
      type: 'high',
      date: '2 hours ago',
      tags: JSON.stringify(['Monetary Policy', 'Euro Area']),
      url: 'https://www.reuters.com/markets/europe/ecb-cuts-rates-again-inflation-fades-economy-stalls-2024-09-12/'
    },
    {
      title: 'US Non-Farm Payrolls Surge',
      content: 'Job creation exceeded expectations with 272k jobs added last month, challenging rate cut narratives.',
      type: 'warning',
      date: '5 hours ago',
      tags: JSON.stringify(['Labor Market', 'US']),
      url: 'https://www.bloomberg.com/news/articles/2024-06-07/us-payrolls-surge-by-272-000-wages-pick-up-in-blow-to-fed'
    },
    {
      title: 'China Export Growth Accelerates',
      content: 'Exports rose 7.6% YoY, beating estimates and providing a boost to the economic recovery.',
      type: 'info',
      date: '1 day ago',
      tags: JSON.stringify(['Trade', 'China']),
      url: 'https://www.cnbc.com/2024/06/07/china-exports-beat-expectations-in-may-imports-miss.html'
    }
  ];

  for (const insight of insights) {
    await prisma.insight.create({ data: insight });
  }

  console.log('Seeding Map Data...');
  const mapData = [
    // GDP Growth
    { country: 'United States', code: 'USA', value: 2.5, indicator: 'GDP Growth' },
    { country: 'China', code: 'CHN', value: 5.2, indicator: 'GDP Growth' },
    { country: 'Germany', code: 'DEU', value: -0.1, indicator: 'GDP Growth' },
    { country: 'India', code: 'IND', value: 7.8, indicator: 'GDP Growth' },
    { country: 'Brazil', code: 'BRA', value: 2.9, indicator: 'GDP Growth' },
    { country: 'United Kingdom', code: 'GBR', value: 0.6, indicator: 'GDP Growth' },
    { country: 'Japan', code: 'JPN', value: 0.9, indicator: 'GDP Growth' },
    { country: 'Canada', code: 'CAN', value: 1.1, indicator: 'GDP Growth' },
    { country: 'Australia', code: 'AUS', value: 1.5, indicator: 'GDP Growth' },
    { country: 'France', code: 'FRA', value: 0.7, indicator: 'GDP Growth' },
    { country: 'Italy', code: 'ITA', value: 0.6, indicator: 'GDP Growth' },
    { country: 'Mexico', code: 'MEX', value: 2.4, indicator: 'GDP Growth' },
    { country: 'South Korea', code: 'KOR', value: 2.3, indicator: 'GDP Growth' },
    { country: 'Spain', code: 'ESP', value: 2.1, indicator: 'GDP Growth' },
    { country: 'Indonesia', code: 'IDN', value: 5.0, indicator: 'GDP Growth' },
    
    // Inflation
    { country: 'United States', code: 'USA', value: 3.4, indicator: 'Inflation' },
    { country: 'China', code: 'CHN', value: 0.3, indicator: 'Inflation' },
    { country: 'Germany', code: 'DEU', value: 2.4, indicator: 'Inflation' },
    { country: 'India', code: 'IND', value: 4.8, indicator: 'Inflation' },
    { country: 'Brazil', code: 'BRA', value: 3.7, indicator: 'Inflation' },
    { country: 'United Kingdom', code: 'GBR', value: 2.3, indicator: 'Inflation' },
    { country: 'Japan', code: 'JPN', value: 2.8, indicator: 'Inflation' },
    { country: 'Canada', code: 'CAN', value: 2.7, indicator: 'Inflation' },
    { country: 'Australia', code: 'AUS', value: 3.6, indicator: 'Inflation' },
    { country: 'France', code: 'FRA', value: 2.2, indicator: 'Inflation' },
    { country: 'Italy', code: 'ITA', value: 0.8, indicator: 'Inflation' },
    { country: 'Mexico', code: 'MEX', value: 4.6, indicator: 'Inflation' },
    { country: 'South Korea', code: 'KOR', value: 2.9, indicator: 'Inflation' },
    { country: 'Spain', code: 'ESP', value: 3.3, indicator: 'Inflation' },
    { country: 'Indonesia', code: 'IDN', value: 2.8, indicator: 'Inflation' },
    { country: 'Argentina', code: 'ARG', value: 289.4, indicator: 'Inflation' },
    { country: 'Turkey', code: 'TUR', value: 69.8, indicator: 'Inflation' },
    
    // Unemployment
    { country: 'United States', code: 'USA', value: 3.9, indicator: 'Unemployment' },
    { country: 'China', code: 'CHN', value: 5.0, indicator: 'Unemployment' },
    { country: 'Germany', code: 'DEU', value: 5.9, indicator: 'Unemployment' },
    { country: 'India', code: 'IND', value: 8.1, indicator: 'Unemployment' },
    { country: 'Brazil', code: 'BRA', value: 7.9, indicator: 'Unemployment' },
    { country: 'United Kingdom', code: 'GBR', value: 4.3, indicator: 'Unemployment' },
    { country: 'Japan', code: 'JPN', value: 2.6, indicator: 'Unemployment' },
    { country: 'Canada', code: 'CAN', value: 6.1, indicator: 'Unemployment' },
    { country: 'Australia', code: 'AUS', value: 3.8, indicator: 'Unemployment' },
    { country: 'France', code: 'FRA', value: 7.5, indicator: 'Unemployment' },
    { country: 'Italy', code: 'ITA', value: 7.2, indicator: 'Unemployment' },
    { country: 'Mexico', code: 'MEX', value: 2.8, indicator: 'Unemployment' },
    { country: 'South Korea', code: 'KOR', value: 2.8, indicator: 'Unemployment' },
    { country: 'Spain', code: 'ESP', value: 11.7, indicator: 'Unemployment' },
    { country: 'Indonesia', code: 'IDN', value: 5.3, indicator: 'Unemployment' },
    { country: 'South Africa', code: 'ZAF', value: 32.9, indicator: 'Unemployment' },
    
    // Policy Rates
    { country: 'United States', code: 'USA', value: 5.37, indicator: 'Policy Rates' },
    { country: 'China', code: 'CHN', value: 3.45, indicator: 'Policy Rates' },
    { country: 'Germany', code: 'DEU', value: 4.25, indicator: 'Policy Rates' },
    { country: 'India', code: 'IND', value: 6.50, indicator: 'Policy Rates' },
    { country: 'Brazil', code: 'BRA', value: 10.50, indicator: 'Policy Rates' },
    { country: 'United Kingdom', code: 'GBR', value: 5.25, indicator: 'Policy Rates' },
    { country: 'Japan', code: 'JPN', value: 0.10, indicator: 'Policy Rates' },
    { country: 'Canada', code: 'CAN', value: 4.75, indicator: 'Policy Rates' },
    { country: 'Australia', code: 'AUS', value: 4.35, indicator: 'Policy Rates' },
    { country: 'France', code: 'FRA', value: 4.25, indicator: 'Policy Rates' },
    { country: 'Italy', code: 'ITA', value: 4.25, indicator: 'Policy Rates' },
    { country: 'Mexico', code: 'MEX', value: 11.00, indicator: 'Policy Rates' },
    { country: 'South Korea', code: 'KOR', value: 3.50, indicator: 'Policy Rates' },
    { country: 'Spain', code: 'ESP', value: 4.25, indicator: 'Policy Rates' },
    { country: 'Indonesia', code: 'IDN', value: 6.25, indicator: 'Policy Rates' }
  ];

  for (const mapItem of mapData) {
    await prisma.mapData.create({ data: mapItem });
  }

  console.log('Seeding Watchlist...');
  const watchlist = [
    { indicator: 'GDP', country: 'Euro Area', latest: '0.3%', change: '+0.1%', changeType: 'up' },
    { indicator: 'CPI', country: 'UK', latest: '3.2%', change: '-0.2%', changeType: 'down' },
    { indicator: 'Policy Rate', country: 'Japan', latest: '0.1%', change: '0.0%', changeType: 'neutral' }
  ];

  for (const item of watchlist) {
    await prisma.watchlist.create({ data: item });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
