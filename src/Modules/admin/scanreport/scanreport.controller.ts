import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
} from '@nestjs/common';
import { getScanReportBodyDto } from 'src/dto/admin.reports.module.dto';
import { AdminScanReport } from '../routes/admin.routes';
import { ScanReportsService } from './scanreport.service';

@Controller(AdminScanReport)
export class ScanReportsController {
  constructor(private readonly reportsService: ScanReportsService) {}

  @Post('failed')
  @HttpCode(200)
  async getAuctionScan(@Body() reportinfo: getScanReportBodyDto) {
    const { data, error } = await this.reportsService.getFailedScanByAuction(
      reportinfo,
    );
    if (data) {
      return {
        data,
        success: true,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }

  @Post('success')
  @HttpCode(200)
  async getSuccessAuctionScan(@Body() reportinfo: getScanReportBodyDto) {
    const { data, error } = await this.reportsService.getScrapperScans(
      reportinfo,
    );
    if (data) {
      return {
        data,
        success: true,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
