import Phaser from 'phaser'
import { TILE_SIZE, CHAPTER_MAZE, getChapter } from '../config'
import { Player } from '../entities/Player'
import { NPC } from '../entities/NPC'
import { Hazard } from '../entities/Hazard'
import { generateMaze, findPathMidpoint } from '../../utils/mazeGenerator'
import { sampleLevels } from '../../utils/levelData'

const WALL = 1
const PATH = 0
const EXIT = 2
const NPC_CELL = 3
const HAZARD_CELL = 4

export class GameScene extends Phaser.Scene {
  private player!: Player
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup
  private levelId = 1
  private grid: number[][] = []
  private levelStartTime = 0
  private exitPos = { x: 0, y: 0 }
  private levelComplete = false
  private mazeWidth = 0
  private mazeHeight = 0
  private npcs: NPC[] = []
  private hazards: Hazard[] = []
  private playerStartPos = { x: 1, y: 1 }
  private checkpointPos: { x: number; y: number } | null = null
  private checkpointActive = false
  private checkpointMarker!: Phaser.GameObjects.Container | null
  private timerText!: Phaser.GameObjects.Text
  private rKey!: Phaser.Input.Keyboard.Key
  private isPaused = false
  private choiceResult: { starBonus: number; hiddenNote: string } | null = null

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: { levelId: number }) {
    this.levelId = data?.levelId || 1
    this.levelComplete = false
    this.isPaused = false
    this.npcs = []
    this.hazards = []
    this.choiceResult = null
  }

  create() {
    this.levelStartTime = Date.now()

    // Generate maze based on chapter difficulty
    const chapter = getChapter(this.levelId)
    const mazeCfg = CHAPTER_MAZE[chapter]
    const levelData = sampleLevels.find((l) => l.id === this.levelId)
    if (levelData?.mapData?.grid && levelData.mapData.grid.length > 0 && levelData.mapData.grid[0].length > 0) {
      this.grid = levelData.mapData.grid
      this.exitPos = levelData.mapData.exitPos
    } else {
      const maze = generateMaze({
        cols: mazeCfg.cols,
        rows: mazeCfg.rows,
        npcCount: mazeCfg.npcs,
        hazardCount: mazeCfg.hazards,
        extraWalls: mazeCfg.extraWalls,
      })
      this.grid = maze.grid
      this.exitPos = maze.exitPos
    }

    this.mazeWidth = this.grid[0]?.length * TILE_SIZE || mazeCfg.cols * TILE_SIZE
    this.mazeHeight = this.grid.length * TILE_SIZE || mazeCfg.rows * TILE_SIZE

    // World bounds
    this.cameras.main.setBounds(0, 0, this.mazeWidth, this.mazeHeight)
    this.physics.world.setBounds(0, 0, this.mazeWidth, this.mazeHeight)
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Groups
    this.wallGroup = this.physics.add.staticGroup()
    this.hazardGroup = this.physics.add.staticGroup()

    // Draw maze
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2
        const y = row * TILE_SIZE + TILE_SIZE / 2
        const cell = this.grid[row][col]

        if (cell === WALL) {
          const wall = this.add.image(x, y, 'wall')
          this.wallGroup.add(wall)
        } else {
          this.add.image(x, y, 'path')

          if (cell === EXIT) {
            const exitMarker = this.add.image(x, y, 'exit')
            exitMarker.setDepth(3)
            this.tweens.add({
              targets: exitMarker,
              scaleX: 1.15, scaleY: 1.15,
              duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            })
            // Glow ring
            const glow = this.add.circle(x, y, TILE_SIZE * 0.6, 0xffd700, 0.2)
            glow.setDepth(2)
            this.tweens.add({
              targets: glow,
              scaleX: 1.3, scaleY: 1.3, alpha: 0.1,
              duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            })
          } else if (cell === NPC_CELL) {
            const npcConfig = {
              name: levelData?.npcNeeds || '同学',
              dialog: levelData?.storyIntro || '帮帮我…',
              mission: levelData?.mission || '完成迷宫',
            }
            const npc = new NPC(this, col, row, npcConfig)
            npc.sprite.setInteractive({ useHandCursor: true })
            npc.sprite.on('pointerdown', () => this.showNPCDialog(npc))
            this.npcs.push(npc)
          } else if (cell === HAZARD_CELL) {
            const hazard = new Hazard(this, col, row)
            this.hazards.push(hazard)
          }
        }
      }
    }

    // Compute checkpoint at ~50% of shortest path from start to exit
    this.checkpointActive = false
    this.checkpointMarker = null
    const sx = this.playerStartPos.x
    const sy = this.playerStartPos.y
    const midpoint = findPathMidpoint(this.grid, sx, sy, this.exitPos.x, this.exitPos.y)
    if (midpoint && !(midpoint.x === sx && midpoint.y === sy) && !(midpoint.x === this.exitPos.x && midpoint.y === this.exitPos.y)) {
      this.checkpointPos = midpoint
      // Hidden flag — only revealed when player walks over it
      const mx = midpoint.x * TILE_SIZE + TILE_SIZE / 2
      const my = midpoint.y * TILE_SIZE + TILE_SIZE / 2
      const marker = this.add.container(mx, my).setDepth(4).setAlpha(0)
      const pole = this.add.rectangle(0, -6, 3, 24, 0x8b7355)
      const flag = this.add.triangle(8, -14, 0, 0, 20, 7, 0, 14, 0xffd700)
      marker.add([pole, flag])
      this.checkpointMarker = marker
    } else {
      this.checkpointPos = null
    }

    // Player start position
    this.playerStartPos = levelData?.mapData?.playerStart || { x: 1, y: 1 }
    this.player = new Player(this, this.playerStartPos.x, this.playerStartPos.y)

    // Camera follow
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)

    // Collisions
    this.physics.add.collider(this.player.sprite, this.wallGroup)
    // NPC block player
    for (const npc of this.npcs) {
      this.physics.add.collider(this.player.sprite, npc.sprite)
      this.physics.add.collider(npc.sprite, this.wallGroup)
      for (const h of this.hazards) {
        this.physics.add.collider(npc.sprite, h.sprite)
      }
    }

    // Hazard collision — send player back to start
    for (const hazard of this.hazards) {
      this.physics.add.overlap(this.player.sprite, hazard.sprite, () => {
        this.respawnPlayer()
      })
      this.physics.add.collider(hazard.sprite, this.wallGroup)
    }

    // R key for restart
    if (this.input.keyboard) {
      this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
    }

    // HUD
    this.createHUD(levelData?.title || '迷宫探索')

    // Touch drag controls
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || this.levelComplete || this.isPaused) return
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body
      const dx = pointer.worldX - this.player.sprite.x
      const dy = pointer.worldY - this.player.sprite.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len > 5) {
        body.setVelocity((dx / len) * this.player.speed, (dy / len) * this.player.speed)
      }
    })
    this.input.on('pointerup', () => {
      if (this.levelComplete) return
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0)
    })
  }

  private createHUD(title: string) {
    const vw = this.cameras.main.width
    const vh = this.cameras.main.height
    const barH = Math.max(36, Math.floor(vh * 0.06))

    // Top bar background
    const topBar = this.add.rectangle(vw / 2, barH / 2, vw, barH, 0x000000, 0.6)
    topBar.setDepth(100).setScrollFactor(0)

    this.add.text(12, barH * 0.25, `第${this.levelId}关: ${title}`, {
      fontSize: `${Math.max(12, Math.floor(barH * 0.4))}px`,
      fontFamily: 'Noto Sans SC, sans-serif', color: '#ffffff',
    }).setDepth(100).setScrollFactor(0)

    // Timer
    this.timerText = this.add.text(vw * 0.38, barH * 0.25, '⏱ 00:00', {
      fontSize: `${Math.max(12, Math.floor(barH * 0.38))}px`,
      fontFamily: 'Noto Sans SC, sans-serif', color: '#ffd700',
    }).setDepth(100).setScrollFactor(0)

    // Restart button
    const restartBtn = this.add.text(vw - 160, barH * 0.2, '🔄 重来', {
      fontSize: `${Math.max(12, Math.floor(barH * 0.38))}px`,
      fontFamily: 'Noto Sans SC, sans-serif', color: '#aaddff',
      backgroundColor: '#333333', padding: { x: 8, y: 3 },
    }).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true })

    restartBtn.on('pointerdown', () => this.restartLevel())

    // Exit button
    const exitBtn = this.add.text(vw - 60, barH * 0.2, '✕ 退出', {
      fontSize: `${Math.max(12, Math.floor(barH * 0.38))}px`,
      fontFamily: 'Noto Sans SC, sans-serif', color: '#ff9999',
      backgroundColor: '#333333', padding: { x: 8, y: 3 },
    }).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true })

    exitBtn.on('pointerdown', () => {
      this.scene.stop()
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/levels' }))
    })

    // Bottom bar
    const bottomBar = this.add.rectangle(vw / 2, vh - barH / 2, vw, barH, 0x000000, 0.5)
    bottomBar.setDepth(100).setScrollFactor(0)

    this.add.text(vw / 2, vh - barH * 0.35, 'WASD/方向键 移动 | 到达金色出口通关 | R键重来 | 中途可激活复活点', {
      fontSize: `${Math.max(10, Math.floor(barH * 0.3))}px`,
      fontFamily: 'Noto Sans SC, sans-serif', color: '#888888',
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0)
  }

  update() {
    if (this.levelComplete || this.isPaused) return

    // R key restart
    if (this.rKey && Phaser.Input.Keyboard.JustDown(this.rKey)) {
      this.restartLevel()
      return
    }

    this.player.update()

    // Update NPCs
    for (const npc of this.npcs) {
      npc.update(this.player.sprite.x, this.player.sprite.y)
    }

    // Update hazards
    for (const hazard of this.hazards) {
      hazard.update()
    }

    // Update timer
    const elapsed = Math.floor((Date.now() - this.levelStartTime) / 1000)
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const secs = (elapsed % 60).toString().padStart(2, '0')
    this.timerText.setText(`⏱ ${mins}:${secs}`)

    // Check checkpoint activation
    if (this.checkpointPos && !this.checkpointActive) {
      const cpx = this.checkpointPos.x * TILE_SIZE + TILE_SIZE / 2
      const cpy = this.checkpointPos.y * TILE_SIZE + TILE_SIZE / 2
      const ppx = this.player.sprite.x
      const ppy = this.player.sprite.y
      if (Math.abs(ppx - cpx) < TILE_SIZE * 0.6 && Math.abs(ppy - cpy) < TILE_SIZE * 0.6) {
        this.checkpointActive = true
        if (this.checkpointMarker) {
          this.checkpointMarker.setAlpha(1)
          const flag = this.checkpointMarker.getAt(1) as Phaser.GameObjects.Triangle
          if (flag) {
            flag.setFillStyle(0x5b8c5a)
            this.tweens.add({
              targets: flag,
              scaleX: 1.1, scaleY: 1.1,
              duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            })
          }
        }
        this.showMessage('已激活复活点！', '#5b8c5a')
      }
    }

    // Check exit
    const px = this.player.sprite.x
    const py = this.player.sprite.y
    const ex = this.exitPos.x * TILE_SIZE + TILE_SIZE / 2
    const ey = this.exitPos.y * TILE_SIZE + TILE_SIZE / 2
    if (Math.abs(px - ex) < TILE_SIZE * 0.7 && Math.abs(py - ey) < TILE_SIZE * 0.7) {
      this.onLevelComplete()
    }
  }

  private showMessage(text: string, color = '#ff6666') {
    const cam = this.cameras.main
    const y = cam.scrollY + 48
    const msg = this.add.text(cam.scrollX + cam.width / 2, y, text, {
      fontSize: '18px', fontFamily: 'Noto Sans SC, sans-serif', color,
      backgroundColor: '#00000088', padding: { x: 16, y: 8 },
    }).setOrigin(0.5, 0).setDepth(200).setScrollFactor(0)
    this.time.delayedCall(1500, () => msg.destroy())
  }

  private respawnPlayer() {
    if (this.isPaused) return
    this.cameras.main.flash(300, 200, 50, 50)

    if (this.checkpointActive && this.checkpointPos) {
      this.teleportTo(this.checkpointPos.x, this.checkpointPos.y)
      this.showMessage('回到复活点！', '#5b8c5a')
    } else {
      this.teleportTo(this.playerStartPos.x, this.playerStartPos.y)
      this.showMessage('碰到障碍！回到起点...', '#ff6666')
    }
  }

  private teleportTo(col: number, row: number) {
    this.player.sprite.setPosition(
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
    )
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)
  }

  private restartLevel() {
    this.cameras.main.fade(300, 0, 0, 0, false, (_cam: any, progress: number) => {
      if (progress >= 1) {
        this.scene.restart({ levelId: this.levelId })
      }
    })
  }

  private showNPCDialog(npc: NPC) {
    this.isPaused = true
    const cam = this.cameras.main
    const cx = cam.scrollX + cam.width / 2
    const cy = cam.scrollY + cam.height / 2

    const overlay = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.6)
      .setDepth(200).setScrollFactor(0)

    const dialogW = cam.width * 0.78
    const dialogBg = this.add.rectangle(cx, cy + 80, dialogW, 200, 0xffffff, 0.95)
      .setDepth(201).setScrollFactor(0)
    dialogBg.setStrokeStyle(2, 0x5b8c5a)

    // NPC face icon
    const faceCircle = this.add.circle(cx - dialogW / 2 + 40, cy + 30, 22, 0xe8a87c).setDepth(202).setScrollFactor(0)
    const faceChar = this.add.text(cx - dialogW / 2 + 40, cy + 30, npc.name[0], {
      fontSize: '16px', fontFamily: 'Noto Sans SC, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0)

    const nameText = this.add.text(cx - dialogW / 2 + 70, cy + 18, npc.name, {
      fontSize: '18px', fontFamily: 'Noto Sans SC, sans-serif', color: '#5b8c5a', fontStyle: 'bold',
    }).setDepth(202).setScrollFactor(0)

    const dialogText = this.add.text(cx, cy + 65, `"${npc.dialog}"`, {
      fontSize: '15px', fontFamily: 'Noto Sans SC, sans-serif', color: '#3e2723',
      wordWrap: { width: dialogW - 80 }, align: 'center', fontStyle: 'italic',
    }).setOrigin(0.5, 0).setDepth(202).setScrollFactor(0)

    const missionText = this.add.text(cx, cy + 115, `任务：${npc.mission}`, {
      fontSize: '13px', fontFamily: 'Noto Sans SC, sans-serif', color: '#e8a87c',
    }).setOrigin(0.5, 0).setDepth(202).setScrollFactor(0)

    const contentElements: Phaser.GameObjects.GameObject[] = [
      faceCircle, faceChar, nameText, dialogText, missionText,
    ]

    const destroyAll = (extra: Phaser.GameObjects.GameObject[] = []) => {
      ;[...contentElements, ...extra].forEach((e) => {
        if (e && e.scene) e.destroy()
      })
      if (overlay.scene) overlay.destroy()
      if (dialogBg.scene) dialogBg.destroy()
      this.isPaused = false
    }

    const levelData = sampleLevels.find((l) => l.id === this.levelId)
    const choices = levelData?.choices

    if (choices && choices.length > 0) {
      const btnSpacing = Math.min(220, (dialogW - 40) / choices.length)
      const startX = cx - ((choices.length - 1) * btnSpacing) / 2
      const btnY = cy + 158

      const choiceButtons: Phaser.GameObjects.Text[] = []

      choices.forEach((choice, i) => {
        const btn = this.add.text(startX + i * btnSpacing, btnY, choice.text, {
          fontSize: '13px', fontFamily: 'Noto Sans SC, sans-serif', color: '#ffffff',
          backgroundColor: '#5b8c5a', padding: { x: 12, y: 6 },
        }).setOrigin(0.5).setDepth(202).setScrollFactor(0).setInteractive({ useHandCursor: true })

        choiceButtons.push(btn)

        btn.on('pointerdown', () => {
          this.choiceResult = {
            starBonus: choice.starBonus || 0,
            hiddenNote: choice.hiddenNote || '',
          }

          // Remove content and choice buttons
          contentElements.forEach((e) => { if (e.scene) e.destroy() })
          choiceButtons.forEach((b) => { if (b.scene) b.destroy() })

          // Show response briefly inside dialog frame
          const respText = this.add.text(cx, cy + 80, choice.response, {
            fontSize: '16px', fontFamily: 'Noto Sans SC, sans-serif', color: '#3e2723',
            wordWrap: { width: dialogW - 60 }, align: 'center',
          }).setOrigin(0.5).setDepth(202).setScrollFactor(0)

          this.time.delayedCall(1500, () => {
            if (respText.scene) respText.destroy()
            if (overlay.scene) overlay.destroy()
            if (dialogBg.scene) dialogBg.destroy()
            this.isPaused = false
          })
        })
      })
    } else {
      const acceptBtn = this.add.text(cx, cy + 155, '交给我吧！', {
        fontSize: '17px', fontFamily: 'Noto Sans SC, sans-serif', color: '#ffffff',
        backgroundColor: '#5b8c5a', padding: { x: 24, y: 8 },
      }).setOrigin(0.5).setDepth(202).setScrollFactor(0).setInteractive({ useHandCursor: true })

      acceptBtn.on('pointerdown', () => destroyAll([acceptBtn]))
    }
  }

  private onLevelComplete() {
    this.levelComplete = true
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)

    const elapsed = (Date.now() - this.levelStartTime) / 1000
    const levelData = sampleLevels.find((l) => l.id === this.levelId)
    let stars = 1
    let starHint = ''
    if (elapsed < 45) {
      stars = 3
    } else if (elapsed < 90) {
      stars = 2
      starHint = '⏱ 45秒内通关可获得三颗星'
    } else {
      starHint = '⏱ 90秒内通关可获得两颗星'
    }
    // Add choice bonus
    stars += this.choiceResult?.starBonus || 0
    if (stars > 3) stars = 3

    const cam = this.cameras.main
    const cx = cam.scrollX + cam.width / 2
    const cy = cam.scrollY + cam.height / 2

    this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.7).setDepth(300).setScrollFactor(0)

    this.time.delayedCall(300, () => {
      const completeText = this.add.text(cx, cy - 70, '通关成功！', {
        fontSize: '34px', fontFamily: 'Noto Sans SC, sans-serif', color: '#ffd700', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setScale(0)
      this.tweens.add({ targets: completeText, scale: 1, duration: 400, ease: 'Back.easeOut' })

      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars)
      this.add.text(cx, cy - 25, starStr, {
        fontSize: '28px', fontFamily: 'Noto Sans SC, sans-serif', color: '#ffd700',
      }).setOrigin(0.5).setDepth(301).setScrollFactor(0)

      this.add.text(cx, cy + 15, `用时 ${Math.floor(elapsed)}秒`, {
        fontSize: '14px', fontFamily: 'Noto Sans SC, sans-serif', color: '#cccccc',
      }).setOrigin(0.5).setDepth(301).setScrollFactor(0)

      if (starHint) {
        this.add.text(cx, cy + 38, starHint, {
          fontSize: '13px', fontFamily: 'Noto Sans SC, sans-serif', color: '#ffaa66',
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0)
      }

      if (levelData) {
        this.add.text(cx, cy + (starHint ? 60 : 45), `帮助了: ${levelData.helpedPerson}`, {
          fontSize: '16px', fontFamily: 'Noto Sans SC, sans-serif', color: '#ffffff',
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0)
      }

      const lcDetail: any = {
        levelId: this.levelId, stars,
        noteDate: levelData?.noteDate || '',
        postNote: levelData?.postNote || '',
      }
      if (this.choiceResult?.hiddenNote) {
        lcDetail.hiddenNote = this.choiceResult.hiddenNote
      }
      window.dispatchEvent(new CustomEvent('levelComplete', { detail: lcDetail }))

      this.time.delayedCall(2000, () => {
        this.scene.start('NoteScene', {
          levelId: this.levelId,
          noteText: levelData?.postNote || '',
          noteDate: levelData?.noteDate || '',
          stars,
        })
      })
    })
  }
}
