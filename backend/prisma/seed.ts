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

  console.log('Clearing old validation data...');
  await prisma.dataApprovalQueue.deleteMany();

  console.log('Seeding Data Validation Queue...');
  
  // 12 Pending items requiring manual review (score <= 80)
  const pendingQueue = [
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
      payload: JSON.stringify({
        title: 'US Core Inflation (Critical Anomaly)',
        period: 'May YoY',
        value: '18.5%',
        subtitle: 'Critical anomaly detected',
        trend: 'up',
        sparkline: JSON.stringify([3.6, 3.8, 4.2, 5.1, 10.0, 15.2, 18.5]),
        sparklineColor: '#EF4444'
      }),
      validationScore: 77.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 100, weight: 0.3, reason: 'Format looks correct' },
        quality: { score: 100, weight: 0.25, reason: 'No missing or invalid values detected' },
        range: { score: 10, weight: 0.25, reason: 'Rate value (18.5%) is outside historically normal US core inflation bounds (0-15%)' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
      payload: JSON.stringify({
        title: 'US Unemployment Rate (Data Anomaly)',
        period: 'May',
        value: 'NaN',
        subtitle: 'Missing data point',
        trend: 'neutral',
        sparkline: JSON.stringify([3.9, 3.9, null, 3.8, 3.9]),
        sparklineColor: '#94A3B8'
      }),
      validationScore: 72.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 50, weight: 0.3, reason: 'Value is not a standard numeric/string type (found NaN/null)' },
        quality: { score: 50, weight: 0.25, reason: 'Found missing/null values in sparkline data' },
        range: { score: 100, weight: 0.25, reason: 'Values within acceptable bounds' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 30),
      payload: JSON.stringify({
        title: 'Euro Area GDP Growth (Extreme Shift)',
        period: 'Q1 QoQ',
        value: '-8.5%',
        subtitle: 'Extreme revision',
        trend: 'down',
        sparkline: JSON.stringify([0.1, 0.2, -0.1, 0.3, -8.5]),
        sparklineColor: '#EF4444'
      }),
      validationScore: 77.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 100, weight: 0.3, reason: 'Format looks correct' },
        quality: { score: 100, weight: 0.25, reason: 'No missing values detected' },
        range: { score: 10, weight: 0.25, reason: 'QoQ Growth rate (-8.5%) is outside normal expansion/contraction bounds (-4% to 4%)' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 40),
      payload: JSON.stringify({
        title: 'UK Inflation Rate (Format Error)',
        period: 'May YoY',
        value: ['3.2%'],
        subtitle: 'Format mismatch',
        trend: 'down',
        sparkline: JSON.stringify([4.0, 3.8, 3.5, 3.2]),
        sparklineColor: '#EF4444'
      }),
      validationScore: 72.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 50, weight: 0.3, reason: 'Value is passed as an Array instead of string/number' },
        quality: { score: 50, weight: 0.25, reason: 'Warning: nested array data formats' },
        range: { score: 100, weight: 0.25, reason: 'Value is within acceptable ranges' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 50),
      payload: JSON.stringify({
        title: 'Japan Policy Interest Rate (Null Values)',
        period: 'Q2',
        value: '0.1%',
        subtitle: 'Data quality alert',
        trend: 'neutral',
        sparkline: JSON.stringify([0.1, null, null, null, 0.1]),
        sparklineColor: '#3B82F6'
      }),
      validationScore: 72.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 100, weight: 0.3, reason: 'Format looks correct' },
        quality: { score: 50, weight: 0.25, reason: 'Sparkline contains 3 missing or null values' },
        range: { score: 100, weight: 0.25, reason: 'Values within normal ranges' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 60),
      payload: JSON.stringify({
        title: 'Brazil Unemployment Rate (Extreme Alert)',
        period: 'Apr',
        value: '45.2%',
        subtitle: 'Abnormal spike',
        trend: 'up',
        sparkline: JSON.stringify([7.9, 8.0, 7.8, 45.2]),
        sparklineColor: '#EF4444'
      }),
      validationScore: 77.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 100, weight: 0.3, reason: 'Format looks correct' },
        quality: { score: 100, weight: 0.25, reason: 'No missing values' },
        range: { score: 10, weight: 0.25, reason: 'Unemployment rate (45.2%) is outside typical bounds (0% to 30%)' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'SinoDataScrape',
      extractedAt: new Date(Date.now() - 1000 * 60 * 70),
      payload: JSON.stringify({
        title: 'China Retail Sales YoY (Scraper Source)',
        period: 'May YoY',
        value: '4.2%',
        subtitle: 'Ingested via external scraper',
        trend: 'up',
        sparkline: JSON.stringify([3.5, 3.8, 4.0, 4.2]),
        sparklineColor: '#10B981'
      }),
      validationScore: 67.5,
      validationDetails: JSON.stringify({
        source: { score: 50, weight: 0.2, reason: 'Ingested from unverified scraper (SinoDataScrape)' },
        format: { score: 100, weight: 0.3, reason: 'Format looks correct' },
        quality: { score: 100, weight: 0.25, reason: 'No missing values' },
        range: { score: 50, weight: 0.25, reason: 'Scraper source does not guarantee historic calibration' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 80),
      payload: JSON.stringify({
        title: 'Germany Industrial Production (NaN Value)',
        period: 'May YoY',
        value: 'NaN',
        subtitle: 'Corrupted database field',
        trend: 'down',
        sparkline: JSON.stringify([-1.2, -1.0, -1.5, NaN]),
        sparklineColor: '#EF4444'
      }),
      validationScore: 72.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 50, weight: 0.3, reason: 'Value is corrupted string NaN' },
        quality: { score: 50, weight: 0.25, reason: 'Sparkline array contains NaN value' },
        range: { score: 100, weight: 0.25, reason: 'Values within normal bounds' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 90),
      payload: JSON.stringify({
        title: 'India Consumer Confidence (Scale Violation)',
        period: 'Q1',
        value: '250.0',
        subtitle: 'Scale out of bounds',
        trend: 'up',
        sparkline: JSON.stringify([110, 115, 120, 250]),
        sparklineColor: '#10B981'
      }),
      validationScore: 77.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 100, weight: 0.3, reason: 'Format looks correct' },
        quality: { score: 100, weight: 0.25, reason: 'No missing values' },
        range: { score: 10, weight: 0.25, reason: 'Consumer confidence index (250) exceeds maximum standard scale limits (0-150)' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 100),
      payload: JSON.stringify({
        title: 'US Government Debt to GDP (Missing Fields)',
        period: '2024',
        value: '124.0%',
        sparkline: JSON.stringify([120, 122, 123, 124])
      }),
      validationScore: 70.0,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 50, weight: 0.3, reason: 'Payload is missing mandatory fields: "trend", "subtitle"' },
        quality: { score: 100, weight: 0.25, reason: 'No missing data inside provided fields' },
        range: { score: 100, weight: 0.25, reason: 'Debt ratio (124%) is within reasonable G20 parameters' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 110),
      payload: JSON.stringify({
        title: 'Australia CPI (Extreme Deflation Anomaly)',
        period: 'Q1 YoY',
        value: '-5.4%',
        subtitle: 'Abnormal deflation rate',
        trend: 'down',
        sparkline: JSON.stringify([2.1, 1.8, 0.5, -5.4]),
        sparklineColor: '#EF4444'
      }),
      validationScore: 77.5,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 100, weight: 0.3, reason: 'Format looks correct' },
        quality: { score: 100, weight: 0.25, reason: 'No missing values' },
        range: { score: 10, weight: 0.25, reason: 'Annual deflation (-5.4%) exceeds stable parameters for advanced G20 economies (typical floor: -2%)' }
      }),
      status: 'PENDING'
    },
    {
      dataType: 'KPI',
      source: 'FRED',
      extractedAt: new Date(Date.now() - 1000 * 60 * 120),
      payload: JSON.stringify({
        title: 'Canada Manufacturing PMI (Empty Sparkline)',
        period: 'May',
        value: '51.5',
        subtitle: 'PMI expansion',
        trend: 'up',
        sparkline: JSON.stringify([]),
        sparklineColor: '#10B981'
      }),
      validationScore: 76.0,
      validationDetails: JSON.stringify({
        source: { score: 100, weight: 0.2, reason: 'Highly trusted official source (FRED)' },
        format: { score: 80, weight: 0.3, reason: 'Format: sparkline payload is an empty array' },
        quality: { score: 100, weight: 0.25, reason: 'No null values in standard parameters' },
        range: { score: 100, weight: 0.25, reason: 'PMI index (51.5) is normal' }
      }),
      status: 'PENDING'
    }
  ];

  for (const item of pendingQueue) {
    await prisma.dataApprovalQueue.create({ data: item });
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
