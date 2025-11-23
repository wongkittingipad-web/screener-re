import { Candle } from '../types';

/**
 * Geometric Brownian Motion generator for realistic stock simulation
 */
export const generateData = (startPrice: number, count: number, startTimestamp?: number): Candle[] => {
  const data: Candle[] = [];
  let currentPrice = startPrice;
  // Default to 500 days ago if no timestamp
  let time = startTimestamp || (Math.floor(Date.now() / 1000) - count * 86400); 

  for (let i = 0; i < count; i++) {
    const volatility = 0.02; // 2% daily volatility
    const drift = 0.0005; // Slight upward drift
    
    const changePercent = drift + volatility * (Math.random() - 0.5);
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });

    currentPrice = close;
    time += 86400; // Add 1 day (simplified)
  }

  return data;
};

export const updateLastCandle = (prev: Candle): Candle => {
    const volatility = 0.005;
    const change = (Math.random() - 0.5) * volatility;
    const newClose = prev.close * (1 + change);
    return {
        ...prev,
        high: Math.max(prev.high, newClose),
        low: Math.min(prev.low, newClose),
        close: newClose,
        volume: prev.volume + Math.floor(Math.random() * 100)
    };
};

// --- Technical Analysis Library ---

export const calculateSMA = (data: Candle[], period: number) => {
  const results = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      // Not enough data yet
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    results.push({ time: data[i].time, value: sum / period });
  }
  return results;
};

export const calculateEMA = (data: Candle[], period: number) => {
  const results = [];
  const k = 2 / (period + 1);
  let prevEma = data[0].close;

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
        results.push({ time: data[i].time, value: data[i].close });
        continue;
    }
    const ema = data[i].close * k + prevEma * (1 - k);
    results.push({ time: data[i].time, value: ema });
    prevEma = ema;
  }
  return results;
};

export const calculateRSI = (data: Candle[], period: number = 14) => {
    const results = [];
    let gains = 0;
    let losses = 0;

    // First average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        results.push({ time: data[i].time, value: rsi });
    }
    return results;
};

export const calculateMACD = (data: Candle[]) => {
    const fastPeriod = 12;
    const slowPeriod = 26;
    const signalPeriod = 9;

    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);

    // Map by time to sync
    const slowMap = new Map(slowEMA.map(i => [i.time, i.value]));
    
    const macdLine = [];
    
    for(const fast of fastEMA) {
        const slowVal = slowMap.get(fast.time);
        if(slowVal !== undefined) {
            macdLine.push({ time: fast.time, value: fast.value - slowVal });
        }
    }

    // Calculate Signal Line (EMA of MACD)
    // We need to convert macdLine format back to a simple structure for calculateEMA helper if generic, 
    // but here we just implement a quick EMA on values
    const signalLine = [];
    const k = 2 / (signalPeriod + 1);
    
    if (macdLine.length > 0) {
        let prevSignal = macdLine[0].value;
        for(let i=0; i<macdLine.length; i++) {
            const val = macdLine[i].value;
            const signal = i === 0 ? val : (val * k + prevSignal * (1 - k));
            signalLine.push({ time: macdLine[i].time, value: signal });
            prevSignal = signal;
        }
    }

    // Histogram
    const histogram = [];
    const signalMap = new Map(signalLine.map(s => [s.time, s.value]));

    for(const macd of macdLine) {
        const sigVal = signalMap.get(macd.time);
        if (sigVal !== undefined) {
            histogram.push({ 
                time: macd.time, 
                value: macd.value - sigVal, 
                color: (macd.value - sigVal) >= 0 ? '#26a69a' : '#ef5350' 
            });
        }
    }

    return { macdLine, signalLine, histogram };
};