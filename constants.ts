export const CHART_BG_COLOR = '#0f172a';
export const GRID_COLOR = '#1e293b';
export const TEXT_COLOR = '#94a3b8';
export const UP_COLOR = '#22c55e';
export const DOWN_COLOR = '#ef4444';

export const DEFAULT_CANDLES_COUNT = 500;

export const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', 'D', 'W'];

export const DEFAULT_WATCHLIST = [
  'AAPL', 'NVDA', 'TSLA', 'AMD', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY', 'QQQ'
];

// Fallback key detection for Streamlit env or local env
export const getApiKey = (): string | undefined => {
  // Check standard process.env (Vite uses import.meta.env usually, but we handle standard node-like first)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  
  // Check for window injection (Common pattern for Streamlit wrappers)
  if ((window as any).GEMINI_API_KEY) {
    return (window as any).GEMINI_API_KEY;
  }

  return undefined;
};