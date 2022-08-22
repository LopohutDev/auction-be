import { AccessTokenDto, RefreshTokenDto } from '../dto/tokens.dto';

export const Jwt = {
  refreshTokens: {},

  checkValidAccessToken(token: AccessTokenDto) {
    const { reId } = token;
    if (!reId || !Jwt.refreshTokens[reId]) {
      return { error: 'Not a valid Token' };
    } else if (Jwt.refreshTokens[reId]?.exp < Date.now() / 1000) {
      delete Jwt.refreshTokens[reId];
      return { error: 'Token Expired' };
    }
    return { success: true };
  },

  checkValidRefreshToken(token: RefreshTokenDto) {
    const { id } = token;
    if (!id || !Jwt.refreshTokens[id]) {
      return { error: 'Not a valid Token' };
    } else if (Jwt.refreshTokens[id]?.exp < Date.now() / 1000) {
      delete Jwt.refreshTokens[id];
      return { error: 'Token Expired' };
    }
    return { success: true };
  },

  addRefreshToken(token: RefreshTokenDto) {
    const { id, exp } = token;
    if (!id || !exp) {
      return { error: 'Token not valid' };
    } else if (exp < Date.now() / 1000) {
      return { error: 'Its already expired' };
    }
    Jwt.refreshTokens[id] = token;
    return { success: true };
  },

  removeExpiredToken(tokenid: string) {
    if (!tokenid) {
      return { error: 'Not valid token' };
    } else if (
      Jwt.refreshTokens[tokenid] &&
      Jwt.refreshTokens[tokenid]?.exp < Date.now() / 1000
    ) {
      delete Jwt.refreshTokens[tokenid];
      return { success: true };
    }

    return { data: true };
  },

  removeToken(tokenid: string) {
    if (!tokenid) {
      return { error: 'Token not valid' };
    }
    delete Jwt.refreshTokens[tokenid];

    return { success: true };
  },
};
