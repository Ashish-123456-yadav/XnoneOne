import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequestUser } from '../../common/types/request-user';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    return this.notificationsService.list(user.id, query);
  }

  @Patch(':notificationId/read')
  markRead(@CurrentUser() user: RequestUser, @Param('notificationId') notificationId: string) {
    return this.notificationsService.markRead(user.id, notificationId);
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.notificationsService.registerDevice(user.id, body);
  }
}
