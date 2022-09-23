import { Module } from '@nestjs/common';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';

@Module({
  controllers: [AuctionController],
  providers: [AuctionService],
})
export class AuctionModule {}
