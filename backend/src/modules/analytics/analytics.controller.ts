import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequestUser } from '../../common/types/request-user';
import { AnalyticsService } from './analytics.service';

@UseGuards(AuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('creator')
  creatorOverview(@CurrentUser() user: RequestUser) {
    return this.analyticsService.creatorOverview(user.id);
  }
}
