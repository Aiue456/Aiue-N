import Phaser from 'phaser'
import { ensureAmbient } from '../../utils/ambient'

interface ComicPanel {
  text: string
  transition: 'fade' | 'slide' | 'zoom'
}

const PANELS: ComicPanel[] = [
  { text: '那年秋天，我转学到了这所老学校...', transition: 'fade' },
  { text: '校园里有一棵高大的老槐树\n据说它见证了一代代人的成长', transition: 'slide' },
  { text: '树下总是聚集着各种需要帮助的人\n我开始了一段奇妙的旅程...', transition: 'zoom' },
  { text: '在迷宫中穿行，帮助每一个需要帮助的人', transition: 'fade' },
  { text: '每帮助一个人，就在树上贴一张便签\n老槐树上渐渐挂满了温暖的记忆', transition: 'slide' },
  { text: '这些便签，记录着点点滴滴的温暖\n准备好开始你的旅程了吗？', transition: 'zoom' },
]

export class ComicScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ComicScene' })
  }

  create(data: { onComplete?: () => void }) {
    ensureAmbient(this)
    const { width, height } = this.scale
    let currentPanel = 0

    const showPanel = (index: number) => {
      this.children.removeAll()

      const panel = PANELS[index]

      // Dark background
      this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

      // Frame
      const frameW = width * 0.82
      const frameH = height * 0.72
      this.add.rectangle(width / 2, height / 2, frameW, frameH, 0x2a2a4e).setStrokeStyle(3, 0x5b8c5a)

      // Content area
      const cw = frameW - 40
      const ch = frameH - 40
      const contentBg = this.add.rectangle(width / 2, height / 2, cw, ch, 0xffffff)

      // Text
      const text = this.add.text(width / 2, height / 2, panel.text, {
        fontSize: '20px',
        fontFamily: 'Noto Sans SC',
        color: '#3e2723',
        wordWrap: { width: cw - 60 },
        align: 'center',
        lineSpacing: 10,
      }).setOrigin(0.5)

      // Apply transition effect
      if (panel.transition === 'fade') {
        text.setAlpha(0)
        this.tweens.add({ targets: text, alpha: 1, duration: 600, ease: 'Sine.easeInOut' })
        contentBg.setAlpha(0)
        this.tweens.add({ targets: contentBg, alpha: 1, duration: 500 })
      } else if (panel.transition === 'slide') {
        text.setX(width / 2 + 60)
        this.tweens.add({ targets: text, x: width / 2, duration: 600, ease: 'Back.easeOut' })
      } else if (panel.transition === 'zoom') {
        text.setScale(0.3)
        this.tweens.add({ targets: text, scale: 1, duration: 600, ease: 'Sine.easeInOut' })
      }

      // Page indicator
      this.add.text(width / 2, height * 0.88, `${index + 1} / ${PANELS.length}`, {
        fontSize: '13px', fontFamily: 'Noto Sans SC', color: '#8b7355',
      }).setOrigin(0.5)

      // Hint text
      this.add.text(width / 2, height * 0.93, '点击继续 ▸', {
        fontSize: '14px', fontFamily: 'Noto Sans SC', color: '#5b8c5a',
      }).setOrigin(0.5)

      this.input.once('pointerdown', () => {
        if (currentPanel < PANELS.length - 1) {
          currentPanel++
          showPanel(currentPanel)
        } else {
          if (data?.onComplete) data.onComplete()
          else this.scene.start('MenuScene')
          this.scene.stop()
        }
      })
    }

    showPanel(0)
  }
}
