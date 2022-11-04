import { Injectable, Logger } from '@nestjs/common';
import { AccountEnum } from '@prisma/client';
import {
  getReportsQueryDto,
  getScanQueryDto,
} from 'src/dto/admin.reports.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { paginationHelper } from '../utils';

@Injectable()
export class ReportsService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ReportsService.name);

  async getReports(locquery: getReportsQueryDto) {
    const { location, range } = locquery;
    try {
      const isLocationExists = await this.prismaService.location.findUnique({
        where: { locid: location },
        rejectOnNotFound: false,
      });
      if (!isLocationExists) {
        return { error: { status: 404, message: 'Invalid location' } };
      }
      let firstDay;
      let lastDay;
      const date = new Date();
      const currentYear = date.getFullYear();
      switch (range) {
        case 'this-month':
          firstDay = new Date(currentYear, date.getMonth(), 1);
          lastDay = new Date(currentYear, date.getMonth() + 1, 0);
          break;
        case 'this-year':
          firstDay = new Date(currentYear, 0, 1);
          lastDay = new Date(currentYear, 11, 31);
          break;
        case 'this-week':
          firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
          lastDay = new Date(date.setDate(date.getDate() - date.getDay() + 6));
          break;
        case 'last-month':
          firstDay = new Date(currentYear, date.getMonth() - 1, 1);
          lastDay = new Date(currentYear, date.getMonth(), 0);
          break;
        case 'last-year':
          const previousYear = currentYear - 1;
          firstDay = new Date(previousYear, 0, 1);
          lastDay = new Date(previousYear, 11, 31);
          break;
        case 'last-week':
          lastDay = new Date(date.setDate(date.getDate() - date.getDay() - 1));
          firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
          break;
        default:
          break;
      }
      let data;
      if (range == 'today') {
        data = await this.prismaService.location.findFirst({
          where: {
            locid: { equals: location },
          },
          select: {
            assigneduser: {
              select: {
                firstname: true,
                lastname: true,
                email: true,
              },
              where: {
                createdAt: {
                  equals: new Date(),
                },
                account: { equals: AccountEnum.ACCEPTED },
              },
            },
            Scanned: {
              where: {
                createdAt: {
                  equals: new Date(),
                },
              },
            },
            failedScans: {
              where: {
                createdAt: {
                  equals: new Date(),
                },
              },
            },
          },
        });
        userData = await this.prismaService.location.findFirst({
          where: {
            locid: { equals: location },
          },
          select: {
            assigneduser: {
              where: {
                account: { equals: AccountEnum.ACCEPTED },
              },
              select: {
                firstname: true,
                lastname: true,
                email: true,
                scanProducts: {
                  where: {
                    createdAt: {
                      equals: new Date(),
                    },
                  },
                },
                failedScans: {
                  where: {
                    createdAt: {
                      equals: new Date(),
                    },
                  },
                },
              },
            },
          },
        });
      } else {
        data = await this.prismaService.location.findFirst({
          where: {
            locid: { equals: location },
          },
          select: {
            assigneduser: {
              select: {
                firstname: true,
                lastname: true,
                email: true,
              },
              where: {
                createdAt: {
                  gte: firstDay,
                  lte: lastDay,
                },
                account: { equals: AccountEnum.ACCEPTED },
              },
            },
            Scanned: {
              where: {
                createdAt: {
                  gte: firstDay,
                  lte: lastDay,
                },
              },
            },
            failedScans: {
              where: {
                createdAt: {
                  gte: firstDay,
                  lte: lastDay,
                },
              },
            },
          },
        });
        userData = await this.prismaService.location.findFirst({
          where: {
            locid: { equals: location },
          },
          select: {
            assigneduser: {
              where: {
                account: { equals: AccountEnum.ACCEPTED },
              },
              select: {
                firstname: true,
                lastname: true,
                email: true,
                scanProducts: {
                  where: {
                    createdAt: {
                      gte: firstDay,
                      lte: lastDay,
                    },
                  },
                },
                failedScans: {
                  where: {
                    createdAt: {
                      gte: firstDay,
                      lte: lastDay,
                    },
                  },
                },
              },
            },
          },
        });
      }
      const allData = await this.prismaService.location.findFirst({
        where: {
          locid: { equals: location },
        },
        select: {
          Scanned: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              createdAt: true,
              ScanId: true,
              barcode: true,
              scannedUser: { select: { firstname: true, lastname: true } },
            },
          },
          failedScans: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              createdAt: true,
              failedScanId: true,
              barcode: true,
              scannedUser: { select: { firstname: true, lastname: true } },
            },
          },
        },
      });

      const failedScans = allData.failedScans;
      const Scanned = allData.Scanned;
      const mergdata = [...Scanned, ...failedScans];
      const sortedDesc = mergdata.sort(
        (objA, objB) => Number(objB.createdAt) - Number(objA.createdAt),
      );
      const latestScan = sortedDesc.splice(0, 10);
      const user = data.assigneduser.length;
      const successScan = data.Scanned.length;
      const failedScan = data.failedScans.length;
      const barcode = successScan + failedScan;
      const usersList = userData.assigneduser.map((row) => {
        return {
          ...row,
          totalScan: row.scanProducts?.length + row.failedScans?.length,
        };
      });
      if (!data) {
        return { error: { status: 404, message: 'No Scans Exists' } };
      }
      return {
        data,
        user,
        successScan,
        failedScan,
        barcode,
        latestScan,
        usersList,
      };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async allScans(allScanQuery: getScanQueryDto) {
    const { page, limit, location } = allScanQuery;

    const allData = await this.prismaService.location.findFirst({
      where: {
        locid: { equals: location },
      },
      select: {
        Scanned: {
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            ScanId: true,
            barcode: true,
            scannedUser: { select: { firstname: true, lastname: true } },
          },
        },
        failedScans: {
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            failedScanId: true,
            barcode: true,
            scannedUser: { select: { firstname: true, lastname: true } },
          },
        },
      },
    });
    const failedScans = allData.failedScans;
    const Scanned = allData.Scanned;
    const mergdata = [...Scanned, ...failedScans];
    if (!allData) {
      return { error: { status: 404, message: 'No Scans Exists' } };
    }
    const { data, pageCount } = paginationHelper(mergdata, page, limit);

    return { data, pageCount };
  }
}
