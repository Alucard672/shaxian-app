import React from 'react';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';

interface Props {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fillOpacity?: number;
}

export function Sparkline({ data, color = '#2e7ab5', width = 56, height = 20, fillOpacity = 0.15 }: Props) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pad = 1;
  const step = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) =>
    `${pad + i * step},${height - pad - ((v - min) / range) * (height - pad * 2)}`
  );
  const path = 'M ' + pts.join(' L ');
  const area = `${path} L ${width - pad} ${height} L ${pad} ${height} Z`;
  const gradId = `sp${Math.random().toString(36).slice(2, 8)}`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGrad id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={fillOpacity} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGrad>
      </Defs>
      <Path d={area} fill={`url(#${gradId})`} />
      <Path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
