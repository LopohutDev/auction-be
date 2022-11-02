import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { locationQueryDataDto } from 'src/dto/admin.location.module.dto';
import { UserAuctionRoute } from '../routes/user.routes';
import { UserAuctionService } from './auction.service';

@Controller(UserAuctionRoute)
export class UserAuctionController {
  constructor(private readonly auctionService: UserAuctionService) {}

  @Get()
  async getAuction(@Query() locationquery: locationQueryDataDto) {
    const { success, error, data } =
      await this.auctionService.getAuctionService(locationquery);
    if (success && data) {
      return {
        success,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
