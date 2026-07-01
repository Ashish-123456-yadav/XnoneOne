import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequestUser } from '../../common/types/request-user';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: RequestUser) {
    return this.usersService.getMyProfile(user.id);
  }

  @UseGuards(AuthGuard)
  @Patch('me/profile')
  updateMyProfile(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.usersService.updateMyProfile(user.id, body);
  }

  @Get(':username')
  getByUsername(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }

  @UseGuards(AuthGuard)
  @Post(':username/follow')
  follow(@CurrentUser() user: RequestUser, @Param('username') username: string) {
    return this.usersService.follow(user.id, username);
  }

  @UseGuards(AuthGuard)
  @Post(':username/unfollow')
  unfollow(@CurrentUser() user: RequestUser, @Param('username') username: string) {
    return this.usersService.unfollow(user.id, username);
  }
}
