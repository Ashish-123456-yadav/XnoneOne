import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  hash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    return PasswordService.hashWithSalt(password, salt);
  }

  verify(password: string, encodedHash: string): boolean {
    const [salt, hash] = encodedHash.split(':');
    if (!salt || !hash) {
      return false;
    }

    const candidate = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');

    return stored.length === candidate.length && timingSafeEqual(stored, candidate);
  }

  static hashWithSalt(password: string, salt: string): string {
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }
}
