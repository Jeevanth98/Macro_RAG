import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Dashboard Endpoints
router.get('/dashboard/kpis', async (req, res) => {
  try {
    const kpis = await prisma.kpi.findMany();
    // Parse the sparkline string back to JSON array
    const formatted = kpis.map(kpi => ({
      ...kpi,
      sparkline: JSON.parse(kpi.sparkline)
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

router.get('/dashboard/insights', async (req, res) => {
  try {
    // Reverse the insights order just to look nice
    const insights = await prisma.insight.findMany({ orderBy: { title: 'asc' } });
    const formatted = insights.map(insight => ({
      ...insight,
      tags: JSON.parse(insight.tags)
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

router.get('/dashboard/chart', async (req, res) => {
  try {
    const chartData = await prisma.chartData.findMany({ orderBy: { year: 'asc' } });
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

router.get('/dashboard/map', async (req, res) => {
  try {
    const { indicator } = req.query;
    const filter = indicator ? { indicator: String(indicator) } : {};
    const mapData = await prisma.mapData.findMany({ where: filter });
    res.json(mapData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

router.get('/dashboard/watchlist', async (req, res) => {
  try {
    const watchlist = await prisma.watchlist.findMany();
    res.json(watchlist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/dashboard/watchlist', async (req, res) => {
  try {
    const { country, indicator } = req.body;
    
    // Auto-generate some mock current data for the newly added indicator
    const latestValue = (Math.random() * 10).toFixed(1) + '%';
    const changeValue = ((Math.random() - 0.5) * 2).toFixed(1);
    const changeType = parseFloat(changeValue) > 0 ? 'up' : parseFloat(changeValue) < 0 ? 'down' : 'neutral';
    
    const newItem = await prisma.watchlist.create({
      data: {
        country,
        indicator,
        latest: latestValue,
        change: parseFloat(changeValue) > 0 ? `+${changeValue}` : changeValue,
        changeType
      }
    });
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.delete('/dashboard/watchlist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.watchlist.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete watchlist item' });
  }
});

router.put('/dashboard/watchlist/:id/alert', async (req, res) => {
  try {
    const { id } = req.params;
    const { alertStatus, triggerValue } = req.body;
    const updated = await prisma.watchlist.update({
      where: { id },
      data: { alertStatus, triggerValue }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alert status' });
  }
});

// Copilot Endpoint (Gemini Integration)
router.post('/copilot/ask', async (req, res) => {
  const { query, mode } = req.body;
  if (!query) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    if (mode === 'summary') {
      const prompt = `Provide a brief summary of the macroeconomic implications of: "${query}". Keep it to 2-3 sentences. Do not use any markdown formatting like ** or ##. Return your response strictly as a valid JSON object in this format: {"text": "summary text...", "sources": ["Source 1"]}`;
      const result = await model.generateContent(prompt);
      const rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const resJson = JSON.parse(rawText);
      res.json({
        text: resJson.text,
        sources: resJson.sources
      });
    } else {
      const prompt = `Provide a comprehensive macroeconomic analysis for: "${query}". 
      Respond ONLY in plain text without any markdown formatting like **, ##. Use clean paragraphs and standard dashes for lists.
      Return the response strictly as a valid JSON object with this structure: 
      {
        "text": "your detailed plain text response", 
        "sources": ["Real Source 1", "Real Source 2"]
      }`;
      const result = await model.generateContent(prompt);
      const rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const resJson = JSON.parse(rawText);
      res.json({
        text: resJson.text,
        sources: resJson.sources
      });
    }
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Failed to fetch from Gemini' });
  }
});

// Report Generation Endpoint
router.post('/report/generate', async (req, res) => {
  try {
    const { topic, includeCitations, includeCharts, includeTable, includeSummary } = req.body;
    const reportTopic = topic || "Global Macroeconomic Outlook";
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let prompt = `Generate a comprehensive macroeconomic report on the topic: "${reportTopic}". `;
    prompt += `Format the output in clean HTML markup, using <h2>, <h3>, <p>, <ul>, <ol>, and <li> tags as appropriate. Do not include markdown codeblocks in the output, just raw HTML. `;
    
    if (includeSummary) prompt += `Start with a detailed Executive Summary. `;
    if (includeTable) prompt += `Include an HTML <table> with realistic economic data metrics. `;
    if (includeCharts) prompt += `Include a visualization by generating a styled HTML bar chart using nested <div> elements with inline styles (e.g. height, background-color) to represent data visually. Ensure it looks like a clean chart. `;
    if (includeCitations) prompt += `Include a "Sources & Citations" section at the end with real sources. `;
    
    const result = await model.generateContent(prompt);
    let htmlContent = result.response.text();
    htmlContent = htmlContent.replace(/```html/g, '').replace(/```/g, '');
    
    res.json({
      title: 'AI Generated Custom Macro Report',
      type: 'Custom Analysis',
      date: new Date().toLocaleDateString(),
      content: htmlContent
    });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Data Endpoints
router.get('/data/countries', (req, res) => {
  res.json([
    { name: 'United States', code: 'USA' }, 
    { name: 'Euro Area', code: 'EU' },
    { name: 'China', code: 'CHN' },
    { name: 'Japan', code: 'JPN' },
    { name: 'United Kingdom', code: 'GBR' },
    { name: 'India', code: 'IND' },
    { name: 'Germany', code: 'DEU' },
    { name: 'France', code: 'FRA' },
    { name: 'Brazil', code: 'BRA' },
    { name: 'Canada', code: 'CAN' },
    { name: 'Australia', code: 'AUS' },
    { name: 'South Korea', code: 'KOR' },
    { name: 'Mexico', code: 'MEX' },
    { name: 'Spain', code: 'ESP' },
    { name: 'Indonesia', code: 'IDN' }
  ]);
});

router.get('/data/indicators', (req, res) => {
  res.json([
    { name: 'GDP Growth', code: 'GDP' }, 
    { name: 'Inflation (CPI)', code: 'CPI' },
    { name: 'Unemployment Rate', code: 'UNEMP' },
    { name: 'Policy Interest Rate', code: 'RATE' },
    { name: 'Manufacturing PMI', code: 'PMI_MFG' },
    { name: 'Services PMI', code: 'PMI_SRV' },
    { name: 'Retail Sales YoY', code: 'RETAIL' },
    { name: 'Industrial Production', code: 'IND_PROD' },
    { name: 'Consumer Confidence', code: 'CONS_CONF' },
    { name: 'Government Debt to GDP', code: 'DEBT_GDP' }
  ]);
});

// Generic data series endpoint for Global Overview charts
router.get('/data/series/:country/:indicator', async (req, res) => {
  const { country, indicator } = req.params;
  const data = [];
  
  // Baseline configuration mapping specific structural events to years
  const isCovidYear = (y: number) => y === 2020;
  const isRecoveryYear = (y: number) => y === 2021;
  const isInflationSpike = (y: number) => y === 2022 || y === 2023;
  
  const cName = country.toLowerCase();
  const indName = indicator.toLowerCase();

  let baseValue = 3;
  let volatility = 1;
  let covidImpact = -5; // GDP drops
  let recoveryImpact = 4;
  let inflationImpact = 0;

  if (indName.includes('gdp')) {
    baseValue = cName.includes('china') || cName.includes('india') ? 6 : 2;
    covidImpact = -6;
    recoveryImpact = 5;
  } else if (indName.includes('inflation') || indName.includes('cpi')) {
    baseValue = cName.includes('india') ? 5 : 2;
    inflationImpact = cName.includes('japan') || cName.includes('china') ? 1 : 5; // US/EU high inflation, Asia lower
    covidImpact = -1; // deflationary shock initially
  } else if (indName.includes('unemployment')) {
    baseValue = cName.includes('spain') ? 12 : 4;
    covidImpact = 6; // unemployment spikes
    recoveryImpact = -3;
  } else if (indName.includes('policy') || indName.includes('rate')) {
    baseValue = cName.includes('japan') ? -0.1 : (cName.includes('india') || cName.includes('brazil') ? 6 : 1);
    covidImpact = -1; // cut rates
    inflationImpact = 4; // hike rates
  } else if (indName.includes('debt')) {
    baseValue = cName.includes('japan') ? 230 : (cName.includes('us') || cName.includes('united states') ? 100 : 70);
    covidImpact = 15; // debt jumps due to stimulus
    recoveryImpact = 2;
  }

  // Generate realistic data incorporating historical shocks
  for(let i=2010; i<=2025; i++) {
    let val = baseValue + Math.sin(i * 1.5) * volatility + (Math.cos(i) * 0.5);
    
    // Apply structural shocks
    if (isCovidYear(i)) val += covidImpact;
    if (isRecoveryYear(i)) val += recoveryImpact;
    if (isInflationSpike(i)) val += inflationImpact;
    
    // Add slight random noise for realism but keep it relatively smooth
    val += (Math.sin(i * cName.length) * 0.4);

    data.push({ year: i.toString(), value: Number(val.toFixed(2)) });
  }
  
  res.json(data);
});

export default router;
