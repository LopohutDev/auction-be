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
    this.logger.log(auctionInfo);
    const { data, error } = validationAuctionBody(auctionInfo);
    if (error) return { error };

    try {
      const {
        id,
        auctionType,
        startDate,
        startTime,
        endDate,
        endTime,
        startNumber,
      } = data;

      const arr = [];
      const currDate = new Date();
      const lastDayOfCurrMonth = new Date(
        currDate.getFullYear(),
        currDate.getMonth() + 1,
        0,
      );
      const date = currDate.toLocaleString().split(',')[0];
      const lastDay = lastDayOfCurrMonth.toLocaleString().split(',')[0];

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

      if (lastDay === date) {
        const futureMonthLastDay = new Date(
          currDate.getFullYear(),
          currDate.getMonth() + 2,
          0,
        );

        for (let i = 1; i <= futureMonthLastDay.getDate(); i++) {
          const futureDate = new Date(
            new Date().getTime() + i * 24 * 60 * 60 * 1000,
          );
          const futureDateDay = futureDate.getDay();

          if (
            futureDateDay === 2 ||
            futureDateDay === 3 ||
            futureDateDay === 4
          ) {
            i = i + 2;
            arr.push({
              AuctionType: 'Auction 1',
              startDate: futureDate,
              startTime: '8am',
              endDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
              endTime: '7pm',
              startNumber: null,
            });
          }

          if (
            futureDateDay === 5 ||
            futureDateDay === 6 ||
            futureDateDay === 0 ||
            futureDateDay === 1
          ) {
            i = i + 3;
            arr.push({
              AuctionType: 'Auction 2',
              startDate: futureDate,
              startTime: '8am',
              endDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
              endTime: '7pm',
              startNumber: null,
            });
          }
        }

        await this.prismaService.auction.createMany({
          data: arr,
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
