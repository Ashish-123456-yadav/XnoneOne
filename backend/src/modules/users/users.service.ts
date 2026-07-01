import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { assertOptionalString } from '../../common/pipes/pagination';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  getProfileByUsername(username: string, viewerId?: string) {
    const user = this.database.findUserByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = this.database.getProfile(user.id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile,
      isFollowing: viewerId ? this.database.isFollowing(viewerId, user.id) : false,
    };
  }

  getMyProfile(userId: string) {
    const profile = this.database.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  updateMyProfile(userId: string, body: Record<string, unknown>) {
    const patch: Record<string, string | null> = {};

    if (body.displayName !== undefined) patch.displayName = assertOptionalString(body.displayName, 'displayName', 80);
    if (body.bio !== undefined) patch.bio = assertOptionalString(body.bio, 'bio', 240);
    if (body.avatarUrl !== undefined) patch.avatarUrl = assertOptionalString(body.avatarUrl, 'avatarUrl', 500) || null;
    if (body.coverUrl !== undefined) patch.coverUrl = assertOptionalString(body.coverUrl, 'coverUrl', 500) || null;
    if (body.location !== undefined) patch.location = assertOptionalString(body.location, 'location', 120) || null;
    if (body.websiteUrl !== undefined) patch.websiteUrl = assertOptionalString(body.websiteUrl, 'websiteUrl', 240) || null;
    if (body.creatorCategory !== undefined) {
      patch.creatorCategory = assertOptionalString(body.creatorCategory, 'creatorCategory', 80) || null;
    }

    const profile = this.database.updateProfile(userId, patch);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile,
      user: this.database.toPublicUser(userId),
    };
  }

  follow(currentUserId: string, username: string) {
    const target = this.database.findUserByUsername(username);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.id === currentUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    this.database.follow(currentUserId, target.id);
    return {
      following: true,
      user: this.database.toPublicUser(target.id),
    };
  }

  unfollow(currentUserId: string, username: string) {
    const target = this.database.findUserByUsername(username);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    this.database.unfollow(currentUserId, target.id);
    return {
      following: false,
      user: this.database.toPublicUser(target.id),
    };
  }
}
