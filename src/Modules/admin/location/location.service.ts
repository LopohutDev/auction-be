import { Injectable, Logger } from '@nestjs/common';
import { AccountEnum, Roles } from '@prisma/client';
import {
  locationBodyDto,
  locationQueryDataDto,
} from 'src/dto/admin.location.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { PrismaService } from 'src/Services/prisma.service';
import {
  toFindDuplicates,
  validateLocationBody,
} from 'src/validations/admin.location.validations';
import { InitialAuctionCreation } from '../auction /initialAuction';

@Injectable()
export class LocationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly initialAuctionCreation: InitialAuctionCreation,
  ) {}
  private readonly logger = new Logger(LocationService.name);

  async createLocation(locinfo: locationBodyDto): Promise<successErrorDto> {
    const { data, error } = validateLocationBody(locinfo);
    if (error) {
      return { error };
    }
    try {
      const { isDuplicateTag, isDuplicateName } = toFindDuplicates(
        data.itemtype,
      );

      if (isDuplicateTag) {
        return { error: { status: 422, message: 'Item Tag must be unique.' } };
      }
      if (isDuplicateName) {
        return { error: { status: 422, message: 'itemName must be unique' } };
      }

      await this.prismaService.location.create({
        data: {
          city: data.city,
          address: data.address,
          Warehouses: { create: data.warehouses },
          locationItem: { createMany: { data: data.itemtype } },
        },
      });

      await this.initialAuctionCreation.createInitial();
      return {
        success: true,
      };
    } catch (error) {
      this.logger.warn(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async getLocationDetails(locquery: locationQueryDataDto) {
    const { location } = locquery;
    if (!location) {
      return { error: { status: 422, message: 'Location is required' } };
    }
    try {
      const data = await this.prismaService.location.findUniqueOrThrow({
        where: { locid: location },
        select: {
          city: true,
          address: true,
          Warehouses: { select: { areaname: true } },
          locationItem: {
            select: {
              itemname: true,
              itemtag: true,
            },
          },
          assigneduser: {
            where: {
              account: {
                not: AccountEnum.DELETED,
              },
            },
            select: {
              id: true,
              firstname: true,
              lastname: true,
              createdAt: true,
            },
          },
        },
      });

      // const data = setObjectLowercaseKeys(locationData);
      return { data };
    } catch (error) {
      return { error: { status: 422, message: 'Location not found' } };
    }
  }

  async updateLocationDetails(
    locinfo: locationBodyDto,
    param: string,
  ): Promise<successErrorDto> {
    if (!param) {
      return { error: { status: 422, message: 'Location param is required' } };
    }
    const { data, error } = validateLocationBody(locinfo);
    if (error) {
      return { error };
    }
    try {
      await this.prismaService.location.update({
        where: { locid: param },
        data: {
          city: data.city,
          address: data.address,
          Warehouses: {
            deleteMany: {},
            create: data.warehouses,
          },
          locationItem: {
            deleteMany: {},
            create: data.itemtype,
          },
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      return { error: { status: 422, message: 'Location is not valid' } };
    }
  }

  async deleteLocation(param: string) {
    if (!param) {
      return { error: { status: 422, message: 'Location param is required' } };
    }
    try {
      const scan = await this.prismaService.scans.findFirst({
        where: { locid: param },
      });
      const failedscan = await this.prismaService.failedScans.findFirst({
        where: { locid: param },
      });
      const user = await this.prismaService.user.findFirst({
        where: { locid: param },
      });
      if (!scan && !failedscan && !user) {
        await this.prismaService.location.delete({
          where: { locid: param },
        });

        return {
          success: true,
        };
      } else {
        return {
          error: {
            status: 422,
            message: 'You cannot delete the location that has data',
          },
        };
      }
    } catch (error) {
      this.logger.log(error);
      return { error: { status: 422, message: 'Internal server error' } };
    }
  }

  async getAllAdminLocation() {
    try {
      const data = await this.prismaService.location.findMany({
        select: {
          createdAt: true,
          city: true,
          address: true,
          _count: { select: { Warehouses: true } },
        },
      });
      const resultadata = data.map((l) => ({
        createdAt: l.createdAt,
        name: l.city,
        address: l.address,
        areas: l._count.Warehouses,
      }));
      return { data: resultadata };
    } catch (error) {
      this.logger.error(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
