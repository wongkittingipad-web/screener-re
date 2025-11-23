import React from 'react';
import { GamePlan } from '../types';
import { ArrowRight, Trash2 } from 'lucide-react';

interface DashboardProps {
    plans: GamePlan[];
    onDelete: (id: string) => void;
    onLoad: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ plans, onDelete, onLoad }) => {
    return (
        <div className="flex-1 bg-gray-950 p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Trade Dashboard</h1>
            
            {plans.length === 0 ? (
                <div className="text-center text-gray-500 py-20 border border-dashed border-gray-800 rounded-lg">
                    <p>No active game plans. Select a ticker and create a strategy.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map(plan => (
                        <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{plan.symbol}</h3>
                                    <span className="text-xs text-gray-500">{new Date(plan.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-xs font-bold ${plan.riskRewardRatio >= 2 ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                    1:{plan.riskRewardRatio.toFixed(1)} RR
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                                <div>
                                    <span className="text-gray-500 text-xs block">Entry</span>
                                    <span className="text-gray-200">${plan.entryPrice.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs block">Stop</span>
                                    <span className="text-red-400">${plan.stopLoss.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs block">Target</span>
                                    <span className="text-green-400">${plan.targetPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-800">
                                <button onClick={() => onLoad(plan.symbol)} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                                    Load Chart <ArrowRight className="w-3 h-3" />
                                </button>
                                <button onClick={() => onDelete(plan.id)} className="text-gray-600 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;