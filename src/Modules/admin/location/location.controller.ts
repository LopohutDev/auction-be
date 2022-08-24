import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
} from '@nestjs/common';
import { locationBodyDto } from 'src/dto/admin.location.module.dto';
import { AdminLocationRoute } from '../routes/admin.routes';
import { LocationService } from './location.service';

@Controller(AdminLocationRoute)
export class LocationController {
  constructor(private readonly locationservice: LocationService) {}

  @Post()
  @HttpCode(200)
  async createLocationController(@Body() locinfo: locationBodyDto) {
    const { error, success } = await this.locationservice.createLocation(
      locinfo,
    );
    if (success) {
      return {
        success: true,
        message: 'Successfully created location.',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
