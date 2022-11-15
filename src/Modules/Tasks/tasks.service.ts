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
import { Download } from 'src/utils/imageDownload.utils';
import { uuid } from 'src/utils/uuid.utils';
import setAuction from '../admin/auction/auction.utils';
import setFutureAuction from '../admin/auction/futureAuctionUtils';
import { ScanReportsService } from '../admin/scanreport/scanreport.service';
import { createExceptionFile } from '../user/scan/exceptionhandling.utils';

import { getLotNo, getLotNoStoreReturn } from '../user/scan/scrapper.utils';
import * as moment from 'moment';
import { count } from 'console';

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
  // @Cron(CronExpression.EVERY_10_MINUTES)
  async handlePriorityQueue() {
    // console.log(moment().valueOf())
    const jobs = Jobs.queue;
    if (!jobs.length) {
      this.logger.debug({ module: 'Queues', message: 'Already cleared' });
    } else {
      const len = Jobs.queue.length;
      try {
        for await (const que of Jobs.queue) {
          const { data, scanParams, error } = await que.func();
          if (data && scanParams) {
            const cd = __dirname.replace(/\\/g, '/');
            const olddir = cd.split('/');
            olddir.splice(olddir.length - 3, 3);
            const dir = `${olddir.join('/')}/src/scrapper`;

            if (!fs.existsSync(`${dir}`)) {
              fs.mkdirSync(`${dir}`, { recursive: true });
            }

            if (!fs.existsSync(`${dir}/images`)) {
              fs.mkdirSync(`${dir}/images`, { recursive: true });
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
              //tagexpireAt: addDays(30),
              tagexpireAt: moment().add(30, 'd').utc().format(),
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

            const cut = moment().valueOf();
            const imagesPath = data.images.map((img) => {
              lastGeneratedNo = lastGeneratedNo > 0 ? lastGeneratedNo + 1 : 1;
              const imgFile = Download(
                img.link,
                `${dir}/images/${
                  scanParams.locationName
                }_${moment().valueOf()}_${generatedLotNo}_${lastGeneratedNo}.jpeg`,
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
                updatedAt: moment.utc(moment()).format(),
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
                updatedAt: moment.utc(moment()).format(),
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
        console.log(error);
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
    const allLocations = await this.prismaService.location.findMany({});
    const isAuction = [];
    for (const auction of allLocations) {
      const isAuctionExist = await this.prismaService.auction.findFirst({
        where: {
          locid: auction.locid,
          startDate: {
            gte: moment
              .utc(
                moment().set({
                  hour: 0,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                }),
              )
              .format(),
          },
        },
      });

      if (isAuctionExist?.locid)
        isAuction.push({ locid: isAuctionExist?.locid });
    }
    if (isAuction.length === 0) {
      let arr = [];
      if (allLocations) {
        allLocations.map(async (row) => {
          const lastAuction = await this.prismaService.auction.findMany({
            where: {
              locid: row.locid,
            },
            orderBy: { startDate: 'desc' },
            take: 1,
          });

          const currDate = moment(lastAuction[0].endDate)
            .add(1, 'days')
            .format('YYYY-MM-DD');

          const futureMonthLast = moment().endOf('month');
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

          for (let i = 1, j = 0; i < remainingDays; i++) {
            const { newArr, n, m } = setFutureAuction(i, j, row, currDate);
            i = n;
            j = m;
            arr = [...arr, newArr];
          }

          await this.prismaService.auction.createMany({
            data: arr,
          });
          arr = [];
        });
      }
    } else {
      const filteredArray = allLocations.filter((value) => {
        return !isAuction.some((row) => {
          return row.locid === value.locid;
        });
      });

      let arr = [];
      if (filteredArray) {
        filteredArray.map(async (row) => {
          const lastAuction = await this.prismaService.auction.findMany({
            where: {
              locid: row.locid,
            },
            orderBy: { startDate: 'desc' },
            take: 1,
          });

          const currDate = moment(lastAuction[0].endDate)
            .add(1, 'days')
            .format('YYYY-MM-DD');
          const futureMonthLast = moment().endOf('month');
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

          for (let i = 1, j = 0; i < remainingDays; i++) {
            const { newArr, n, m } = setFutureAuction(i, j, row, currDate);
            i = n;
            j = m;
            arr = [...arr, newArr];
          }

          await this.prismaService.auction.createMany({
            data: arr,
          });
          arr = [];
        });
      }
    }
  }
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async deleteExpiredTag() {
    await this.prismaService.tags.deleteMany({
      where: {
        tagexpireAt: {
          lte: moment.utc(moment()).format(),
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async deletePastAuctionScanItems() {
    const pastAuctions = await this.prismaService.auction.findMany({
      where: {
        endDate: {
          lte: moment.utc(moment()).format(),
        },
      },
      orderBy: {
        endDate: 'desc',
      },
      include: {
        srappers: true,
        scannedItem: {
          include: {
            products: true,
          },
        },
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
      for (const scans of auction.scannedItem) {
        for (const products of scans.products) {
          const images = products.images;
          for (let i = 0; i < images.length; i++) {
            fs.unlink(images[i], (err) => {
              if (err) {
                this.logger.error(err);
              }
            });
          }
        }
      }
    }
  }
}
