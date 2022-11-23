import { Injectable, Logger } from '@nestjs/common';
import { locationQueryDataDto } from 'src/dto/admin.location.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { subDays } from 'src/utils/common.utils';
import * as moment from 'moment';

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
        const auctiondata = await this.prismaService.auction.findMany({
          where: {
            startDate: {
              gte: subDays(3),
            },
            startNumber: { gte: 0 },
            locid: location,
          },
        });

        return { success: true, data: auctiondata };
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
        if (
          moment(auctiondata[i].startDate).format('YYYY-MM-DD') <
          moment(subDays(3)).format('YYYY-MM-DD')
        ) {
          if (auctiondata[i].isRecover) {
            resultData.push({ ...auctiondata[i], status: 'isRecover' });
          }
        } else {
          resultData.push({ ...auctiondata[i], status: 'cuurent' });
        }
      }
      return { success: true, data: resultData };
    } catch (error) {
      this.logger.debug(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
