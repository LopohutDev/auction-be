import { Injectable, Logger } from '@nestjs/common';
import { locationQueryDataDto } from 'src/dto/admin.location.module.dto';
import { setArrayLowercaseKeys } from 'src/Modules/admin/utils';
import { PrismaService } from 'src/Services/prisma.service';

@Injectable()
export class UserAuctionService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(UserAuctionService.name);

  async getAuctionService(locquery: locationQueryDataDto) {
    const { location } = locquery;
    if (!location) {
      return { error: { status: 422, message: 'Location is required' } };
    }
    try {
      const isLocation = await this.prismaService.location.findUnique({
        where: {
          locid: location,
        },
      });

      if (!isLocation) {
        return { error: { status: 422, message: 'Location not found' } };
      }
      const auctionData = await this.prismaService.location.findMany({
        where: {
          locid: location,
        },
        select: {
          Auction: {
            select: {
              id: true,
              auctionType: true,
              scannedItem: true,
              startDate: true,
              startTime: true,
              endDate: true,
              endTime: true,
              startNumber: true,
              isRecover: true,
            },
          },
        },
      });

      const currData = auctionData[0]?.Auction.filter(
        (row) => row.startNumber && row.scannedItem?.length === 0 && row,
      );

      const data = setArrayLowercaseKeys(currData);

      return { success: true, data };
    } catch (error) {
      this.logger.debug(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
