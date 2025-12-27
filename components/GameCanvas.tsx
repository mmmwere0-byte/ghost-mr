
import React, { useEffect, useRef, useState } from 'react';
import { GameState, LevelConfig, CarState, Obstacle, SceneryObject, Skin } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TRACK_WIDTH, SKINS } from '../constants';

interface GameCanvasProps {
  level: LevelConfig;
  gameState: GameState;
  activeSkinId: string;
  onFinish: (success: boolean, score: number) => void;
  onUpdateHUD: (speed: number, distance: number, health: number, nitro: number, coinsCollected: number) => void;
  isLeftPressed?: boolean;
  isRightPressed?: boolean;
  isTurboPressed?: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  level, 
  gameState, 
  activeSkinId,
  onFinish, 
  onUpdateHUD,
  isLeftPressed = false,
  isRightPressed = false,
  isTurboPressed = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const activeSkin = SKINS.find(s => s.id === activeSkinId) || SKINS[0];
  
  const [car, setCar] = useState<CarState>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 120,
    angle: 0,
    speed: 2,
    acceleration: 0.2,
    friction: 0.03,
    maxSpeed: 10 * level.speedMultiplier,
    width: 34,
    height: 65,
    health: 100,
    nitro: 100
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [scenery, setScenery] = useState<SceneryObject[]>([]);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [coinsInSession, setCoinsInSession] = useState(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const update = () => {
    if (gameState !== GameState.PLAYING) return;

    setCar(prev => {
      let nextSpeed = prev.speed;
      let nextX = prev.x;
      let nextHealth = prev.health;
      let nextNitro = prev.nitro;

      const baseMaxSpeed = 10 * level.speedMultiplier;
      const turboMultiplier = 1.6;
      const isBoosting = (isTurboPressed || keysPressed.current['Shift'] || keysPressed.current[' ']) && nextNitro > 0;

      const currentMaxSpeed = isBoosting ? baseMaxSpeed * turboMultiplier : baseMaxSpeed;
      const currentAccel = isBoosting ? prev.acceleration * 2.5 : prev.acceleration;

      if (isBoosting) {
        nextNitro = Math.max(0, nextNitro - 0.5);
      } else {
        nextNitro = Math.min(100, nextNitro + 0.1);
      }
      
      const minSpeed = 2 * level.speedMultiplier;
      if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || isBoosting) {
        nextSpeed += currentAccel;
      } else {
        if (nextSpeed > minSpeed) nextSpeed -= prev.friction;
        if (nextSpeed < minSpeed) nextSpeed = minSpeed;
      }

      if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) {
        nextSpeed -= prev.acceleration * 2;
      }

      if (nextSpeed > currentMaxSpeed) nextSpeed -= 0.1;
      if (nextSpeed < 1.5) nextSpeed = 1.5;

      const movingLeft = keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || isLeftPressed;
      const movingRight = keysPressed.current['ArrowRight'] || keysPressed.current['d'] || isRightPressed;

      // Simple Linear Movement
      if (movingLeft) nextX -= 7 * (nextSpeed / baseMaxSpeed + 0.3);
      if (movingRight) nextX += 7 * (nextSpeed / baseMaxSpeed + 0.3);

      const leftBound = (CANVAS_WIDTH - TRACK_WIDTH) / 2;
      const rightBound = leftBound + TRACK_WIDTH;
      if (nextX < leftBound + prev.width / 2) nextX = leftBound + prev.width / 2;
      if (nextX > rightBound - prev.width / 2) nextX = rightBound - prev.width / 2;

      // Visual angle tilt
      const targetAngle = movingLeft ? -0.1 : movingRight ? 0.1 : 0;
      const nextAngle = prev.angle + (targetAngle - prev.angle) * 0.1;

      return { 
        ...prev, 
        speed: nextSpeed, 
        x: nextX, 
        angle: nextAngle,
        health: nextHealth, 
        nitro: nextNitro, 
        maxSpeed: currentMaxSpeed 
      };
    });

    setDistanceTraveled(d => {
      const newD = d + car.speed;
      if (newD >= level.targetDistance) onFinish(true, Math.floor(newD + car.health * 10 + coinsInSession * 50));
      return newD;
    });

    // Scenery Logic
    if (Math.random() < 0.2) {
      const leftSide = Math.random() < 0.5;
      const trackLeft = (CANVAS_WIDTH - TRACK_WIDTH) / 2;
      const trackRight = trackLeft + TRACK_WIDTH;
      const xPos = leftSide 
        ? Math.random() * (trackLeft - 60) 
        : trackRight + 20 + Math.random() * (CANVAS_WIDTH - trackRight - 60);
      
      let type = 'rock';
      if (level.name.includes("Neon")) type = 'building';
      else if (level.name.includes("Dust")) type = 'cactus';
      else if (level.name.includes("Glacier")) type = 'ice';
      else if (level.name.includes("Void")) type = 'crystal';

      setScenery(prev => [...prev, { id: Date.now() + Math.random(), x: xPos, y: -150, size: 30 + Math.random() * 60, type }].slice(-40));
    }

    // Obstacles & Coins Logic
    if (Math.random() < level.obstacleFrequency + 0.01) {
      const trackLeft = (CANVAS_WIDTH - TRACK_WIDTH) / 2;
      const isCoin = Math.random() < 0.35;
      setObstacles(prev => [...prev, { 
        id: Date.now() + Math.random(), 
        x: trackLeft + 30 + Math.random() * (TRACK_WIDTH - 80), 
        y: -100, 
        width: isCoin ? 30 : 40, 
        height: isCoin ? 30 : 40, 
        type: isCoin ? 'coin' : (Math.random() > 0.4 ? 'barrier' : 'oil') as any 
      }].slice(-25));
    }

    setScenery(prev => prev.map(s => ({ ...s, y: s.y + car.speed })).filter(s => s.y < CANVAS_HEIGHT + 200));
    setObstacles(prev => {
      const updated = prev.map(o => ({ ...o, y: o.y + car.speed })).filter(o => o.y < CANVAS_HEIGHT + 100);
      let hitBarrier = false;
      let collectedCoinIds: number[] = [];

      updated.forEach(o => {
        if (car.x + car.width/2 > o.x && car.x - car.width/2 < o.x + o.width && car.y + car.height/2 > o.y && car.y - car.height/2 < o.y + o.height) {
          if (o.type === 'barrier') hitBarrier = true;
          else if (o.type === 'coin') {
            collectedCoinIds.push(o.id);
          }
        }
      });

      if (collectedCoinIds.length > 0) {
        setCoinsInSession(c => c + collectedCoinIds.length);
      }

      if (hitBarrier) {
        setCar(c => {
          const newHealth = Math.max(0, c.health - 0.5);
          if (newHealth <= 0) onFinish(false, 0);
          return { ...c, health: newHealth, speed: c.speed * 0.95 };
        });
      }
      return updated.filter(o => !collectedCoinIds.includes(o.id));
    });

    onUpdateHUD(car.speed, distanceTraveled, car.health, car.nitro, coinsInSession);
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, car, distanceTraveled, obstacles, scenery, isLeftPressed, isRightPressed, isTurboPressed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isBoosting = car.speed > 12 * level.speedMultiplier;
    const shakeX = isBoosting ? (Math.random() - 0.5) * 5 : 0;
    const shakeY = isBoosting ? (Math.random() - 0.5) * 5 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Background
    ctx.fillStyle = level.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dynamic Speed Lines
    ctx.strokeStyle = isBoosting ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const x = (i * (CANVAS_WIDTH / 20)) + (Math.sin(distanceTraveled * 0.001 + i) * 10);
      const y = (distanceTraveled * 2 + i * 100) % CANVAS_HEIGHT;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 100); ctx.stroke();
    }

    // Scenery Rendering
    scenery.forEach(s => {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = level.colors.scenery;
      if (s.type === 'building') {
        ctx.fillRect(s.x, s.y, s.size, s.size * 2.5);
      } else if (s.type === 'cactus') {
        ctx.fillRect(s.x + s.size/3, s.y, s.size/3, s.size);
        ctx.fillRect(s.x, s.y + s.size/3, s.size, s.size/4);
      } else {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + s.size);
        ctx.lineTo(s.x + s.size/2, s.y);
        ctx.lineTo(s.x + s.size, s.y + s.size);
        ctx.fill();
      }
      ctx.restore();
    });

    // Track
    const leftBound = (CANVAS_WIDTH - TRACK_WIDTH) / 2;
    ctx.fillStyle = level.colors.track;
    ctx.fillRect(leftBound, 0, TRACK_WIDTH, CANVAS_HEIGHT);

    // Border Lines
    ctx.strokeStyle = level.colors.border;
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 20]);
    ctx.lineDashOffset = -distanceTraveled % 60;
    ctx.beginPath();
    ctx.moveTo(leftBound, 0); ctx.lineTo(leftBound, CANVAS_HEIGHT);
    ctx.moveTo(leftBound + TRACK_WIDTH, 0); ctx.lineTo(leftBound + TRACK_WIDTH, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Obstacles & Coins
    obstacles.forEach(o => {
      if (o.type === 'coin') {
        ctx.save();
        ctx.fillStyle = '#facc15';
        ctx.shadowBlur = 15; ctx.shadowColor = '#facc15';
        ctx.beginPath();
        ctx.arc(o.x + o.width/2, o.y + o.height/2, o.width/2, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#713f12';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', o.x + o.width/2, o.y + o.height/2 + 6);
        ctx.restore();
      } else if (o.type === 'barrier') {
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 15; ctx.shadowColor = '#ef4444';
        ctx.fillRect(o.x, o.y, o.width, o.height);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.ellipse(o.x + o.width/2, o.y + o.height/2, o.width/2, o.height/3, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    // Car Rendering
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    
    // Nitro Flame
    if (isBoosting) {
      const flameGrad = ctx.createLinearGradient(0, car.height/2, 0, car.height/2 + 50);
      flameGrad.addColorStop(0, activeSkin.accentColor);
      flameGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-12, car.height/2);
      ctx.lineTo(0, car.height/2 + 40 + Math.random()*20);
      ctx.lineTo(12, car.height/2);
      ctx.fill();
    }

    // Car Body
    ctx.shadowBlur = 20; ctx.shadowColor = `${activeSkin.primaryColor}88`;
    ctx.fillStyle = activeSkin.primaryColor;
    ctx.beginPath(); ctx.roundRect(-car.width/2, -car.height/2, car.width, car.height, 10); ctx.fill();
    
    // Stripe
    ctx.fillStyle = activeSkin.secondaryColor;
    ctx.fillRect(-car.width/4, -car.height/2, car.width/2, car.height);
    
    // Windshield
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-car.width/2 + 5, -car.height/2 + 10, car.width - 10, 15);
    
    // Headlights
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ffffff';
    ctx.fillRect(-car.width/2 + 4, -car.height/2 + 2, 6, 4);
    ctx.fillRect(car.width/2 - 10, -car.height/2 + 2, 6, 4);
    
    ctx.restore();
    ctx.restore();

  }, [car, obstacles, scenery, distanceTraveled, level, activeSkinId, isLeftPressed, isRightPressed, isTurboPressed]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="rounded-xl border-8 border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.8)]" />
    </div>
  );
};

export default GameCanvas;
