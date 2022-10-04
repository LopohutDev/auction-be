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

    const currMonthLastDay = new Date(
      currDate.getFullYear(),
      currDate.getMonth() + 1,
      0,
    );

    const noAuction = await this.prismaService.location.findMany({
      where: {
        Auction: {
          none: {},
        },
      },
    });

    if (noAuction) {
      const remainingDays = currMonthLastDay.getDate() - currDate.getDate();

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
