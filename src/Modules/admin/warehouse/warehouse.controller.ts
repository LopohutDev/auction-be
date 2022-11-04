import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
} from '@nestjs/common';
import { warehouseBodyDto } from 'src/dto/admin.warehouse.module.dto';
import { AdminWarehouseRoute } from '../routes/admin.routes';
import { WarehouseService } from './warehouse.service';

@Controller(AdminWarehouseRoute)
export class WarehouseController {
  constructor(private readonly warehouseservice: WarehouseService) {}

  @Post()
  @HttpCode(200)
  async createLocationController(@Body() warehouseinfo: warehouseBodyDto) {
    const { error, success } = await this.warehouseservice.createWarehouse(
      warehouseinfo,
    );
    if (success) {
      return {
        success: true,
        message: 'Successfully created warehouse area.',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
