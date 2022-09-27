import { Controller, Get, HttpException, Param } from '@nestjs/common';
import { locationQueryDataDto } from 'src/dto/admin.location.module.dto';
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
}
