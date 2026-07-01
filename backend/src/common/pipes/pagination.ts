import { BadRequestException } from '@nestjs/common';

export interface PaginationQuery {
  cursor?: string;
  limit?: string | number;
}

export interface NormalizedPagination {
  cursor: string | null;
  limit: number;
}

export const normalizePagination = (query: PaginationQuery, defaultLimit = 20, maxLimit = 50): NormalizedPagination => {
  const rawLimit = Number(query.limit ?? defaultLimit);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), maxLimit) : defaultLimit;

  return {
    cursor: typeof query.cursor === 'string' && query.cursor.length > 0 ? query.cursor : null,
    limit,
  };
};

export const assertRequiredString = (value: unknown, field: string, min = 1, max = 500): string => {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new BadRequestException(`${field} must be between ${min} and ${max} characters`);
  }

  return trimmed;
};

export const assertOptionalString = (value: unknown, field: string, max = 500): string => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new BadRequestException(`${field} must be at most ${max} characters`);
  }

  return trimmed;
};
