
import React, { useState, useEffect, useRef } from 'react';
import { GameState, LevelConfig, Skin } from './types';
import { LEVELS, SKINS } from './constants';
import GameCanvas from './components/GameCanvas';
import { generateBriefing, generateReaction } from './services/geminiService';

const App: React.FC = () => {
  // Persistence Loading
  const savedCoins = parseInt(localStorage.getItem('vx_coins') || '0');
  const savedSkins = JSON.parse(localStorage.getItem('vx_owned_skins') || '["default"]');
  const savedActiveSkin = localStorage.getItem('vx_active_skin') || 'default';

  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [briefing, setBriefing] = useState<string>("");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [hud, setHud] = useState({ speed: 0, distance: 0, health: 100, nitro: 100, coins: 0 });
  const [totalCoins, setTotalCoins] = useState(savedCoins);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(savedSkins);
  const [activeSkinId, setActiveSkinId] = useState(savedActiveSkin);
  const [score, setScore] = useState(0);

  const [ariaMessage, setAriaMessage] = useState<string>("System Ready. Initializing Neural Core.");
  const [isAriaTalking, setIsAriaTalking] = useState(false);
  const lastEventRef = useRef<string>("");
  const cooldownRef = useRef<boolean>(false);

  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [isTurboPressed, setIsTurboPressed] = useState(false);

  const shopScrollRef = useRef<HTMLDivElement>(null);

  const currentLevel = LEVELS[currentLevelIndex];

  // Save data whenever economy changes
  useEffect(() => {
    localStorage.setItem('vx_coins', totalCoins.toString());
    localStorage.setItem('vx_owned_skins', JSON.stringify(ownedSkins));
    localStorage.setItem('vx_active_skin', activeSkinId);
  }, [totalCoins, ownedSkins, activeSkinId]);

  const triggerAriaReaction = async (event: string) => {
    if (cooldownRef.current || lastEventRef.current === event) return;
    
    cooldownRef.current = true;
    lastEventRef.current = event;
    setIsAriaTalking(true);
    
    const reaction = await generateReaction(event, currentLevel ? currentLevel.theme : "Cyber Hub");
    setAriaMessage(reaction);
    
    setTimeout(() => {
      setIsAriaTalking(false);
      cooldownRef.current = false;
    }, 4500);
  };

  const startLevel = async (index: number) => {
    setCurrentLevelIndex(index);
    setIsBriefingLoading(true);
    setGameState(GameState.BRIEFING);
    const text = await generateBriefing(LEVELS[index]);
    setBriefing(text);
    setAriaMessage(text);
    setIsBriefingLoading(false);
  };

  const onFinish = (success: boolean, finalScore: number) => {
    if (success) {
      const earned = hud.coins;
      setTotalCoins(prev => prev + earned);
    }
    setScore(finalScore);
    setGameState(success ? GameState.SUCCESS : GameState.GAMEOVER);
    triggerAriaReaction(success ? "MISSION_SUCCESS" : "VEHICLE_DESTROYED");
  };

  const handleUpdateHUD = (speed: number, distance: number, health: number, nitro: number, coins: number) => {
    if (coins > hud.coins) {
      if (Math.random() < 0.1) triggerAriaReaction("COIN_COLLECTED");
    }
    if (health < hud.health - 5) triggerAriaReaction("HEAVY_IMPACT");
    setHud({ speed, distance, health, nitro, coins });
  };

  const handleBuySkin = (skin: Skin) => {
    if (ownedSkins.includes(skin.id)) {
      setActiveSkinId(skin.id);
      triggerAriaReaction("SKIN_EQUIPPED");
    } else if (totalCoins >= skin.price) {
      setTotalCoins(prev => prev - skin.price);
      setOwnedSkins(prev => [...prev, skin.id]);
      setActiveSkinId(skin.id);
      triggerAriaReaction("PURCHASE_SUCCESS");
    } else {
      triggerAriaReaction("INSUFFICIENT_FUNDS");
    }
  };

  const scrollShop = (direction: 'up' | 'down') => {
    if (shopScrollRef.current) {
      const scrollAmount = 300;
      shopScrollRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) startLevel(currentLevelIndex + 1);
    else setGameState(GameState.MENU);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex items-center justify-center text-white select-none overflow-hidden font-sans">
      
      {/* Global Coins Display */}
      {(gameState === GameState.MENU || gameState === GameState.SHOP) && (
        <div className="absolute top-6 right-6 flex items-center gap-3 bg-slate-900/80 p-3 px-6 rounded-2xl border border-yellow-500/30 backdrop-blur-xl z-50 animate-fade-in">
          <i className="fa-solid fa-coins text-yellow-500 text-xl animate-pulse"></i>
          <span className="text-xl font-black font-mono tracking-tighter">{totalCoins}</span>
        </div>
      )}

      {/* ARIA Tactical Assistant */}
      {gameState === GameState.PLAYING && (
        <div className={`absolute top-24 right-6 z-30 transition-all duration-700 transform ${isAriaTalking ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-90'}`}>
          <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl p-4 rounded-3xl border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)] max-w-sm">
            <div className="relative w-14 h-14 flex-shrink-0">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-2xl animate-ping"></div>
              <div className="relative w-full h-full bg-slate-800 rounded-2xl border border-cyan-400/50 flex items-center justify-center overflow-hidden">
                <i className="fa-solid fa-brain text-2xl text-cyan-400"></i>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1">A.R.I.A // COMMS</span>
              <p className="text-xs font-bold leading-tight text-slate-100 italic">"{ariaMessage}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Splash Screen */}
      {gameState === GameState.START && (
        <div className="relative z-10 flex flex-col items-center animate-fade-in">
          <h1 className="text-[14rem] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-cyan-300 to-indigo-600 drop-shadow-[0_20px_60px_rgba(59,130,246,0.6)]">
            VELOCITY
          </h1>
          <div className="mt-8 flex flex-col items-center gap-6">
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="group relative px-20 py-8 bg-blue-600 hover:bg-cyan-500 rounded-full font-black text-3xl uppercase tracking-[0.6em] transition-all hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(37,99,235,0.5)]"
            >
              <span className="relative z-10">Start Engine</span>
              <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
            </button>
          </div>
        </div>
      )}

      {/* Menu Screen (Hub) */}
      {gameState === GameState.MENU && (
        <div className="max-w-6xl w-full p-10 flex flex-col items-center animate-fade-in h-[90vh]">
          <div className="relative mb-10 text-center flex flex-col items-center">
            <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">MISSION HUB</h1>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setGameState(GameState.SHOP)} className="px-8 py-3 bg-yellow-600/20 border border-yellow-500/50 rounded-xl text-yellow-500 font-black uppercase text-xs tracking-widest hover:bg-yellow-500 hover:text-black transition-all">
                <i className="fa-solid fa-cart-shopping mr-2"></i> Cyber Shop
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full overflow-y-auto pr-4 custom-scrollbar">
            {LEVELS.map((level, idx) => (
              <button key={level.id} onClick={() => startLevel(idx)} className="group relative bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] text-left hover:border-cyan-500/50 hover:bg-slate-800 transition-all flex flex-col h-44">
                <span className="text-[10px] font-black text-slate-500">#{level.id.toString().padStart(2, '0')}</span>
                <h3 className="text-lg font-black group-hover:text-cyan-400 italic mb-auto">{level.name.split('-')[0]}</h3>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full self-start ${level.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {level.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shop Screen */}
      {gameState === GameState.SHOP && (
        <div className="max-w-5xl w-full p-10 flex flex-col items-center animate-fade-in relative h-[90vh]">
          <div className="relative mb-12 text-center w-full">
             <button onClick={() => setGameState(GameState.MENU)} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-black uppercase text-xs tracking-widest">
                <i className="fa-solid fa-arrow-left"></i> Hub
             </button>
             <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">CYBER SHOP</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.6em] mt-2">Personalize Your Velocity X</p>
          </div>

          {/* Shop Control Buttons (Up/Down) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
            <button 
              onClick={() => scrollShop('up')} 
              className="w-14 h-14 bg-slate-900/80 border-2 border-yellow-500/50 rounded-2xl flex items-center justify-center text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all shadow-lg active:scale-90"
              title="Scroll Up"
            >
              <i className="fa-solid fa-chevron-up text-xl"></i>
            </button>
            <button 
              onClick={() => scrollShop('down')} 
              className="w-14 h-14 bg-slate-900/80 border-2 border-yellow-500/50 rounded-2xl flex items-center justify-center text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all shadow-lg active:scale-90"
              title="Scroll Down"
            >
              <i className="fa-solid fa-chevron-down text-xl"></i>
            </button>
          </div>

          <div 
            ref={shopScrollRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full overflow-y-auto px-10 pb-20 custom-scrollbar scroll-smooth"
          >
            {SKINS.map((skin) => {
              const isOwned = ownedSkins.includes(skin.id);
              const isActive = activeSkinId === skin.id;
              return (
                <div key={skin.id} className={`relative bg-slate-900/40 border-2 p-8 rounded-[3rem] flex flex-col items-center transition-all group ${isActive ? 'border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.25)]' : 'border-slate-800 hover:border-slate-600'}`}>
                  {isOwned && !isActive && <div className="absolute top-4 right-6 text-[8px] font-black uppercase text-slate-500">Owned</div>}
                  <div className="w-28 h-48 rounded-3xl mb-8 relative overflow-hidden shadow-inner" style={{ backgroundColor: skin.secondaryColor }}>
                    <div className="absolute inset-x-0 top-6 bottom-6 w-14 mx-auto rounded-2xl shadow-2xl transition-transform group-hover:scale-105" style={{ backgroundColor: skin.primaryColor }}></div>
                    <div className="absolute top-3 left-3 right-3 h-10 rounded-xl opacity-40" style={{ backgroundColor: '#020617' }}></div>
                  </div>
                  <h4 className="text-lg font-black italic mb-4 text-center leading-tight tracking-tight">{skin.name}</h4>
                  
                  <button 
                    onClick={() => handleBuySkin(skin)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isActive ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : isOwned ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'}`}
                  >
                    {isActive ? (
                      <><i className="fa-solid fa-check-circle"></i> Equipped</>
                    ) : isOwned ? (
                      <><i className="fa-solid fa-sync"></i> Equip</>
                    ) : (
                      <><i className="fa-solid fa-coins"></i> {skin.price}</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Briefing Screen */}
      {gameState === GameState.BRIEFING && (
        <div className="max-w-xl bg-slate-900/95 border border-cyan-500/30 p-12 rounded-[3rem] shadow-2xl backdrop-blur-3xl animate-fade-in">
          <p className="text-xl leading-relaxed italic text-slate-300 border-l-4 border-cyan-500/50 pl-8 mb-12">
            {isBriefingLoading ? "Decrypting Objectives..." : `"${briefing}"`}
          </p>
          <button onClick={() => setGameState(GameState.PLAYING)} disabled={isBriefingLoading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black py-6 rounded-[1.5rem] transition-all uppercase tracking-[0.3em] active:scale-95 shadow-xl">
            Launch Mission
          </button>
        </div>
      )}

      {/* In-Game HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10">
          <div className="flex gap-4">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-blue-500/40 backdrop-blur-xl">
              <div className="text-[10px] text-blue-400 uppercase font-black mb-1">Sector</div>
              <div className="text-2xl font-mono font-bold">{(hud.distance / currentLevel.targetDistance * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-yellow-500/40 backdrop-blur-xl">
              <div className="text-[10px] text-yellow-500 uppercase font-black mb-1">Credits</div>
              <div className="text-2xl font-mono font-bold">{hud.coins}</div>
            </div>
          </div>

          <div className="flex flex-col items-center scale-125">
             <div className="bg-slate-900/95 p-5 rounded-full border-4 border-cyan-500/60 backdrop-blur-2xl flex flex-col items-center justify-center w-28 h-28 shadow-[0_0_50px_rgba(6,182,212,0.4)]">
                <div className="text-4xl font-black italic font-mono text-cyan-300">{(hud.speed * 25).toFixed(0)}</div>
                <div className="text-[9px] opacity-70 font-black">KM/H</div>
             </div>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-red-500/40 backdrop-blur-xl w-44">
            <div className="text-[10px] text-red-500 uppercase font-black mb-2">Integrity</div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${hud.health}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      {gameState === GameState.PLAYING && (
        <GameCanvas 
          level={currentLevel} 
          gameState={gameState} 
          activeSkinId={activeSkinId}
          onFinish={onFinish} 
          onUpdateHUD={handleUpdateHUD} 
          isLeftPressed={isLeftPressed} 
          isRightPressed={isRightPressed} 
          isTurboPressed={isTurboPressed} 
        />
      )}

      {/* Controls */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-10 left-0 right-0 px-12 flex justify-between items-end pointer-events-none z-20">
          <div className="flex gap-6">
            <button className={`w-24 h-24 rounded-3xl bg-slate-900/70 border-2 border-cyan-500/30 flex items-center justify-center text-4xl text-cyan-400 pointer-events-auto active:scale-90 transition-all backdrop-blur-xl ${isLeftPressed ? 'bg-cyan-500/40' : ''}`} onMouseDown={() => setIsLeftPressed(true)} onMouseUp={() => setIsLeftPressed(false)} onTouchStart={() => setIsLeftPressed(true)} onTouchEnd={() => setIsLeftPressed(false)}><i className="fa-solid fa-angle-left"></i></button>
            <button className={`w-24 h-24 rounded-3xl bg-slate-900/70 border-2 border-cyan-500/30 flex items-center justify-center text-4xl text-cyan-400 pointer-events-auto active:scale-90 transition-all backdrop-blur-xl ${isRightPressed ? 'bg-cyan-500/40' : ''}`} onMouseDown={() => setIsRightPressed(true)} onMouseUp={() => setIsRightPressed(false)} onTouchStart={() => setIsRightPressed(true)} onTouchEnd={() => setIsRightPressed(false)}><i className="fa-solid fa-angle-right"></i></button>
          </div>
          <button className={`w-28 h-28 rounded-full bg-yellow-500/20 border-4 border-yellow-500/50 flex flex-col items-center justify-center pointer-events-auto active:scale-75 transition-all backdrop-blur-2xl shadow-2xl ${isTurboPressed ? 'bg-yellow-500/40' : ''}`} onMouseDown={() => setIsTurboPressed(true)} onMouseUp={() => setIsTurboPressed(false)} onTouchStart={() => setIsTurboPressed(true)} onTouchEnd={() => setIsTurboPressed(false)}>
            <i className="fa-solid fa-bolt-lightning text-4xl text-yellow-400"></i>
            <span className="text-[10px] font-black uppercase mt-2 text-yellow-500">Nitro</span>
          </button>
        </div>
      )}

      {/* Results */}
      {(gameState === GameState.GAMEOVER || gameState === GameState.SUCCESS) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-6">
          <div className="p-14 rounded-[4rem] border-2 text-center max-w-md w-full shadow-2xl border-cyan-500/30">
            <h2 className={`text-6xl font-black mb-4 italic uppercase tracking-tighter ${gameState === GameState.SUCCESS ? 'text-green-400' : 'text-red-400'}`}>
              {gameState === GameState.SUCCESS ? 'Cleared' : 'Failed'}
            </h2>
            <div className="text-xl font-mono mb-2 text-slate-400 uppercase tracking-widest">Credits Collected: {hud.coins}</div>
            <div className="text-3xl font-mono mb-12 text-white font-bold">Total Score: {score}</div>
            <div className="flex flex-col gap-4">
              <button onClick={gameState === GameState.SUCCESS ? nextLevel : () => startLevel(currentLevelIndex)} className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] uppercase tracking-[0.2em] transition-all">
                {gameState === GameState.SUCCESS ? 'Continue' : 'Retry'}
              </button>
              <button onClick={() => setGameState(GameState.MENU)} className="w-full py-4 text-slate-500 font-black uppercase text-xs tracking-[0.4em]">Return to Hub</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
