import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { MongooseModule } from '@nestjs/mongoose'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { GameModule } from './game/game.module'
import { SocialModule } from './social/social.module'
import { LevelsModule } from './levels/levels.module'

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/campus-maze'),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
      name: 'default',
    }]),
    AuthModule,
    UsersModule,
    GameModule,
    SocialModule,
    LevelsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
