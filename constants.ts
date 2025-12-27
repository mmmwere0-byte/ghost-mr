
import { LevelConfig, Skin } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TRACK_WIDTH = 400;

export const SKINS: Skin[] = [
  { id: 'default', name: 'Original Blue', price: 0, primaryColor: '#3b82f6', secondaryColor: '#1e3a8a', accentColor: '#60a5fa' },
  { id: 'blaze', name: 'Crimson Blaze', price: 10, primaryColor: '#ef4444', secondaryColor: '#7f1d1d', accentColor: '#f87171' },
  { id: 'emerald', name: 'Emerald Swift', price: 25, primaryColor: '#10b981', secondaryColor: '#064e3b', accentColor: '#34d399' },
  { id: 'phantom', name: 'Phantom Void', price: 50, primaryColor: '#a855f7', secondaryColor: '#4c1d95', accentColor: '#c084fc' },
  { id: 'gold', name: 'Golden Zenith', price: 100, primaryColor: '#eab308', secondaryColor: '#713f12', accentColor: '#facc15' },
];

const createLevel = (id: number): LevelConfig => {
  const difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme' = 
    id <= 5 ? 'Easy' : id <= 10 ? 'Medium' : id <= 15 ? 'Hard' : 'Extreme';
  
  const sectors = [
    { name: "Neon City", theme: "Futuristic urban racing", colors: { track: '#1e293b', background: '#0f172a', border: '#3b82f6', scenery: '#1d4ed8' } },
    { name: "Dust Badlands", theme: "Desert wasteland survival", colors: { track: '#78350f', background: '#451a03', border: '#f59e0b', scenery: '#92400e' } },
    { name: "Glacier Ridge", theme: "Sub-zero drifting challenge", colors: { track: '#0f172a', background: '#1e3a8a', border: '#06b6d4', scenery: '#e2e8f0' } },
    { name: "Void Protocol", theme: "Deep space digital boundary", colors: { track: '#000000', background: '#020617', border: '#ef4444', scenery: '#450a0a' } }
  ];

  const sectorIndex = Math.floor((id - 1) / 5) % sectors.length;
  const sector = sectors[sectorIndex];
  
  return {
    id,
    name: `${sector.name} - Part ${((id - 1) % 5) + 1}`,
    difficulty,
    targetDistance: 4000 + (id * 1500),
    obstacleFrequency: 0.01 + (id * 0.005),
    speedMultiplier: 0.9 + (id * 0.1),
    theme: sector.theme,
    colors: sector.colors
  };
};

export const LEVELS: LevelConfig[] = Array.from({ length: 20 }, (_, i) => createLevel(i + 1));
