import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/Services/prisma.service';

@Injectable()
export class UserLocationService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(UserLocationService.name);

  async getAllLocationService() {
    try {
      const data = await this.prismaService.location.findMany({
        select: {
          locid: true,
          city: true,
          address: true,
          createdAt: true,
          _count: {
            select: {
              Warehouses: true,
            },
          },
        },
      });
      return { success: true, data };
    } catch (error) {
      this.logger.debug(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
  async getLocationItemsService(param: string) {
    try {
      const data = await this.prismaService.location.findFirst({
        where: { locid: param },
        select: {
          id: true,
          Warehouses: {
            select: {
              id: true,
              areaname: true,
            },
          },
          locationItem: {
            select: {
              id: true,
              itemname: true,
              itemtag: true,
            },
          },
        },
      });

      // const data = setObjectLowercaseKeys(locationItemData);
      return { success: true, data };
    } catch (error) {
      this.logger.debug(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
