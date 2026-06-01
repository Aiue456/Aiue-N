import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from '../schemas'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findById(id: string) {
    const user = await this.userModel.findById(id).exec()
    if (!user) throw new NotFoundException('用户不存在')
    const { password, ...rest } = user.toObject()
    return rest
  }

  async updateProfile(id: string, data: { username?: string; avatar?: string }) {
    const user = await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec()
    if (!user) throw new NotFoundException('用户不存在')
    const { password, ...rest } = user.toObject()
    return rest
  }

  async searchUsers(keyword: string) {
    const users = await this.userModel.find({ username: { $regex: keyword, $options: 'i' } }).limit(20).exec()
    return users.map((u) => ({ _id: u._id, username: u.username, avatar: u.avatar }))
  }

  async heartbeat(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { lastActiveAt: Date.now() }).exec()
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId).exec()
    if (!user) throw new NotFoundException('用户不存在')

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) throw new BadRequestException('旧密码不正确')

    const hashed = await bcrypt.hash(newPassword, 10)
    await this.userModel.findByIdAndUpdate(userId, { password: hashed }).exec()
    return { message: '密码修改成功' }
  }
}
