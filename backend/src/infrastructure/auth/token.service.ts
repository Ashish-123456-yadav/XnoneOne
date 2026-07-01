import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import { env } from '../../config/env';

export interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  role: 'user' | 'creator' | 'moderator' | 'admin';
  type: 'access' | 'refresh';
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class TokenService {
  createAccessToken(input: Omit<TokenPayload, 'type' | 'jti' | 'iat' | 'exp'>): { token: string; expiresIn: number } {
    return {
      token: this.sign(input, 'access', env.auth.accessSecret, env.auth.accessTtlSeconds),
      expiresIn: env.auth.accessTtlSeconds,
    };
  }

  createRefreshToken(input: Omit<TokenPayload, 'type' | 'jti' | 'iat' | 'exp'>): { token: string; expiresIn: number } {
    return {
      token: this.sign(input, 'refresh', env.auth.refreshSecret, env.auth.refreshTtlSeconds),
      expiresIn: env.auth.refreshTtlSeconds,
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    const payload = this.verify(token, env.auth.accessSecret);
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    return payload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    const payload = this.verify(token, env.auth.refreshSecret);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload;
  }

  private sign(
    input: Omit<TokenPayload, 'type' | 'jti' | 'iat' | 'exp'>,
    type: 'access' | 'refresh',
    secret: string,
    ttlSeconds: number,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      ...input,
      type,
      jti: randomUUID(),
      iat: now,
      exp: now + ttlSeconds,
    };

    const header = this.encode({ alg: 'HS256', typ: 'JWT' });
    const body = this.encode(payload);
    const signature = this.signature(`${header}.${body}`, secret);

    return `${header}.${body}.${signature}`;
  }

  private verify(token: string, secret: string): TokenPayload {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) {
      throw new UnauthorizedException('Malformed token');
    }

    const expectedSignature = this.signature(`${header}.${body}`, secret);
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token has expired');
    }

    return payload;
  }

  private encode(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private signature(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}
