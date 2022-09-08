import { Injectable, Logger } from '@nestjs/common';
import { auctionBodyDto } from 'src/dto/admin.auction.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { validationAuctionBody } from 'src/validations/admin.auction.validation';

@Injectable()
export class AuctionService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(AuctionService.name);

  async createAuction(auctionInfo: auctionBodyDto): Promise<successErrorDto> {
    const { data, error } = validationAuctionBody(auctionInfo);
    if (error) return { error };

    try {
      const { startDate, startTime, endDate, endTime, startNumber } = data;
      await this.prismaService.auction.create({
        data: {
          startDate,
          startTime,
          endDate,
          endTime,
          startNumber,
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      this.logger.warn(error);
      return {
        error: { status: 500, message: 'Server error' },
      };
    }
  }
}
