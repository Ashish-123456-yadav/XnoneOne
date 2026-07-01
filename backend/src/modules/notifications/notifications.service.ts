import { Injectable, NotFoundException } from '@nestjs/common';
import { normalizePagination } from '../../common/pipes/pagination';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { RealtimeHubService } from '../../infrastructure/realtime/realtime-hub.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly realtime: RealtimeHubService,
  ) {}

  list(userId: string, query: Record<string, string>) {
    const pagination = normalizePagination(query, 20, 100);
    const page = this.database.listNotifications(userId, pagination.cursor, pagination.limit);

    return {
      items: page.items.map((notification) => this.database.toNotificationResponse(notification)),
      pageInfo: {
        limit: pagination.limit,
        nextCursor: page.nextCursor,
        hasNextPage: Boolean(page.nextCursor),
      },
    };
  }

  markRead(userId: string, notificationId: string) {
    const notification = this.database.markNotificationRead(userId, notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.database.toNotificationResponse(notification);
  }

  registerDevice(userId: string, body: Record<string, unknown>) {
    const token = typeof body.fcmToken === 'string' ? body.fcmToken.trim() : '';
    const platform = typeof body.platform === 'string' ? body.platform.trim() : 'unknown';

    this.realtime.publish(`devices:${userId}`, { platform, tokenRegistered: token.length > 0 });

    return {
      success: true,
      provider: 'firebase-cloud-messaging',
      platform,
      registered: token.length > 0,
    };
  }
}
