
import React, { useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { smartScreener } from '../services/geminiService';

interface ScreenerProps {
    onLoadSymbol: (symbol: string) => void;
}

const Screener: React.FC<ScreenerProps> = ({ onLoadSymbol }) => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters state
    const [filters, setFilters] = useState({
        sector: 'Technology',
        marketCap: 'Large Cap (>10B)',
        trend: 'Uptrend',
        volume: 'High (>1M)',
    });

    const runScreen = async () => {
        setLoading(true);
        // Construct a prompt based on filters
        const query = `Find 10 stocks in ${filters.sector} with ${filters.marketCap}, in a ${filters.trend}, with ${filters.volume}. Return JSON.`;
        
        try {
            const data = await smartScreener(query);
            // Enrich with mock numbers for the table visualization
            const enriched = data.map(d => ({
                ...d,
                price: (Math.random() * 200 + 50).toFixed(2),
                change: (Math.random() * 5 - 2).toFixed(2) + '%',
                volume: (Math.random() * 5 + 1).toFixed(1) + 'M',
                pe: (Math.random() * 40 + 10).toFixed(1)
            }));
            setResults(enriched);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 bg-gray-950 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-gray-800 bg-gray-900">
                <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Filter className="w-6 h-6 text-blue-400" /> Stock Screener
                </h1>
                
                {/* Filters Grid */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Sector</label>
                        <select 
                            value={filters.sector} 
                            onChange={(e) => setFilters({...filters, sector: e.target.value})}
                            className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-700"
                        >
                            <option>Technology</option>
                            <option>Healthcare</option>
                            <option>Finance</option>
                            <option>Energy</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Market Cap</label>
                        <select 
                            value={filters.marketCap} 
                            onChange={(e) => setFilters({...filters, marketCap: e.target.value})}
                            className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-700"
                        >
                            <option>Mega Cap (>200B)</option>
                            <option>Large Cap (>10B)</option>
                            <option>Mid Cap (>2B)</option>
                            <option>Small Cap (&lt;2B)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Trend</label>
                        <select 
                            value={filters.trend} 
                            onChange={(e) => setFilters({...filters, trend: e.target.value})}
                            className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-700"
                        >
                            <option>Uptrend</option>
                            <option>Downtrend</option>
                            <option>New Highs</option>
                            <option>Oversold (RSI &lt; 30)</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={runScreen} 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
                        >
                            {loading ? 'Scanning...' : 'Run Screen'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-500 border-b border-gray-800 text-xs uppercase">
                            <th className="p-3">Symbol</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Change</th>
                            <th className="p-3">Volume</th>
                            <th className="p-3">P/E</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-20 text-gray-600">
                                    Use the filters above to find trading opportunities.
                                </td>
                            </tr>
                        ) : (
                            results.map((r, i) => (
                                <tr key={i} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                                    <td className="p-3 font-bold text-blue-400">{r.symbol}</td>
                                    <td className="p-3 text-gray-300">{r.name}</td>
                                    <td className="p-3 text-gray-200 font-mono">${r.price}</td>
                                    <td className={`p-3 font-mono ${r.change.includes('-') ? 'text-red-400' : 'text-green-400'}`}>{r.change}</td>
                                    <td className="p-3 text-gray-400">{r.volume}</td>
                                    <td className="p-3 text-gray-400">{r.pe}</td>
                                    <td className="p-3 text-gray-500 text-xs max-w-xs truncate">{r.reason}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => onLoadSymbol(r.symbol)}
                                            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs border border-gray-700"
                                        >
                                            Chart
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Screener;
