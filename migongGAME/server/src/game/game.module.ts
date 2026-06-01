import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GameService } from './game.service'
import { GameController } from './game.controller'
import { GameProgress, GameProgressSchema, SaveHistory, SaveHistorySchema, Achievement, AchievementSchema } from '../schemas'

@Module({
  imports: [MongooseModule.forFeature([
    { name: GameProgress.name, schema: GameProgressSchema },
    { name: SaveHistory.name, schema: SaveHistorySchema },
    { name: Achievement.name, schema: AchievementSchema },
  ])],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
