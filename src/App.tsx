/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, LogOut, History } from 'lucide-react';
import Auth from './components/Auth';
import ScoreHistory from './components/ScoreHistory';
import { UserToken, saveScore, getGlobalHighScores } from './lib/storage';

// Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 150;
const SPEED_INCREMENT = 2;

type Point = { x: number; y: number };

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserToken | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    const refreshScores = async () => {
      const globals = await getGlobalHighScores();
      if (globals.length > 0) {
        setHighScore(globals[0].score);
      }
    };
    refreshScores();
  }, [showHistory, isGameOver]); // Refresh high score when history is closed or game over

  // Save high score automatically handled on Game Over now, no longer as an effect.
  // We'll leave the local highScore display update inside the Game Over block.

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setSpeed(BASE_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        if (currentUser) {
          saveScore(currentUser.username, score);
        }
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        if (currentUser) {
          saveScore(currentUser.username, score);
        }
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setSpeed(prev => Math.max(50, prev - SPEED_INCREMENT));
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isPaused, isGameOver, generateFood]);

  // Game Loop
  useEffect(() => {
    const loop = (time: number) => {
      if (time - lastUpdateTimeRef.current > speed) {
        moveSnake();
        lastUpdateTimeRef.current = time;
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [moveSnake, speed]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (subtle)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * size);
      ctx.lineTo(canvas.width, i * size);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x * size + size / 2, food.y * size + size / 2, size / 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#10b981' : '#059669';

      if (isHead) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
      }

      // Rounded rectangle for segments
      const padding = 1;
      const r = 4;
      const x = segment.x * size + padding;
      const y = segment.y * size + padding;
      const w = size - padding * 2;
      const h = size - padding * 2;

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();

      ctx.shadowBlur = 0;
    });
  }, [snake, food]);

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050505] font-sans">
      {showHistory && (
        <ScoreHistory username={currentUser.username} onClose={() => setShowHistory(false)} />
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] flex justify-between items-end mb-8"
      >
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tighter neon-text text-emerald-500">
            NEON<span className="text-white opacity-50">SNAKE</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Precision Arcade v1.0</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-4 text-zinc-400 text-xs font-mono mb-2">
            <div className="flex items-center gap-1">
              <span className="text-emerald-500 font-bold">{currentUser.username}</span>
            </div>
            <button onClick={() => setShowHistory(true)} className="hover:text-white transition-colors flex items-center gap-1">
              <History size={12} /> History
            </button>
            <button
              onClick={() => {
                setCurrentUser(null);
                resetGame();
              }}
              className="hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono justify-end w-full">
            <Trophy size={12} className="text-amber-500" />
            <span>GLOBAL BEST: {highScore < score ? score : highScore}</span>
          </div>
          <div className="text-3xl font-display font-bold text-white text-right w-full mt-1">
            {score.toString().padStart(4, '0')}
          </div>
        </div>
      </motion.div>

      {/* Game Board */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-black border border-white/10 rounded-lg overflow-hidden shadow-2xl">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="block cursor-none"
          />

          {/* Overlays */}
          <AnimatePresence>
            {(isPaused && !isGameOver) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPaused(false)}
                  className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-black neon-glow"
                >
                  <Play size={32} fill="currentColor" />
                </motion.button>
                <p className="mt-4 text-xs font-mono uppercase tracking-widest text-emerald-500/80">Press Space to Start</p>
              </motion.div>
            )}

            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                <h2 className="text-4xl font-display font-bold text-red-500 mb-2">GAME OVER</h2>
                <div className="h-px w-24 bg-red-500/30 mb-6" />
                <div className="mb-8">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Final Score</p>
                  <p className="text-5xl font-display font-bold text-white">{score}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                >
                  <RotateCcw size={18} />
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div >

      {/* Controls / Mobile UI */}
      < div className="mt-8 w-full max-w-[400px] grid grid-cols-3 gap-4" >
        <div className="col-span-1 flex flex-col gap-2">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-[10px] uppercase text-zinc-500 font-mono mb-1">Speed</p>
            <p className="text-lg font-display font-bold text-emerald-500">{Math.round(1000 / speed)}<span className="text-[10px] ml-1 opacity-50">TPS</span></p>
          </div>
          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2">
          <div />
          <ControlButton icon={<ChevronUp />} onClick={() => direction.y === 0 && setDirection({ x: 0, y: -1 })} />
          <div />
          <ControlButton icon={<ChevronLeft />} onClick={() => direction.x === 0 && setDirection({ x: -1, y: 0 })} />
          <ControlButton icon={<ChevronDown />} onClick={() => direction.y === 0 && setDirection({ x: 0, y: 1 })} />
          <ControlButton icon={<ChevronRight />} onClick={() => direction.x === 0 && setDirection({ x: 1, y: 0 })} />
        </div>
      </div >

      {/* Footer Instructions */}
      < div className="mt-8 text-center" >
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-mono">
          Use Arrow Keys or On-Screen Controls
        </p>
      </div >
    </div >
  );
}

function ControlButton({ icon, onClick }: { icon: React.ReactNode, onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="aspect-square flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-zinc-400 active:bg-emerald-500 active:text-black active:border-emerald-500 transition-colors"
    >
      {icon}
    </motion.button>
  );
}
