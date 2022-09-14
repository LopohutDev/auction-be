import {
  Controller,
  HttpException,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import { ScanQueryDto } from 'src/dto/user.scan.module.dto';
import { UserScanRoute } from '../routes/user.routes';
import { ScanService } from './scan.service';

@Controller(UserScanRoute)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post()
  @HttpCode(200)
  async getScanned(@Body() query: ScanQueryDto) {
    const { data, error } = await this.scanService.getScanProduct(query);
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
