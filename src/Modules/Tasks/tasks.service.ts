import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { BarcodeData } from 'src/Cache/BarCodes';
import { Jobs } from 'src/Cache/Jobs';
import { ITEMTAG } from 'src/constants/location.constants';
import { PrismaService } from 'src/Services/prisma.service';
import { Jwt } from 'src/tokens/Jwt';
import { addDays, subDays } from 'src/utils/common.utils';
import { formatDate } from 'src/utils/formatDate.utils';
import { Download } from 'src/utils/imageDownload.utils';
import { uuid } from 'src/utils/uuid.utils';
import setAuction from '../admin/auction/auction.utils';
import { ScanReportsService } from '../admin/scanreport/scanreport.service';
import { createExceptionFile } from '../user/scan/exceptionhandling.utils';
import { getLotNo, getLotNoStoreReturn } from '../user/scan/scrapper.utils';

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
          if (data && scanParams) {
            const olddir = __dirname.split('/');
            olddir.splice(olddir.length - 3, 3);
            const dir = `${olddir.join('/')}/src/scrapper`;

            if (!fs.existsSync(`${dir}`)) {
              fs.mkdirSync(`${dir}`);
            }

            if (!fs.existsSync(`${dir}/images`)) {
              fs.mkdirSync(`${dir}/images`);
            }

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
            let generatedLotNo;
            if (
              scanParams.locationItemId.toLowerCase() === ITEMTAG.STORE_RETUEN
            ) {
              const lastProduct = await this.prismaService.products.findMany({
                where: {
                  scans: {
                    auctionId: scanParams.auctionId,
                  },
                  itemType: ITEMTAG.STORE_RETUEN,
                },
                orderBy: { id: 'desc' },
                take: 1,
              });
              generatedLotNo =
                lastScannedItem.length > 0 && lastProduct.length > 0
                  ? getLotNoStoreReturn(
                      lastProduct[0]?.lotNo,
                      lastScannedItem[0].auctionId !== scanParams.auctionId,
                    )
                  : '200';
            } else {
              const lastProduct = await this.prismaService.products.findMany({
                where: {
                  scans: {
                    auctionId: scanParams.auctionId,
                  },
                  itemType: {
                    not: ITEMTAG.STORE_RETUEN,
                  },
                },
                orderBy: { id: 'desc' },
                take: 1,
              });
              generatedLotNo =
                lastScannedItem.length > 0 && lastProduct.length > 0
                  ? getLotNo(
                      lastProduct[0]?.lotNo,
                      lastScannedItem[0].auctionId !== scanParams.auctionId,
                    )
                  : '20D';
            }
            let lastGeneratedNo = 0;

            const imagesPath = data.images.map((img) => {
              lastGeneratedNo = lastGeneratedNo > 0 ? lastGeneratedNo + 1 : 1;
              const imgFile = Download(
                img.link,
                `${dir}/images/${generatedLotNo}_${lastGeneratedNo}.jpeg`,
              );
              return imgFile;
            });

            const productData = {
              barcode: scanParams.barcode,
              lotNo: generatedLotNo,
              startingBid: Number(data.price) * 0.05,
              title: data.title,
              images: imagesPath,
              description: data.description,
              category: '',
              manufacturer: data.manufacturer,
              itemType: scanParams.locationItemId.toLowerCase(),
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
                updatedAt: new Date(),
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
                updatedAt: new Date(),
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
        createExceptionFile('Exception Caugth: ' + String(error));
        this.logger.debug({
          module: 'Queue',
          message: `Facing issue ie: ${error}`,
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7PM)
  async handleZipGeneration() {
    const scanReport = new ScanReportsService(this.prismaService);
    const day = new Date().getDay();
    const auctiondata = await this.prismaService.auction.findMany({
      where: {
        startDate: { gte: day === 1 || day === 4 ? subDays(4) : subDays(3) },
        startNumber: { gte: 0 },
      },
    });

    this.logger.debug({ message: 'HandleZip now' });
    if (auctiondata && auctiondata.length) {
      for await (const auctions of auctiondata) {
        const { error } = await scanReport.exportScrapperScans(
          {
            auction: auctions.id,
            location: auctions.locid,
          },
          true,
        );
        if (error) {
          this.logger.error({ error: 'Error occur', message: error });
          createExceptionFile(
            'Module: handleZipper cron failed with: ' + error.message,
          );
        }
      }
    } else {
      createExceptionFile(
        'Auction current data not found please cross check startdate : ' +
          new Date().toLocaleString(),
      );
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async addFutureAuction() {
    let arr = [];
    const currDate = new Date();

    const futureMonthLast = new Date(
      currDate.getFullYear(),
      currDate.getMonth() + 1,
      0,
    );
    const futureMonthLastDay = futureMonthLast.getDay();
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

    const allLocations = await this.prismaService.location.findMany({});

    if (allLocations) {
      allLocations.map((row) => {
        for (let i = 1, j = 0; i < futureMonthLast.getDate() + d; i++) {
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

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async deletePastAuctionScanItems() {
    const pastAuctions = await this.prismaService.auction.findMany({
      where: {
        endDate: {
          lte: new Date(),
        },
      },
      orderBy: {
        endDate: 'desc',
      },
      include: {
        srappers: true,
      },
    });
    pastAuctions.shift();

    for (const auction of pastAuctions) {
      for (const scrapperZip of auction.srappers) {
        const scrapperZipFile = scrapperZip.filePath.split('/');
        scrapperZipFile.splice(scrapperZipFile.length - 2, 2);
        const scrapperZipDir = scrapperZipFile.join('/');

        if (fs.existsSync(scrapperZipDir)) {
          rimraf(scrapperZipDir, (err) => {
            if (err) {
              this.logger.error(err);
            }
          });
        }
      }
    }
  }
}
function orderBy(
  arg0: { where: { ScanId: {} } },
  orderBy: any,
  arg2: { id: string },
  take: any,
  arg4: number,
) {
  throw new Error('Function not implemented.');
}
