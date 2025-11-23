
import React, { useState, useEffect } from 'react';
import { Candle, GamePlan } from '../types';
import { Calculator, Brain, Save, StickyNote, Activity } from 'lucide-react';
import { analyzeChartPattern } from '../services/geminiService';
import { calculateSMA } from '../services/marketData';

interface RightPanelProps {
    symbol: string;
    currentPrice: number;
    candles: Candle[];
    onSavePlan: (plan: GamePlan) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ symbol, currentPrice, candles, onSavePlan }) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'analysis' | 'notes'>('plan');
    
    // Calculator State
    const [entry, setEntry] = useState<string>(currentPrice.toString());
    const [stop, setStop] = useState<string>((currentPrice * 0.95).toString());
    const [target, setTarget] = useState<string>((currentPrice * 1.1).toString());
    const [riskAmount, setRiskAmount] = useState<string>('100');
    
    // AI State
    const [analysis, setAnalysis] = useState<string>('');
    const [analyzing, setAnalyzing] = useState(false);

    // Notes State
    const [notes, setNotes] = useState('');

    useEffect(() => {
        setEntry(currentPrice.toFixed(2));
        setStop((currentPrice * 0.98).toFixed(2));
        setTarget((currentPrice * 1.05).toFixed(2));

        // Load notes
        const savedNote = localStorage.getItem(`note_${symbol}`);
        setNotes(savedNote || '');
        setAnalysis(''); // Reset analysis on symbol change
    }, [symbol, currentPrice]);

    const handleSaveNote = () => {
        localStorage.setItem(`note_${symbol}`, notes);
    };

    // Derived Market Data
    const spread = currentPrice * 0.0002; // Simulated tight spread
    const bid = currentPrice - spread;
    const ask = currentPrice + spread;
    
    // Key Levels Calculation
    const getMA = (period: number) => {
        const sma = calculateSMA(candles, period);
        return sma.length > 0 ? sma[sma.length - 1].value : null;
    };

    const ma20 = getMA(20);
    const ma50 = getMA(50);
    const ma200 = getMA(200);

    // Simple pivot logic for S/R
    const recentHigh = Math.max(...candles.slice(-50).map(c => c.high));
    const recentLow = Math.min(...candles.slice(-50).map(c => c.low));

    // Game Plan Logic
    const entryVal = parseFloat(entry) || 0;
    const stopVal = parseFloat(stop) || 0;
    const targetVal = parseFloat(target) || 0;
    const riskVal = parseFloat(riskAmount) || 0;

    const riskPerShare = Math.abs(entryVal - stopVal);
    const shares = riskPerShare > 0 ? Math.floor(riskVal / riskPerShare) : 0;
    const rewardPerShare = Math.abs(targetVal - entryVal);
    const rrRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
    const totalPosition = shares * entryVal;

    const handleSave = () => {
        const plan: GamePlan = {
            id: Date.now().toString(),
            symbol,
            entryPrice: entryVal,
            stopLoss: stopVal,
            targetPrice: targetVal,
            riskAmount: riskVal,
            shares,
            riskRewardRatio: rrRatio,
            thesis: analysis ? "Based on AI Analysis" : "Manual Plan",
            createdAt: Date.now()
        };
        onSavePlan(plan);
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        const result = await analyzeChartPattern(symbol, candles);
        setAnalysis(result);
        setAnalyzing(false);
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
            {/* Market Data Header */}
            <div className="p-4 bg-gray-850 border-b border-gray-800">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{currentPrice.toFixed(2)}</h2>
                        <span className="text-xs text-gray-500">USD</span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Bid: <span className="text-green-400">{bid.toFixed(2)}</span></div>
                        <div className="text-xs text-gray-400">Ask: <span className="text-red-400">{ask.toFixed(2)}</span></div>
                    </div>
                </div>
                
                {/* Key Levels Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-gray-800 p-2 rounded">
                        <span className="text-[10px] uppercase text-gray-500 block">Resistance</span>
                        <span className="text-xs font-mono text-red-300">{recentHigh.toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-800 p-2 rounded">
                        <span className="text-[10px] uppercase text-gray-500 block">Support</span>
                        <span className="text-xs font-mono text-green-300">{recentLow.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
                    <span>20MA: <span className="text-gray-300">{ma20?.toFixed(2) || '-'}</span></span>
                    <span>50MA: <span className="text-gray-300">{ma50?.toFixed(2) || '-'}</span></span>
                    <span>200MA: <span className="text-gray-300">{ma200?.toFixed(2) || '-'}</span></span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 bg-gray-900">
                <button 
                    onClick={() => setActiveTab('plan')}
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${activeTab === 'plan' ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Calculator className="w-3 h-3" /> Plan
                </button>
                <button 
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${activeTab === 'notes' ? 'text-yellow-400 border-b-2 border-yellow-400 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <StickyNote className="w-3 h-3" /> Note
                </button>
                <button 
                    onClick={() => setActiveTab('analysis')}
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${activeTab === 'analysis' ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Brain className="w-3 h-3" /> AI
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
                {activeTab === 'plan' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Max Risk ($)</label>
                                <input type="number" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Position Size</label>
                                <div className="text-white font-mono text-sm py-2 px-1 border-b border-gray-700">${totalPosition.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <label className="text-xs text-blue-400 block mb-1 font-bold">ENTRY</label>
                                <input type="number" value={entry} onChange={e => setEntry(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono" />
                            </div>

                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <label className="text-xs text-red-400 block mb-1 font-bold">STOP LOSS</label>
                                <input type="number" value={stop} onChange={e => setStop(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono" />
                                <div className="text-right text-xs text-red-500 mt-1">-{((1 - stopVal/entryVal)*100).toFixed(2)}%</div>
                            </div>

                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <label className="text-xs text-green-400 block mb-1 font-bold">TARGET</label>
                                <input type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono" />
                                <div className="text-right text-xs text-green-500 mt-1">+{((targetVal/entryVal - 1)*100).toFixed(2)}%</div>
                            </div>
                        </div>

                        <div className="bg-gray-800 p-3 rounded border border-gray-700 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-400">Shares</span>
                                <span className="text-white font-mono font-bold">{shares}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">R/R</span>
                                <span className={`font-mono font-bold ${rrRatio >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>1 : {rrRatio.toFixed(2)}</span>
                            </div>
                        </div>

                        <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-colors">
                            <Save className="w-4 h-4" /> Save Strategy
                        </button>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleSaveNote}
                            placeholder={`Enter trade notes for ${symbol}...`}
                            className="flex-1 bg-gray-800 text-gray-200 p-3 rounded border border-gray-700 focus:outline-none focus:border-yellow-500 resize-none text-sm leading-relaxed"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">Auto-saved to local storage</p>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg">
                            <h3 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                                <Brain className="w-4 h-4" /> Gemini Insights
                            </h3>
                            <p className="text-xs text-purple-200/70 mb-3">
                                Generates technical sentiment based on last 30 periods of price action.
                            </p>
                            <button 
                                onClick={handleAnalyze} 
                                disabled={analyzing}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 rounded text-sm transition-colors"
                            >
                                {analyzing ? 'Thinking...' : 'Run Analysis'}
                            </button>
                        </div>

                        {analysis && (
                            <div className="bg-gray-800 p-3 rounded border border-gray-700 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono text-xs">
                                {analysis}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightPanel;
