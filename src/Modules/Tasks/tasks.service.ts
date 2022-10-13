import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BarcodeData } from 'src/Cache/BarCodes';
import { Jobs } from 'src/Cache/Jobs';
import { PrismaService } from 'src/Services/prisma.service';
import { Jwt } from 'src/tokens/Jwt';
import { addDays } from 'src/utils/common.utils';
import { uuid } from 'src/utils/uuid.utils';
import setAuction from '../admin/auction /auction.utils';
import { getLotNo } from '../user/scan/scrapper.utils';

@Injectable()
export class TasksService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_2_HOURS)
  handleRemoveTokens() {
    const alltokens = Object.keys(Jwt.refreshTokens);
    let errors = 0;
    let success = 0;
    for (let i = 0; i < alltokens.length; i += 1) {
      const { error, success: totalsucess } = Jwt.removeExpiredToken(
        alltokens[i],
      );
      if (totalsucess) {
        success += 1;
      } else if (error) {
        errors += 1;
      }
    }
    this.logger.debug({
      module: 'Tokens',
      totalRecords: alltokens.length,
      errors,
      success,
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  handleRemoveBarcodes() {
    const barcodes = Object.keys(BarcodeData.data);
    let errors = 0;
    let success = 0;
    for (let i = 0; i < barcodes.length; i += 1) {
      const { error, success: totalsucess } = BarcodeData.removeExpiredData(
        barcodes[i],
      );
      if (totalsucess) {
        success += 1;
      } else if (error) {
        errors += 1;
      }
    }
    this.logger.debug({
      module: 'Barcodes',
      totalRecords: barcodes.length,
      errors,
      success,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePriorityQueue() {
    const jobs = Jobs.queue;
    if (!jobs.length) {
      this.logger.debug({ module: 'Queues', message: 'Already cleared' });
    } else {
      const len = Jobs.queue.length;
      try {
        for await (const que of Jobs.queue) {
          const { data, scanParams, error } = await que.func();

          const lastScannedItem = await this.prismaService.scans.findMany({
            orderBy: { id: 'desc' },
            take: 1,
          });
          const lastScannedIndex = lastScannedItem[0]?.id + 1 || 1;
          const ScanData = {
            ScanId: uuid(),
            tag: scanParams.tag,
            auctionId: scanParams.auctionId,
            locid: scanParams.locid,
            scannedBy: scanParams.userid,
            scannedName: scanParams.username,
            tagexpireAt: addDays(30),
          };
          if (data && scanParams) {
            const lastProduct = await this.prismaService.products.findMany({
              orderBy: { id: 'desc' },
              take: 1,
            });
            const productData = {
              barcode: scanParams.barcode,
              lotNo: lastScannedItem.length
                ? getLotNo(
                    lastProduct[0]?.lotNo,
                    lastScannedItem[0].auctionId !== scanParams.auctionId,
                  )
                : '20D',
              startingBid: Number(data.price) * 0.5,
              title: scanParams.areaname + lastScannedIndex + data.title,
              images: data.images?.map((l) => l.link),
              description: data.description,
              category: '',
              manufacturer: data.manufacturer,
              scans: {
                create: ScanData,
              },
            };
            await this.prismaService.products.create({ data: productData });
            await this.prismaService.tags.update({
              where: {
                id: scanParams.lastInsertId,
              },
              data: {
                successScanId: ScanData.ScanId,
              },
            });
          } else if (error) {
            const failedScanData = {
              failedScanId: uuid(),
              tag: scanParams.tag,
              auctionId: scanParams.auctionId,
              locid: scanParams.locid,
              scannedBy: scanParams.userid,
              scannedName: scanParams.username,
              tagexpireAt: addDays(30),
            };
            await this.prismaService.tags.create({
              data: {
                tag: scanParams.tag,
                auctionId: scanParams.auctionId,
                tagexpireAt: addDays(30),
                auctionStartNo: scanParams.autionStartNo,
              },
            });
            const lastInsertId = await this.prismaService.tags.findFirst({
              orderBy: { id: 'desc' },
              take: 1,
              select: {
                id: true,
              },
            });
            await this.prismaService.failedScans.create({
              data: {
                ...failedScanData,
                barcode: scanParams.barcode,
                failedStatus: 'DONE',
                rejectedReason: error.message,
              },
            });
            await this.prismaService.tags.update({
              where: {
                id: lastInsertId.id,
              },
              data: {
                failedScanId: failedScanData.failedScanId,
              },
            });
          }
          Jobs.dequeue();
          this.logger.debug({
            module: 'Queue',
            message: `Total queue ${len} is cleared now`,
          });
        }
      } catch (error) {
        this.logger.debug({
          module: 'Queue',
          message: `Facing issue ie: ${error?.message || error}`,
        });
      }
    }
  }
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async addFutureAuction() {
    let arr = [];
    const currDate = new Date();

    const futureMonthLastDay = new Date(
      currDate.getFullYear(),
      currDate.getMonth() + 1,
      0,
    );

    const allLocations = await this.prismaService.location.findMany({});

    if (allLocations) {
      allLocations.map((row) => {
        for (let i = 1, j = 0; i <= futureMonthLastDay.getDate(); i++) {
          const { newArr, n, m } = setAuction(i, j, row, currDate);
          i = n;
          j = m;
          arr = [...arr, newArr];
        }
      });
    }

    await this.prismaService.auction.createMany({
      data: arr,
    });
  }
}
