import React from 'react';
import {
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E7EAF0',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#0F172A' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </div>
      ))}
    </div>
  );
};

export default function AreaChartComponent({
  data = [],
  dataKey = 'value',
  xKey = 'year',
  color = '#6D5DFC',
  gradientId = 'areaGrad',
  height = 360,
  showGrid = true,
  showForecast = false,
  forecastData = [],
  annotations = [],
  name = 'Actual',
  series = null, // Array of { dataKey, name, color } for multi-series support
}) {
  const combinedData = showForecast ? [...data, ...forecastData] : data;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsArea data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${gradientId}-forecast`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
          {series && series.map((s, i) => (
            <linearGradient key={s.dataKey} id={`${gradientId}-multi-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" strokeOpacity={0.5} />
        )}
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        {series ? (
          series.map((s, i) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#${gradientId}-multi-${i})`}
              name={s.name}
              dot={false}
              activeDot={{ r: 5, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
            />
          ))
        ) : (
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            name={name}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        )}
        {showForecast && forecastData.length > 0 && (
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill={`url(#${gradientId}-forecast)`}
            name="Forecast"
            dot={false}
          />
        )}
        {annotations.map((ann, i) => (
          <ReferenceLine
            key={i}
            x={ann.x}
            stroke={ann.color || '#94A3B8'}
            strokeDasharray="4 4"
            label={{ value: ann.label, position: 'top', fontSize: 10, fill: '#94A3B8' }}
          />
        ))}
      </RechartsArea>
    </ResponsiveContainer>
  );
}
