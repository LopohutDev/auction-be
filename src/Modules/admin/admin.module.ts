import { Module } from '@nestjs/common';
import { LocationModule } from './location/location.module';
import { ReportsModule } from './reports/reports.module';
import { ScanReportsModule } from './scanreport/scanreport.module';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [LocationModule, WarehouseModule, ReportsModule, ScanReportsModule],
})
export class AdminModule {}
