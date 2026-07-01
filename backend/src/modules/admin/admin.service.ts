import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { assertOptionalString } from '../../common/pipes/pagination';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  dashboard() {
    return this.database.adminDashboard();
  }

  reports(query: Record<string, string>) {
    const status = query.status as 'open' | 'reviewing' | 'resolved' | 'rejected' | undefined;
    if (status && !['open', 'reviewing', 'resolved', 'rejected'].includes(status)) {
      throw new BadRequestException('Invalid report status');
    }

    return this.database.listReports(status).map((report) => ({
      ...report,
      reporter: this.database.toPublicUser(report.reporterId),
      post: report.postId ? this.database.findPostById(report.postId) : null,
    }));
  }

  updateReport(adminId: string, reportId: string, body: Record<string, unknown>) {
    const status = body.status as 'open' | 'reviewing' | 'resolved' | 'rejected';
    if (!['open', 'reviewing', 'resolved', 'rejected'].includes(status)) {
      throw new BadRequestException('Invalid report status');
    }

    const report = this.database.updateReport(reportId, adminId, status, assertOptionalString(body.resolutionNote, 'resolutionNote', 500));
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  setUserBan(userId: string, body: Record<string, unknown>) {
    const banned = body.banned === true;
    const user = this.database.setUserBanned(userId, banned);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: this.database.toPublicUser(user.id),
      banned: user.isBanned,
    };
  }
}
