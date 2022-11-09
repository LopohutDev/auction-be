import { Module } from '@nestjs/common';
import { InitialAuctionCreation } from '../auction/initialAuction';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
  controllers: [LocationController],
  providers: [LocationService, InitialAuctionCreation],
})
export class LocationModule {}
