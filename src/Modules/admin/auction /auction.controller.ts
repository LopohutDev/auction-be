import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  auctionBodyDto,
  getAuctionQueryDto,
  getRecoverQueryDto,
} from 'src/dto/admin.auction.module.dto';
import { AdminGuard } from 'src/guards/admin.guard';
import { AdminAuction } from '../routes/admin.routes';
import { AuctionService } from './auction.service';

@Controller(AdminAuction)
export class AuctionController {
  constructor(private readonly auctionservice: AuctionService) {}

  @UseGuards(AdminGuard)
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

  @UseGuards(AdminGuard)
  @Get()
  async getAuctionData(@Query() locinfo: getAuctionQueryDto) {
    const { data, error } = await this.auctionservice.getAllAuction(locinfo);
    if (data) {
      return {
        data,
        success: true,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }

  @UseGuards(AdminGuard)
  @Get('recover')
  async recoverData(@Query() auctionId: getRecoverQueryDto) {
    const { success, error } = await this.auctionservice.setRecoverData(
      auctionId,
    );
    if (success) {
      return {
        success: true,
        message: 'Successfully recover auction data.',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
