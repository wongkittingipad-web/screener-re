
import React, { useState, useEffect } from 'react';
import ChartContainer from './components/ChartContainer';
import Watchlist from './components/Watchlist';
import RightPanel from './components/RightPanel';
import Dashboard from './components/Dashboard';
import Screener from './components/Screener';
import IndicatorManager from './components/IndicatorManager';
import { generateData, updateLastCandle } from './services/marketData';
import { Candle, IndicatorConfig, IndicatorType, GamePlan, ChartLayout, Timeframe } from './types';
import { LayoutDashboard, LineChart, SlidersHorizontal, Settings, Plus, Save } from 'lucide-react';
import { TIMEFRAMES } from './constants';

const DEFAULT_INDICATORS: IndicatorConfig[] = [
    { id: '1', type: IndicatorType.SMA, period: 20, color: '#f59e0b', visible: true, paneIndex: 0 },
    { id: '2', type: IndicatorType.RSI, period: 14, color: '#a855f7', visible: true, paneIndex: 1 },
];

const App: React.FC = () => {
  const [view, setView] = useState<'chart' | 'dashboard' | 'screener'>('chart');
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  
  // Data State
  const [data, setData] = useState<Candle[]>([]);
  const [comparisonSymbol, setComparisonSymbol] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<Candle[]>([]);
  
  // Chart Config
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const [timeframe, setTimeframe] = useState<Timeframe>('D');
  
  // UI State
  const [showIndManager, setShowIndManager] = useState(false);
  const [plans, setPlans] = useState<GamePlan[]>(() => {
    const saved = localStorage.getItem('tradeflow_plans');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [layouts, setLayouts] = useState<ChartLayout[]>(() => {
      const saved = localStorage.getItem('tradeflow_layouts');
      return saved ? JSON.parse(saved) : [];
  });

  // Load Main Data (simulated timeframe impact by count/volatility)
  useEffect(() => {
    const volatilityMult = timeframe === '1m' ? 0.2 : timeframe === 'W' ? 3 : 1;
    const initialData = generateData(150, 500); // Base generation
    // In a real app, 'timeframe' would change the API call parameters
    setData(initialData);
  }, [activeSymbol, timeframe]);

  // Load Comparison Data
  useEffect(() => {
    if (comparisonSymbol) {
        setComparisonData(generateData(100, 500));
    } else {
        setComparisonData([]);
    }
  }, [comparisonSymbol, timeframe]);

  // Live Simulation
  useEffect(() => {
    const interval = setInterval(() => {
        setData(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            const shouldAdd = Math.random() > 0.9; 
            
            if (shouldAdd) {
                const nextTime = last.time + (timeframe === 'D' ? 86400 : 3600); 
                const nextOpen = last.close;
                return [...prev, {
                    time: nextTime,
                    open: nextOpen,
                    close: nextOpen,
                    high: nextOpen,
                    low: nextOpen,
                    volume: 0
                }];
            } else {
                const updated = updateLastCandle(last);
                const newData = [...prev];
                newData[newData.length - 1] = updated;
                return newData;
            }
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeframe]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('tradeflow_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
      localStorage.setItem('tradeflow_layouts', JSON.stringify(layouts));
  }, [layouts]);

  const handleSavePlan = (plan: GamePlan) => {
    setPlans(prev => [plan, ...prev]);
    alert("Game Plan Saved!");
  };

  const saveLayout = () => {
      const name = prompt("Enter layout name:", "My Setup 1");
      if (name) {
          const newLayout: ChartLayout = { id: Date.now().toString(), name, indicators };
          setLayouts([...layouts, newLayout]);
      }
  };

  const loadLayout = (layoutId: string) => {
      const layout = layouts.find(l => l.id === layoutId);
      if (layout) setIndicators(layout.indicators);
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-200 font-sans overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-16 flex flex-col items-center py-4 bg-gray-900 border-r border-gray-800 gap-6 z-20">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
                TF
            </div>
            
            <button onClick={() => setView('chart')} className={`p-3 rounded-xl transition-all ${view === 'chart' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <LineChart className="w-6 h-6" />
            </button>
            <button onClick={() => setView('screener')} className={`p-3 rounded-xl transition-all ${view === 'screener' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <SlidersHorizontal className="w-6 h-6" />
            </button>
            <button onClick={() => setView('dashboard')} className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <LayoutDashboard className="w-6 h-6" />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
            {view === 'dashboard' && <Dashboard plans={plans} onDelete={id => setPlans(p => p.filter(x => x.id !== id))} onLoad={(s) => {setActiveSymbol(s); setView('chart');}} />}
            {view === 'screener' && <Screener onLoadSymbol={(s) => {setActiveSymbol(s); setView('chart');}} />}
            
            {view === 'chart' && (
                <>
                    <Watchlist currentSymbol={activeSymbol} onSelect={setActiveSymbol} />
                    
                    <div className="flex-1 flex flex-col relative min-w-0">
                        {/* Toolbar */}
                        <div className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4 justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 className="font-bold text-white text-lg">{activeSymbol}</h2>
                                
                                {/* Timeframe Selector */}
                                <div className="flex bg-gray-800 rounded p-1 gap-1">
                                    {TIMEFRAMES.map((tf) => (
                                        <button 
                                            key={tf}
                                            onClick={() => setTimeframe(tf as Timeframe)}
                                            className={`px-2 py-0.5 text-xs rounded ${timeframe === tf ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            {tf}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="h-6 w-px bg-gray-700 mx-2"></div>
                                
                                {/* Comparison */}
                                <div className="relative group">
                                    {comparisonSymbol ? (
                                        <button onClick={() => setComparisonSymbol('')} className="bg-pink-900/30 text-pink-400 text-xs px-2 py-1 rounded border border-pink-500/50 flex items-center gap-1">
                                            Vs {comparisonSymbol} <span className="opacity-50 hover:opacity-100">×</span>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                const s = prompt("Enter comparison symbol (e.g. SPY):");
                                                if(s) setComparisonSymbol(s.toUpperCase());
                                            }}
                                            className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Compare
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Layouts */}
                                <select 
                                    className="bg-gray-800 text-xs text-gray-300 border border-gray-700 rounded p-1 w-24"
                                    onChange={(e) => loadLayout(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Layouts</option>
                                    {layouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                                <button onClick={saveLayout} title="Save Layout" className="text-gray-400 hover:text-blue-400"><Save className="w-4 h-4" /></button>
                                
                                <div className="h-6 w-px bg-gray-700 mx-2"></div>
                                
                                <button 
                                    onClick={() => setShowIndManager(true)}
                                    className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded border border-gray-700 transition-colors"
                                >
                                    <Settings className="w-3 h-3" /> Indicators
                                </button>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="flex-1 bg-gray-950 relative overflow-hidden">
                            {data.length > 0 && (
                                <ChartContainer 
                                    data={data} 
                                    comparisonData={comparisonData}
                                    comparisonSymbol={comparisonSymbol}
                                    symbol={activeSymbol} 
                                    indicators={indicators} 
                                />
                            )}
                        </div>
                    </div>

                    <RightPanel 
                        symbol={activeSymbol} 
                        currentPrice={data.length > 0 ? data[data.length - 1].close : 0} 
                        candles={data}
                        onSavePlan={handleSavePlan}
                    />
                </>
            )}
            
            {showIndManager && (
                <IndicatorManager 
                    indicators={indicators} 
                    onUpdate={setIndicators} 
                    onClose={() => setShowIndManager(false)} 
                />
            )}
        </div>
    </div>
  );
};

export default App;
