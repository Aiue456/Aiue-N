import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LevelsService } from './levels.service'
import { LevelsController } from './levels.controller'
import { Level, LevelSchema, Achievement, AchievementSchema } from '../schemas'

@Module({
  imports: [MongooseModule.forFeature([
    { name: Level.name, schema: LevelSchema },
    { name: Achievement.name, schema: AchievementSchema },
  ])],
  controllers: [LevelsController],
  providers: [LevelsService],
})
export class LevelsModule {}
