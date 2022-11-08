import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
  Get,
  Response,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Response as Res } from 'express';
import {
  getScanReportBodyDto,
  getScanReportsDto,
  updateMarkDoneBodyDto,
} from 'src/dto/admin.reports.module.dto';
import { paginationDto } from 'src/dto/common.dto';
import { AdminGuard } from 'src/guards/admin.guard';
import { AdminScanReport } from '../routes/admin.routes';
import { ScanReportsService } from './scanreport.service';

@Controller(AdminScanReport)
export class ScanReportsController {
  constructor(private readonly reportsService: ScanReportsService) {}

  @UseGuards(AdminGuard)
  @Get()
  async getReportsZipFile(
    @Response() res: Res,
    @Query() scanReport: getScanReportsDto,
  ) {
    const { data, error } = await this.reportsService.getZipScanReport(
      scanReport,
      res,
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

  @UseGuards(AdminGuard)
  @Post()
  async exportReportsByLocation(@Body() scanReport: getScanReportBodyDto) {
    const { data, error } = await this.reportsService.exportScrapperScans(
      scanReport,
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

  @UseGuards(AdminGuard)
  @Post('failed')
  @HttpCode(200)
  async getAuctionScan(
    @Body() reportinfo: getScanReportBodyDto,
    @Query() pagination: paginationDto,
  ) {
    const { data, error, pageCount } =
      await this.reportsService.getFailedScanByAuction(reportinfo, pagination);
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
  @UseGuards(AdminGuard)
  @Post('markdone')
  @HttpCode(200)
  async updateMarkDone(@Body() markdoneinfo: updateMarkDoneBodyDto) {
    const { success, error } = await this.reportsService.updateMarkDone(
      markdoneinfo,
    );
    if (success) {
      return {
        success: true,
        message: 'Marked as Done successfully.',
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
