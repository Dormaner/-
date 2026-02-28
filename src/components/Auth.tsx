import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';
import { registerUser, loginUser, UserToken } from '../lib/storage';

interface AuthProps {
    onLogin: (token: UserToken) => void;
}

export default function Auth({ onLogin }: AuthProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Username and password are required');
            return;
        }

        if (isLogin) {
            const result = await loginUser(username, password);
            if (result.success && result.token) {
                onLogin(result.token);
            } else {
                setError(result.error || 'Login failed');
            }
        } else {
            const result = await registerUser(username, password);
            if (result.success) {
                // Automatically login after successful registration
                onLogin({ username });
            } else {
                setError(result.error || 'Registration failed');
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050505] font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[400px] bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-display font-bold tracking-tighter neon-text text-emerald-500 mb-2">
                            NEON<span className="text-white opacity-50">SNAKE</span>
                        </h1>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-mono">
                            {isLogin ? 'Authentication' : 'Registration'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-[10px] uppercase text-zinc-500 font-mono mb-1 ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-colors"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase text-zinc-500 font-mono mb-1 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-colors"
                                placeholder="Enter your password"
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2 rounded-lg text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            className="mt-2 w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors neon-glow"
                        >
                            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                            {isLogin ? 'Enter Game' : 'Create Subject'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-xs text-zinc-500 hover:text-emerald-400 font-mono transition-colors"
                        >
                            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
