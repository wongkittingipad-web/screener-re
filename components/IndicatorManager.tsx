
import React, { useState } from 'react';
import { IndicatorConfig, IndicatorType } from '../types';
import { X, Plus, Trash2, Code, Settings } from 'lucide-react';

interface IndicatorManagerProps {
    indicators: IndicatorConfig[];
    onUpdate: (indicators: IndicatorConfig[]) => void;
    onClose: () => void;
}

const IndicatorManager: React.FC<IndicatorManagerProps> = ({ indicators, onUpdate, onClose }) => {
    const [view, setView] = useState<'list' | 'add' | 'editor'>('list');
    const [selectedType, setSelectedType] = useState<IndicatorType>(IndicatorType.SMA);
    const [scriptContent, setScriptContent] = useState('// Enter Pine Script logic here\nplot(close)');
    
    // Add new indicator logic
    const handleAdd = (type: IndicatorType) => {
        if (type === IndicatorType.CUSTOM_SCRIPT) {
            setView('editor');
            return;
        }

        const newInd: IndicatorConfig = {
            id: Date.now().toString(),
            type: type,
            period: type === IndicatorType.RSI ? 14 : 20,
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            visible: true,
            paneIndex: (type === IndicatorType.RSI || type === IndicatorType.MACD) ? 1 : 0
        };
        onUpdate([...indicators, newInd]);
        setView('list');
    };

    const handleRemove = (id: string) => {
        onUpdate(indicators.filter(i => i.id !== id));
    };

    const handleSaveScript = () => {
        const newInd: IndicatorConfig = {
            id: Date.now().toString(),
            type: IndicatorType.CUSTOM_SCRIPT,
            period: 0,
            color: '#00ff00',
            visible: true,
            paneIndex: 0,
            script: scriptContent
        };
        onUpdate([...indicators, newInd]);
        setView('list');
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-lg w-[500px] h-[600px] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">Indicators</h2>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {view === 'list' && (
                        <>
                            <div className="space-y-2 mb-4">
                                {indicators.map(ind => (
                                    <div key={ind.id} className="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{backgroundColor: ind.color}}></span>
                                            <span className="text-gray-200 font-medium">{ind.type}</span>
                                            {ind.period ? <span className="text-xs text-gray-500">({ind.period})</span> : null}
                                            {ind.type === IndicatorType.CUSTOM_SCRIPT && <Code className="w-3 h-3 text-yellow-500" />}
                                        </div>
                                        <button onClick={() => handleRemove(ind.id)} className="text-gray-500 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => setView('add')}
                                className="w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 rounded flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Indicator
                            </button>
                        </>
                    )}

                    {view === 'add' && (
                        <div className="grid grid-cols-2 gap-3">
                            {Object.values(IndicatorType).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => handleAdd(t)}
                                    className="p-4 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-left"
                                >
                                    <span className="font-bold text-gray-200 block">{t}</span>
                                    <span className="text-xs text-gray-500">
                                        {t === IndicatorType.CUSTOM_SCRIPT ? 'Write Pine Script (Beta)' : 'Standard built-in'}
                                    </span>
                                </button>
                            ))}
                            <button onClick={() => setView('list')} className="col-span-2 mt-4 text-gray-400 hover:text-white text-sm">Back to list</button>
                        </div>
                    )}

                    {view === 'editor' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-gray-950 flex-1 border border-gray-700 rounded p-2 font-mono text-sm text-green-400">
                                <textarea 
                                    className="w-full h-full bg-transparent focus:outline-none resize-none"
                                    value={scriptContent}
                                    onChange={(e) => setScriptContent(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleSaveScript} className="flex-1 bg-blue-600 text-white py-2 rounded">Save Script</button>
                                <button onClick={() => setView('list')} className="px-4 text-gray-400">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IndicatorManager;
