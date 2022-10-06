import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/Services/prisma.service';
import { paginationDto, successErrorReturnDto } from 'src/dto/common.dto';
import { usersQueryDataDto } from 'src/dto/admin.location.module.dto';
import { validateUsersBody } from 'src/validations/admin.location.validations';
import { AccountEnum } from '@prisma/client';
import { Roles } from 'src/dto/auth.module.dto';
import { paginationHelper } from '../utils';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(PrismaService.name);

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
          break;
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
          break;
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
  async listAdminUser(pagination: paginationDto) {
    const { page, limit } = pagination;
    try {
      const userData = await this.prismaService.user.findMany({
        where: {
          account: {
            not: AccountEnum.DELETED,
          },
          role: {
            not: Roles.ADMIN,
          },
        },
        select: {
          id: true,
          createdAt: true,
          firstname: true,
          lastname: true,
          email: true,
          account: true,
          location: true,
        },
      });
      const { data, pageCount } = paginationHelper(userData, page, limit);

      return { data, pageCount };
    } catch (error) {
      return { error: { status: 422, message: 'users not found' } };
    }
  }
}
