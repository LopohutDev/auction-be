import { Module } from '@nestjs/common';
import { UserAuctionModule } from './auctions/auction.module';
import { UserLocationModule } from './locations/location.module';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [ScanModule, UserLocationModule, UserAuctionModule],
})
export class UserModule {}
