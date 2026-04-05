import React, { useState, useRef, useEffect, forwardRef, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, User, Code, Briefcase, GraduationCap, Award, Mail, 
  X, Minus, Square, Folder, Monitor, Github, Linkedin, Phone, 
  ChevronRight, FileText, ExternalLink, Maximize2, Gamepad2, RotateCcw,
  Sun, Moon
} from 'lucide-react';

const ThemeContext = createContext<{ isDark: boolean; toggleTheme: () => void }>({
  isDark: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

type AppId = 'terminal' | 'about' | 'education' | 'skills' | 'projects' | 'experience' | 'achievements' | 'contact' | 'dino';

interface AppConfig {
  id: AppId;
  title: string;
  icon: React.ElementType;
  type: 'terminal' | 'text' | 'explorer';
}

const APPS: AppConfig[] = [
  { id: 'terminal', title: 'Terminal', icon: Terminal, type: 'terminal' },
  { id: 'about', title: 'About_Me.txt', icon: FileText, type: 'text' },
  { id: 'education', title: 'Education', icon: GraduationCap, type: 'explorer' },
  { id: 'skills', title: 'Skills', icon: Code, type: 'explorer' },
  { id: 'projects', title: 'Projects', icon: Folder, type: 'explorer' },
  { id: 'experience', title: 'Experience', icon: Briefcase, type: 'explorer' },
  { id: 'achievements', title: 'Achievements', icon: Award, type: 'explorer' },
  { id: 'contact', title: 'Contact.txt', icon: Mail, type: 'text' },
  { id: 'dino', title: 'Dino Run', icon: Gamepad2, type: 'explorer' }
];

interface WindowState {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number, y: number };
  size: { width: number, height: number };
}

const getInitialWindows = (): Record<AppId, WindowState> => {
  const isClient = typeof window !== 'undefined';
  const screenWidth = isClient ? window.innerWidth : 1200;
  const screenHeight = isClient ? window.innerHeight : 800;
  const isMobile = screenWidth < 768;
  
  return APPS.reduce((acc, app, index) => {
    const isTerminal = app.id === 'terminal';
    const width = isMobile ? screenWidth - 20 : 700;
    const height = isMobile ? screenHeight - 120 : 450;
    
    const startX = isMobile ? 10 : (isTerminal ? Math.max(screenWidth - width - 40, 40) : 40 + index * 30);
    const startY = isMobile ? 10 : (40 + (isTerminal ? 0 : index * 30));
      
    acc[app.id] = {
      id: app.id,
      isOpen: app.id === 'about',
      isMinimized: false,
      isMaximized: isMobile, // Default to maximized on mobile
      zIndex: isTerminal ? 10 : index,
      position: { x: startX, y: startY },
      size: { width, height }
    };
    return acc;
  }, {} as Record<AppId, WindowState>);
};

const GREETINGS = [
  "Hello",
  "नमस्ते", // Hindi
  "నమస్కారం", // Telugu
  "Hola", // Spanish
  "Bonjour", // French
  "Ciao", // Italian
  "こんにちは", // Japanese
  "안녕하세요", // Korean
  "Hallo", // German
  "Olá", // Portuguese
  "Привет", // Russian
  "您好", // Chinese
  "مرحبا", // Arabic
  "Jambo", // Swahili
  "Merhaba", // Turkish
  "Xin chào", // Vietnamese
  "Γεια σας", // Greek
  "שלום", // Hebrew
  "สวัสดี", // Thai
  "Hej", // Swedish
  "Cześć", // Polish
  "Halo" // Indonesian
];

// Create a single AudioContext to reuse
let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

export default function App() {
  const [windows, setWindows] = useState<Record<AppId, WindowState>>(() => getInitialWindows());
  const [activeWindow, setActiveWindow] = useState<AppId | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [time, setTime] = useState(new Date());
  const [isBooting, setIsBooting] = useState(true);
  const [isLoginScreen, setIsLoginScreen] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);
  
  const desktopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const greetingTimer = setInterval(() => {
      setGreetingIndex(prev => (prev + 1) % GREETINGS.length);
    }, 150);

    // Boot sequence
    const bootTimer = setTimeout(() => {
      setIsBooting(false);
      setIsLoginScreen(true);
    }, 4500);

    return () => {
      clearInterval(timer);
      clearInterval(greetingTimer);
      clearTimeout(bootTimer);
    };
  }, []);

  const playSound = (type: 'open' | 'close' | 'minimize') => {
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) return;
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'open') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'close') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'minimize') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const openApp = (id: AppId) => {
    playSound('open');
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: true,
        isMinimized: false,
        zIndex: maxZIndex + 1
      }
    }));
    setMaxZIndex(prev => prev + 1);
    setActiveWindow(id);
  };

  const closeApp = (id: AppId) => {
    playSound('close');
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false }
    }));
    if (activeWindow === id) {
      setActiveWindow(null);
    }
  };

  const minimizeApp = (id: AppId) => {
    playSound('minimize');
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isMinimized: true }
    }));
    if (activeWindow === id) {
      setActiveWindow(null);
    }
  };

  const toggleMaximize = (id: AppId) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isMaximized: !prev[id].isMaximized }
    }));
  };

  const focusWindow = (id: AppId) => {
    if (activeWindow === id && !windows[id].isMinimized) return;
    
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMinimized: false,
        zIndex: maxZIndex + 1
      }
    }));
    setMaxZIndex(prev => prev + 1);
    setActiveWindow(id);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (isBooting) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className={`mb-12 flex items-center justify-center text-4xl md:text-6xl font-bold font-sans tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>
          {GREETINGS[greetingIndex]}
        </div>
        <div className={`w-48 h-1 rounded-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <motion.div 
            className={`h-full transition-colors duration-500 ${isDark ? 'bg-white' : 'bg-black'}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  if (isLoginScreen) {
    return (
      <div 
        className={`h-screen w-full flex flex-col items-center justify-center bg-cover bg-center transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-white'}`}
        style={{
          backgroundImage: isDark ? `
            radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.08) 0%, transparent 40%), 
            radial-gradient(circle at 15% 85%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          ` : `
            radial-gradient(circle at 85% 15%, rgba(0, 0, 0, 0.05) 0%, transparent 40%), 
            radial-gradient(circle at 15% 85%, rgba(0, 0, 0, 0.02) 0%, transparent 40%),
            linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px'
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className={`rounded-full border flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md overflow-hidden transition-colors duration-500 ${isDark ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/10'} ${isMobile ? 'w-32 h-32' : 'w-24 h-24'}`}>
            <span className={`font-bold font-serif transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'} ${isMobile ? 'text-6xl' : 'text-4xl'}`}>P</span>
          </div>
          <h1 className={`font-semibold mb-8 tracking-wide transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'} ${isMobile ? 'text-3xl' : 'text-2xl'}`}>Prathik Reddy Mettu</h1>
          
          <button 
            onClick={() => {
              setIsLoginScreen(false);
              // Initialize audio context on first user interaction
              getAudioContext();
            }}
            className={`px-8 py-3 rounded-full border font-medium transition-all hover:scale-105 active:scale-95 backdrop-blur-sm duration-500 ${isDark ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-black/5 hover:bg-black/10 border-black/20 text-black'} ${isMobile ? 'text-lg w-full max-w-[200px]' : 'text-base'}`}
          >
            Click to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={`h-screen w-full overflow-hidden font-sans flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#000000] text-gray-200 selection:bg-white/20' : 'bg-[#f8f9fa] text-gray-800 selection:bg-black/20'}`}>
        {/* Top Menu Bar */}
        <div className={`h-7 backdrop-blur-xl border-b flex items-center justify-between px-2 sm:px-4 z-50 relative text-[10px] sm:text-xs transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className={`font-bold text-xs sm:text-sm px-1 sm:px-1.5 py-0.5 rounded transition-colors duration-500 ${isDark ? 'text-white bg-white/10' : 'text-black bg-black/10'}`}>P</span>
            <span className={`font-semibold truncate max-w-[80px] sm:max-w-none transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Prathik Reddy</span>
            <span className={`hidden md:inline cursor-pointer transition-colors duration-500 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`} onClick={() => openApp('terminal')}>Terminal</span>
            <span className={`hidden lg:inline cursor-pointer transition-colors duration-500 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`} onClick={() => openApp('about')}>About</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={toggleTheme} className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-300 hover:text-white' : 'hover:bg-black/10 text-gray-600 hover:text-black'}`}>
              {isDark ? <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>
            <span className={`hidden xs:inline transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(time)}</span>
            <span className={`font-medium transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{formatTime(time)}</span>
          </div>
        </div>

        {/* Desktop Environment */}
        <div 
          ref={desktopRef}
          className={`flex-1 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#000000]' : 'bg-[#f0f2f5]'}`}
        >
          {/* Interactive Background */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: isDark
                ? `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.06), transparent 40%)`
                : `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.04), transparent 40%)`
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage: isDark ? `
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
              ` : `
                linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        {/* Windows */}
        <AnimatePresence>
          {APPS.map(app => {
            const state = windows[app.id];
            if (!state.isOpen || state.isMinimized) return null;

            return (
              <Window 
                key={app.id}
                app={app}
                state={state}
                isActive={activeWindow === app.id}
                onClose={() => closeApp(app.id)}
                onMinimize={() => minimizeApp(app.id)}
                onMaximize={() => toggleMaximize(app.id)}
                onFocus={() => focusWindow(app.id)}
                desktopRef={desktopRef}
              />
            );
          })}
        </AnimatePresence>

        {/* macOS Dock */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-auto overflow-x-auto no-scrollbar">
          <div className={`backdrop-blur-2xl border rounded-2xl px-2 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-2xl transition-colors duration-500 mx-auto w-max ${isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
            {APPS.map(app => {
              const isOpen = windows[app.id].isOpen;
              const isActive = activeWindow === app.id && !windows[app.id].isMinimized;
              return (
                <button
                  key={app.id}
                  onClick={() => isOpen ? focusWindow(app.id) : openApp(app.id)}
                  className={`relative group p-0.5 sm:p-1 rounded-xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border shadow-lg sm:group-hover:scale-110 sm:group-hover:-translate-y-2 transition-all duration-200 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                    <app.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-black'}`} />
                  </div>
                  {isOpen && (
                    <div className={`absolute -bottom-0.5 sm:-bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${isActive ? (isDark ? 'bg-white' : 'bg-black') : 'bg-gray-500'}`} />
                  )}
                  
                  {/* Tooltip - Hidden on mobile */}
                  <div className={`hidden sm:block absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 border rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl ${isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-black/10 text-black'}`}>
                    {app.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}

// --- Window Component ---

interface WindowProps {
  key?: React.Key;
  app: AppConfig;
  state: WindowState;
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  desktopRef: React.RefObject<HTMLDivElement | null>;
}

const Window = forwardRef<HTMLDivElement, WindowProps>(({ app, state, isActive, onClose, onMinimize, onMaximize, onFocus, desktopRef }, ref) => {
  const { isDark } = useTheme();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isActuallyMaximized = state.isMaximized || isMobile;
  
  return (
    <motion.div
      ref={ref}
      drag={!isActuallyMaximized}
      dragConstraints={desktopRef}
      dragHandle=".title-bar"
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        ...(isActuallyMaximized ? {} : {
          width: Math.min(state.size.width, window.innerWidth - 40),
          height: Math.min(state.size.height, window.innerHeight - 100),
        })
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{ 
        zIndex: state.zIndex,
        ...(isActuallyMaximized ? {} : { top: state.position.y, left: state.position.x })
      }}
      onMouseDown={onFocus}
      className={`
        flex flex-col backdrop-blur-2xl overflow-hidden border shadow-2xl transition-colors duration-500
        ${isDark ? 'bg-[#0a0a0a]/95' : 'bg-white/95'}
        ${isActive ? (isDark ? 'border-white/20 shadow-white/5' : 'border-black/20 shadow-black/5') : (isDark ? 'border-white/10 shadow-black/50' : 'border-black/10 shadow-black/20')}
        ${isActuallyMaximized ? 'fixed top-7 inset-x-0 bottom-0 !w-full !h-[calc(100%-28px)] !max-w-none !max-h-none !rounded-none !transform-none' : 'absolute rounded-xl'}
      `}
    >
      {/* Title Bar */}
      <div 
        className={`
          title-bar h-10 flex items-center px-3 select-none relative transition-colors duration-500
          ${isActive ? (isDark ? 'bg-[#141414]' : 'bg-[#f3f4f6]') : (isDark ? 'bg-[#0a0a0a]' : 'bg-white')}
          ${isDark ? 'border-b border-white/10' : 'border-b border-black/10'}
        `}
      >
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-2 absolute left-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={`rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center group transition-colors ${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`}
          >
            <X className={`text-black/50 transition-opacity ${isMobile ? 'w-3 h-3 opacity-100' : 'w-2 h-2 opacity-0 group-hover:opacity-100'}`} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className={`rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 flex items-center justify-center group transition-colors ${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`}
          >
            <Minus className={`text-black/50 transition-opacity ${isMobile ? 'w-3 h-3 opacity-100' : 'w-2 h-2 opacity-0 group-hover:opacity-100'}`} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            className={`rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 flex items-center justify-center group transition-colors ${isMobile ? 'w-5 h-5' : 'w-3 h-3'}`}
          >
            {state.isMaximized ? (
              <Maximize2 className={`text-black/50 transition-opacity ${isMobile ? 'w-3 h-3 opacity-100' : 'w-2 h-2 opacity-0 group-hover:opacity-100'}`} />
            ) : (
              <Square className={`text-black/50 transition-opacity ${isMobile ? 'w-3 h-3 opacity-100' : 'w-2 h-2 opacity-0 group-hover:opacity-100'}`} />
            )}
          </button>
        </div>

        {/* Centered Title */}
        <div className="flex-1 flex items-center justify-center gap-2 pointer-events-none">
          <app.icon className={`w-4 h-4 transition-colors duration-500 ${isActive ? (isDark ? 'text-white' : 'text-black') : 'text-gray-500'}`} />
          <span className={`text-xs font-medium transition-colors duration-500 ${isActive ? (isDark ? 'text-white' : 'text-black') : 'text-gray-500'}`}>{app.title}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-auto relative transition-colors duration-500 ${isDark ? 'bg-[#050505]/80' : 'bg-white/80'}`}>
        {app.type === 'terminal' && <TerminalApp />}
        {app.type === 'text' && <TextApp id={app.id} />}
        {app.type === 'explorer' && <ExplorerApp id={app.id} />}
      </div>
    </motion.div>
  );
});

// --- Dino Game Component ---
function DinoGame() {
  const { isDark } = useTheme();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isJumping, setIsJumping] = useState(false);
  const [dinoY, setDinoY] = useState(0);
  const [obstacles, setObstacles] = useState<{ x: number; id: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const dinoYRef = useRef(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const gameStartedRef = useRef(false);
  const requestRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(undefined);
  const obstacleIdRef = useRef(0);

  // Sync refs with state for the game loop
  useEffect(() => {
    dinoYRef.current = dinoY;
    scoreRef.current = score;
    gameOverRef.current = gameOver;
    gameStartedRef.current = gameStarted;
  }, [dinoY, score, gameOver, gameStarted]);

  const jump = useCallback(() => {
    if (gameOver) {
      setGameOver(false);
      setGameStarted(true);
      setScore(0);
      setObstacles([]);
      setDinoY(0);
      setIsJumping(false);
      obstacleIdRef.current = 0;
      return;
    }
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    if (!isJumping) {
      setIsJumping(true);
      let velocity = 12;
      const gravity = 0.6;
      let currentY = 0;

      const animateJump = () => {
        currentY += velocity;
        velocity -= gravity;

        if (currentY <= 0) {
          setDinoY(0);
          setIsJumping(false);
          return;
        }

        setDinoY(currentY);
        requestAnimationFrame(animateJump);
      };

      requestAnimationFrame(animateJump);
    }
  }, [isJumping, gameOver, gameStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  const gameLoop = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined && gameStartedRef.current && !gameOverRef.current) {
      const deltaTime = time - lastTimeRef.current;

      setObstacles(prev => {
        const next = prev
          .map(obs => ({ ...obs, x: obs.x - 0.3 * deltaTime }))
          .filter(obs => obs.x > -50);

        // Add new obstacle
        if (next.length === 0 || (next[next.length - 1].x < 350 && Math.random() < 0.015)) {
          next.push({ x: 600, id: obstacleIdRef.current++ });
        }

        // Collision detection
        for (const obs of next) {
          if (obs.x < 60 && obs.x > 20 && dinoYRef.current < 30) {
            setGameOver(true);
            setHighScore(prev => Math.max(prev, Math.floor(scoreRef.current / 10)));
          }
        }

        return next;
      });

      setScore(s => s + 1);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  return (
    <div className={`h-full flex flex-col items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
      <div className={`w-full max-w-md flex justify-between items-center mb-4 font-mono transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>
        <div>
          <span className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SCORE: </span>
          <span className="text-green-500 font-bold">{Math.floor(score / 10)}</span>
        </div>
        <div>
          <span className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>HIGH: </span>
          <span className="text-blue-500 font-bold">{highScore}</span>
        </div>
      </div>

      <div 
        onClick={jump}
        className={`relative w-full max-w-2xl h-48 border-b-2 overflow-hidden cursor-pointer transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] border-white/20' : 'bg-gray-50 border-black/20'}`}
      >
        {/* Dino */}
        <div 
          className="absolute left-10 w-10 h-10 flex items-end justify-center"
          style={{ bottom: `${dinoY}px` }}
        >
          <div className={`w-8 h-8 rounded-sm transition-colors duration-500 ${isDark ? 'bg-white' : 'bg-black'}`}>
             <div className="w-1.5 h-1.5 bg-red-500 absolute top-1 right-1 rounded-full" />
          </div>
        </div>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div 
            key={obs.id}
            className={`absolute bottom-0 w-6 h-10 transition-colors duration-500 ${isDark ? 'bg-red-500/80' : 'bg-red-600/80'}`}
            style={{ left: `${obs.x}px` }}
          />
        ))}

        {/* Ground Line */}
        <div className={`absolute bottom-0 w-full h-[1px] transition-colors duration-500 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Overlays */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="text-center">
              <p className={`text-xl font-bold mb-2 font-mono ${isDark ? 'text-white' : 'text-black'}`}>CHROME DINO</p>
              <p className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isMobile ? 'Tap to Start' : 'Press SPACE or Click to Start'}
              </p>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
            <h2 className="text-3xl font-bold text-red-500 mb-4 font-mono">GAME OVER</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); setGameOver(false); setGameStarted(true); setScore(0); setObstacles([]); setDinoY(0); }}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all border ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-black/5 hover:bg-black/10 text-black border-black/20'}`}
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
          </div>
        )}
      </div>

      <div className={`mt-6 text-xs font-mono text-center space-y-1 transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <p>{isMobile ? 'Tap anywhere to jump' : 'Press SPACE or UP to jump'}</p>
        <p>Avoid the red obstacles!</p>
      </div>
    </div>
  );
}

// --- App Contents ---

function TerminalApp() {
  const { isDark } = useTheme();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{type: 'cmd' | 'out', text: string | React.ReactNode}[]>([
    { type: 'out', text: 'Last login: ' + new Date().toString().split(' GMT')[0] + ' on console' },
    { type: 'out', text: 'Welcome to Prathik-OS v1.0.0 (Darwin Kernel Version 23.0.0)' },
    { type: 'out', text: ' ' },
    { type: 'out', text: ' * Documentation:  https://github.com/prathikreddy19' },
    { type: 'out', text: ' * Management:     https://linkedin.com/in/prathikreddymettu' },
    { type: 'out', text: ' ' },
    { type: 'out', text: 'Type "help" to see available commands.' },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = input.trim().toLowerCase();
      const newHistory = [...history, { type: 'cmd' as const, text: input }];
      
      switch(cmd.split(' ')[0]) {
        case 'help':
          newHistory.push({ type: 'out', text: 'Available commands: whoami, clear, skills, contact, date, projects, education, experience, github, linkedin, echo, sudo' });
          break;
        case 'whoami':
          newHistory.push({ type: 'out', text: 'Prathik Reddy Mettu - Computer Science Engineering student & aspiring Software Engineer.' });
          break;
        case 'clear':
          setHistory([]);
          setInput('');
          return;
        case 'skills':
          newHistory.push({ type: 'out', text: 'Java, Python, C, DSA, OOP, DBMS, Node.js, Express.js, FastAPI, Flask, MongoDB, React, PyTorch, Transformers, NLP, LLMs, RAG' });
          break;
        case 'contact':
          newHistory.push({ type: 'out', text: 'Email: prathikreddy1230@gmail.com | Phone: +91 6281989942' });
          break;
        case 'date':
          newHistory.push({ type: 'out', text: new Date().toString() });
          break;
        case 'projects':
          newHistory.push({ type: 'out', text: 'Projects: TransPolymer, Virtual Brain Twins, Smart Borewell Management System' });
          break;
        case 'education':
          newHistory.push({ type: 'out', text: 'B.Tech in Computer Science Engineering - KMCE' });
          break;
        case 'experience':
          newHistory.push({ type: 'out', text: 'Experience: Software engineering student with strong foundations in DSA, backend development, and AI-based systems.' });
          break;
        case 'github':
          newHistory.push({ type: 'out', text: 'GitHub: https://github.com/prathikreddy19' });
          break;
        case 'linkedin':
          newHistory.push({ type: 'out', text: 'LinkedIn: https://linkedin.com/in/prathikreddymettu' });
          break;
        case 'sudo':
          newHistory.push({ type: 'out', text: 'Nice try! You don\'t have root privileges.' });
          break;
        case 'echo':
          newHistory.push({ type: 'out', text: input.substring(5) });
          break;
        case '':
          break;
        default:
          newHistory.push({ type: 'out', text: `Command not found: ${cmd}` });
      }
      
      setHistory(newHistory);
      setInput('');
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={`p-4 font-mono text-sm h-full flex flex-col transition-colors duration-500 ${isDark ? 'text-green-400' : 'text-green-600 bg-white'}`}>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {history.map((line, i) => (
          <div key={i} className="mb-1">
            {line.type === 'cmd' ? (
              <div className="flex flex-wrap">
                <span className={`mr-2 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>prathikreddy@system</span>
                <span className={`transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{line.text}</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{line.text}</div>
            )}
          </div>
        ))}
        <div className="flex items-center mt-1">
          <span className={`mr-2 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'} hidden sm:inline`}>prathikreddy@system</span>
          <span className={`mr-2 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'} sm:hidden`}>$</span>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleCommand}
            className={`flex-1 bg-transparent outline-none transition-colors duration-500 ${isDark ? 'text-white caret-white' : 'text-black caret-black'}`}
            autoFocus
          />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Mobile Keyboard Helper */}
      {isMobile && (
        <div className="mt-4 flex flex-wrap gap-2 pb-2 border-t pt-4 border-white/10">
          {['help', 'clear', 'whoami', 'skills', 'projects', 'contact'].map(cmd => (
            <button
              key={cmd}
              onClick={() => {
                const newHistory = [...history, { type: 'cmd' as const, text: cmd }];
                // Reuse the logic from handleCommand
                switch(cmd) {
                  case 'help':
                    newHistory.push({ type: 'out', text: 'Available commands: whoami, clear, skills, contact, date, projects, education, experience, github, linkedin, echo, sudo' });
                    break;
                  case 'whoami':
                    newHistory.push({ type: 'out', text: 'Prathik Reddy Mettu - Computer Science Engineering student & aspiring Software Engineer.' });
                    break;
                  case 'clear':
                    setHistory([]);
                    return;
                  case 'skills':
                    newHistory.push({ type: 'out', text: 'Java, Python, C, DSA, OOP, DBMS, Node.js, Express.js, FastAPI, Flask, MongoDB, React, PyTorch, Transformers, NLP, LLMs, RAG' });
                    break;
                  case 'contact':
                    newHistory.push({ type: 'out', text: 'Email: prathikreddy1230@gmail.com | Phone: +91 6281989942' });
                    break;
                  case 'projects':
                    newHistory.push({ type: 'out', text: 'Projects: TransPolymer, Virtual Brain Twins, Smart Borewell Management System' });
                    break;
                  default:
                    newHistory.push({ type: 'out', text: `Command not found: ${cmd}` });
                }
                setHistory(newHistory);
              }}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}
            >
              {cmd}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TextApp({ id }: { id: AppId }) {
  const { isDark } = useTheme();
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (id === 'about') {
    return (
      <div className={`p-4 sm:p-6 font-sans h-full overflow-y-auto prose max-w-none transition-colors duration-500 ${isDark ? 'text-gray-300 prose-invert' : 'text-gray-700 bg-white'}`}>
        <h1 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-4 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Prathik Reddy Mettu</h1>
        <p className={`text-base sm:text-lg mb-4 sm:mb-6 transition-colors duration-500 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Software Engineering Student & AI Enthusiast</p>
        
        <div className="space-y-3 sm:space-y-4 leading-relaxed text-sm sm:text-base">
          <p>
            Software engineering student with strong foundations in DSA, backend development, and AI-based systems. 
            Experienced in building end-to-end applications using MERN and FastAPI, with a focus on clean code, 
            API design, and real-world problem solving.
          </p>
          <p>
            I have a strong interest in Machine Learning and AI, specifically in NLP, LLMs, and RAG. 
            I enjoy building full-stack applications that solve meaningful problems and provide a great user experience.
          </p>
        </div>
      </div>
    );
  }

  if (id === 'contact') {
    return (
      <div className={`p-6 font-mono h-full flex flex-col items-center justify-center transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700 bg-white'}`}>
        <div className={`p-8 rounded-xl border shadow-xl w-full max-w-md transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/10'}`}>
          <h2 className={`text-xl font-bold mb-6 text-center border-b pb-4 transition-colors duration-500 ${isDark ? 'text-white border-white/10' : 'text-black border-black/10'}`}>Contact Information</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                <a href="mailto:prathikreddy1230@gmail.com" className={`text-sm transition-colors ${isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>prathikreddy1230@gmail.com</a>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:bg-green-500/20 transition-colors">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                <a href="tel:+916281989942" className={`text-sm transition-colors ${isDark ? 'hover:text-green-400' : 'hover:text-green-600'}`}>+91 6281989942</a>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">LinkedIn</p>
                <a href="https://linkedin.com/in/prathikreddymettu" target="_blank" rel="noreferrer" className={`text-sm transition-colors ${isDark ? 'hover:text-blue-500' : 'hover:text-blue-700'}`}>linkedin.com/in/prathikreddymettu</a>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-400 group-hover:bg-gray-500/20 transition-colors">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">GitHub</p>
                <a href="https://github.com/prathikreddy19" target="_blank" rel="noreferrer" className={`text-sm transition-colors ${isDark ? 'hover:text-gray-400' : 'hover:text-gray-600'}`}>github.com/prathikreddy19</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ExplorerApp({ id }: { id: AppId }) {
  const { isDark } = useTheme();
  
  if (id === 'skills') {
    const skillCategories = [
      {
        title: "Programming Languages",
        skills: ["Java", "Python", "C"]
      },
      {
        title: "CS Fundamentals",
        skills: ["DSA", "OOP", "DBMS (SQL)", "Operating Systems", "Computer Networks"]
      },
      {
        title: "Backend & Web",
        skills: ["Node.js", "Express.js", "FastAPI", "Flask", "REST APIs", "MongoDB", "React"]
      },
      {
        title: "ML & AI",
        skills: ["PyTorch", "Scikit-learn", "Transformers", "NLP", "LLMs", "RAG"]
      },
      {
        title: "Tools",
        skills: ["Git", "GitHub", "Postman", "VS Code", "Jupyter Notebook"]
      },
      {
        title: "Achievements",
        skills: ["170+ LeetCode problems solved"]
      }
    ];

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
      <div className={`p-4 sm:p-6 h-full overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {skillCategories.map((category, i) => (
            <div key={i} className={`p-4 sm:p-5 rounded-xl border transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5 hover:border-black/10'}`}>
              <h3 className={`font-medium mb-4 flex items-center gap-2 transition-colors duration-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                <Folder className="w-4 h-4" />
                {category.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, j) => (
                  <span key={j} className={`px-2.5 py-1 rounded-md text-xs border transition-colors duration-500 ${isDark ? 'bg-white/5 text-gray-300 border-white/5' : 'bg-white text-gray-700 border-black/5 shadow-sm'}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'projects') {
    const projects = [
      {
        title: "TransPolymer – Polymer Property Prediction",
        tech: "PyTorch, Transformers, FastAPI, MERN, MongoDB",
        desc: "Full-stack app to predict polymer properties from SMILES input using a Transformer-based deep learning model. REST APIs via FastAPI, React frontend, MongoDB for auth and prediction history.",
        link: "https://github.com/prathikreddy19/Transpolymer-PS"
      },
      {
        title: "Virtual Brain Twins – Neural Interpretation System",
        tech: "Transformers, PyTorch, MERN, FastAPI, NLP, MongoDB, Firebase",
        desc: "End-to-end workflow for neural state detection and domain-specific text generation using NLP. AI interpretation using FLAN-T5, Firebase Authentication with email verification. Modular MERN + FastAPI architecture.",
        link: "https://github.com/prathikreddy19/NeuroVerse"
      },
      {
        title: "Smart Borewell Management System – IoT Automation",
        tech: "ESP32, ESP-NOW, Sensors, Flask, IoT Dashboard",
        desc: "IoT-based automated water management using ESP32 and ultrasonic sensors. State-machine-based control system with manual override support. Handles asynchronous sensor inputs and network failures in real-time.",
        link: "https://github.com/prathikreddy19"
      }
    ];

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
      <div className={`p-4 sm:p-6 h-full overflow-y-auto space-y-4 sm:space-y-6 transition-colors duration-500 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
        {projects.map((project, i) => {
          const content = (
            <div className={`p-4 sm:p-6 rounded-xl border transition-colors duration-500 group ${project.link ? 'cursor-pointer' : ''} ${isDark ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-gray-50 border-black/5 hover:border-black/10'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className={`text-lg font-medium transition-colors duration-500 ${isDark ? 'text-white group-hover:text-blue-400' : 'text-black group-hover:text-blue-600'}`}>{project.title}</h3>
                {project.link && <ExternalLink className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />}
              </div>
              <p className={`text-xs font-mono mb-4 transition-colors duration-500 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{project.tech}</p>
              <p className={`text-sm leading-relaxed transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{project.desc}</p>
            </div>
          );

          return project.link ? (
            <a key={i} href={project.link} target="_blank" rel="noopener noreferrer" className="block">
              {content}
            </a>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>
    );
  }

  if (id === 'experience') {
    const experiences = [
      {
        title: "Software Engineering Student",
        company: "Keshav Memorial College of Engineering",
        desc: "Building end-to-end applications using MERN and FastAPI. Focusing on clean code, API design, and real-world problem solving. Developed projects like TransPolymer and Virtual Brain Twins."
      }
    ];

    return (
      <div className={`p-6 h-full overflow-y-auto relative transition-colors duration-500 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
        <div className={`absolute left-10 top-6 bottom-6 w-px transition-colors duration-500 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div>
        <div className="space-y-8 relative">
          {experiences.map((exp, i) => (
            <div key={i} className="pl-12 relative">
              <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-4 transition-colors duration-500 ${isDark ? 'bg-blue-500 border-[#1e1e2e]' : 'bg-blue-600 border-white'}`}></div>
              <h3 className={`text-lg font-medium transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{exp.title}</h3>
              <p className={`text-sm mb-3 transition-colors duration-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{exp.company}</p>
              <p className={`text-sm leading-relaxed p-4 rounded-xl border transition-colors duration-500 ${isDark ? 'text-gray-400 bg-white/5 border-white/5' : 'text-gray-600 bg-gray-50 border-black/5'}`}>{exp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'education') {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
      <div className={`p-4 sm:p-6 h-full overflow-y-auto flex flex-col gap-4 sm:gap-6 transition-colors duration-500 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
        <div className={`p-4 sm:p-6 rounded-xl border flex gap-3 sm:gap-4 transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5'}`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <GraduationCap className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-medium transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>B.Tech in Computer Science Engineering</h3>
            <p className={`text-xs sm:text-sm mb-2 transition-colors duration-500 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Keshav Memorial College of Engineering, Hyderabad</p>
            <p className={`text-[10px] sm:text-xs font-mono transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sep 2023 – Present</p>
          </div>
        </div>

        <div className={`p-4 sm:p-6 rounded-xl border flex gap-3 sm:gap-4 transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5'}`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
            <GraduationCap className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-medium transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>Intermediate</h3>
            <p className={`text-xs sm:text-sm mb-2 transition-colors duration-500 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Narayana Junior College, Hyderabad</p>
            <p className={`text-[10px] sm:text-xs font-mono transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aug 2021 – Mar 2023</p>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'dino') {
    return <DinoGame />;
  }

  if (id === 'achievements') {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
      <div className={`p-4 sm:p-6 h-full overflow-y-auto space-y-6 sm:space-y-8 transition-colors duration-500 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
        <div>
          <h2 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2 transition-colors duration-500 ${isDark ? 'text-white border-white/10' : 'text-black border-black/10'}`}>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            Key Achievements
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div className={`p-4 sm:p-5 rounded-xl border transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <h3 className={`text-sm sm:text-base font-medium mb-1 sm:mb-2 transition-colors duration-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>LeetCode Problem Solving</h3>
              <p className={`text-xs sm:text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Solved 170+ problems on LeetCode, demonstrating strong problem-solving skills and proficiency in Data Structures and Algorithms.</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2 transition-colors duration-500 ${isDark ? 'text-white border-white/10' : 'text-black border-black/10'}`}>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className={`p-3 sm:p-4 rounded-xl border flex items-start gap-2 sm:gap-3 transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 transition-colors duration-500 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>HackerRank Python Basic Certificate</p>
                <p className={`text-[10px] sm:text-xs font-mono mt-1 transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aug 2024</p>
              </div>
            </div>
            <div className={`p-3 sm:p-4 rounded-xl border flex items-start gap-2 sm:gap-3 transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 transition-colors duration-500 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>KMCE GenAI Project School</p>
                <p className={`text-[10px] sm:text-xs font-mono mt-1 transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Certificate of Completion • Jul 2025</p>
              </div>
            </div>
            <div className={`p-3 sm:p-4 rounded-xl border flex items-start gap-2 sm:gap-3 transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 transition-colors duration-500 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>JPMorgan Chase</p>
                <p className={`text-[10px] sm:text-xs font-mono mt-1 transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Software Engineering Virtual Experience • Oct 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
