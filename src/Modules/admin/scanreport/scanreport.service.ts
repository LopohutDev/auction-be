import { Injectable, Logger } from '@nestjs/common';
import { Response as Res } from 'express';
import { Parser } from 'json2csv';
import * as fs from 'fs';
import * as archiver from 'archiver';
import { LOCATION } from 'src/constants/location.constants';
import {
  exportScanReportBodyDto,
  getScanReportBodyDto,
  ScannedFailedStatus,
} from 'src/dto/admin.reports.module.dto';
import { ScanDataReturnDto } from 'src/dto/user.scan.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { formatDate } from 'src/utils/formatDate.utils';
import { valdiateScanAuction } from 'src/validations/admin.scan.validations';

@Injectable()
export class ScanReportsService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ScanReportsService.name);

  async getFailedScanByAuction(
    reportinfo: getScanReportBodyDto,
  ): Promise<ScanDataReturnDto> {
    const { error } = valdiateScanAuction(reportinfo);
    if (error) {
      return { error };
    }
    const { location, auction } = reportinfo;
    try {
      const data = await this.prismaService.scans.findMany({
        where: {
          locid: location,
          auctionId: auction,
          failedStatus: ScannedFailedStatus.DONE,
        },
      });
      return { data };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async getScrapperScans(reportinfo: getScanReportBodyDto) {
    const { error } = valdiateScanAuction(reportinfo);
    if (error) {
      return { error };
    }
    const { location, auction } = reportinfo;
    try {
      const data = await this.prismaService.scraperZip.findMany({
        where: { auctionId: auction, locid: location },
      });
      return { data };
    } catch (error) {
      this.logger.error(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async exportScrapperScans(scanReport: exportScanReportBodyDto, res: Res) {
    const { auction, location, isNewReport } = scanReport;

    try {
      const data = await this.prismaService.location.findFirst({
        where: {
          locid: { equals: location },
          Scanned: {
            every: {
              auctionId: {
                equals: auction,
              },
            },
          },
        },
        select: {
          city: true,
          Scanned: {
            orderBy: { createdAt: 'desc' },
            select: {
              createdAt: true,
              ScanId: true,
              barcode: true,
              tag: true,
              scannedUser: { select: { firstname: true, lastname: true } },
              products: {
                select: {
                  lotNo: true,
                  title: true,
                  category: true,
                  description: true,
                  quantity: true,
                  barcode: true,
                  startingBid: true,
                  consignor: true,
                },
              },
            },
          },
          scapper: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              filePath: true,
            },
            where: {
              isNewUploaded: true,
            },
          },
        },
      });

      const formattedData = data.Scanned.map((scan) => {
        const prod = scan.products;

        if (data.city === LOCATION.HOUSTON || LOCATION.DALLAS) {
          return {
            lotNo: prod.lotNo,
            Quantity: prod.quantity,
            Title: `${scan.tag} + ${prod.title}`,
            Description: prod.description,
            Consignor: prod.consignor,
            StartBidEach: prod.startingBid,
          };
        }

        return {
          lotNo: prod.lotNo,
          Title: `${scan.tag} + ${prod.title}`,
          Category: prod.category,
          Featured: 'N',
          QuantityAvailable: scan.products.quantity,
          StartingBid: scan.products.startingBid,
          NewLot: '',
          Description: scan.products.description,
        };
      });

      if (!formattedData) {
        return { error: { status: 404, message: 'No Scans Exists' } };
      }

      const existingFileNameArr =
        data.scapper[0] &&
        data.scapper[0].filePath
          .replace(/^.*[\\\/]/, '')
          .split('.')[0]
          .split('_');

      // Creation of CSV
      const json2csv = new Parser({ fields: Object.keys(formattedData[0]) });
      const CSV_FINAL = json2csv.parse(formattedData);
      const lastNumber =
        existingFileNameArr &&
        parseInt(existingFileNameArr[existingFileNameArr.length - 1]);
      const currFormatDate = `${formatDate(new Date())}_${
        lastNumber ? lastNumber + 1 : 1
      }`;
      const dir = `./src/scrapper/`;
      const archive = archiver('zip');
      if (!fs.existsSync(`${dir}/${currFormatDate}`)) {
        fs.mkdirSync(`${dir}/${currFormatDate}`);
      }

      //Created csv File
      fs.writeFileSync(
        `${dir}/${currFormatDate}/${currFormatDate}.csv`,
        CSV_FINAL,
      );

      if (isNewReport && auction) {
        // Zipper

        const output = fs.createWriteStream(
          `${dir}/zipFiles/${currFormatDate}.zip`,
        );

        output.on('close', () => {
          console.log(archive.pointer() + ' total bytes');
        });
        archive.on('error', (err: archiver.ArchiverError) => {
          throw err;
        });
        archive.pipe(output);
        archive.directory(`${dir}/${currFormatDate}`, false);
        await archive.finalize();

        const zipFilePath = fs.realpathSync(
          `${dir}/zipFiles/${currFormatDate}.zip`,
        );

        await this.prismaService.scraperZip.create({
          data: {
            filePath: zipFilePath,
            lastcsvgenerated: new Date(),
            auction: {
              connect: {
                id: auction,
              },
            },
            isNewUploaded: true,
            locations: {
              connect: {
                locid: location,
              },
            },
          },
        });
      }

      res.setHeader(
        'Content-disposition',
        `attachment; filename=${currFormatDate}.csv`,
      );
      res.set('Content-Type', 'text/csv');
      res.status(200).send(CSV_FINAL);

      return { data: formattedData };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
