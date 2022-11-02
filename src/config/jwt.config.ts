import { SignOptions } from 'jsonwebtoken';

export const accessTokenConfig: SignOptions = {
  expiresIn: '1h',
  algorithm: 'HS256',
};

export const refreshTokenConfig: SignOptions = {
  expiresIn: '8h',
  algorithm: 'HS256',
};

export const AccessTokenSecret = 'SECRET';
export const RefreshTokenSecret = 'REFRESH_SECRET';
