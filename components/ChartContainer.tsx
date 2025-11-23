
import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries,
  CrosshairMode,
  LineStyle,
  Time
} from 'lightweight-charts';
import { Candle, IndicatorConfig, IndicatorType } from '../types';
import { CHART_BG_COLOR, GRID_COLOR, UP_COLOR, DOWN_COLOR, TEXT_COLOR } from '../constants';
import { calculateSMA, calculateRSI, calculateMACD } from '../services/marketData';

interface ChartProps {
  data: Candle[];
  comparisonData?: Candle[]; // New prop for comparison
  comparisonSymbol?: string;
  indicators: IndicatorConfig[];
  symbol: string;
}

const mapData = (data: Candle[]) => data.map(d => ({
  time: d.time as Time,
  open: d.open,
  high: d.high,
  low: d.low,
  close: d.close,
}));

const ChartContainer: React.FC<ChartProps> = ({ data, comparisonData, comparisonSymbol, indicators, symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Map<string, ISeriesApi<any>>>(new Map());
  const [legend, setLegend] = useState<any>({});

  // 1. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_BG_COLOR },
        textColor: TEXT_COLOR,
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: GRID_COLOR,
        scaleMargins: {
          top: 0.05,
          bottom: 0.3,
        },
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };
    window.addEventListener('resize', handleResize);

    chart.subscribeCrosshairMove((param) => {
        if (param.time) {
            const dataPoint = param.seriesData.get(seriesRefs.current.get('main') as any);
            const indValues: any = {};
            
            indicators.forEach(ind => {
                if(ind.visible) {
                    if (ind.type === IndicatorType.MACD) {
                         const line = seriesRefs.current.get(ind.id + '_line');
                         const sig = seriesRefs.current.get(ind.id + '_signal');
                         const hist = seriesRefs.current.get(ind.id + '_hist');
                         if(line) indValues[ind.id + '_line'] = param.seriesData.get(line);
                         if(sig) indValues[ind.id + '_signal'] = param.seriesData.get(sig);
                         if(hist) indValues[ind.id + '_hist'] = param.seriesData.get(hist);
                    } else {
                        const s = seriesRefs.current.get(ind.id);
                        if(s) {
                            indValues[ind.id] = param.seriesData.get(s);
                        }
                    }
                }
            });

            // Handle Comparison Legend
            if (comparisonSymbol) {
                const compSeries = seriesRefs.current.get('comparison');
                if (compSeries) {
                    indValues['comparison'] = param.seriesData.get(compSeries);
                }
            }

            if(dataPoint || Object.keys(indValues).length > 0) {
                setLegend({ 
                    ohlc: dataPoint, 
                    indicators: indValues 
                });
            }
        }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // 2. Update Series & Data
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    const chart = chartRef.current;
    
    // -- Main Candle Series --
    let mainSeries = seriesRefs.current.get('main') as ISeriesApi<"Candlestick">;
    if (!mainSeries) {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderVisible: false,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
      });
      seriesRefs.current.set('main', mainSeries);
    }
    mainSeries.setData(mapData(data));

    // -- Comparison Series --
    if (comparisonData && comparisonSymbol) {
        let compSeries = seriesRefs.current.get('comparison') as ISeriesApi<"Line">;
        if (!compSeries) {
            compSeries = chart.addSeries(LineSeries, {
                color: '#ec4899', // Pink for comparison
                lineWidth: 2,
                priceScaleId: 'comparison',
            });
            seriesRefs.current.set('comparison', compSeries);
            
            // Create a dedicated scale for comparison to avoid messing up main candle scale
            chart.priceScale('comparison').applyOptions({
                 scaleMargins: { top: 0.1, bottom: 0.3 },
                 visible: false // Hidden axis, just overlay line
            });
        }
        compSeries.setData(comparisonData.map(d => ({ time: d.time as Time, value: d.close })));
    } else {
        const compSeries = seriesRefs.current.get('comparison');
        if (compSeries) {
            chart.removeSeries(compSeries);
            seriesRefs.current.delete('comparison');
        }
    }

    // -- Indicators Management --
    const paneIndicators = indicators.filter(i => i.visible && i.paneIndex > 0);
    const overlayIndicators = indicators.filter(i => i.visible && i.paneIndex === 0);

    // Cleanup logic
    seriesRefs.current.forEach((series, id) => {
        if (id === 'main' || id === 'comparison') return;
        const baseId = id.replace('_line', '').replace('_signal', '').replace('_hist', '');
        const exists = indicators.find(i => i.id === baseId && i.visible);
        if (!exists) {
            chart.removeSeries(series);
            seriesRefs.current.delete(id);
        }
    });

    const PANE_HEIGHT = 0.20; 
    const totalPaneHeight = paneIndicators.length * PANE_HEIGHT;

    chart.priceScale('right').applyOptions({
        scaleMargins: {
            top: 0.05,
            bottom: totalPaneHeight + 0.05 
        }
    });

    overlayIndicators.forEach(ind => {
        let series = seriesRefs.current.get(ind.id) as ISeriesApi<"Line">;
        if (!series) {
            series = chart.addSeries(LineSeries, {
                color: ind.color,
                lineWidth: 2,
                priceScaleId: 'right',
            });
            seriesRefs.current.set(ind.id, series);
        }
        
        if (ind.type === IndicatorType.SMA) {
            const smaData = calculateSMA(data, ind.period || 20);
            series.setData(smaData.map(d => ({ time: d.time as Time, value: d.value })));
        } else if (ind.type === IndicatorType.CUSTOM_SCRIPT) {
            // Mock visualization for custom script: just plotting a shifted line for demo
            series.setData(data.map(d => ({ time: d.time as Time, value: d.close * 0.98 })));
        }
    });

    paneIndicators.forEach((ind, index) => {
        const topMargin = 1.0 - (totalPaneHeight - (index * PANE_HEIGHT)); 
        const bottomMargin = (totalPaneHeight - ((index + 1) * PANE_HEIGHT));
        const scaleId = `pane_${ind.id}`;
        
        chart.priceScale(scaleId).applyOptions({
            scaleMargins: { top: topMargin + 0.05, bottom: Math.max(0, bottomMargin) },
            visible: true,
            borderVisible: false,
        });

        if (ind.type === IndicatorType.RSI) {
            let series = seriesRefs.current.get(ind.id) as ISeriesApi<"Line">;
            if (!series) {
                series = chart.addSeries(LineSeries, { color: ind.color, lineWidth: 2, priceScaleId: scaleId });
                seriesRefs.current.set(ind.id, series);
            }
            const rsiData = calculateRSI(data, ind.period || 14);
            series.setData(rsiData.map(d => ({ time: d.time as Time, value: d.value })));
        }
        
        if (ind.type === IndicatorType.MACD) {
            let macdLineSeries = seriesRefs.current.get(ind.id + '_line') as ISeriesApi<"Line">;
            if(!macdLineSeries) {
                macdLineSeries = chart.addSeries(LineSeries, { color: ind.color, lineWidth: 2, priceScaleId: scaleId });
                seriesRefs.current.set(ind.id + '_line', macdLineSeries);
            }
            let signalLineSeries = seriesRefs.current.get(ind.id + '_signal') as ISeriesApi<"Line">;
            if(!signalLineSeries) {
                signalLineSeries = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, priceScaleId: scaleId, lineStyle: LineStyle.Dashed });
                seriesRefs.current.set(ind.id + '_signal', signalLineSeries);
            }
            let histSeries = seriesRefs.current.get(ind.id + '_hist') as ISeriesApi<"Histogram">;
            if(!histSeries) {
                histSeries = chart.addSeries(HistogramSeries, { priceScaleId: scaleId });
                seriesRefs.current.set(ind.id + '_hist', histSeries);
            }

            const macdData = calculateMACD(data);
            macdLineSeries.setData(macdData.macdLine.map(d => ({ time: d.time as Time, value: d.value })));
            signalLineSeries.setData(macdData.signalLine.map(d => ({ time: d.time as Time, value: d.value })));
            histSeries.setData(macdData.histogram.map(d => ({ time: d.time as Time, value: d.value, color: d.color })));
        }
    });

  }, [data, indicators, comparisonData, comparisonSymbol]);

  return (
    <div className="w-full h-full relative">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Legend Overlay */}
      <div className="absolute top-2 left-2 bg-gray-900/80 p-2 rounded border border-gray-700 pointer-events-none text-xs text-gray-300 font-mono z-10">
        <div className="flex gap-4 mb-1">
            <span className="font-bold text-white text-lg">{symbol}</span>
            {legend.ohlc && (
                <div className="flex gap-2 items-end">
                    <span className="text-gray-400">O: <span className="text-white">{legend.ohlc.open?.toFixed(2)}</span></span>
                    <span className="text-gray-400">H: <span className="text-white">{legend.ohlc.high?.toFixed(2)}</span></span>
                    <span className="text-gray-400">L: <span className="text-white">{legend.ohlc.low?.toFixed(2)}</span></span>
                    <span className={`font-bold ${legend.ohlc.close >= legend.ohlc.open ? 'text-green-400' : 'text-red-400'}`}>
                        C: {legend.ohlc.close?.toFixed(2)}
                    </span>
                </div>
            )}
        </div>
        
        {/* Comparison Legend */}
        {comparisonSymbol && legend.indicators?.['comparison'] && (
             <div className="flex gap-2 text-pink-500 font-bold mb-1">
                <span>{comparisonSymbol}</span>
                <span>{legend.indicators['comparison'].value?.toFixed(2)}</span>
             </div>
        )}

        <div className="space-y-0.5">
            {indicators.filter(i => i.visible).map(ind => {
                if (ind.type === IndicatorType.MACD) {
                    const vMacd = legend.indicators?.[ind.id + '_line'];
                    const vSig = legend.indicators?.[ind.id + '_signal'];
                    const vHist = legend.indicators?.[ind.id + '_hist'];
                    if (!vMacd && !vSig) return null;
                    const formatVal = (v: any) => (v?.value ?? v)?.toFixed(2) ?? '-';
                    return (
                        <div key={ind.id} className="flex gap-2">
                             <span style={{color: ind.color}} className="font-bold">{ind.type}</span>
                             <span>{formatVal(vMacd)}</span>
                             <span className="text-red-400">{formatVal(vSig)}</span>
                             <span className="text-gray-400">{formatVal(vHist)}</span>
                        </div>
                    );
                }
                const val = legend.indicators?.[ind.id];
                if (val === undefined) return null;
                const displayVal = (val.value ?? val).toFixed(2);
                return (
                    <div key={ind.id} className="flex gap-2">
                         <span style={{color: ind.color}} className="font-bold">{ind.type} {ind.period ? `(${ind.period})` : ''}</span>
                         <span>{displayVal}</span>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;
