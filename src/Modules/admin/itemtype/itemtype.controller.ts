import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { itemTypeBodyDto } from 'src/dto/admin.warehouse.module.dto';
import { AdminGuard } from 'src/guards/admin.guard';
import { AdminItemType } from '../routes/admin.routes';
import { ItemTypeService } from './itemtype.service';

@Controller(AdminItemType)
export class ItemTypeController {
  constructor(private readonly itemtypeservice: ItemTypeService) {}

  @UseGuards(AdminGuard)
  @Get()
  async getAllItemType() {
    const { data, error } = await this.itemtypeservice.getItemType();
    if (data) {
      return {
        success: true,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }

  @UseGuards(AdminGuard)
  @Post()
  async createtype(@Body() itemtype: itemTypeBodyDto) {
    const { success, error } = await this.itemtypeservice.createNewItemType(
      itemtype,
    );
    if (success) {
      return {
        success,
        message: 'Item type successfully created',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
