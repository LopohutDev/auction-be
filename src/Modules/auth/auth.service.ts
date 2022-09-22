import {
  ForbiddenException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
// import * as argon from 'argon2';
import {
  accessTokenConfig,
  AccessTokenSecret,
  refreshTokenConfig,
  RefreshTokenSecret,
} from 'src/config/jwt.config';
import {
  AccountEnum,
  forgotPasswordDto,
  forgotPasswordInitDto,
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
import { User } from '@prisma/client';
import * as nodemailer from 'nodemailer';

// interface IUserOTP {
//   otp: string;
//   timeStamp: string;
//   userId: string;
// }

// let userOtp: IUserOTP[] = [];

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) { }

  private readonly logger = new Logger(AuthService.name);

  async getUserToken(user: authTokenDto) {
    const payload = {
      email: user.email,
      role: user?.role || Roles.NORMAL,
      name: user?.firstname || '' + user?.lastname || '',
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
      } else if (user.isAdmin && isUserExists.role !== Roles.ADMIN) {
        return { error: { status: 422, message: 'You are not admin' } };
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
      name: refreshToken.name,
    };
    return {
      access_token: sign(
        payload,
        process.env[AccessTokenSecret],
        accessTokenConfig,
      ) as string,
    };
  }

  checkExpiration(emailOtpExpiration: Date) {
    const oldOtpExpiration = new Date(emailOtpExpiration).getTime();
    const currentDateTime = new Date().getTime();
    const diff = oldOtpExpiration - currentDateTime;

    if (diff > 0) {
      throw new UnprocessableEntityException(
        `You can request again later ${diff / 60000} minute(s)`,
      );
    }
  }

  generateCode() {
    const min = 100000;
    const max = 900000;
    const random = Math.random() * min;

    const minutesToAdd = 2;
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + minutesToAdd);

    return {
      code: (Math.floor(random) + max).toString(),
      expiration: futureDate,
    };
  }

  async forgotPassword(dto: forgotPasswordInitDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    const payload = {
      email: dto.email,
    };
    const tokan = sign(
      payload,
      process.env[AccessTokenSecret],
      accessTokenConfig,
    );
    const message =
      'Click on this link for reset password : <a href="http://0.0.0.0:5000/' +
      user.id +
      '/token=' +
      tokan +
      '">click</a>';
    if (!user) throw new ForbiddenException('Credentials incorrect');
    this.logger.log('user>>', tokan);
    const yourEmail = 'dc0b617e7f77ea';
    const yourPass = '32c237a5760a4f';
    const mailHost = 'smtp.mailtrap.io';
    const mailPort = 2525;
    const senderEmail = 'richa.d@aveosoft.com';
    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: false,
      auth: {
        user: yourEmail,
        pass: yourPass,
      },
    });

    const mailOptions = {
      from: senderEmail,
      to: dto.email,
      subject: senderEmail,
      html: message,
    };
    // this.logger.log(mailOptions);
    await transporter.sendMail(mailOptions);
    return {
      message: 'Forgot password OTP has been sent to your email.',
    };
  }

  async resetPassword(dto: forgotPasswordDto) {
    try {
      const data = verify(
        dto.token,
        process.env[AccessTokenSecret],
        accessTokenConfig,
      );
      let user = await this.prismaService.user.findUnique({
        where: { email: data.email },
      });
      if (!user) throw new ForbiddenException('Credentials incorrect');
      user = await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: encrypt(dto.password),
        },
      });
      // const tokens = await this.getUserToken(user);
      if (user) {
        return {
          success: true,
          message: 'Password has successfully changed.',
        };
      } else {
        return {
          success: false,
          message: 'Password has not changed.',
        };
      }
    } catch (error) {
      return {
        error: {
          status: 422,
          message: ' The token has expired. Please try again.',
        },
      };
    }
  }
}
