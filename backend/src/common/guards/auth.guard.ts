import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../infrastructure/auth/token.service';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { HttpRequestWithUser } from '../types/request-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly database: DatabaseService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<HttpRequestWithUser>();
    const header = request.headers.authorization;
    const rawHeader = Array.isArray(header) ? header[0] : header;

    if (!rawHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = this.tokenService.verifyAccessToken(rawHeader.slice('Bearer '.length));
    const user = this.database.findUserById(payload.sub);

    if (!user || user.isBanned) {
      throw new UnauthorizedException('User session is no longer valid');
    }

    request.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return true;
  }
}
