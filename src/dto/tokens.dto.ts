export type tokenDto = {
  email: string;
  role: string;
  iat: number;
  exp: number;
};

export interface AccessTokenDto extends tokenDto {
  reId: string;
}

export interface RefreshTokenDto extends tokenDto {
  id: string;
}

export type refreshTokenObjDto = {
  [key: string]: tokenDto;
};

export type authTokenDto = {
  email: string;
  role?: string;
};
