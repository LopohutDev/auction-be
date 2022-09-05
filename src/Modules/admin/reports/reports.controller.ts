import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { getReportsQueryDto } from 'src/dto/admin.reports.module.dto';
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
}
