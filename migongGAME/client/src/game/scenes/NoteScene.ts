import Phaser from 'phaser'
import { sfxScribble, sfxStar } from '../../utils/sfx'
import { ensureAmbient } from '../../utils/ambient'

export class NoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NoteScene' })
  }

  create(data: { levelId: number; noteText: string; noteDate: string; stars: number }) {
    ensureAmbient(this)
    const { width, height } = this.scale

    // Sky gradient background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xf5f0e8, 0xf5f0e8)
    bg.fillRect(0, 0, width, height)

    // Ground
    bg.fillStyle(0x8b7355)
    bg.fillRect(0, height * 0.7, width, height * 0.3)

    // Big tree
    const tree = this.add.image(width * 0.45, height * 0.5, 'tree')
    tree.setScale(3.5)

    // Player character (small animation)
    const playerDot = this.add.graphics()
    playerDot.fillStyle(0x5b8c5a)
    playerDot.fillCircle(width * 0.35, height * 0.65, 8)
    playerDot.setDepth(1)

    // Animation: player walks to tree
    this.tweens.add({
      targets: playerDot,
      x: width * 0.43,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Show note being written effect after delay
        this.time.delayedCall(600, () => {
          this.showNote(data)
        })
      },
    })

    // Skip button
    this.add.text(width - 10, 10, '跳过 ▸', {
      fontSize: '14px', fontFamily: 'Noto Sans SC', color: '#8b7355',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.showNote(data)
    })
  }

  private showNote(data: { levelId: number; noteText: string; noteDate: string; stars: number }) {
    const { width, height } = this.scale
    this.children.removeAll()

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f0e8)

    // Paper-looking note
    const noteX = width / 2
    const noteY = height / 2
    const noteW = width * 0.7
    const noteH = height * 0.5

    const noteBg = this.add.graphics()
    noteBg.fillStyle(0xfef9e7)
    noteBg.fillRoundedRect(noteX - noteW / 2, noteY - noteH / 2, noteW, noteH, 16)
    noteBg.lineStyle(2, 0xd4c5a9)
    noteBg.strokeRoundedRect(noteX - noteW / 2, noteY - noteH / 2, noteW, noteH, 16)

    // Tape at top
    noteBg.fillStyle(0xf0e0c0, 0.6)
    noteBg.fillRect(noteX - 20, noteY - noteH / 2 - 6, 40, 16)

    // Title
    this.add.text(noteX, noteY - noteH / 2 + 30, '老槐树 · 便签', {
      fontSize: '20px', fontFamily: 'Noto Sans SC', color: '#5b3a29', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Date
    this.add.text(noteX - noteW / 2 + 30, noteY - noteH / 2 + 60, data.noteDate || '', {
      fontSize: '12px', fontFamily: 'Noto Sans SC', color: '#8b7355',
    })

    // Available text area (below date, above continue button)
    const textTop = noteY - noteH / 2 + 84
    const textBottom = noteY + noteH / 2 - 52
    const textAreaH = textBottom - textTop
    const textPaddingX = 28
    const rowGap = 6
    const rowH = (textAreaH - rowGap * 2) / 3
    const textW = noteW - textPaddingX * 2

    // Split text into 3 roughly equal parts at sentence boundaries
    const fullText = data.noteText || '今天帮了同学一个忙，心里暖暖的。'
    const charsPerRow = Math.ceil(fullText.length / 3)

    const splitAtBoundary = (text: string, targetIdx: number): number => {
      for (const sep of ['。', '！', '？', '；', '，', '、', '\n', ' ']) {
        const idx = text.indexOf(sep, targetIdx - 6)
        if (idx !== -1 && idx < targetIdx + 6) return idx + 1
      }
      return targetIdx
    }

    const split1 = splitAtBoundary(fullText, charsPerRow)
    const remaining = fullText.substring(split1)
    const split2 = split1 + splitAtBoundary(remaining, charsPerRow)

    const rows = [
      fullText.substring(0, split1).trim(),
      fullText.substring(split1, split2).trim(),
      fullText.substring(split2).trim(),
    ].filter((r) => r.length > 0)

    // Separator lines between rows
    const sepLines = this.add.graphics()
    sepLines.lineStyle(1, 0xd4c5a9, 0.35)

    // Row text objects and masks
    const rowTexts: Phaser.GameObjects.Text[] = []
    const baseFontSize = 15

    for (let i = 0; i < rows.length; i++) {
      const rTop = textTop + i * (rowH + rowGap)
      const rBottom = rTop + rowH

      // Separator line (not before first row)
      if (i > 0) {
        sepLines.lineBetween(noteX - textW / 2, rTop - rowGap / 2, noteX + textW / 2, rTop - rowGap / 2)
      }

      // Per-row clip mask
      const rm = this.make.graphics()
      rm.fillStyle(0xffffff)
      rm.fillRect(noteX - textW / 2, rTop, textW, rowH)
      const rowMask = rm.createGeometryMask()

      const rowText = this.add.text(noteX - textW / 2, rTop, '', {
        fontSize: `${baseFontSize}px`,
        fontFamily: 'serif', color: '#3e2723',
        wordWrap: { width: textW }, lineSpacing: 6, align: 'left',
      })
      rowText.setMask(rowMask)
      rowTexts.push(rowText)
    }

    // Typing animation: row by row
    let currentRow = 0
    let charIdx = 0
    let scribbleCounter = 0
    const totalChars = rows.reduce((s, r) => s + r.length, 0)

    this.time.addEvent({
      delay: 40,
      callback: () => {
        if (currentRow >= rows.length) return

        if (charIdx < rows[currentRow].length) {
          charIdx++
          scribbleCounter++
          if (scribbleCounter % 3 === 0) sfxScribble()
          rowTexts[currentRow].setText(rows[currentRow].substring(0, charIdx))
          // Auto-shrink if overflow
          if (rowTexts[currentRow].height > rowH) {
            const ratio = rowH / rowTexts[currentRow].height
            rowTexts[currentRow].setFontSize(Math.max(9, Math.floor(baseFontSize * ratio)))
          }
        } else {
          currentRow++
          charIdx = 0
        }
      },
      repeat: totalChars + rows.length + 3,
    })

    // Continue button
    this.time.delayedCall(totalChars * 40 + 1000, () => {
      const continueBtn = this.add.text(noteX, noteY + noteH / 2 - 30, '存入笔记本 ▸', {
        fontSize: '18px', fontFamily: 'Noto Sans SC', color: '#ffffff', backgroundColor: '#5b8c5a', padding: { x: 20, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      continueBtn.on('pointerdown', () => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/levels' }))
        this.scene.stop()
      })
    })
  }
}
