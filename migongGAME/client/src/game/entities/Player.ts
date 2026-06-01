import Phaser from 'phaser'
import { TILE_SIZE } from '../config'
import { sfxFootstep } from '../../utils/sfx'

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite
  speed = 160
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const px = x * TILE_SIZE + TILE_SIZE / 2
    const py = y * TILE_SIZE + TILE_SIZE / 2

    // Create a simple colored rectangle as the player sprite
    const gfx = scene.add.graphics()
    // Body (green uniform)
    gfx.fillStyle(0x5b8c5a)
    gfx.fillRoundedRect(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, 4)
    // Face
    gfx.fillStyle(0xffe0bd)
    gfx.fillCircle(TILE_SIZE / 2 - 2, 8, 7)
    // Eyes
    gfx.fillStyle(0x333333)
    gfx.fillCircle(TILE_SIZE / 2 - 5, 7, 2)
    gfx.fillCircle(TILE_SIZE / 2 + 1, 7, 2)
    // Generate texture
    gfx.generateTexture('player_char', TILE_SIZE, TILE_SIZE)
    gfx.destroy()

    this.sprite = scene.physics.add.sprite(px, py, 'player_char')
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setDepth(10)
    this.sprite.setDisplaySize(TILE_SIZE * 0.8, TILE_SIZE * 0.8)

    // Set physics body size to match the sprite
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(TILE_SIZE * 0.6, TILE_SIZE * 0.6)
    body.setOffset(TILE_SIZE * 0.1, TILE_SIZE * 0.1)

    // Keyboard input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys()
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
    }
  }

  update() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)

    if (!this.cursors) return

    const left = this.cursors.left?.isDown || (this.wasd?.A?.isDown ?? false)
    const right = this.cursors.right?.isDown || (this.wasd?.D?.isDown ?? false)
    const up = this.cursors.up?.isDown || (this.wasd?.W?.isDown ?? false)
    const down = this.cursors.down?.isDown || (this.wasd?.S?.isDown ?? false)

    let vx = 0
    let vy = 0
    if (left) vx -= 1
    if (right) vx += 1
    if (up) vy -= 1
    if (down) vy += 1

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      body.setVelocity((vx / len) * this.speed, (vy / len) * this.speed)
      sfxFootstep()
    }
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }
}
