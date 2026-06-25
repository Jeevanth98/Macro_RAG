import { PrismaClient } from '@prisma/client';
import { fetchFredSeries } from './fredService';
import { DataValidator } from './validator';
import 'dotenv/config';
import { langsmithService } from './observability/langsmith';

const prisma = new PrismaClient();
const validator = new DataValidator();

export async function syncFredData() {
  console.log('Starting FRED data synchronization...');
  const runId = langsmithService.traceStart('FRED Ingestion Sync', { timestamp: new Date().toISOString() });

  try {
    const gdpData = await fetchFredSeries('A191RL1Q225SBEA', 12);
    const inflationData = await fetchFredSeries('CPILFESL', 12);
    const unrateData = await fetchFredSeries('UNRATE', 12);
    
    // New KPIs
    const payemsData = await fetchFredSeries('PAYEMS', 12); // Nonfarm Payrolls
    const fedfundsData = await fetchFredSeries('FEDFUNDS', 12); // Fed Funds Rate
    const sentimentData = await fetchFredSeries('UMCSENT', 12); // Consumer Sentiment

    // DGS10: 10-Year Treasury, fetch ~10 years (2500 trading days)
    const dgs10Data = await fetchFredSeries('DGS10', 3000);

    await prisma.kpi.deleteMany();

    const kpisToInsert: any[] = [];

    const getTrend = (current: number, previous: number) => {
      if (current > previous) return 'up';
      if (current < previous) return 'down';
      return 'neutral';
    };

    if (gdpData.length >= 2) {
      const current = gdpData[gdpData.length - 1];
      const prev = gdpData[gdpData.length - 2];
      kpisToInsert.push({
        title: 'US Real GDP Growth',
        period: current.date,
        value: `${current.value.toFixed(1)}%`,
        subtitle: `Prev: ${prev.value.toFixed(1)}%`,
        trend: getTrend(current.value, prev.value),
        sparkline: JSON.stringify(gdpData.map((d: any) => d.value)),
        sparklineColor: '#6D5DFC'
      });
    }

    if (inflationData.length >= 2) {
      const current = inflationData[inflationData.length - 1];
      const prev = inflationData[inflationData.length - 2];
      kpisToInsert.push({
        title: 'US Core CPI Index',
        period: current.date,
        value: current.value.toFixed(1),
        subtitle: `Prev: ${prev.value.toFixed(1)}`,
        trend: getTrend(current.value, prev.value),
        sparkline: JSON.stringify(inflationData.map((d: any) => d.value)),
        sparklineColor: '#EF4444'
      });
    }

    if (unrateData.length >= 2) {
      const current = unrateData[unrateData.length - 1];
      const prev = unrateData[unrateData.length - 2];
      kpisToInsert.push({
        title: 'US Unemployment Rate',
        period: current.date,
        value: `${current.value.toFixed(1)}%`,
        subtitle: `Prev: ${prev.value.toFixed(1)}%`,
        trend: getTrend(current.value, prev.value),
        sparkline: JSON.stringify(unrateData.map((d: any) => d.value)),
        sparklineColor: '#94A3B8'
      });
    }

    if (payemsData.length >= 2) {
      const current = payemsData[payemsData.length - 1];
      const prev = payemsData[payemsData.length - 2];
      kpisToInsert.push({
        title: 'Nonfarm Payrolls',
        period: current.date,
        value: `${(current.value / 1000).toFixed(1)}M`, // Display in Millions
        subtitle: `Prev: ${(prev.value / 1000).toFixed(1)}M`,
        trend: getTrend(current.value, prev.value),
        sparkline: JSON.stringify(payemsData.map((d: any) => d.value)),
        sparklineColor: '#12B981' // Green
      });
    }

    if (fedfundsData.length >= 2) {
      const current = fedfundsData[fedfundsData.length - 1];
      const prev = fedfundsData[fedfundsData.length - 2];
      kpisToInsert.push({
        title: 'Federal Funds Rate',
        period: current.date,
        value: `${current.value.toFixed(2)}%`,
        subtitle: `Prev: ${prev.value.toFixed(2)}%`,
        trend: getTrend(current.value, prev.value),
        sparkline: JSON.stringify(fedfundsData.map((d: any) => d.value)),
        sparklineColor: '#F59E0B' // Orange
      });
    }

    if (sentimentData.length >= 2) {
      const current = sentimentData[sentimentData.length - 1];
      const prev = sentimentData[sentimentData.length - 2];
      kpisToInsert.push({
        title: 'Consumer Sentiment',
        period: current.date,
        value: current.value.toFixed(1),
        subtitle: `Prev: ${prev.value.toFixed(1)}`,
        trend: getTrend(current.value, prev.value),
        sparkline: JSON.stringify(sentimentData.map((d: any) => d.value)),
        sparklineColor: '#3B82F6' // Blue
      });
    }

    for (const kpi of kpisToInsert) {
      const validation = validator.validate({
        source: 'FRED',
        dataType: 'KPI',
        payload: kpi
      });

      if (validation.isAutoApproved) {
        await prisma.kpi.create({ 
          data: {
            ...kpi,
            source: validation.metadata.source,
            extractedAt: validation.metadata.extractedAt,
            validationScore: validation.finalScore
          } 
        });
        await prisma.dataApprovalQueue.create({
          data: {
            dataType: 'KPI',
            source: validation.metadata.source,
            extractedAt: validation.metadata.extractedAt,
            payload: JSON.stringify(kpi),
            validationScore: validation.finalScore,
            validationDetails: JSON.stringify(validation.breakdown),
            status: 'APPROVED'
          }
        });
      } else {
        await prisma.dataApprovalQueue.create({
          data: {
            dataType: 'KPI',
            source: validation.metadata.source,
            extractedAt: validation.metadata.extractedAt,
            payload: JSON.stringify(kpi),
            validationScore: validation.finalScore,
            validationDetails: JSON.stringify(validation.breakdown),
            status: 'PENDING'
          }
        });
      }
    }

    // --- Update Chart Data ---
    await prisma.chartData.deleteMany();
    
    const validDgs10 = dgs10Data.filter((d: any) => !isNaN(d.value));
    
    // Create an array to insert, mapping actual date string so frontend can parse it
    const chartDataToInsert = validDgs10.map((d: any) => ({
      year: d.date, // Sending raw date 'YYYY-MM-DD' in the 'year' field
      value: d.value,
    }));

    // Validate the entire ChartData payload at once
    const chartValidation = validator.validate({
      source: 'FRED',
      dataType: 'ChartData',
      payload: chartDataToInsert
    });

    if (chartValidation.isAutoApproved) {
      const chartDataWithMetadata = chartDataToInsert.map((d: any) => ({
        ...d,
        source: chartValidation.metadata.source,
        extractedAt: chartValidation.metadata.extractedAt,
        validationScore: chartValidation.finalScore
      }));

      // Insert in batches since 3000 rows might be large
      const batchSize = 500;
      for (let i = 0; i < chartDataWithMetadata.length; i += batchSize) {
        const batch = chartDataWithMetadata.slice(i, i + batchSize);
        await prisma.chartData.createMany({ data: batch });
      }

      await prisma.dataApprovalQueue.create({
        data: {
          dataType: 'ChartData',
          source: chartValidation.metadata.source,
          extractedAt: chartValidation.metadata.extractedAt,
          payload: JSON.stringify(chartDataToInsert),
          validationScore: chartValidation.finalScore,
          validationDetails: JSON.stringify(chartValidation.breakdown),
          status: 'APPROVED'
        }
      });
    } else {
      await prisma.dataApprovalQueue.create({
        data: {
          dataType: 'ChartData',
          source: chartValidation.metadata.source,
          extractedAt: chartValidation.metadata.extractedAt,
          payload: JSON.stringify(chartDataToInsert),
          validationScore: chartValidation.finalScore,
          validationDetails: JSON.stringify(chartValidation.breakdown),
          status: 'PENDING'
        }
      });
    }

    console.log('FRED data synchronization completed successfully.');
    langsmithService.traceSuccess(runId, { status: 'success' });
  } catch (error) {
    console.error('Failed to sync FRED data:', error);
    langsmithService.traceError(runId, error);
  } finally {
    await prisma.$disconnect();
  }
}
