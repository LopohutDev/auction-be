import { Module } from '@nestjs/common';
import { UserAuctionModule } from './auctions/auction.module';
import { UserLocationModule } from './locations/location.module';
import { ScanModule } from './scan/scan.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ScanModule, UserLocationModule, UserAuctionModule, UsersModule],
})
export class UserModule {}
