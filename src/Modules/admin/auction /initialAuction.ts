import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/Services/prisma.service';

@Injectable()
export class InitialAuctionCreation {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(InitialAuctionCreation.name);

  async createInitial() {
    const arr = [];
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
      // this.logger.log('isAuction>>>>', remainingDays);
      noAuction.map((row) => {
        for (let i = 1, j = 0; i <= remainingDays; i++) {
          // const futureDate = new Date(
          //   new Date().getTime() + i * 24 * 60 * 60 * 1000,
          // );
          const currDateDay = currDate.getDay();
          if (i === 1 && j === 0) {
            j++;
            if (currDateDay === 1 || currDateDay === 4) {
              i = 1;
            }
            if (currDateDay === 2 || currDateDay === 5) {
              i = 0;
            }
            if (currDateDay === 3 || currDateDay === 6) {
              i = -1;
            }
            if (currDateDay === 0) {
              i = 2;
            }
          }
          // this.logger.debug('futureDate>>>', currDateDay);

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
              auctionType: 'Auction1',
              startDate: futureDate.toISOString(),
              startTime: new Date(futureDate.setHours(8, 0, 0)).toISOString(),
              endDate: new Date(
                new Date(futureDate).getTime() + 2 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              endTime: new Date(futureDate.setHours(19, 0, 0)).toISOString(),
              locid: row.locid,
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
              auctionType: 'Auction2',
              startDate: futureDate.toISOString(),
              startTime: new Date(futureDate.setHours(8, 0, 0)).toISOString(),
              endDate: new Date(
                new Date(futureDate).getTime() + 3 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              endTime: new Date(futureDate.setHours(19, 0, 0)).toISOString(),
              locid: row.locid,
            });
          }
        }
      });
      await this.prismaService.auction.createMany({
        data: arr,
      });
    }

    this.logger.debug('futureDate>>>', JSON.stringify(arr));
  }
}
