import { Controller, Get, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GameService } from './game.service';

@Controller('save')
@UseGuards(AuthGuard('jwt'))
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  getSave(@Req() req: any) {
    return this.gameService.getSave(req.user.userId);
  }

  @Post()
  saveProgress(@Req() req: any, @Body() body: any) {
    const { clientVersion, ...data } = body
    return this.gameService.saveProgress(req.user.userId, data, clientVersion);
  }

  @Post('resolve-conflict')
  resolveConflict(@Req() req: any, @Body() body: { choice: 'local'|'cloud', cloudData: any, localData: any }) {
    return this.gameService.resolveConflict(req.user.userId, body.choice, body.cloudData, body.localData)
  }

  @Get('history')
  getHistory(@Req() req: any) {
    return this.gameService.getHistory(req.user.userId)
  }

  @Post('restore/:version')
  restoreVersion(@Req() req: any, @Param('version') version: string) {
    return this.gameService.restoreVersion(req.user.userId, +version)
  }
}
