import { Module } from '@nestjs/common';
import { UserAuctionController } from './auction.controller';
import { UserAuctionService } from './auction.service';

@Module({
  controllers: [UserAuctionController],
  providers: [UserAuctionService],
})
export class UserAuctionModule {}
