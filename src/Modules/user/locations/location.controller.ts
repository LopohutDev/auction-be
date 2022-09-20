import { Controller, Get, HttpException } from '@nestjs/common';
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
}
