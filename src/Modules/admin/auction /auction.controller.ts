import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { auctionBodyDto } from 'src/dto/admin.auction.module.dto';
import { AdminAuction } from '../routes/admin.routes';
import { AuctionService } from './auction.service';

@Controller(AdminAuction)
export class AuctionController {
  constructor(private readonly auctionservice: AuctionService) {}

  @Post()
  async createAuctionController(@Body() auctioninfo: auctionBodyDto) {
    const { error, success } = await this.auctionservice.createAuction(
      auctioninfo,
    );
    if (success) {
      return {
        success: true,
        message: 'Successfully auction created.',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
