import { EmailRegex, PasswordRegex } from 'src/constants/regex.constants';
import { Jwt } from 'src/tokens/Jwt';
import {
  loginBodyDto,
  registerBodyDto,
  returnLoginUserDto,
  returnRegisterUserDto,
  refreshTokenParamsDto,
} from 'src/dto/auth.module.dto';
import { decryptRefreshToken } from 'src/utils/crypt.utils';
import { decodeRefreshToken } from 'src/guards/strategies/jwt.strategy';

export const validateregisterUser = (
  userinfo: registerBodyDto,
): returnRegisterUserDto => {
  const { firstname, lastname, email, password, isAdmin, location } = userinfo;
  if (!firstname || !firstname.trim().length) {
    return { error: { status: 422, message: 'First name is required' } };
  } else if (!lastname || !lastname.trim().length) {
    return { error: { status: 422, message: 'Last name is required' } };
  } else if (!email || !email.trim().length) {
    return { error: { status: 422, message: 'Email is required' } };
  } else if (!EmailRegex.test(email)) {
    return { error: { status: 422, message: 'Email is not valid' } };
  } else if (!password || !password.trim().length) {
    return { error: { status: 422, message: 'Password is required' } };
  } else if (!PasswordRegex.test(password)) {
    return { error: { status: 422, message: 'Password is not valid' } };
  } else if (!isAdmin && (!location || !location.trim().length)) {
    return { error: { status: 422, message: 'Location is required' } };
  }
  return { user: userinfo };
};

export const validateLoginUser = (
  userinfo: loginBodyDto,
): returnLoginUserDto => {
  const { email, password } = userinfo;
  if (!email || !email.trim().length) {
    return { error: { status: 422, message: 'Email is required' } };
  } else if (!EmailRegex.test(email)) {
    return { error: { status: 422, message: 'Email is not valid' } };
  } else if (!password || !password.trim().length) {
    return { error: { status: 422, message: 'Password is required' } };
  }
  return { user: userinfo };
};

export const refreshTokenValidate = (token: refreshTokenParamsDto) => {
  const { refresh_token } = token;
  if (!refresh_token || !refresh_token.trim().length) {
    return { error: { status: 422, message: 'Refresh token is required' } };
  }

  const { token: refreshToken, error } = decryptRefreshToken(refresh_token);
  if (error) {
    return { error: { status: 403, message: error } };
  } else if (refreshToken.split('.').length < 3) {
    return { error: { status: 403, message: 'Invalid token' } };
  }

  const { data, error: decodedErr } = decodeRefreshToken(refreshToken);
  if (decodedErr) {
    return { error: { status: 403, message: 'Invalid Token' } };
  }

  const { error: jwtErr } = Jwt.checkValidRefreshToken(data);
  if (jwtErr) {
    return { error: { status: 403, message: jwtErr } };
  }

  return { token: data };
};
