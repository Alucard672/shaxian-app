import React from 'react';
import Svg, { Path, Rect, Circle, Polyline } from 'react-native-svg';

export type IconName =
  | 'dash' | 'order' | 'stock' | 'cust' | 'report' | 'settings' | 'pay'
  | 'search' | 'plus' | 'chev' | 'chevR' | 'chevL' | 'arrowL' | 'up' | 'down' | 'bell'
  | 'warn' | 'x' | 'print' | 'filter' | 'refresh'
  | 'purchase' | 'supplier' | 'truck' | 'scan' | 'edit' | 'trash';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 16, color = '#0a1220', strokeWidth = 1.6 }: Props) {
  const common = {
    width: size, height: size, viewBox: '0 0 16 16',
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'dash':
      return (
        <Svg {...common}>
          <Rect x="2" y="2" width="5" height="5" />
          <Rect x="9" y="2" width="5" height="5" />
          <Rect x="2" y="9" width="5" height="5" />
          <Rect x="9" y="9" width="5" height="5" />
        </Svg>
      );
    case 'order':
      return (
        <Svg {...common}>
          <Path d="M3 2h7l3 3v9H3z" />
          <Path d="M6 7h4M6 10h4" />
        </Svg>
      );
    case 'stock':
      return (
        <Svg {...common}>
          <Path d="M2 5l6-3 6 3v6l-6 3-6-3z" />
          <Path d="M2 5l6 3 6-3M8 8v6" />
        </Svg>
      );
    case 'cust':
      return (
        <Svg {...common}>
          <Circle cx="8" cy="5" r="3" />
          <Path d="M2 14c0-3 3-5 6-5s6 2 6 5" />
        </Svg>
      );
    case 'report':
      return (
        <Svg {...common}>
          <Path d="M2 13h12M4 13V9M7 13V5M10 13V7M13 13V3" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...common}>
          <Circle cx="8" cy="8" r="2" />
          <Path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13" />
        </Svg>
      );
    case 'pay':
      return (
        <Svg {...common}>
          <Rect x="1" y="3" width="14" height="10" rx="1" />
          <Path d="M1 7h14M4 10h3" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common} viewBox="0 0 14 14">
          <Circle cx="6" cy="6" r="4" />
          <Path d="M9 9l3 3" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common} viewBox="0 0 12 12" strokeWidth={strokeWidth * 1.3}>
          <Path d="M6 2v8M2 6h8" />
        </Svg>
      );
    case 'chev':
      return (
        <Svg {...common} viewBox="0 0 10 10">
          <Path d="M2 4l3 3 3-3" />
        </Svg>
      );
    case 'chevR':
      return (
        <Svg {...common} viewBox="0 0 10 10">
          <Path d="M4 2l3 3-3 3" />
        </Svg>
      );
    case 'chevL':
      return (
        <Svg {...common} viewBox="0 0 10 10">
          <Path d="M6 2L3 5l3 3" />
        </Svg>
      );
    case 'arrowL':
      return (
        <Svg {...common} viewBox="0 0 16 16" strokeWidth={strokeWidth * 1.1}>
          <Path d="M14 8H2M7 3L2 8l5 5" />
        </Svg>
      );
    case 'up':
      return (
        <Svg {...common} viewBox="0 0 10 10" strokeWidth={strokeWidth * 1.2}>
          <Path d="M2 6l3-3 3 3" />
        </Svg>
      );
    case 'down':
      return (
        <Svg {...common} viewBox="0 0 10 10" strokeWidth={strokeWidth * 1.2}>
          <Path d="M2 4l3 3 3-3" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...common} viewBox="0 0 14 14">
          <Path d="M3 5a4 4 0 018 0v3l1 2H2l1-2z" />
          <Path d="M5 11a2 2 0 004 0" />
        </Svg>
      );
    case 'warn':
      return (
        <Svg width={size} height={size} viewBox="0 0 10 10" fill={color}>
          <Path d="M5 0L10 9H0z" />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...common} viewBox="0 0 10 10" strokeWidth={strokeWidth * 1.2}>
          <Path d="M2 2l6 6M8 2l-6 6" />
        </Svg>
      );
    case 'print':
      return (
        <Svg {...common} viewBox="0 0 14 14">
          <Path d="M3 5V1h8v4M3 10H1V5h12v5h-2M3 8h8v5H3z" />
        </Svg>
      );
    case 'filter':
      return (
        <Svg {...common} viewBox="0 0 14 14">
          <Path d="M1 2h12l-4.5 5.5V12l-3 1.5V7.5z" />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg {...common} viewBox="0 0 14 14">
          <Path d="M12 3a5 5 0 10.5 7" />
          <Path d="M12 1v3h-3" />
        </Svg>
      );
    case 'purchase':
      return (
        <Svg {...common}>
          <Path d="M2 4h2l2 8h7l2-6H5" />
          <Circle cx="7" cy="14" r="1" />
          <Circle cx="12" cy="14" r="1" />
        </Svg>
      );
    case 'supplier':
      return (
        <Svg {...common}>
          <Path d="M2 6l6-3 6 3v7H2z" />
          <Path d="M6 13V9h4v4" />
        </Svg>
      );
    case 'truck':
      return (
        <Svg {...common} viewBox="0 0 14 14">
          <Path d="M1 3h8v7H1zM9 5h3l2 2v3h-5" />
          <Circle cx="4" cy="11" r="1.2" />
          <Circle cx="11" cy="11" r="1.2" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg {...common}>
          <Path d="M2 5V2h3M14 5V2h-3M2 11v3h3M14 11v3h-3" />
          <Path d="M2 8h12" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...common}>
          <Path d="M11 2l3 3-8 8H3v-3z" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...common}>
          <Path d="M3 5h10M6 5V3h4v2M4 5v9h8V5M7 8v4M9 8v4" />
        </Svg>
      );
    default:
      return null;
  }
}
