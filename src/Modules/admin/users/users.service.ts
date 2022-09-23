import { Injectable } from '@nestjs/common';
import { AccountEnum } from '@prisma/client';
import { PrismaService } from 'src/Services/prisma.service';
import { successErrorReturnDto } from 'src/dto/common.dto';
import { usersQueryDataDto } from 'src/dto/admin.location.module.dto';
import { validateUsersBody } from 'src/validations/admin.location.validations';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async acceptAdminUser(
    userinfo: usersQueryDataDto,
  ): Promise<successErrorReturnDto> {
    const { data, error } = validateUsersBody(userinfo);
    if (error) {
      return { error };
    }
    try {
      switch (data.type) {
        case AccountEnum.ACCEPTED:
          await this.prismaService.user.update({
            where: { id: data.id },
            data: {
              account: AccountEnum.ACCEPTED,
            },
          });
          return {
            success: true,
            message: 'Successfully Verified Account.',
          };
        case AccountEnum.REJECTED:
          await this.prismaService.user.update({
            where: { id: data.id },
            data: {
              account: AccountEnum.REJECTED,
              rejectedreason: 'wrong user',
            },
          });
          return {
            success: true,
            message: 'Successfully rejected Account.',
          };
        case AccountEnum.DELETED:
          await this.prismaService.user.update({
            where: { id: data.id },
            data: {
              account: AccountEnum.DELETED,
            },
          });
          return {
            success: true,
            message: 'Successfully Deleted Account.',
          };
        default:
          return {
            success: true,
            message: 'Invalid Type',
          };
      }
    } catch (error) {
      return { error: { status: 422, message: 'User id is not valid' } };
    }
  }
  async listAdminUser() {
    try {
      const data = await this.prismaService.user.findMany({
        where: {
          account: {
            not: 'DELETED',
          },
        },
        select: {
          createdAt: true,
          firstname: true,
          lastname: true,
          email: true,
          account: true,
          location: true,
        },
      });
      return { data };
    } catch (error) {
      return { error: { status: 422, message: 'users not found' } };
    }
  }
}
