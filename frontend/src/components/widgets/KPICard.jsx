import React from 'react';
import SparklineChart from '../charts/SparklineChart';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './KPICard.css';

export default function KPICard({
  title,
  period,
  value,
  subtitle,
  trend = 'neutral', // 'up' | 'down' | 'neutral'
  sparklineData = [],
  sparklineColor,
  onClick,
  className = '',
}) {
  const trendConfig = {
    up: { icon: TrendingUp, color: '#12B981', className: 'kpi-trend--up' },
    down: { icon: TrendingDown, color: '#EF4444', className: 'kpi-trend--down' },
    neutral: { icon: Minus, color: '#94A3B8', className: 'kpi-trend--neutral' },
  };

  const { icon: TrendIcon, color: trendColor, className: trendClass } = trendConfig[trend] || trendConfig.neutral;
  const lineColor = sparklineColor || trendColor;

  return (
    <div className={`kpi-card hover-lift ${className}`} onClick={onClick}>
      <div className="kpi-card__header">
        <span className="kpi-card__title">{title}</span>
        {period && <span className="kpi-card__period">{period}</span>}
      </div>

      <div className="kpi-card__value">{value}</div>

      <div className="kpi-card__footer">
        <div className={`kpi-card__trend ${trendClass}`}>
          <TrendIcon size={14} />
          <span>{subtitle}</span>
        </div>
        {sparklineData.length > 1 && (
          <SparklineChart data={sparklineData} color={lineColor} width={72} height={24} />
        )}
      </div>
    </div>
  );
}
