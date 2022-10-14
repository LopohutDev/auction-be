import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import { BarcodeData } from 'src/Cache/BarCodes';
import { Jobs } from 'src/Cache/Jobs';
import { PrismaService } from 'src/Services/prisma.service';
import { Jwt } from 'src/tokens/Jwt';
import { addDays } from 'src/utils/common.utils';
import { Download } from 'src/utils/imageDownload.utils';
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePriorityQueue() {
    const jobs = Jobs.queue;
    if (!jobs.length) {
      this.logger.debug({ module: 'Queues', message: 'Already cleared' });
    } else {
      const len = Jobs.queue.length;
      try {
        for await (const que of Jobs.queue) {
          const { data, scanParams, error } = await que.func();
          const olddir = __dirname.split('/');
          olddir.splice(olddir.length - 2, 2);
          const dir = `${olddir.join('/')}/scrapper`;

          if (!fs.existsSync(`${dir}`)) {
            fs.mkdirSync(`${dir}`);
          }

          if (!fs.existsSync(`${dir}/images`)) {
            fs.mkdirSync(`${dir}/images`);
          }

          const imagesPath = data.images.map((img) => {
            const imgFile = Download(img.link, `${dir}/images/${img.id}.jpeg`);
            return imgFile;
          });

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
            barcode: scanParams.barcode,
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
              images: imagesPath,
              description: data.description,
              category: '',
              manufacturer: data.manufacturer,
            };
            await this.prismaService.scans.create({
              data: {
                ...ScanData,
                products: { create: productData },
              },
            });
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
                id: scanParams.lastInsertId,
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
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async deleteExpiredTag() {
    await this.prismaService.tags.deleteMany({
      where: {
        tagexpireAt: {
          lte: new Date(),
        },
      },
    });
  }
}
