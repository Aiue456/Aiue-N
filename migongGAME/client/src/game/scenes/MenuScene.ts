import Phaser from 'phaser'
import { ensureAmbient } from '../../utils/ambient'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    ensureAmbient(this)

    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f0e8)

    // Title
    this.add.text(width / 2, height * 0.15, '校园迷宫奇遇记', {
      fontSize: '36px',
      fontFamily: 'Noto Sans SC',
      color: '#3e2723',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.22, '—— 老槐树下的温暖记忆 ——', {
      fontSize: '16px',
      fontFamily: 'Noto Sans SC',
      color: '#5b8c5a',
    }).setOrigin(0.5)

    // Tree illustration
    const tree = this.add.image(width / 2, height * 0.42, 'tree')
    tree.setScale(2)

    // Menu buttons
    const btnStyle = {
      fontSize: '22px',
      fontFamily: 'Noto Sans SC',
      color: '#ffffff',
      backgroundColor: '#5b8c5a',
      padding: { x: 40, y: 14 },
    }

    const startBtn = this.add.text(width / 2, height * 0.68, '开始游戏', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true })
    const levelsBtn = this.add.text(width / 2, height * 0.76, '选择关卡', { ...btnStyle, backgroundColor: '#8b7355' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    const notebookBtn = this.add.text(width / 2, height * 0.84, '好人好事笔记本', { ...btnStyle, backgroundColor: '#e8a87c' }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: 1 })
    })
    levelsBtn.on('pointerdown', () => {
      this.scene.stop()
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/levels' }))
    })
    notebookBtn.on('pointerdown', () => {
      this.scene.stop()
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/notebook' }))
    })

    // Bottom nav
    this.add.text(width / 2, height * 0.94, '排行榜 | 好友 | 登录', {
      fontSize: '14px',
      fontFamily: 'Noto Sans SC',
      color: '#8b7355',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/leaderboard' }))
    })
  }
}
