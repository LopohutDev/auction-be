import { Injectable, Logger } from '@nestjs/common';
import { registerBodyDto } from 'src/dto/auth.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { encrypt } from 'src/utils/crypt.utils';
import { validateregisterUser } from 'src/validations/auth.validation';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(AuthService.name);

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
}
