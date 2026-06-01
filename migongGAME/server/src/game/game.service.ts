import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { GameProgress, SaveHistory, Achievement } from '../schemas'

@Injectable()
export class GameService {
  constructor(
    @InjectModel(GameProgress.name) private gameProgressModel: Model<GameProgress>,
    @InjectModel(SaveHistory.name) private saveHistoryModel: Model<SaveHistory>,
    @InjectModel(Achievement.name) private achievementModel: Model<Achievement>,
  ) {}

  async getSave(userId: string) {
    let progress = await this.gameProgressModel.findOne({ userId }).exec()
    if (!progress) {
      progress = await this.gameProgressModel.create({
        userId,
        completedLevels: [],
        levelStars: {},
        notesCollection: [],
        unlockedChapters: [],
        totalPlayTime: 0,
        achievements: [],
        updatedAt: Date.now(),
      })
    }
    return { success: true, data: progress }
  }

  async saveProgress(userId: string, data: any, clientVersion?: number) {
    const existing = await this.gameProgressModel.findOne({ userId }).exec()

    if (existing && clientVersion !== undefined) {
      const serverVersion = (existing as any).version || 0
      if (clientVersion < serverVersion) {
        // Conflict detected — return cloud data for user to choose
        return {
          success: true,
          conflict: true,
          message: '存档冲突',
          localVersion: clientVersion,
          cloudVersion: serverVersion,
          cloudData: existing,
        }
      }
    }

    const newVersion = ((existing as any)?.version || 0) + 1
    const r = await this.gameProgressModel.findOneAndUpdate(
      { userId },
      { ...data, version: newVersion, updatedAt: Date.now() },
      { upsert: true, new: true },
    ).exec()

    // Save history
    try {
      await this.saveHistoryModel.create({ userId, version: newVersion, data, createdAt: Date.now() })
      // Trim to last 5
      const allHistory = await this.saveHistoryModel.find({ userId }).sort({ version: -1 }).exec()
      if (allHistory.length > 5) {
        const toDelete = allHistory.slice(5).map(h => h._id)
        await this.saveHistoryModel.deleteMany({ _id: { $in: toDelete } }).exec()
      }
    } catch { /* history is best-effort */ }

    const newlyUnlocked = await this.checkAchievements(userId, data)

    return { success: true, message: '存档保存成功', version: newVersion, updatedAt: r.updatedAt, newlyUnlocked }
  }

  async resolveConflict(userId: string, choice: 'local' | 'cloud', cloudData: any, localData: any) {
    if (choice === 'cloud') {
      const r = await this.gameProgressModel.findOneAndUpdate(
        { userId },
        { ...cloudData, version: (cloudData.version || 0) + 1, updatedAt: Date.now() },
        { upsert: true, new: true },
      ).exec()
      return { success: true, message: '已使用云端存档' }
    }
    // For 'local', just re-save with incremented version
    const existing = await this.gameProgressModel.findOne({ userId }).exec()
    if (existing) {
      const newVersion = ((existing as any).version || 0) + 1
      await this.gameProgressModel.findOneAndUpdate(
        { userId },
        { ...localData, version: newVersion, updatedAt: Date.now() },
        { new: true },
      ).exec()
    }
    return { success: true, message: '已保留本地存档' }
  }

  async getHistory(userId: string) {
    const history = await this.saveHistoryModel.find({ userId }).sort({ version: -1 }).limit(5).exec()
    return { success: true, data: history.map(h => ({
      version: h.version,
      createdAt: h.createdAt,
      completedLevels: h.data?.completedLevels?.length || 0,
      totalStars: Object.values(h.data?.levelStars || {}).reduce((a: number, b: number) => a + b, 0),
    }))}
  }

  async restoreVersion(userId: string, version: number) {
    const entry = await this.saveHistoryModel.findOne({ userId, version }).exec()
    if (!entry) throw new NotFoundException('存档版本不存在')
    const r = await this.gameProgressModel.findOneAndUpdate(
      { userId },
      { ...entry.data, version: (entry.data.version || 0) + 1, updatedAt: Date.now() },
      { new: true },
    ).exec()
    return { success: true, message: '存档已恢复', data: r }
  }

  private async checkAchievements(userId: string, data: any): Promise<string[]> {
    const allAchievements = await this.achievementModel.find().exec()
    if (!allAchievements.length) return []

    const progress = await this.gameProgressModel.findOne({ userId }).exec()
    const existingAchIds: string[] = progress?.achievements?.map((a: any) => a.id || a) || []

    const newlyUnlocked: string[] = []

    for (const ach of allAchievements) {
      if (existingAchIds.includes(ach.id)) continue

      const condition = ach.condition
      let met = false

      switch (condition.type) {
        case 'levels':
          met = (data.completedLevels?.length || 0) >= condition.count
          break
        case 'stars': {
          const starValues = Object.values(data.levelStars || {}) as number[]
          const totalStars = starValues.reduce(
            (sum: number, v: number) => sum + (Number(v) || 0), 0,
          )
          met = totalStars >= condition.count
          break
        }
        case 'notes':
          met = (data.notesCollection?.length || 0) >= condition.count
          break
        // 'speed' and 'friends' types need external data not yet tracked here
      }

      if (met) newlyUnlocked.push(ach.id)
    }

    if (newlyUnlocked.length > 0) {
      const entries = newlyUnlocked.map(id => ({ id, unlockedAt: Date.now() }))
      await this.gameProgressModel.findOneAndUpdate(
        { userId },
        { $push: { achievements: { $each: entries } } },
      ).exec()
    }

    return newlyUnlocked
  }
}
