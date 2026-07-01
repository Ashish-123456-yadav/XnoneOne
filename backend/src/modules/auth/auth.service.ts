import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { env } from '../../config/env';
import { PasswordService } from '../../infrastructure/auth/password.service';
import { TokenService } from '../../infrastructure/auth/token.service';
import { DatabaseService, PublicUser, UserRecord } from '../../infrastructure/database/database.service';
import { assertRequiredString } from '../../common/pipes/pagination';

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  register(body: RegisterDto) {
    const email = this.normalizeEmail(body.email);
    const username = this.normalizeUsername(body.username);
    const displayName = assertRequiredString(body.displayName, 'displayName', 2, 80);
    const password = assertRequiredString(body.password, 'password', 10, 128);

    if (this.database.findUserByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }

    if (this.database.findUserByUsername(username)) {
      throw new ConflictException('Username is already taken');
    }

    const user = this.database.createUser({
      email,
      username,
      displayName,
      passwordHash: this.passwordService.hash(password),
      role: 'creator',
    });

    return this.createSession(user);
  }

  login(body: LoginDto) {
    const email = this.normalizeEmail(body.email);
    const password = assertRequiredString(body.password, 'password', 1, 128);
    const user = this.database.findUserByEmail(email);

    if (!user?.passwordHash || !this.passwordService.verify(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('This account is currently suspended');
    }

    this.database.touchLogin(user.id);
    return this.createSession(user);
  }

  refresh(body: RefreshDto) {
    const refreshToken = assertRequiredString(body.refreshToken, 'refreshToken', 20, 2000);
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const stored = this.database.findActiveRefreshToken(refreshToken);

    if (!stored || stored.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = this.database.findUserById(payload.sub);
    if (!user || user.isBanned) {
      throw new UnauthorizedException('User session is no longer valid');
    }

    this.database.revokeRefreshToken(refreshToken);
    return this.createSession(user);
  }

  logout(body: RefreshDto) {
    const refreshToken = assertRequiredString(body.refreshToken, 'refreshToken', 20, 2000);
    this.database.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  me(userId: string): PublicUser {
    return this.database.toPublicUser(userId);
  }

  firebaseExchange(body: { firebaseIdToken: string; email?: string; username?: string; displayName?: string }) {
    const firebaseIdToken = assertRequiredString(body.firebaseIdToken, 'firebaseIdToken', 12, 4000);
    const firebaseUid = `firebase:${firebaseIdToken.slice(0, 18)}`;
    const email = body.email ? this.normalizeEmail(body.email) : `${firebaseUid.replace(/[^a-z0-9]/gi, '')}@firebase.local`;
    const existing = this.database.findUserByEmail(email);

    if (existing) {
      return this.createSession(existing);
    }

    const username = this.normalizeUsername(body.username ?? `creator_${Date.now().toString(36)}`);
    const user = this.database.createUser({
      email,
      username,
      displayName: body.displayName ? assertRequiredString(body.displayName, 'displayName', 2, 80) : username,
      firebaseUid,
      passwordHash: null,
      role: 'creator',
    });

    return this.createSession(user);
  }

  private createSession(user: UserRecord) {
    const basePayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const access = this.tokenService.createAccessToken(basePayload);
    const refresh = this.tokenService.createRefreshToken(basePayload);
    const expiresAt = new Date(Date.now() + env.auth.refreshTtlSeconds * 1000).toISOString();

    this.database.createRefreshToken(user.id, refresh.token, expiresAt);

    return {
      user: this.database.toPublicUser(user.id),
      tokens: {
        accessToken: access.token,
        refreshToken: refresh.token,
        expiresIn: access.expiresIn,
      },
    };
  }

  private normalizeEmail(value: unknown): string {
    const email = assertRequiredString(value, 'email', 5, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('email must be a valid email address');
    }

    return email;
  }

  private normalizeUsername(value: unknown): string {
    const username = assertRequiredString(value, 'username', 3, 32).toLowerCase();
    if (!/^[a-z0-9_]+$/.test(username)) {
      throw new BadRequestException('username may only contain letters, numbers, and underscores');
    }

    return username;
  }
}
