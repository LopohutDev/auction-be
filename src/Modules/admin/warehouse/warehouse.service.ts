import { Injectable, Logger } from '@nestjs/common';
import { warehouseBodyDto } from 'src/dto/admin.warehouse.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { validationWarehouseBody } from 'src/validations/admin.warehouse.validations';

@Injectable()
export class WarehouseService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(WarehouseService.name);
  async createWarehouse(
    warehouseInfo: warehouseBodyDto,
  ): Promise<successErrorDto> {
    const { data, error } = validationWarehouseBody(warehouseInfo);
    if (error) return { error };

    try {
      const isLocationExists = await this.prismaService.location.findUnique({
        where: { locid: data.location },
        rejectOnNotFound: false,
      });
      this.logger.log('isLocationExists', isLocationExists);
      if (isLocationExists) {
        await this.prismaService.warehouses.create({
          data: {
            areaname: data.areaname,
            assletter: data.assletter,
            locid: data.location,
          },
        });
      } else if (!isLocationExists) {
        return { error: { status: 422, message: 'Invalid Location' } };
      }
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
