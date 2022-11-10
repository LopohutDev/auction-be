import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { PrismaService } from 'src/Services/prisma.service';
import setAuction from './auction.utils';
import setFutureAuction from './futureAuctionUtils';

@Injectable()
export class futureAuctionCreation {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(futureAuctionCreation.name);

  async addFutureAuction(row) {
    let arr = [];
    const currDate = moment(row.lastAuction.endDate)
      .add(1, 'days')
      .format('YYYY-MM-DD');

    const futureMonthLast = moment(currDate).endOf('month');

    const futureMonthLastDay = futureMonthLast.day();
    let d = null;
    switch (futureMonthLastDay) {
      case 1:
        d = 0;
        break;
      case 2:
        d = 2;
        break;
      case 3:
        d = 1;
        break;
      case 4:
        d = 0;
        break;
      case 5:
        d = 3;
        break;
      case 6:
        d = 2;
        break;
      case 0:
        d = 1;
        break;
      default:
        null;
        break;
    }

    const dayCount = moment(currDate).format('DD');
    const remainingDays = futureMonthLast.date() + d - Number(dayCount);

    for (let i = 1, j = 0; i <= remainingDays; i++) {
      const { newArr, n, m } = setFutureAuction(i, j, row, currDate);
      i = n;
      j = m;
      arr = [...arr, newArr];
    }

    this.logger.log('arrr------------>>>>', JSON.stringify(arr));
    await this.prismaService.auction.createMany({
      data: arr,
    });
  }
}
