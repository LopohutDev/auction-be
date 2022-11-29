import {
  Controller,
  Get,
  HttpException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  itemSizeQueryDataDto,
  locationQueryDataDto,
} from 'src/dto/admin.location.module.dto';
import { AuthGuard } from 'src/guards/jwt.guard';
import { UserLocationRoute } from '../routes/user.routes';
import { UserLocationService } from './location.service';

@Controller(UserLocationRoute)
export class UserLocationController {
  constructor(private readonly locationservice: UserLocationService) {}

  @Get()
  async getAllLocations() {
    const { success, error, data } =
      await this.locationservice.getAllLocationService();
    if (success && data) {
      return {
        success,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
  @UseGuards(AuthGuard)
  @Get('item')
  async getItems() {
    const { success, error, data } =
      await this.locationservice.getItemsService();
    if (success && data) {
      return {
        success,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
  @Get(':location')
  async getLocationsItems(@Param() param: locationQueryDataDto) {
    const { success, error, data } =
      await this.locationservice.getLocationItemsService(param.location);
    if (success && data) {
      return {
        success,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
  @UseGuards(AuthGuard)
  @Get('item/:item')
  async getItemsSize(@Param() param: itemSizeQueryDataDto) {
    const { success, error, data } =
      await this.locationservice.getItemsSizeService(param.item);
    if (success && data) {
      return {
        success,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
