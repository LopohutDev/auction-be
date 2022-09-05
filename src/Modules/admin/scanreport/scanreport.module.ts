import { Module } from '@nestjs/common';
import { ScanReportsController } from './scanreport.controller';
import { ScanReportsService } from './scanreport.service';

@Module({
  controllers: [ScanReportsController],
  providers: [ScanReportsService],
})
export class ScanReportsModule {}
