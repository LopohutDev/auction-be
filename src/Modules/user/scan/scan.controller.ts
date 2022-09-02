import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { ScanQueryDto } from 'src/dto/user.scan.module.dto';
import { UserScanRoute } from '../routes/user.routes';
import { ScanService } from './scan.service';

@Controller(UserScanRoute)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Get()
  async getScanned(@Query() query: ScanQueryDto) {
    const { barcode } = query;
    const { data, error } = await this.scanService.getScanProduct(barcode);
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
