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
          const currDateDay = currDate.getDay();

          if (i === 1 && j === 0) {
            j++;
            switch (currDateDay) {
              case 1:
                i = 1;
                break;

              case 2:
                i = 0;
                break;

              case 3:
                i = -1;
                break;

              case 4:
                i = 1;
                break;

              case 5:
                i = 0;
                break;

              case 6:
                i = -1;
                break;

              case 0:
                i = 2;
                break;

              default:
                null;
                break;
            }
          }

          const { newArr, n } = setAuction(i, row);

          i = n;
          arr = [...arr, newArr];
        }
      });
      await this.prismaService.auction.createMany({
        data: arr,
      });
    }
  }
}
