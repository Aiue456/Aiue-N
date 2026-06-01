import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import { NoteScene } from './scenes/NoteScene'
import { NotebookScene } from './scenes/NotebookScene'
import { ComicScene } from './scenes/ComicScene'

export const TILE_SIZE = 32

// Chapter-based maze dimensions (cols, rows)
export const CHAPTER_MAZE: Record<number, { cols: number; rows: number; npcs: number; hazards: number; extraWalls: number }> = {
  1: { cols: 25, rows: 19, npcs: 2, hazards: 1, extraWalls: 0 },
  2: { cols: 33, rows: 25, npcs: 3, hazards: 6, extraWalls: 8 },
  3: { cols: 41, rows: 29, npcs: 4, hazards: 10, extraWalls: 16 },
}

// Default (used for level 1 display)
export const MAZE_COLS = CHAPTER_MAZE[1].cols
export const MAZE_ROWS = CHAPTER_MAZE[1].rows

/** Get chapter number from level ID */
export function getChapter(levelId: number): number {
  if (levelId <= 10) return 1
  if (levelId <= 30) return 2
  return 3
}

export interface LevelConfig {
  id: number
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  storyIntro: string
  mission: string
  npcNeeds: string
  postNote: string
  noteDate: string
  values: string
  helpedPerson: string
  action: string
  location: string
  stars: number
  choices?: { text: string; response: string; starBonus?: number; hiddenNote?: string }[]
  mapData: { grid: number[][]; playerStart: { x: number; y: number }; exitPos: { x: number; y: number }; npcPositions: { x: number; y: number }[] }
}

export function createGameConfig(parent: string, levelId: number): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: MAZE_COLS * TILE_SIZE,
    height: MAZE_ROWS * TILE_SIZE,
    parent,
    backgroundColor: '#f5f0e8',
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: [BootScene, MenuScene, GameScene, NoteScene, NotebookScene, ComicScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
    },
  }
}
