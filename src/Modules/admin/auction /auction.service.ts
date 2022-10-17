import { Injectable, Logger } from '@nestjs/common';
import {
  auctionBodyDto,
  auctionStatusDto,
  getAuctionQueryDto,
  getRecoverQueryDto,
} from 'src/dto/admin.auction.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { PrismaService } from 'src/Services/prisma.service';
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

      await this.prismaService.auction.update({
        where: {
          id,
        },
        data: {
          endDate,
          endTime,
          startNumber,
          isRecover:
            startNumber || startNumber === 0 ? new Date().toISOString() : null,
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
              startTime: true,
              endDate: true,
              endTime: true,
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

        if (currDate > endDate) {
          return {
            ...row,
            status: auctionStatusDto.Past,
          };
        } else if (!row.startNumber && row.startNumber !== 0) {
          return {
            ...row,
            status: auctionStatusDto.Future,
          };
        } else if (
          (row.startNumber && currDate <= endDate) ||
          row.startNumber === 0
        ) {
          return {
            ...row,
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
            isRecover: new Date().toISOString(),
          },
        });
        return {
          success: true,
        };
      } else {
        return { error: { status: 422, message: 'Invalid auction' } };
      }
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
