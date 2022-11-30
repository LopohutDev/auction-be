import { Injectable, Logger } from '@nestjs/common';
import { Response as Res } from 'express';
import { Parser } from 'json2csv';
import * as fs from 'fs';
import { LOCATION } from 'src/constants/location.constants';
import {
  getScanReportBodyDto,
  getScanReportsDto,
  updateMarkDoneBodyDto,
} from 'src/dto/admin.reports.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { formatDate } from 'src/utils/formatDate.utils';
import { valdiateScanAuction } from 'src/validations/admin.scan.validations';
import { paginationDto } from 'src/dto/common.dto';
import { paginationHelperForAllData } from '../utils';
import * as AdmZip from 'adm-zip';
import { addDays, subDays } from 'src/utils/common.utils';
import {
  locationScansDallasDto,
  locationScansDto,
} from 'src/dto/user.scan.module.dto';
import { Products } from '@prisma/client';
import * as moment from 'moment';

@Injectable()
export class ScanReportsService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ScanReportsService.name);

  async getFailedScanByAuction(
    reportinfo: getScanReportBodyDto,
    pagination: paginationDto,
  ) {
    const { error } = valdiateScanAuction(reportinfo);
    if (error) {
      return { error };
    }
    const { location, auction, markdone } = reportinfo;
    const { page, limit, all } = pagination;
    try {
      const scanData = await this.prismaService.failedScans.findMany({
        where: {
          locid: location,
          auctionId: auction,
          markDone: markdone,
        },
      });
      const { data, pageCount } = paginationHelperForAllData(
        scanData,
        page,
        limit,
        all,
      );

      return { data, pageCount };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: error } };
    }
  }
  async updateMarkDone(markdoneinfo: updateMarkDoneBodyDto) {
    const { id, markdone } = markdoneinfo;
    try {
      const scanData = await this.prismaService.failedScans.update({
        where: {
          id: id,
        },
        data: { markDone: markdone },
      });
      return { success: true };
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
        orderBy: {
          lastcsvgenerated: 'desc',
        },
      });
      return { data };
    } catch (error) {
      this.logger.error(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async exportScrapperScans(
    scanReport: getScanReportBodyDto,
    isNewUploaded?: boolean,
  ) {
    const { auction, location } = scanReport;

    try {
      const AuctionData = await this.prismaService.auction.findFirst({
        where: { id: auction, locid: location, startNumber: { gte: 0 } },
        rejectOnNotFound: false,
      });

      if (!AuctionData) {
        return { error: { status: 404, message: 'Auction not found' } };
      }

      if (AuctionData.startDate < subDays(3) && !AuctionData.isRecover) {
        return {
          error: { status: 409, message: 'Auction has already passed.' },
        };
      }
      if (moment(AuctionData.endDate).format() < moment(subDays(0)).format()) {
        return {
          error: {
            status: 409,
            message: 'You can not create zip on recover auction',
          },
        };
      }
      /* if (AuctionData.startDate > new Date()) {
        return {
          error: { status: 409, message: 'Auction is not started yet' },
        };
      }*/

      const scrapperZip = await this.prismaService.scraperZip.findMany({
        where: {
          auctionId: auction,
          locid: location,
          createdAt: {
            // gte: new Date(new Date().setHours(0, 0, 0, 0)),
            gte: moment
              .utc(
                moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
              )
              .format(),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const newUploads = scrapperZip.filter((l) => l.isNewUploaded);
      const lastZip = scrapperZip[scrapperZip.length - 1];

      const duration = {
        gte: newUploads.length
          ? newUploads[newUploads.length - 1].lastcsvgenerated
          : moment
              .utc(
                moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
              )
              .format(),
        lte: moment.utc(moment()).format(),
      };

      console.log('duration', duration);

      const scannedData = await this.prismaService.scans.findMany({
        where: { createdAt: duration, locid: location, auctionId: auction },
        select: {
          locations: { select: { city: true } },
          //tags: { select: { tag: true } },
          products: true,
          tag: true,
          scannedName: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      console.log('scan', scannedData);

      if (!scannedData.length) {
        return { error: { status: 404, message: 'No Scanned Item Found!' } };
      }
      const username = [];
      const formattedData: locationScansDto[] = [];
      const formattedDataDalas: locationScansDallasDto[] = [];
      let json2csv;
      let CSV_FINAL;
      let description;
      //  return {scannedData:scannedData}
      try {
        scannedData.forEach((scan) => {
          username.push(scan.scannedName);
          const splitTag = scan.tag.split(/(\d+)/);
          if (scan.locations.city.toLowerCase() === LOCATION.SACRAMENTO) {
            description = scan.products[0]?.itemName
              ? `${splitTag[2]} -- ${scan.products[0]?.itemName} - ${scan.products[0]?.itemSize} - ${scan.products[0]?.description}`
              : `${splitTag[2]} -- ${scan.products[0]?.description}`;
            formattedData.push({
              lotNo: scan.products[0]?.lotNo,
              Title: `${splitTag[0]}${splitTag[1]}  ${scan.products[0]?.title} ${scan.products[0]?.itemName} ${scan.products[0]?.itemSize}`,
              Category: scan.products[0]?.category,
              Featured: 'N',
              QuantityAvailable: scan.products[0]?.quantity,
              StartingBid: scan.products[0]?.startingBid,
              NewLot: '',
              Description: description,
            });
            json2csv = new Parser({
              fields: Object.keys(formattedData[0]),
            });
            CSV_FINAL = json2csv.parse(formattedData);
          } else {
            description = scan.products[0]?.itemName
              ? `${splitTag[2]} -- ${scan.products[0]?.itemName} - ${scan.products[0]?.itemSize} - ${scan.products[0]?.description}`
              : `${splitTag[2]} -- ${scan.products[0]?.description}`;
            formattedDataDalas.push({
              LotNo: scan.products[0]?.lotNo,
              Quantity: scan.products[0]?.quantity,
              Title: `${splitTag[0]}${splitTag[1]}  ${scan.products[0]?.title} ${scan.products[0]?.itemName} ${scan.products[0]?.itemSize}`,
              Description1: description,
              Consignor: scan.products[0]?.consignor,
              StartBidEach: scan.products[0]?.startingBid,
            });
            json2csv = new Parser({
              fields: Object.keys(formattedDataDalas[0]),
            });
            CSV_FINAL = json2csv.parse(formattedDataDalas);
          }
        });
        console.log('push', formattedDataDalas);
        //    return { data: formattedDataDalas , error: { status: 200 , message: 'Null' } }
      } catch (error) {
        this.logger.error(error?.message || error);
        return { error: { status: 500, message: error } };
      }

      const unique = username.filter((item, i, ar) => ar.indexOf(item) === i);
      const user = unique.toString();
      const existingFileNameArr =
        scrapperZip.length &&
        lastZip.filePath
          .replace(/^.*[\\\/]/, '')
          .split('.')[0]
          .split('_');

      // Creation of CSV
      const zip = new AdmZip();
      // const json2csv = new Parser({ fields: Object.keys(formattedData[0]) });
      // const CSV_FINAL = json2csv.parse(formattedData);
      const lastNumber =
        existingFileNameArr &&
        parseInt(existingFileNameArr[existingFileNameArr.length - 1]);

      const currFormatDate = `${formatDate(new Date(AuctionData.endDate))}_${
        formatDate(new Date(lastZip?.createdAt || undefined)) ===
          formatDate(new Date()) && lastNumber
          ? lastZip && !lastZip.isNewUploaded
            ? lastNumber
            : lastNumber + 1
          : 1
      }`;

      const cd = __dirname.replace(/\\/g, '/');
      const olddir = cd.split('/');
      olddir.splice(olddir.length - 4, 4);
      const id =
        AuctionData.id.substring(0, 5) + AuctionData.startDate.getTime();
      const dir = `${olddir.join('/')}/src/scrapper/${id}`;

      console.log(dir);

      if (!fs.existsSync(`${dir}`)) {
        fs.mkdirSync(`${dir}`, { recursive: true });
      }

      if (!fs.existsSync(`${dir}/${currFormatDate}`)) {
        fs.mkdirSync(`${dir}/${currFormatDate}`, { recursive: true });
      }

      //Created csv File

      const scanProducts = scannedData.map((scan) => {
        return {
          productImg: scan.products[0].images,
          products: scan.products,
        };
      });

      const output = `${dir}/zipFiles/${currFormatDate}.zip`;

      if (!fs.existsSync(`${dir}/zipFiles`)) {
        fs.mkdirSync(`${dir}/zipFiles`, { recursive: true });
      }

      if (!fs.existsSync(`${dir}/images`)) {
        fs.mkdirSync(`${dir}/images`, { recursive: true });
      }

      if (lastZip && !lastZip.isNewUploaded) {
        const files = await fs.readdirSync(`${dir}/${currFormatDate}`);

        files.forEach((file) =>
          fs.unlinkSync(`${dir}/${currFormatDate}/${file}`),
        );
      }

      const products: Products[] = [];
      scanProducts.forEach((l) => {
        products.push(l.products[0]);
        const lotNo = l.products[0].lotNo;
        let no = 1;
        l.productImg.forEach((image) => {
          const imageSplit = image.split('.');
          const imageFileExe = imageSplit[imageSplit.length - 1];
          const imageFileName = lotNo + '_' + no + '.' + imageFileExe;
          fs.copyFileSync(image, `${dir}/${currFormatDate}/${imageFileName}`);
          no++;
        });
      });

      fs.writeFileSync(
        `${dir}/${currFormatDate}/${currFormatDate}.csv`,
        CSV_FINAL,
      );
      zip.addLocalFolder(`${dir}/${currFormatDate}`);
      zip.writeZip(output);
      // Log Successful Creation of Zip File
      this.logger.log('Create Zip File Success');

      const zipFilePath = fs.realpathSync(
        `${dir}/zipFiles/${currFormatDate}.zip`,
      );

      const scrapperZipData = {
        products: {
          connect: products.map((prod) => ({
            productId: prod.productId,
          })),
        },
        filePath: zipFilePath,
        lastcsvgenerated: moment.utc(moment()).format(),
        auction: {
          connect: {
            id: auction,
          },
        },
        isNewUploaded: isNewUploaded ? true : false,
        locations: {
          connect: {
            locid: location,
          },
        },
        scannedBy: user,
      };

      if (lastZip && !lastZip.isNewUploaded) {
        await this.prismaService.scraperZip.update({
          where: { id: lastZip.id },
          data: scrapperZipData,
        });
      } else {
        await this.prismaService.scraperZip.create({
          data: scrapperZipData,
        });
      }

      return {
        data: { status: 200, message: 'Generate Scan Report Success' },
      };
    } catch (error) {
      this.logger.error(error?.message || error);
      return { error: { status: 500, message: 'server error' } };
    }
  }

  async getZipScanReport(scanReportQuery: getScanReportsDto, res: Res) {
    try {
      const scanReport = await this.prismaService.scraperZip.findFirst({
        where: {
          id: Number(scanReportQuery.scrapperId),
          locid: scanReportQuery.location,
        },
        select: {
          filePath: true,
        },
      });

      if (scanReportQuery.isUploaded === 'true') {
        await this.prismaService.scraperZip.update({
          where: {
            id: Number(scanReportQuery.scrapperId),
          },
          data: {
            isNewUploaded: true,
            lastcsvgenerated: moment.utc(moment()).format(),
          },
        });
      }

      const zip = new AdmZip(scanReport.filePath);
      const data = zip.toBuffer();
      const cd = scanReport.filePath.replace(/\\/g, '/');
      const splittedFilePath = cd.split('/');
      const fileName = splittedFilePath[splittedFilePath.length - 1].toString();

      res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-length', data.length.toString());
      res.send(data);

      return { data: { status: 200, message: 'Download is Starting' } };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
