
export enum GameState {
  START = 'START',
  MENU = 'MENU',
  BRIEFING = 'BRIEFING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  SUCCESS = 'SUCCESS',
  SHOP = 'SHOP'
}

export interface Skin {
  id: string;
  name: string;
  price: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  targetDistance: number;
  obstacleFrequency: number;
  speedMultiplier: number;
  theme: string;
  colors: {
    track: string;
    background: string;
    border: string;
    scenery: string;
  };
}

export interface CarState {
  x: number;
  y: number;
  angle: number;
  speed: number;
  acceleration: number;
  friction: number;
  maxSpeed: number;
  width: number;
  height: number;
  health: number;
  nitro: number;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'pothole' | 'barrier' | 'oil' | 'rock' | 'cone' | 'coin';
}

export interface SceneryObject {
  id: number;
  x: number;
  y: number;
  size: number;
  type: string;
}
