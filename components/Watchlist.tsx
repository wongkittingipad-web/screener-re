import React, { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { smartScreener } from '../services/geminiService';

interface WatchlistProps {
  onSelect: (symbol: string) => void;
  currentSymbol: string;
}

const MOCK_PRICES: Record<string, { p: number, c: number }> = {
    'AAPL': { p: 175.40, c: 1.2 },
    'NVDA': { p: 890.00, c: 2.5 },
    'TSLA': { p: 160.20, c: -1.5 },
    'AMD': { p: 170.50, c: 0.8 },
    'SPY': { p: 510.20, c: 0.1 },
};

const Watchlist: React.FC<WatchlistProps> = ({ onSelect, currentSymbol }) => {
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'NVDA', 'TSLA', 'AMD', 'SPY']);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    const results = await smartScreener(aiPrompt);
    if (results.length > 0) {
        setSymbols([...new Set([...symbols, ...results.map(r => r.symbol)])]);
        setAiPrompt('');
        setIsAiMode(false);
    }
    setLoading(false);
  };

  const getPrice = (sym: string) => {
    // In a real app, this comes from WebSocket or API
    // Using mock data or randomized deviations for visual flair
    const base = MOCK_PRICES[sym] || { p: 100, c: 0 };
    return base;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-64">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-gray-100 font-semibold mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" /> Watchlist
        </h2>
        
        {isAiMode ? (
             <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'High beta tech stocks'"
                    className="w-full bg-gray-800 text-sm text-white p-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500 h-20 resize-none"
                />
                <div className="flex gap-2">
                    <button 
                        onClick={handleAiSearch}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded disabled:opacity-50"
                    >
                        {loading ? 'Thinking...' : 'Gemini Scan'}
                    </button>
                    <button onClick={() => setIsAiMode(false)} className="px-2 text-gray-400 hover:text-white text-xs">Cancel</button>
                </div>
             </div>
        ) : (
            <button 
                onClick={() => setIsAiMode(true)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-1.5 rounded flex items-center justify-center gap-2 border border-gray-700 transition-colors"
            >
                <Plus className="w-3 h-3" /> AI Smart Add
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {symbols.map(sym => {
            const data = getPrice(sym);
            const isUp = data.c >= 0;
            return (
                <div 
                    key={sym}
                    onClick={() => onSelect(sym)}
                    className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${currentSymbol === sym ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''}`}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-200">{sym}</span>
                        <span className="text-gray-200 font-mono">{data.p.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Vol: {(Math.random() * 10).toFixed(1)}M</span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {data.c}%
                        </span>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default Watchlist;