import { Injectable, Logger } from '@nestjs/common';
import { auctionBodyDto } from 'src/dto/admin.auction.module.dto';
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
      const arr = [];
      const currDate = new Date();
      const lastDayOfCurrMonth = new Date(
        currDate.getFullYear(),
        currDate.getMonth() + 1,
        0,
      );
      const date = currDate.toLocaleString().split(',')[0];
      const lastDay = lastDayOfCurrMonth.toLocaleString().split(',')[0];

      if (lastDay === date) {
        futureAuction(currDate, arr);
        await this.prismaService.auction.createMany({
          data: arr,
        });
      } else {
        const { data, error } = validationAuctionBody(auctionInfo);
        if (error) return { error };

        const {
          id,
          auctionType,
          startDate,
          startTime,
          endDate,
          endTime,
          startNumber,
        } = data;

        await this.prismaService.auction.update({
          where: {
            id,
          },
          data: {
            auctionType,
            startDate,
            startTime,
            endDate,
            endTime,
            startNumber,
          },
        });
      }
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

//  const arr = [];
//  const currDate = moment().format();
//  var daysInMonth = moment(currDate, 'YYYY-MM').daysInMonth();

//  if (daysInMonth) {
//    for (let i = 1; i <= daysInMonth; i++) {
//      const futureDate = moment(currDate).add(i, 'days').format('YYYY-MM-DD');
//      const futureMonthDay = moment(futureDate).day();
//      console.log(futureDate, futureMonthDay);

//      if (futureMonthDay === 2 || futureMonthDay === 3 || futureMonthDay === 4) {
//        i = i + 2;
//        arr.push({
//          AuctionType: 'Auction 1',
//          startDate: futureDate,
//          startTime: '8am',
//          endDate: moment(futureDate).add(2, 'days').format('YYYY-MM-DD'),
//          endTime: '7pm',
//          startNumber: null,
//        });
//      }

//      if (
//        futureMonthDay === 5 ||
//        futureMonthDay === 6 ||
//        futureMonthDay === 0 ||
//        futureMonthDay === 1
//      ) {
//        i = i + 3;
//        arr.push({
//          AuctionType: 'Auction 2',
//          startDate: futureDate,
//          startTime: '8am',
//          endDate: moment(futureDate).add(3, 'days').format('YYYY-MM-DD'),
//          endTime: '7pm',
//          startNumber: null,
//        });
//      }
//    }
//  }

//  console.log(arr);
