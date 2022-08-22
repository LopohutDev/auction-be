import { EmailRegex, PasswordRegex } from 'src/constants/regex.constants';
import {
  registerBodyDto,
  returnRegisterUserDto,
} from 'src/dto/auth.module.dto';

export const validateregisterUser = (
  userinfo: registerBodyDto,
): returnRegisterUserDto => {
  const { firstname, lastname, email, password, location } = userinfo;
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
  } else if (!location || !location.trim().length) {
    return { error: { status: 422, message: 'Location is required' } };
  }
  return { user: userinfo };
};