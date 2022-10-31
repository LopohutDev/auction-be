import { Injectable, Logger } from '@nestjs/common';
import { BarcodeData } from 'src/Cache/BarCodes';
import { Jobs } from 'src/Cache/Jobs';
import { SCANENV } from 'src/constants/common.constants';
import { ScanQueryDto } from 'src/dto/user.scan.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { addDays } from 'src/utils/common.utils';
import { uuid } from 'src/utils/uuid.utils';
import { validateUserScan } from 'src/validations/user.scans.validations';
import { getScrapperData } from './scrapper.utils';

@Injectable()
export class ScanService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ScanService.name);

  async getScanProduct(scaninfo: ScanQueryDto) {
    const { item, error } = validateUserScan(scaninfo);
    if (error) {
      return { error };
    }
    const islocationExists = await this.prismaService.location.findFirst({
      where: {
        Warehouses: { some: { areaname: item.areaname } },
        locationItem: { some: { itemname: item.itemtype } },
      },
    });
    if (!islocationExists) {
      return { error: { status: 404, message: 'Invalid Location' } };
    }
    const { data } = BarcodeData.get(item.barcode);
    if (data) {
      return { error: { status: 409, message: 'Already scanned product' } };
    }
    const isAuctionExists = await this.prismaService.auction.findUnique({
      where: { id: item.auction },
      rejectOnNotFound: false,
    });

    if (!isAuctionExists) {
      return { error: { status: 404, message: 'Invalid auction' } };
    }

    if (new Date(isAuctionExists.endDate).valueOf() < new Date().valueOf()) {
      return { error: { status: 500, message: 'Auction is already finished' } };
    }

    const userdata = await this.prismaService.user.findUnique({
      where: { email: scaninfo.email },
    });

    const values = {
      barcode: item.barcode,
      key: process.env[SCANENV],
    };
    const {
      default: { get },
    } = await import('axios');
    try {
      const { data } = await get('https://api.barcodelookup.com/v3/products', {
        params: values,
      });
      if (data) {
        const fetchStartNo = await this.prismaService.auction.findUnique({
          where: { id: item.auction },
          select: {
            startNumber: true,
          },
        });
        let startNumber = fetchStartNo.startNumber;
        let tag = item.areaname + fetchStartNo.startNumber + item.itemtype;
        const checkTag = await this.prismaService.tags.findFirst({
          where: {
            tag: tag,
            tagexpireAt: {
              gte: new Date(),
            },
          },
          select: { tag: true, auctionStartNo: true },
        });
        if (checkTag) {
          const fetchAuctionSNo = await this.prismaService.tags.findMany({
            where: {
              auctionId: item.auction,
              tagexpireAt: {
                gte: new Date(),
              },
            },
            orderBy: { id: 'desc' },
            take: 1,
            select: {
              auctionStartNo: true,
            },
          });
          if (fetchAuctionSNo) {
            const checkTagAgian = await this.prismaService.tags.findFirst({
              where: {
                tag: tag,
                tagexpireAt: {
                  gte: new Date(),
                },
              },
              select: { tag: true, auctionStartNo: true },
            });
            if (checkTagAgian) {
              const fetchSNo = await this.prismaService.tags.findMany({
                where: {
                  tagexpireAt: {
                    gte: new Date(),
                  },
                },
                orderBy: { id: 'desc' },
                take: 1,
                select: {
                  auctionStartNo: true,
                },
              });
              const num = fetchSNo[0].auctionStartNo + 1;
              tag = item.areaname + num + item.itemtype;
              startNumber = num;
            } else {
              const num = fetchAuctionSNo[0].auctionStartNo + 1;
              tag = item.areaname + num + item.itemtype;
              startNumber = num;
            }
          }
        }
        await this.prismaService.tags.create({
          data: {
            tag: tag,
            auctionId: item.auction,
            tagexpireAt: addDays(30),
            auctionStartNo: startNumber,
          },
        });
        const lastInsertId = await this.prismaService.tags.findFirst({
          orderBy: { id: 'desc' },
          take: 1,
          select: {
            id: true,
          },
        });
        const params = {
          barcode: item.barcode,
          areaname: item.areaname,
          locationItemId: item.itemtype,
          auctionId: item.auction,
          userid: userdata.id,
          username: userdata.firstname + ' ' + userdata.lastname,
          locid: islocationExists.locid,
          tag: tag,
          autionStartNo: startNumber,
          lastInsertId: lastInsertId.id,
        };
        Jobs.set(() => getScrapperData(data, params));
        return {
          data: {
            message:
              'The item was successfully submitted. The tag number is: ' + tag,
          },
        };
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        return { error: { status: 404, message: 'Something went wrong' } };
      }
      return { error: { status: 500, message: 'Some error occured' } };
    }
  }

  async createFailedProducts(scaninfo: ScanQueryDto) {
    const { item, error } = validateUserScan(scaninfo, true);
    if (error) {
      return { error };
    }
    try {
      const islocationExists = await this.prismaService.location.findFirst({
        where: {
          Warehouses: { some: { areaname: item.areaname } },
          locationItem: { some: { itemname: item.itemtype } },
        },
      });
      if (!islocationExists) {
        return { error: { status: 404, message: 'Invalid Location' } };
      }
      const isAuctionExists = await this.prismaService.auction.findUnique({
        where: { id: item.auction },
        rejectOnNotFound: false,
      });
      if (!isAuctionExists) {
        return { error: { status: 404, message: 'Invalid auction' } };
      }

      if (new Date(isAuctionExists.endDate).valueOf() < new Date().valueOf()) {
        return {
          error: { status: 500, message: 'Auction is already finished' },
        };
      }

      const userdata = await this.prismaService.user.findUnique({
        where: { email: scaninfo.email },
      });
      // const lastScannedItem = await this.prismaService.failedScans.findMany({
      //   orderBy: { id: 'desc' },
      //   take: 1,
      // });
      const fetchStartNo = await this.prismaService.auction.findUnique({
        where: { id: item.auction },
        select: {
          startNumber: true,
        },
      });
      let startNumber = fetchStartNo.startNumber;
      let tag = item.areaname + fetchStartNo.startNumber + item.itemtype;
      const checkTag = await this.prismaService.tags.findFirst({
        where: {
          tag: tag,
          tagexpireAt: {
            gte: new Date(),
          },
        },
        select: { tag: true, auctionStartNo: true },
      });
      if (checkTag) {
        const fetchAuctionSNo = await this.prismaService.tags.findMany({
          where: {
            auctionId: item.auction,
            tagexpireAt: {
              gte: new Date(),
            },
          },
          orderBy: { id: 'desc' },
          take: 1,
          select: {
            auctionStartNo: true,
          },
        });
        if (fetchAuctionSNo) {
          const checkTagAgian = await this.prismaService.tags.findFirst({
            where: {
              tag: tag,
              tagexpireAt: {
                gte: new Date(),
              },
            },
            select: { tag: true, auctionStartNo: true },
          });
          if (checkTagAgian) {
            const fetchSNo = await this.prismaService.tags.findMany({
              where: {
                tagexpireAt: {
                  gte: new Date(),
                },
              },
              orderBy: { id: 'desc' },
              take: 1,
              select: {
                auctionStartNo: true,
              },
            });
            const num = fetchSNo[0].auctionStartNo + 1;
            tag = item.areaname + num + item.itemtype;
            startNumber = num;
          } else {
            const num = fetchAuctionSNo[0].auctionStartNo + 1;
            tag = item.areaname + num + item.itemtype;
            startNumber = num;
          }
        }
      }
      // const lastScannedIndex = lastScannedItem[0]?.id + 1 || 1;
      const FailedScanData = {
        failedScanId: uuid(),
        tag: tag,
        auctionId: item.auction,
        locid: islocationExists.locid,
        scannedBy: userdata.id,
        scannedName: userdata.firstname + '' + userdata.lastname,
        tagexpireAt: addDays(30),
        barcode: scaninfo.barcode,
      };
      if (!item.barcode) {
        await this.prismaService.tags.create({
          data: {
            tag: tag,
            auctionId: item.auction,
            tagexpireAt: addDays(30),
            auctionStartNo: startNumber,
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
            ...FailedScanData,
            failedStatus: 'DONE',
            rejectedReason: 'The Program could not read barcode',
          },
        });
        await this.prismaService.tags.update({
          where: {
            id: lastInsertId.id,
          },
          data: {
            failedScanId: FailedScanData.failedScanId,
          },
        });
        return {
          data: {
            message:
              'The item reported as a failed scan. The tag number is: ' + tag,
          },
        };
      }
      await this.prismaService.tags.create({
        data: {
          tag: tag,
          auctionId: item.auction,
          tagexpireAt: addDays(30),
          auctionStartNo: startNumber,
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
          ...FailedScanData,
          failedStatus: 'DONE',
          rejectedReason: 'Some other issue occur',
        },
      });
      await this.prismaService.tags.update({
        where: {
          id: lastInsertId.id,
        },
        data: {
          failedScanId: FailedScanData.failedScanId,
        },
      });
      return {
        data: {
          message:
            'The item reported as a failed scan. The tag number is: ' + tag,
        },
      };
    } catch (error) {
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
