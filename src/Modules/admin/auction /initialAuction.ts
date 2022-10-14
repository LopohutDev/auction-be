import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/Services/prisma.service';
import setAuction from './auction.utils';

@Injectable()
export class InitialAuctionCreation {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(InitialAuctionCreation.name);

  async createInitial() {
    let arr = [];
    const currDate = new Date();

    const currMonthLast = new Date(
      currDate.getFullYear(),
      currDate.getMonth() + 1,
      0,
    );
    const currMonthLastDay = currMonthLast.getDay();
    let d = null;
    switch (currMonthLastDay) {
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

    const noAuction = await this.prismaService.location.findMany({
      where: {
        Auction: {
          none: {},
        },
      },
    });

    if (noAuction) {
      const remainingDays = currMonthLast.getDate() + d - currDate.getDate();

      noAuction.map((row) => {
        for (let i = 1, j = 0; i <= remainingDays; i++) {
          const { newArr, n, m } = setAuction(i, j, row, currDate);

          i = n;
          j = m;
          arr = [...arr, newArr];
        }
      });

      await this.prismaService.auction.createMany({
        data: arr,
      });
    }
  }
}
