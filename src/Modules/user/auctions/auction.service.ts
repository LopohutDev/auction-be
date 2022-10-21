import { Injectable, Logger } from '@nestjs/common';
import { locationQueryDataDto } from 'src/dto/admin.location.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { subDays } from 'src/utils/common.utils';

@Injectable()
export class UserAuctionService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(UserAuctionService.name);

  async getAuctionService(locquery: locationQueryDataDto) {
    const { location, isAdmin } = locquery;
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
      if (!isAdmin) {
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

        const data = auctionData[0]?.Auction.filter(
          (row) => row.startNumber && row.scannedItem?.length === 0 && row,
        );

        // const data = setArrayLowercaseKeys(currData);

        return { success: true, data };
      }
      const auctiondata = await this.prismaService.auction.findMany({
        where: {
          startDate: {
            gte: subDays(6),
          },
          startNumber: { gte: 0 },
          locid: location,
        },
      });
      const resultData = [];
      for (let i = 0; i < auctiondata.length; i += 1) {
        if (auctiondata[i].startDate < subDays(3)) {
          if (auctiondata[i].isRecover) {
            resultData.push(auctiondata[i]);
          }
        } else {
          resultData.push(auctiondata[i]);
        }
      }
      return { success: true, data: resultData };
    } catch (error) {
      this.logger.debug(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
