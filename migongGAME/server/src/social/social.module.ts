import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SocialService } from './social.service'
import { SocialController } from './social.controller'
import { Friend, FriendSchema, User, UserSchema, GameProgress, GameProgressSchema, Achievement, AchievementSchema } from '../schemas'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema },
      { name: User.name, schema: UserSchema },
      { name: GameProgress.name, schema: GameProgressSchema },
      { name: Achievement.name, schema: AchievementSchema },
    ]),
  ],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}
