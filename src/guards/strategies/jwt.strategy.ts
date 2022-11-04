import { JwtPayload, verify } from 'jsonwebtoken';
import { AccessTokenSecret, RefreshTokenSecret } from 'src/config/jwt.config';
import { AccessTokenDto, RefreshTokenDto } from 'src/dto/tokens.dto';
import { Jwt } from 'src/tokens/Jwt';

interface jwtPayload {
  username: string;
  name: string;
  iat: string;
  exp: string;
}

export const validateToken = (token: string | undefined) => {
  if (!token) {
    return { error: { status: 401, message: 'Not Authorized!' } };
  }
  const tokensplit = token.split(' ');
  if (!tokensplit.length) {
    return { error: { status: 401, message: 'Not Authorized!' } };
  } else if (tokensplit[0] !== 'Bearer') {
    return { error: { status: 401, message: 'Not Authorized!' } };
  } else if (!tokensplit[1]) {
    return { error: { status: 401, message: 'Not Authorized!' } };
  }
  const validtkensplit = tokensplit[1].split('.');
  if (validtkensplit.length !== 3) {
    return { error: { status: 403, message: 'Not a Authorised User' } };
  }
  if (tokensplit[1]) {
    try {
      const data = (<jwtPayload | JwtPayload>(
        verify(tokensplit[1], process.env[AccessTokenSecret])
      )) as AccessTokenDto;
      const { error } = Jwt.checkValidAccessToken(data);
      if (error) {
        return { error: { status: 403, message: 'Not a Authorised User' } };
      }
      return { data };
    } catch (error) {
      return { error: { status: 403, message: 'Not a Authorised User' } };
    }
  }
  return { error: { status: 403, message: 'Not a Authorised User' } };
};

export const decodeRefreshToken = (token: string) => {
  if (!token) {
    return { error: 'Invalid Token' };
  }
  try {
    const data = verify(
      token,
      process.env[RefreshTokenSecret],
    ) as RefreshTokenDto;
    return { data };
  } catch (err) {
    return { error: 'Not valid Token' };
  }
};

export const decodeAccessToken = (token: string) => {
  if (!token) {
    return { error: 'Invalid Token' };
  }
  try {
    const data = verify(
      token,
      process.env[AccessTokenSecret],
    ) as AccessTokenDto;
    return { data };
  } catch (err) {
    return { error: 'Not valid Token' };
  }
};
