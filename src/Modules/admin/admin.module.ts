import { Module } from '@nestjs/common';
import { ItemTypeModule } from './itemtype/itemtype.module';
import { AuctionModule } from './auction/auction.module';
import { LocationModule } from './location/location.module';
import { ReportsModule } from './reports/reports.module';
import { ScanReportsModule } from './scanreport/scanreport.module';
import { AdminUsersModule } from './users/users.module';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [
    LocationModule,
    WarehouseModule,
    ReportsModule,
    ScanReportsModule,
    AdminUsersModule,
    ItemTypeModule,
    AuctionModule,
    AdminUsersModule,
  ],
})
export class AdminModule {}
