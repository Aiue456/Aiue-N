import Phaser from 'phaser'
import { TILE_SIZE } from '../config'
import { initAudio } from '../../utils/sfx'

export class BootScene extends Phaser.Scene {
  private nextScene = 'MenuScene'
  private nextSceneData: any = null

  constructor() {
    super({ key: 'BootScene' })
  }

  init(data: { nextScene?: string; sceneData?: any }) {
    // Check window override first (set by GameContainer)
    const targetScene = (window as any).__TARGET_SCENE__
    const targetData = (window as any).__TARGET_SCENE_DATA__
    if (targetScene) {
      this.nextScene = targetScene
      this.nextSceneData = targetData
    } else if (data?.nextScene) {
      this.nextScene = data.nextScene
      this.nextSceneData = data.sceneData
    }
  }

  preload() {
    // Ambient background audio (shared across all scenes)
    this.load.audio('ambient_rain', 'audio/ambient_rain.mp3')
  }

  create() {
    // Unlock AudioContext on first user interaction
    const unlockAudio = () => {
      initAudio()
      document.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('keydown', unlockAudio)
    }
    document.addEventListener('pointerdown', unlockAudio)
    document.addEventListener('keydown', unlockAudio)

    // Wall texture — brown brick
    const wallGfx = this.make.graphics({ x: 0, y: 0 })
    wallGfx.fillStyle(0x6b4226)
    wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    wallGfx.fillStyle(0x8b6914)
    wallGfx.fillRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2)
    wallGfx.lineStyle(1, 0x5a3510)
    for (let i = 0; i < 3; i++) {
      const y = i * Math.floor(TILE_SIZE / 3)
      wallGfx.strokeRect(2, y + 2, TILE_SIZE - 4, Math.floor(TILE_SIZE / 3) - 2)
    }
    wallGfx.generateTexture('wall', TILE_SIZE, TILE_SIZE)
    wallGfx.destroy()

    // Path/floor texture — light beige, visibly different from dark background
    const pathGfx = this.make.graphics({ x: 0, y: 0 })
    pathGfx.fillStyle(0xe8dcc8)
    pathGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    pathGfx.lineStyle(1, 0xd4c5a9, 0.5)
    pathGfx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE)
    pathGfx.generateTexture('path', TILE_SIZE, TILE_SIZE)
    pathGfx.destroy()

    // Exit texture — gold glowing door
    const exitGfx = this.make.graphics({ x: 0, y: 0 })
    exitGfx.fillStyle(0xffd700)
    exitGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    exitGfx.fillStyle(0xffec8b)
    exitGfx.fillRect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6)
    exitGfx.fillStyle(0xffffff)
    exitGfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 4)
    exitGfx.generateTexture('exit', TILE_SIZE, TILE_SIZE)
    exitGfx.destroy()

    // NPC texture — orange character
    const npcGfx = this.make.graphics({ x: 0, y: 0 })
    npcGfx.fillStyle(0xe8a87c)
    npcGfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 3, TILE_SIZE / 3)
    npcGfx.fillStyle(0xd4956a)
    npcGfx.fillRect(TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2)
    npcGfx.fillStyle(0xffffff)
    npcGfx.fillCircle(TILE_SIZE / 2 - 4, TILE_SIZE / 3 - 1, 2)
    npcGfx.fillCircle(TILE_SIZE / 2 + 4, TILE_SIZE / 3 - 1, 2)
    npcGfx.generateTexture('npc', TILE_SIZE, TILE_SIZE)
    npcGfx.destroy()

    // Tree texture
    const treeGfx = this.make.graphics({ x: 0, y: 0 })
    treeGfx.fillStyle(0x5b3a29)
    treeGfx.fillRect(TILE_SIZE * 2 - 6, TILE_SIZE * 2, 12, TILE_SIZE * 4)
    treeGfx.fillStyle(0x5b8c5a)
    treeGfx.fillCircle(TILE_SIZE * 2, TILE_SIZE, TILE_SIZE * 2)
    treeGfx.fillCircle(TILE_SIZE, TILE_SIZE * 1.5, TILE_SIZE * 1.2)
    treeGfx.fillCircle(TILE_SIZE * 3, TILE_SIZE * 1.5, TILE_SIZE * 1.2)
    treeGfx.generateTexture('tree', TILE_SIZE * 4, TILE_SIZE * 6)
    treeGfx.destroy()

    // Transition to the requested scene
    this.scene.start(this.nextScene, this.nextSceneData)
  }
}
