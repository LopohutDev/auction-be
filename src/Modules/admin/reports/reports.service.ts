import { Injectable, Logger } from '@nestjs/common';
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
    const { location } = locquery;
    try {
      const isLocationExists = await this.prismaService.location.findUnique({
        where: { locid: location },
        rejectOnNotFound: false,
      });
      if (!isLocationExists) {
        return { error: { status: 404, message: 'Invalid location' } };
      }
      const data = await this.prismaService.location.findFirst({
        where: {
          locid: { equals: location },
          Scanned: { some: { createdAt: { lte: new Date() } } },
        },
        select: {
          assigneduser: {
            select: {
              firstname: true,
              lastname: true,
              _count: { select: { scanProducts: true } },
            },
          },
          Scanned: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              createdAt: true,
              ScanId: true,
              barcode: true,
              scannedUser: { select: { firstname: true, lastname: true } },
              status: true,
            },
          },
          _count: {
            select: {
              assigneduser: true,
              Scanned: true,
            },
          },
        },
      });

      if (!data) {
        return { error: { status: 404, message: 'No Scans Exists' } };
      }

      return {
        data,
      };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async allScans(allScanQuery: getScanQueryDto) {
    const { page, limit, location } = allScanQuery;

    const allData = await this.prismaService.location.findUnique({
      where: {
        locid: location,
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
      },
    });

    if (!allData) {
      return { error: { status: 404, message: 'No Scans Exists' } };
    }
    const { data, pageCount } = paginationHelper(allData?.Scanned, page, limit);

    return { data, pageCount };
  }
}
