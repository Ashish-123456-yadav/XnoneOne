import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user';
import { AdminService } from './admin.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'moderator')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('reports')
  reports(@Query() query: Record<string, string>) {
    return this.adminService.reports(query);
  }

  @Patch('reports/:reportId')
  updateReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateReport(user.id, reportId, body);
  }

  @Roles('admin')
  @Patch('users/:userId/ban')
  setUserBan(@Param('userId') userId: string, @Body() body: Record<string, unknown>) {
    return this.adminService.setUserBan(userId, body);
  }
}
