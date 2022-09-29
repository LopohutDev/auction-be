import { Controller, Get, HttpException, Query } from '@nestjs/common';
import {
  getReportsQueryDto,
  getScanQueryDto,
} from 'src/dto/admin.reports.module.dto';
import { AdminReportsRoute } from '../routes/admin.routes';
import { ReportsService } from './reports.service';

@Controller(AdminReportsRoute)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getcurrentReports(@Query() locinfo: getReportsQueryDto) {
    const { data, error } = await this.reportsService.getReports(locinfo);
    if (data) {
      return {
        data,
        success: true,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('allscans')
  async getAllScans(@Query() allScanQuery: getScanQueryDto) {
    const { data, pageCount, error } = await this.reportsService.allScans(
      allScanQuery,
    );
    if (data) {
      return {
        data,
        pageCount,
        success: true,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
