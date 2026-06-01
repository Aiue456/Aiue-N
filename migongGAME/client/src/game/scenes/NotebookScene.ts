import Phaser from 'phaser'
import { ensureAmbient } from '../../utils/ambient'

export class NotebookScene extends Phaser.Scene {
  private currentPage = 0
  private notes: Array<{ levelId: number; noteText: string; date: string; earnedAt: number }> = []

  constructor() {
    super({ key: 'NotebookScene' })
  }

  create() {
    ensureAmbient(this)
    const saved = localStorage.getItem('gameProgress')
    if (saved) {
      const progress = JSON.parse(saved)
      this.notes = progress.notesCollection || []
    }
    this.currentPage = 0
    this.renderPage()
  }

  private renderPage() {
    this.children.removeAll()
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f0e8)

    const coverW = width * 0.85
    const coverH = height * 0.85
    const pageTop = height / 2 - coverH / 2
    const pageLeftX = width / 2 - coverW / 2
    const leftCx = width / 2 - coverW / 4
    const rightCx = width / 2 + coverW / 4
    const textW = coverW / 2 - 56
    const leftTextX = pageLeftX + 28

    // Left page background
    const lp = this.add.graphics()
    lp.fillStyle(0xfef9e7)
    lp.fillRoundedRect(pageLeftX, pageTop, coverW / 2, coverH, 8)
    lp.lineStyle(1, 0xd4c5a9)
    lp.strokeRoundedRect(pageLeftX, pageTop, coverW / 2, coverH, 8)

    // Right page background
    const rp = this.add.graphics()
    rp.fillStyle(0xfef9e7)
    rp.fillRoundedRect(width / 2, pageTop, coverW / 2, coverH, 8)
    rp.lineStyle(1, 0xd4c5a9)
    rp.strokeRoundedRect(width / 2, pageTop, coverW / 2, coverH, 8)

    // Spiral binding
    for (let i = 0; i < 6; i++) {
      this.add.rectangle(width / 2, pageTop + 30 + i * 40, 10, 10, 0x888888).setDepth(1)
    }

    // Notebook title (centered across both pages)
    this.add.text(width / 2, pageTop + 36, '好人好事笔记本', {
      fontSize: '22px', fontFamily: 'Noto Sans SC', color: '#5b3a29', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Center divider line below title
    const div = this.add.graphics()
    div.lineStyle(1, 0xd4c5a9, 0.6)
    div.lineBetween(pageLeftX + 20, pageTop + 64, width - pageLeftX - 20, pageTop + 64)

    if (this.notes.length === 0) {
      this.add.text(width / 2, height / 2, '还没有收集到便签...\n去迷宫中帮助别人吧！', {
        fontSize: '16px', fontFamily: 'Noto Sans SC', color: '#8b7355', align: 'center',
      }).setOrigin(0.5)
    } else {
      const note = this.notes[Math.min(this.currentPage, this.notes.length - 1)]

      // Split note text into 3 lines at sentence boundaries
      const lines = splitIntoLines(note.noteText, 3)

      // === LEFT PAGE: 3-line layout ===
      const lineH = 42
      const leftStartY = pageTop + 88

      // Line 1: Date
      this.add.text(leftTextX, leftStartY, `📅 ${note.date}`, {
        fontSize: '15px', fontFamily: 'Noto Sans SC', color: '#5b8c5a', fontStyle: 'bold',
      })

      // Line 2: Level
      this.add.text(leftTextX, leftStartY + lineH, `📖 第 ${note.levelId} 关`, {
        fontSize: '14px', fontFamily: 'Noto Sans SC', color: '#e8a87c',
      })

      // Line 3-5: Note text in 3 rows
      const textColors = [0x3e2723, 0x3e2723, 0x3e2723]
      for (let i = 0; i < lines.length; i++) {
        this.add.text(leftTextX, leftStartY + lineH * 2 + 4 + i * lineH, lines[i], {
          fontSize: '14px', fontFamily: 'serif', color: '#3e2723',
          wordWrap: { width: textW },
        })
      }

      // Horizontal ruled lines on left page
      const ruledLines = this.add.graphics()
      ruledLines.lineStyle(1, 0xc8dcc8, 0.3)
      for (let y = leftStartY + lineH * 2; y < pageTop + coverH - 40; y += lineH) {
        ruledLines.lineBetween(pageLeftX + 16, y, width / 2 - 16, y)
      }

      // === RIGHT PAGE: 3-line layout ===
      const rightTextX = width / 2 + 28
      const rightStartY = pageTop + 88

      // Line 1: Title
      this.add.text(rightCx, rightStartY, '老槐树便签 · 原迹', {
        fontSize: '15px', fontFamily: 'Noto Sans SC', color: '#5b3a29', fontStyle: 'bold',
      }).setOrigin(0.5, 0)

      // Line 2: Theme
      this.add.text(rightTextX, rightStartY + lineH, '✨ 善行主题', {
        fontSize: '13px', fontFamily: 'Noto Sans SC', color: '#e8a87c',
      })

      // Line 3-5: Note text in 3 rows (italic)
      for (let i = 0; i < lines.length; i++) {
        this.add.text(rightTextX, rightStartY + lineH * 2 + 4 + i * lineH, lines[i], {
          fontSize: '14px', fontFamily: 'serif', color: '#3e2723', fontStyle: 'italic',
          wordWrap: { width: textW },
        })
      }

      // Ruled lines on right page
      const ruledLinesR = this.add.graphics()
      ruledLinesR.lineStyle(1, 0xc8dcc8, 0.3)
      for (let y = rightStartY + lineH * 2; y < pageTop + coverH - 40; y += lineH) {
        ruledLinesR.lineBetween(width / 2 + 16, y, width - pageLeftX - 16, y)
      }
    }

    // Page number
    this.add.text(width / 2, pageTop + coverH - 28, `${this.currentPage + 1} / ${Math.max(1, this.notes.length)}`, {
      fontSize: '12px', fontFamily: 'Noto Sans SC', color: '#8b7355',
    }).setOrigin(0.5)

    // Navigation
    if (this.notes.length > 1) {
      if (this.currentPage > 0) {
        this.add.text(30, height / 2, '◀ 上一页', {
          fontSize: '16px', fontFamily: 'Noto Sans SC', color: '#5b8c5a',
          backgroundColor: '#f5f0e8', padding: { x: 10, y: 6 },
        }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.currentPage--
          this.renderPage()
        })
      }
      if (this.currentPage < this.notes.length - 1) {
        this.add.text(width - 30, height / 2, '下一页 ▶', {
          fontSize: '16px', fontFamily: 'Noto Sans SC', color: '#5b8c5a',
          backgroundColor: '#f5f0e8', padding: { x: 10, y: 6 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.currentPage++
          this.renderPage()
        })
      }
    }

    // Back button
    this.add.text(width / 2, height - 22, '← 返回', {
      fontSize: '15px', fontFamily: 'Noto Sans SC', color: '#ffffff',
      backgroundColor: '#5b8c5a', padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.scene.stop()
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }))
    })
  }
}

function splitIntoLines(text: string, count: number): string[] {
  const charsPerLine = Math.ceil(text.length / count)
  const result: string[] = []
  let cursor = 0

  for (let i = 0; i < count && cursor < text.length; i++) {
    let end = Math.min(cursor + charsPerLine, text.length)

    // Find the best sentence boundary to break at
    if (end < text.length) {
      for (const sep of ['。', '！', '？', '；', '，', '、', ' ']) {
        const idx = text.lastIndexOf(sep, end + 4)
        if (idx > cursor + 2 && idx < end + 6) {
          end = idx + 1
          break
        }
      }
    }

    result.push(text.substring(cursor, end))
    cursor = end
  }

  return result
}
