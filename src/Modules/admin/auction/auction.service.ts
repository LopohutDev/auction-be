import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';

import {
  auctionBodyDto,
  auctionStatusDto,
  getAuctionQueryDto,
  getRecoverQueryDto,
} from 'src/dto/admin.auction.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { subDays } from 'src/utils/common.utils';
import { setTimeZone } from 'src/utils/setTimeZone';
import { validationAuctionBody } from 'src/validations/admin.auction.validation';

@Injectable()
export class AuctionService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(AuctionService.name);

  async createAuction(auctionInfo: auctionBodyDto): Promise<successErrorDto> {
    try {
      const { data, error } = validationAuctionBody(auctionInfo);
      if (error) return { error };

      const { id, endDate, endTime, startNumber } = data;

      const endDateTime = `${endDate} ${endTime}`;
      const location = await this.prismaService.auction.findUnique({
        where: {
          id,
        },
        select: {
          locations: {
            select: {
              locid: true,
            },
          },
        },
      });
      if (startNumber) {
        const auctionTags = await this.prismaService.auction.findMany({
          where: {
            startNumber: startNumber,
            locid: location.locations.locid,
          },
        });
        const tags = await this.prismaService.tags.findMany({
          where: {
            auctionStartNo: startNumber,
            locid: location.locations.locid,
            tagexpireAt: {
              // gt: new Date(),
              gt: moment.utc(moment()).format(),
            },
          },
        });
        if (auctionTags.length > 0 || tags.length > 0) {
          return {
            error: {
              status: 500,
              message: `Starting Number is already used on another auction: ${startNumber}`,
            },
          };
        }
      }

      await this.prismaService.auction.update({
        where: {
          id,
        },
        data: {
          endDate: new Date(Date.parse(endDateTime)).toISOString(),
          // endTime,
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

  async getAllAuction(locquery: getAuctionQueryDto) {
    const { location } = locquery;

    try {
      const isLocationExists = await this.prismaService.location.findUnique({
        where: { locid: location },
        rejectOnNotFound: false,
      });

      if (!isLocationExists) {
        return { error: { status: 404, message: 'Invalid location' } };
      }

      const locationAuctionData = await this.prismaService.location.findMany({
        where: {
          locid: { equals: location },
        },
        select: {
          Auction: {
            select: {
              id: true,
              auctionType: true,
              startDate: true,
              // startTime: true,
              endDate: true,
              // endTime: true,
              startNumber: true,
              isRecover: true,
              _count: {
                select: {
                  scannedItem: true,
                  failedScans: true,
                },
              },
            },
          },
        },
      });

      const currDate = new Date().toISOString().slice(0, 10);

      const data = locationAuctionData[0]?.Auction.map((row) => {
        const endDate = new Date(row.endDate).toISOString().slice(0, 10);
        const startDate_timeZone = setTimeZone({
          date: row.startDate,
          options: {
            timeZone: process.env.TZ,
          },
        }).split(',')[0];
        const startTime_timeZone = setTimeZone({
          date: row.startDate,
          options: {
            timeZone: process.env.TZ,
            hour12: false,
          },
        }).split(' ')[1];
        const endDate_timeZone = setTimeZone({
          date: row.endDate,
          options: {
            timeZone: process.env.TZ,
          },
        }).split(',')[0];
        const endTime_timeZone = setTimeZone({
          date: row.endDate,
          options: {
            timeZone: process.env.TZ,
            hour12: false,
          },
        }).split(' ')[1];
        if (currDate > endDate) {
          return {
            ...row,
            startDate: startDate_timeZone,
            startTime: startTime_timeZone,
            endDate: endDate_timeZone,
            endTime: endTime_timeZone,

            status: auctionStatusDto.Past,
          };
        } else if (!row.startNumber && row.startNumber !== 0) {
          return {
            ...row,
            startDate: startDate_timeZone,
            startTime: startTime_timeZone,
            endDate: endDate_timeZone,
            endTime: endTime_timeZone,
            status: auctionStatusDto.Future,
          };
        } else if (
          (row.startNumber && currDate <= endDate) ||
          row.startNumber === 0
        ) {
          return {
            ...row,
            startDate: startDate_timeZone,
            startTime: startTime_timeZone,
            endDate: endDate_timeZone,
            endTime: endTime_timeZone,
            status: auctionStatusDto.Current,
          };
        }
      });

      return { data };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async setRecoverData(auctionId: getRecoverQueryDto) {
    const { auction } = auctionId;
    if (!auction || !auction.trim().length) {
      return { error: { status: 422, message: 'Auction is required' } };
    }
    const day = new Date().getDay();
    const isAuction = await this.prismaService.auction.findFirst({
      where: {
        startDate: {
          gte: day === 1 || day === 4 ? subDays(7) : subDays(6),
          lt: moment.utc(moment()).format(),
        },
        id: auction,
        startNumber: {
          gte: 0,
        },
      },
    });
    if (!isAuction || isAuction?.id !== auction) {
      return { error: { status: 422, message: 'Invalid auction' } };
    }
    try {
      await this.prismaService.auction.update({
        where: {
          id: auction,
        },
        data: {
          isRecover: new Date().toISOString(),
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
