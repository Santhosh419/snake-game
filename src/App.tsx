import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  {
    id: 1,
    title: "SECTOR_01.WAV",
    artist: "SYS_ADMIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "CORRUPT_DATA.DAT",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "VOID_SIGNAL.MP3",
    artist: "NEURAL_NET_V4",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  }
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [glitchTrigger, setGlitchTrigger] = useState(0);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---

  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setGlitchTrigger(prev => prev + 1);
    generateFood();
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        setGlitchTrigger(prev => prev + 1);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 16); // Hex-like scoring
        setGlitchTrigger(prev => prev + 1);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // --- Music Logic ---

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setGlitchTrigger(prev => prev + 1);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
    setGlitchTrigger(prev => prev + 1);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
    setGlitchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black text-cyan font-mono crt-flicker">
      {/* CRT Overlays */}
      <div className="static-bg"></div>
      <div className="scanline"></div>
      <div className="scanline-bar"></div>

      {/* Header */}
      <div className="mb-8 text-center z-10 w-full max-w-6xl flex justify-between items-end border-b-4 border-magenta pb-2">
        <div className="text-left">
          <h1 
            key={glitchTrigger} 
            className="text-5xl md:text-7xl font-bold glitch-text tracking-tighter" 
            data-text="SNAKE.EXE"
          >
            SNAKE.EXE
          </h1>
          <p className="text-sm text-magenta mt-1">
            {'>'} INITIALIZING NEURAL LINK...
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xl">SYS_MEM: 0x{score.toString(16).toUpperCase().padStart(4, '0')}</p>
          <p className="text-magenta">MAX_OVERFLOW: 0x{highScore.toString(16).toUpperCase().padStart(4, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-8 w-full max-w-6xl items-start z-10">
        
        {/* Left Panel: Stats & Controls */}
        <div className="border-glitch bg-black p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-xl text-magenta mb-2 border-b border-cyan inline-block">{'//'} STATUS</h2>
            <div className="text-3xl font-bold">
              {isGameOver ? (
                <span className="text-magenta glitch-text" data-text="FATAL_ERR">FATAL_ERR</span>
              ) : isPaused ? (
                <span className="text-cyan">HALTED</span>
              ) : (
                <span className="text-cyan glitch-text" data-text="EXECUTING">EXECUTING</span>
              )}
            </div>
          </div>
          
          <div className="md:hidden">
            <h2 className="text-xl text-magenta mb-2 border-b border-cyan inline-block">{'//'} MEMORY</h2>
            <p className="text-2xl">0x{score.toString(16).toUpperCase().padStart(4, '0')}</p>
          </div>
          
          <div>
            <h2 className="text-xl text-magenta mb-2 border-b border-cyan inline-block">{'//'} INPUT_VECTORS</h2>
            <div className="flex flex-col gap-2 text-lg">
              <div className="flex justify-between"><span>[ARROWS]</span> <span className="text-magenta">NAVIGATE</span></div>
              <div className="flex justify-between"><span>[SPACE]</span> <span className="text-magenta">INTERRUPT</span></div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t-2 border-dashed border-cyan">
            <p className="text-xs opacity-70">WARNING: AVOID SELF-INTERSECTION TO PREVENT KERNEL PANIC.</p>
          </div>
        </div>

        {/* Center: Game Window */}
        <div className="relative w-full max-w-[500px] mx-auto">
          <div className="border-4 border-cyan bg-black p-1 relative shadow-[0_0_15px_#00FFFF]">
            
            {/* Game Grid */}
            <div 
              className="grid w-full aspect-square bg-[#050505]"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
              }}
            >
              {/* Food */}
              <div 
                className="bg-magenta shadow-[0_0_10px_#FF00FF]"
                style={{ 
                  gridColumn: food.x + 1,
                  gridRow: food.y + 1
                }}
              />
              
              {/* Snake */}
              {snake.map((segment, i) => (
                <div 
                  key={i}
                  className={`${i === 0 ? 'bg-cyan shadow-[0_0_10px_#00FFFF] z-10' : 'bg-cyan/70 border border-black'}`}
                  style={{ 
                    gridColumn: segment.x + 1,
                    gridRow: segment.y + 1
                  }}
                />
              ))}
            </div>

            {/* Overlay: Pause / Game Over */}
            {(isPaused || isGameOver) && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center border-2 border-magenta m-1">
                {isGameOver ? (
                  <>
                    <h2 className="text-5xl font-bold text-magenta glitch-text mb-4" data-text="SYSTEM_FAILURE">SYSTEM_FAILURE</h2>
                    <p className="text-xl mb-8">DUMP: 0x{score.toString(16).toUpperCase().padStart(4, '0')}</p>
                    <button 
                      onClick={resetGame}
                      className="border-glitch bg-cyan text-black px-6 py-2 text-2xl font-bold hover:bg-magenta hover:text-white transition-colors"
                    >
                      [ REBOOT_SEQUENCE ]
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-5xl font-bold text-cyan glitch-text mb-4" data-text="EXECUTION_HALTED">EXECUTION_HALTED</h2>
                    <p className="text-xl mb-8 text-magenta">AWAITING INPUT...</p>
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="border-glitch bg-cyan text-black px-6 py-2 text-2xl font-bold hover:bg-magenta hover:text-white transition-colors"
                    >
                      [ RESUME_PROCESS ]
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Music Player */}
        <div className="border-glitch bg-black p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-xl text-magenta mb-2 border-b border-cyan inline-block">{'//'} AUDIO_SUBSYSTEM</h2>
            <div className="text-2xl font-bold truncate glitch-text" data-text={currentTrack.title}>
              {currentTrack.title}
            </div>
            <div className="text-sm text-cyan/70 mt-1">SRC: {currentTrack.artist}</div>
          </div>

          <div className="h-24 border-2 border-cyan p-2 flex items-end gap-1 relative overflow-hidden bg-[#050505]">
            <div className="absolute top-1 left-1 text-xs text-magenta">FREQ_ANALYSIS</div>
            {[...Array(16)].map((_, i) => (
              <div 
                key={i}
                className="flex-1 bg-cyan transition-all duration-75"
                style={{ 
                  height: isPlaying ? `${Math.random() * 80 + 10}%` : '5%',
                  opacity: isPlaying ? 1 : 0.3
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <button 
              onClick={prevTrack} 
              className="text-2xl hover:text-magenta transition-colors"
            >
              {'[<<]'}
            </button>
            <button 
              onClick={togglePlay}
              className="text-3xl font-bold text-magenta hover:text-cyan transition-colors"
            >
              {isPlaying ? '[ || ]' : '[ > ]'}
            </button>
            <button 
              onClick={nextTrack} 
              className="text-2xl hover:text-magenta transition-colors"
            >
              {'[>>]'}
            </button>
          </div>

          <audio 
            ref={audioRef}
            src={currentTrack.url}
            onEnded={nextTrack}
          />
          
          <div className="mt-auto pt-4 border-t-2 border-dashed border-cyan">
            <p className="text-xs opacity-70">STREAM_STATE: {isPlaying ? 'ACTIVE' : 'IDLE'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-sm text-magenta w-full max-w-6xl border-t-4 border-cyan pt-2 flex justify-between">
        <span>V 4.0.9 // KERNEL_READY</span>
        <span className="hidden sm:inline">CONNECTION: SECURE</span>
        <span>TERMINAL_ID: 0x8F9A</span>
      </div>
    </div>
  );
}

