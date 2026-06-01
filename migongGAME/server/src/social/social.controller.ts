import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';

@Controller()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('leaderboard')
  @UseGuards(AuthGuard('jwt'))
  getLeaderboard(@Query('page') page = 1, @Query('limit') limit = 20, @Query('sort') sort = 'stars') {
    return this.socialService.getLeaderboard(sort, +page, +limit);
  }

  @Get('friends')
  @UseGuards(AuthGuard('jwt'))
  getFriends(@Req() req: any) {
    return this.socialService.getFriends(req.user.userId);
  }

  @Get('friends/search')
  @UseGuards(AuthGuard('jwt'))
  searchUsers(@Query('keyword') keyword: string) {
    return this.socialService.searchUsers(keyword || '');
  }

  @Post('friends/request')
  @UseGuards(AuthGuard('jwt'))
  sendFriendRequest(@Req() req: any, @Body('friendId') friendId: string) {
    return this.socialService.sendFriendRequest(req.user.userId, friendId);
  }

  @Get('friends/requests')
  @UseGuards(AuthGuard('jwt'))
  getFriendRequests(@Req() req: any) {
    return this.socialService.getFriendRequests(req.user.userId);
  }

  @Put('friends/request/:id')
  @UseGuards(AuthGuard('jwt'))
  handleFriendRequest(@Req() req: any, @Param('id') id: string, @Body('action') action: 'accept' | 'reject') {
    return this.socialService.handleFriendRequest(id, req.user.userId, action);
  }

  @Delete('friends/:id')
  @UseGuards(AuthGuard('jwt'))
  deleteFriend(@Req() req: any, @Param('id') friendId: string) {
    return this.socialService.deleteFriend(req.user.userId, friendId);
  }

  @Get('achievements')
  getAchievements() {
    return this.socialService.getAchievements();
  }

  @Get('achievements/user')
  @UseGuards(AuthGuard('jwt'))
  getUserAchievements(@Req() req: any) {
    return this.socialService.getUserAchievements(req.user.userId);
  }
}
