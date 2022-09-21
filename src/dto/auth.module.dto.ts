import { errorDto, successErrorDto } from './common.dto';

export type registerBodyDto = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  location?: string;
  isAdmin?: boolean;
};

export interface returnRegisterUserDto extends errorDto {
  user?: registerBodyDto;
}

export interface loginBodyDto {
  email: string;
  password: string;
  isAdmin?: string;
}

export interface returnLoginUserDto extends errorDto {
  user?: loginBodyDto;
}

export interface userTokenDto {
  access_token?: string;
  refresh_token?: string;
}

export interface forgotPasswordInitDto {
  email: string;
}

export interface forgotPasswordDto {
  email: string;
  otp: string;
  password: string;
}

export interface loginUserDto extends successErrorDto, userTokenDto {}

export interface logoutParamsDto {
  email: string;
  reId: string;
}

export type refreshTokenParamsDto = {
  refresh_token: string;
};

export enum AccountEnum {
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

export enum Roles {
  ADMIN = 'ADMIN',
  NORMAL = 'NORMAL',
}
