import { Controller, Get, HttpException } from '@nestjs/common';
import { AdminItemType } from '../routes/admin.routes';
import { ItemTypeService } from './itemtype.service';

@Controller(AdminItemType)
export class ItemTypeController {
  constructor(private readonly itemtypeservice: ItemTypeService) {}

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
}
