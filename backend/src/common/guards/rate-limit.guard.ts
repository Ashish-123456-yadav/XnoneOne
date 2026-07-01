import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { env } from '../../config/env';
import { HttpRequestWithUser } from '../types/request-user';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<HttpRequestWithUser>();
    const key = this.keyFor(request);
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + env.rateLimit.windowMs });
      return true;
    }

    bucket.count += 1;

    if (bucket.count > env.rateLimit.maxRequests) {
      throw new HttpException('Too many requests. Please retry shortly.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private keyFor(request: HttpRequestWithUser): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0];
    const ip = forwardedIp ?? request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    return `${request.user?.id ?? ip}:${request.method ?? 'GET'}:${request.originalUrl ?? request.url ?? '/'}`;
  }
}
