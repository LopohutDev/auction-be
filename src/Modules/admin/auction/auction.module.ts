import { Module } from '@nestjs/common';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';
import { futureAuctionCreation } from './startFutureAuction';

@Module({
  controllers: [AuctionController],
  providers: [AuctionService, futureAuctionCreation],
})
export class AuctionModule {}
