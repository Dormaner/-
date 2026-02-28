import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, History, Crown } from 'lucide-react';
import { getUserScores, getGlobalHighScores, ScoreRecord } from '../lib/storage';

interface ScoreHistoryProps {
    username: string;
    onClose: () => void;
}

export default function ScoreHistory({ username, onClose }: ScoreHistoryProps) {
    const [activeTab, setActiveTab] = useState<'personal' | 'global'>('personal');
    const [personalScores, setPersonalScores] = useState<ScoreRecord[]>([]);
    const [globalScores, setGlobalScores] = useState<{ username: string, score: number }[]>([]);

    useEffect(() => {
        const fetchScores = async () => {
            const pScores = await getUserScores(username);
            setPersonalScores(pScores);

            const gScores = await getGlobalHighScores();
            setGlobalScores(gScores);
        };

        fetchScores();
    }, [username, activeTab]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-[500px] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
                    <div className="flex items-center gap-3">
                        <Trophy className="text-emerald-500" size={24} />
                        <h2 className="text-xl font-display font-bold text-white tracking-wider">LEADERBOARD</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'personal' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                    >
                        <History size={14} /> Personal History
                    </button>
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'global' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                    >
                        <Crown size={14} /> Global Top 10
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'personal' && (
                        <div className="flex flex-col gap-3">
                            {personalScores.length === 0 ? (
                                <div className="text-center py-10 text-zinc-500 font-mono text-sm">
                                    No games played yet.<br />Time to enter the neon void.
                                </div>
                            ) : (
                                personalScores.map((record, index) => (
                                    <div key={index} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="text-white font-display font-bold text-xl">{record.score}</span>
                                            <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">
                                                {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {index === 0 && <span className="text-[10px] uppercase tracking-widest text-emerald-500 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Personal Best</span>}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'global' && (
                        <div className="flex flex-col gap-3">
                            {globalScores.length === 0 ? (
                                <div className="text-center py-10 text-zinc-500 font-mono text-sm">
                                    The global board is empty.
                                </div>
                            ) : (
                                globalScores.map((record, index) => (
                                    <div key={index} className={`flex items-center p-4 border rounded-xl relative overflow-hidden
                    ${index === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                                            index === 1 ? 'bg-zinc-300/10 border-zinc-300/30' :
                                                index === 2 ? 'bg-amber-700/10 border-amber-700/30' :
                                                    'bg-white/5 border-white/5'}`
                                    }>
                                        {index < 3 && (
                                            <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 flex items-end justify-center pb-2 ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-zinc-400' : 'bg-amber-700'} opacity-20`} />
                                        )}

                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm mr-4 z-10
                      ${index === 0 ? 'bg-amber-500 text-black' :
                                                index === 1 ? 'bg-zinc-300 text-black' :
                                                    index === 2 ? 'bg-amber-700 text-black' :
                                                        'bg-white/10 text-zinc-400'}`}
                                        >
                                            {index + 1}
                                        </div>

                                        <div className="flex-1 z-10">
                                            <span className={`font-mono text-sm tracking-widest ${record.username === username ? 'text-emerald-400 font-bold' : 'text-white'}`}>
                                                {record.username} {record.username === username && '(You)'}
                                            </span>
                                        </div>

                                        <div className={`font-display font-bold text-2xl z-10
                      ${index === 0 ? 'text-amber-500' :
                                                index === 1 ? 'text-zinc-300' :
                                                    index === 2 ? 'text-amber-700' :
                                                        'text-white'}`}
                                        >
                                            {record.score}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
