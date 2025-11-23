
export interface Candle {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum IndicatorType {
  SMA = 'SMA',
  EMA = 'EMA',
  RSI = 'RSI',
  MACD = 'MACD',
  BOLLINGER = 'BOLLINGER',
  VWAP = 'VWAP',
  CUSTOM_SCRIPT = 'SCRIPT' // Placeholder for Pine Script logic
}

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  period?: number;
  color: string;
  visible: boolean;
  paneIndex: number; // 0 = Main chart, 1+ = Bottom panes
  script?: string; // For custom scripts
  data?: any[]; // Calculated data cache
}

export interface GamePlan {
  id: string;
  symbol: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  riskAmount: number; // Max dollar loss willing to take
  shares: number;
  riskRewardRatio: number;
  thesis: string;
  createdAt: number;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface WatchlistGroup {
  id: string;
  name: string;
  symbols: string[];
}

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface ChartLayout {
    id: string;
    name: string;
    indicators: IndicatorConfig[];
}

export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | 'D' | 'W';

export interface ScreenerFilter {
    sector: string;
    marketCap: string;
    peRatio: string;
    price: string;
    change: string;
    volume: string;
}
