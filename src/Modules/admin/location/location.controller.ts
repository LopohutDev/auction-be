import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  locationBodyDto,
  locationQueryDataDto,
} from 'src/dto/admin.location.module.dto';
import { AdminGuard } from 'src/guards/admin.guard';
import { AdminLocationRoute } from '../routes/admin.routes';
import { LocationService } from './location.service';

@Controller(AdminLocationRoute)
export class LocationController {
  constructor(private readonly locationservice: LocationService) {}

  @UseGuards(AdminGuard)
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

  @UseGuards(AdminGuard)
  @Get()
  async getLocation(@Query() locationquery: locationQueryDataDto) {
    const { data, error } = await this.locationservice.getLocationDetails(
      locationquery,
    );
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
  @Get('/all')
  async getAdminLocation() {
    const { data, error } = await this.locationservice.getAllAdminLocation();
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
  @Put(':location')
  async updateLocationController(
    @Param() param: locationQueryDataDto,
    @Body() locinfo: locationBodyDto,
  ) {
    const { error, success } = await this.locationservice.updateLocationDetails(
      locinfo,
      param.location,
    );
    if (success) {
      return {
        success: true,
        message: 'Successfully updated location.',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
  @UseGuards(AdminGuard)
  @Delete(':location')
  async deleteLocationController(@Param() param: locationQueryDataDto) {
    const { success, error } = await this.locationservice.deleteLocation(
      param.location,
    );
    if (success) {
      return {
        success: true,
        message: 'Successfully Delete location.',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
