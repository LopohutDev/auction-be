import { Injectable, Logger } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import {
  accessTokenConfig,
  AccessTokenSecret,
  refreshTokenConfig,
  RefreshTokenSecret,
} from 'src/config/jwt.config';
import {
  AccountEnum,
  loginBodyDto,
  loginUserDto,
  logoutParamsDto,
  refreshTokenParamsDto,
  registerBodyDto,
  Roles,
} from 'src/dto/auth.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { authTokenDto } from 'src/dto/tokens.dto';
import { decodeRefreshToken } from 'src/guards/strategies/jwt.strategy';
import { PrismaService } from 'src/Services/prisma.service';
import { Jwt } from 'src/tokens/Jwt';
import { decrypt, encrypt, encryptRefreshToken } from 'src/utils/crypt.utils';
import { uuid } from 'src/utils/uuid.utils';
import {
  refreshTokenValidate,
  validateLoginUser,
  validateregisterUser,
} from 'src/validations/auth.validation';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(AuthService.name);

  async getUserToken(user: authTokenDto) {
    const payload = {
      email: user.email,
      role: user?.role || 'NORMAL',
    };
    const id = uuid();
    const refresh_token = sign(
      { id, ...payload },
      process.env[RefreshTokenSecret],
      refreshTokenConfig,
    );
    let sendedToken = refresh_token as string;
    const { data } = decodeRefreshToken(refresh_token);
    if (data) {
      const { success } = Jwt.addRefreshToken(data);
      if (success) {
        const { token } = encryptRefreshToken(refresh_token as string);
        if (token) {
          sendedToken = token;
        }
      }
      return {
        access_token: sign(
          { reId: id, ...payload },
          process.env[AccessTokenSecret],
          accessTokenConfig,
        ),
        refresh_token: sendedToken,
      };
    }
  }

  async registerUser(userinfo: registerBodyDto): Promise<successErrorDto> {
    const { user, error } = validateregisterUser(userinfo);
    if (error) {
      return { error };
    }
    try {
      const isUserExists = await this.prismaService.user.findUnique({
        where: { email: user.email },
        rejectOnNotFound: false,
      });
      if (isUserExists) {
        return { error: { status: 422, message: 'User already exists' } };
      }
      if (!user.isAdmin) {
        const isLocationExists = await this.prismaService.location.findUnique({
          where: { locid: user.location },
          rejectOnNotFound: false,
        });
        if (!isLocationExists) {
          return { error: { status: 422, message: 'Invalid Location' } };
        }
      }
      await this.prismaService.user.create({
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          password: encrypt(user.password),
          role: user.isAdmin ? Roles.ADMIN : Roles.NORMAL,
          account: user.isAdmin ? AccountEnum.ACCEPTED : AccountEnum.REVIEWED,
          locid: !user.isAdmin ? user.location : null,
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      this.logger.warn(error);
      return {
        error: { status: 500, message: 'Server error' },
      };
    }
  }

  async getLogin(loginInfo: loginBodyDto): Promise<loginUserDto> {
    const { error, user } = validateLoginUser(loginInfo);
    if (error) {
      return { error };
    }
    try {
      const isUserExists = await this.prismaService.user.findUnique({
        where: { email: user.email },
        rejectOnNotFound: false,
      });
      if (!isUserExists) {
        return { error: { status: 422, message: 'User not found' } };
      } else if (user.password !== decrypt(isUserExists.password)) {
        return { error: { status: 422, message: 'email password not valid' } };
      } else if (isUserExists.account !== AccountEnum.ACCEPTED) {
        return {
          error: {
            status: 401,
            message: "You can's access . please ask your admin",
          },
        };
      }
      const { access_token, refresh_token } = await this.getUserToken(
        isUserExists,
      );
      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      this.logger.warn(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async getLogout(user: logoutParamsDto): Promise<successErrorDto> {
    const { email, reId } = user;
    if (!email || !email.trim().length) {
      return { error: { status: 422, message: 'email is required' } };
    }

    const { error } = Jwt.removeToken(reId);
    if (error) {
      return { error: { status: 403, message: 'Invalid Token' } };
    }

    return { success: true };
  }

  async getRefeshToken(token: refreshTokenParamsDto): Promise<loginUserDto> {
    const { token: refreshToken, error } = refreshTokenValidate(token);
    if (error) {
      return { error };
    }

    const payload = {
      reId: refreshToken.id,
      email: refreshToken.email,
      role: refreshToken.role,
    };
    return {
      access_token: sign(
        payload,
        process.env['SECRET'],
        accessTokenConfig,
      ) as string,
    };
  }
}
