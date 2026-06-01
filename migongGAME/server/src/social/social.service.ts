import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Friend, User, GameProgress, Achievement } from '../schemas'

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(Friend.name) private friendModel: Model<Friend>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(GameProgress.name) private gameProgressModel: Model<GameProgress>,
    @InjectModel(Achievement.name) private achievementModel: Model<Achievement>,
  ) {}

  async getLeaderboard(sort = 'stars', page = 1, limit = 20) {
    const all = await this.gameProgressModel.find().exec()
    const list: any[] = []

    for (const p of all) {
      const user = await this.userModel.findById(p.userId).exec()
      const totalStars = Object.values(p.levelStars || {}).reduce((a: number, b: number) => a + b, 0)
      list.push({
        userId: p.userId,
        username: user?.username || '未知用户',
        avatar: user?.avatar || '',
        completedLevels: p.completedLevels?.length || 0,
        totalStars,
      })
    }

    const sortKey = sort === 'completedLevels' ? 'completedLevels' : 'totalStars'
    list.sort((a, b) => b[sortKey] - a[sortKey])

    const total = list.length
    const paged = list.slice((page - 1) * limit, page * limit)
    const ranked = paged.map((item, i) => ({ ...item, rank: (page - 1) * limit + i + 1 }))

    return { success: true, data: { list: ranked, total } }
  }

  async getFriends(userId: string) {
    const relations = await this.friendModel.find({ userId, status: 'accepted' }).exec()
    const friends: any[] = []

    for (const rel of relations) {
      const user = await this.userModel.findById(rel.friendId).exec()
      const progress = await this.gameProgressModel.findOne({ userId: rel.friendId }).exec()
      if (user) {
        friends.push({
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          completedLevels: progress?.completedLevels?.length || 0,
          totalStars: Object.values(progress?.levelStars || {}).reduce((a: number, b: number) => a + b, 0),
        })
      }
    }
    return friends
  }

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) throw new BadRequestException('不能添加自己为好友')
    const exists = await this.friendModel.findOne({ userId, friendId }).exec()
    if (exists) throw new BadRequestException('已存在好友关系或申请')
    await this.friendModel.create({ userId, friendId, status: 'pending', createdAt: Date.now() })
    return { success: true, message: '好友请求已发送' }
  }

  async handleFriendRequest(requestId: string, userId: string, action: 'accept' | 'reject') {
    const request = await this.friendModel.findById(requestId).exec()
    if (!request || request.friendId !== userId) throw new BadRequestException('请求不存在')
    if (action === 'accept') {
      await this.friendModel.findByIdAndUpdate(requestId, { status: 'accepted' }).exec()
      await this.friendModel.create({ userId, friendId: request.userId, status: 'accepted', createdAt: Date.now() })
    } else {
      await this.friendModel.findByIdAndDelete(requestId).exec()
    }
    return { success: true, message: '操作成功' }
  }

  async deleteFriend(userId: string, friendId: string) {
    await this.friendModel.deleteMany({ userId, friendId }).exec()
    await this.friendModel.deleteMany({ userId: friendId, friendId: userId }).exec()
    return { success: true, message: '已删除好友' }
  }

  async getFriendRequests(userId: string) {
    const incoming = await this.friendModel.find({ friendId: userId, status: 'pending' }).exec()
    const result: any[] = []
    for (const r of incoming) {
      const user = await this.userModel.findById(r.userId).exec()
      if (user) {
        result.push({ id: r._id, user: { id: user._id, username: user.username, avatar: user.avatar }, createdAt: r.createdAt })
      }
    }
    return result
  }

  async searchUsers(keyword: string) {
    const users = await this.userModel.find({ username: { $regex: keyword, $options: 'i' } }).limit(20).exec()
    return users.map((u) => ({ _id: u._id, username: u.username, avatar: u.avatar }))
  }

  async getAchievements() {
    const achievements = await this.achievementModel.find().exec()
    return { success: true, data: achievements }
  }

  async getUserAchievements(userId: string) {
    const progress = await this.gameProgressModel.findOne({ userId }).exec()
    const unlockedIds = progress?.achievements?.map((a: any) => a.id || a) || []
    return { success: true, data: unlockedIds }
  }
}
