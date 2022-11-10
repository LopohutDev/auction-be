import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/Services/prisma.service';
import { successErrorReturnDto } from 'src/dto/common.dto';
import { usersDataDto } from 'src/dto/user.scan.module.dto';
import { validateUsersBody } from 'src/validations/user.scans.validations';
import { AccountEnum } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(PrismaService.name);

  async deleteUser(userinfo: usersDataDto): Promise<successErrorReturnDto> {
    const { data, error } = validateUsersBody(userinfo);
    if (error) {
      return { error };
    }
    try {
      if (data.type === AccountEnum.DELETED) {
        await this.prismaService.user.update({
          where: { email: data.email },
          data: {
            account: AccountEnum.DELETED,
          },
        });
        return {
          success: true,
          message: 'Account deleted successfully.',
        };
      } else {
        return {
          error: { status: 422, message: 'Please pass valid type' },
        };
      }
    } catch (error) {
      return { error: { status: 422, message: 'User email is not valid' } };
    }
  }
}
