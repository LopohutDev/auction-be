import { Injectable, Logger } from '@nestjs/common';
import {
  auctionBodyDto,
  getAuctionQueryDto,
  getRecoverQueryDto,
} from 'src/dto/admin.auction.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { validationAuctionBody } from 'src/validations/admin.auction.validation';
import futureAuction from './auction.utils';

@Injectable()
export class AuctionService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(AuctionService.name);

  async createAuction(auctionInfo: auctionBodyDto): Promise<successErrorDto> {
    this.logger.log(auctionInfo);

    try {
      // const arr = [];
      // const currDate = new Date();
      // const lastDayOfCurrMonth = new Date(
      //   currDate.getFullYear(),
      //   currDate.getMonth() + 1,
      //   0,
      // );
      // const date = currDate.toLocaleString().split(',')[0];
      // const lastDay = lastDayOfCurrMonth.toLocaleString().split(',')[0];

      // if (lastDay === date) {
      //   futureAuction(currDate, arr);
      //   await this.prismaService.auction.createMany({
      //     data: arr,
      //   });
      // } else {
      const { data, error } = validationAuctionBody(auctionInfo);
      if (error) return { error };

      const {
        id,
        // auctionType,
        // startDate,
        // startTime,
        endDate,
        endTime,
        startNumber,
      } = data;

      await this.prismaService.auction.update({
        where: {
          id,
        },
        data: {
          // auctionType,
          // startDate,
          // startTime,
          endDate,
          endTime,
          startNumber,
        },
      });
      // }
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

      const data = await this.prismaService.location.findMany({
        where: {
          locid: { equals: location },
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
            },
          },
        },
      });
      this.logger.log('data>>>', data);

      return { data };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async setRecoverData(auctionId: getRecoverQueryDto) {
    const { id } = auctionId;

    const isAuction = await this.prismaService.auction.findUnique({
      where: {
        id,
      },
    });
    try {
      if (isAuction) {
        await this.prismaService.auction.update({
          where: {
            id,
          },
          data: {
            isRecover: true,
          },
        });
        return {
          success: true,
        };
      }
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
