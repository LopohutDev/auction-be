import { Injectable, Logger } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import {
  accessTokenConfig,
  AccessTokenSecret,
  refreshTokenConfig,
  RefreshTokenSecret,
} from 'src/config/jwt.config';
import {
  loginBodyDto,
  loginUserDto,
  registerBodyDto,
} from 'src/dto/auth.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { authTokenDto } from 'src/dto/tokens.dto';
import { decodeRefreshToken } from 'src/guards/strategies/jwt.strategy';
import { PrismaService } from 'src/Services/prisma.service';
import { Jwt } from 'src/tokens/Jwt';
import { decrypt, encrypt, encryptRefreshToken } from 'src/utils/crypt.utils';
import { uuid } from 'src/utils/uuid.utils';
import {
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
      const isLocationExists = await this.prismaService.location.findUnique({
        where: { locid: user.location },
        rejectOnNotFound: false,
      });
      if (isUserExists) {
        return { error: { status: 422, message: 'User already exists' } };
      } else if (!isLocationExists) {
        return { error: { status: 422, message: 'Invalid Location' } };
      }
      await this.prismaService.user.create({
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          password: encrypt(user.password),
          locid: user.location,
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
}
