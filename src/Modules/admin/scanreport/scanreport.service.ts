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
import { paginationHelper, paginationHelperForAllData } from '../utils';
import * as AdmZip from 'adm-zip';

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
      return { error: { status: 500, message: 'Server error' } };
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
      });
      return { data };
    } catch (error) {
      this.logger.error(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async exportScrapperScans(scanReport: getScanReportBodyDto) {
    const { auction, location } = scanReport;

    try {
      const scrapperZip = await this.prismaService.scraperZip.findMany({
        where: {
          auctionId: auction,
        },
        select: {
          filePath: true,
          isNewUploaded: true,
          products: true,
          createdAt: true,
          lastcsvgenerated: true,
          id: true,
        },
      });

      const data = await this.prismaService.location.findFirst({
        where: {
          locid: location,
          Scanned: {
            some: {
              auctionId: auction,
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
              products: true,
            },
          },
          scapper: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              filePath: true,
              createdAt: true,
            },
            where: {
              isNewUploaded: true,
            },
          },
        },
      });

      if (!data) {
        return { error: { status: 404, message: 'No Data Found' } };
      }

      const formattedData = [];
      data.Scanned.forEach((scan) => {
        scan.products.forEach((prod) => {
          if (data.city === LOCATION.HOUSTON || LOCATION.DALLAS) {
            formattedData.push({
              lotNo: prod.lotNo,
              Quantity: prod.quantity,
              Title: `${scan.tag} + ${prod.title}`,
              Description: prod.description,
              Consignor: prod.consignor,
              StartBidEach: prod.startingBid,
            });
          } else {
            formattedData.push({
              lotNo: prod.lotNo,
              Title: `${scan.tag} + ${prod.title}`,
              Category: prod.category,
              Featured: 'N',
              QuantityAvailable: scan.products[0].quantity,
              StartingBid: scan.products[0].startingBid,
              NewLot: '',
              Description: scan.products[0].description,
            });
          }
        });
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
      const zip = new AdmZip();
      const json2csv = new Parser({ fields: Object.keys(formattedData[0]) });
      const CSV_FINAL = json2csv.parse(formattedData);
      const lastNumber =
        existingFileNameArr &&
        parseInt(existingFileNameArr[existingFileNameArr.length - 1]);

      const currFormatDate = `${formatDate(new Date())}_${
        formatDate(new Date(data?.scapper[0]?.createdAt || undefined)) ===
          formatDate(new Date()) && lastNumber
          ? lastNumber + 1
          : 1
      }`;

      const olddir = __dirname.split('/');
      olddir.splice(olddir.length - 4, 4);
      const dir = `${olddir.join('/')}/src/scrapper`;

      if (!fs.existsSync(`${dir}`)) {
        fs.mkdirSync(`${dir}`);
      }

      if (!fs.existsSync(`${dir}/${currFormatDate}`)) {
        fs.mkdirSync(`${dir}/${currFormatDate}`);
      }

      //Created csv File
      fs.writeFileSync(
        `${dir}/${currFormatDate}/${currFormatDate}.csv`,
        CSV_FINAL,
      );

      if (auction) {
        if (
          scrapperZip[scrapperZip.length - 1] === null ||
          scrapperZip[scrapperZip.length - 1] === undefined
        ) {
          if (!data.Scanned) {
            return { error: { status: 406, message: 'No Scans Exist!' } };
          }

          const scanProducts = data.Scanned.map((scan) => {
            const prodImages = scan.products.map((prod) => {
              return { images: prod.images, productId: prod.productId };
            });
            return { productImg: prodImages, products: scan.products };
          });

          const output = `${dir}/zipFiles/${currFormatDate}.zip`;

          if (!fs.existsSync(`${dir}/zipFiles`)) {
            fs.mkdirSync(`${dir}/zipFiles`);
          }

          if (!fs.existsSync(`${dir}/images`)) {
            fs.mkdirSync(`${dir}/images`);
          }

          const products = [];

          if (scanProducts.length > 0) {
            scanProducts.forEach((scanProd) => {
              scanProd.products.forEach((prod) => {
                // product checking
                products.push(prod);

                prod.images.forEach((image) => {
                  const imageSplit = image.split('/');
                  const imageFileName = imageSplit[imageSplit.length - 1];
                  fs.copyFileSync(
                    image,
                    `${dir}/${currFormatDate}/${imageFileName}`,
                  );
                });
              });
            });
          }

          zip.addLocalFolder(`${dir}/${currFormatDate}`);
          zip.writeZip(output);
          // Log Successful Creation of Zip File
          this.logger.log('Create Zip File Success');

          const zipFilePath = fs.realpathSync(
            `${dir}/zipFiles/${currFormatDate}.zip`,
          );

          await this.prismaService.scraperZip.create({
            data: {
              products: {
                connect: products.map((prod) => ({
                  productId: prod.productId,
                })),
              },
              filePath: zipFilePath,
              lastcsvgenerated: new Date(),
              auction: {
                connect: {
                  id: auction,
                },
              },
              isNewUploaded: false,
              locations: {
                connect: {
                  locid: location,
                },
              },
            },
          });
        } else {
          if (scrapperZip[scrapperZip.length - 1]?.isNewUploaded === false) {
            if (!data.Scanned) {
              return { error: { status: 406, message: 'No Scans Exist!' } };
            }

            const filteredData = data.Scanned.filter((filData) => {
              if (
                new Date(filData.createdAt) >
                (new Date(
                  scrapperZip[scrapperZip.length - 2]?.lastcsvgenerated,
                ) ||
                  new Date(
                    scrapperZip[scrapperZip.length - 1]?.lastcsvgenerated,
                  ))
              ) {
                return true;
              }
              return false;
            });

            const scanProducts = filteredData.map((scan) => {
              const prodImages = scan.products.map((prod) => {
                return { images: prod.images, productId: prod.productId };
              });
              return { productImg: prodImages, products: scan.products };
            });

            const output = `${dir}/zipFiles/${currFormatDate}.zip`;

            if (!fs.existsSync(`${dir}/zipFiles`)) {
              fs.mkdirSync(`${dir}/zipFiles`);
            }

            if (!fs.existsSync(`${dir}/images`)) {
              fs.mkdirSync(`${dir}/images`);
            }

            const products = scrapperZip[scrapperZip.length - 1].products;

            if (scanProducts.length > 0) {
              scanProducts.forEach((scanProd) => {
                scanProd.products.forEach((prod) => {
                  // product checking
                  scrapperZip[scrapperZip.length - 1].products.forEach(
                    (scrapProd) => {
                      if (scrapProd.productId !== prod.productId) {
                        products.push(prod);
                      }
                    },
                  );

                  prod.images.forEach((image) => {
                    const imageSplit = image.split('/');
                    const imageFileName = imageSplit[imageSplit.length - 1];
                    fs.copyFileSync(
                      image,
                      `${dir}/${currFormatDate}/${imageFileName}`,
                    );
                  });
                });
              });
            }

            zip.addLocalFolder(`${dir}/${currFormatDate}`);
            zip.writeZip(output);

            await this.prismaService.scraperZip.update({
              where: {
                id: scrapperZip[scrapperZip.length - 1].id,
              },
              data: {
                products: {
                  connect: products.map((prod) => ({
                    productId: prod.productId,
                  })),
                },
                lastcsvgenerated: new Date(),
              },
            });

            return {
              data: { status: 200, message: 'Updated Scan Reports' },
            };
          } else if (
            scrapperZip[scrapperZip.length - 1].isNewUploaded === true
          ) {
            if (!data.Scanned) {
              return { error: { status: 406, message: 'No Scans Exist!' } };
            }

            const filteredData = data.Scanned.filter((filData) => {
              if (
                new Date(filData.createdAt) >
                (new Date(
                  scrapperZip[scrapperZip.length - 2]?.lastcsvgenerated,
                ) ||
                  new Date(
                    scrapperZip[scrapperZip.length - 1]?.lastcsvgenerated,
                  ))
              ) {
                return true;
              }
              return false;
            });

            const scanProducts = filteredData.map((scan) => {
              const prodImages = scan.products.map((prod) => {
                return { images: prod.images, productId: prod.productId };
              });
              return { productImg: prodImages, products: scan.products };
            });

            const output = `${dir}/zipFiles/${currFormatDate}.zip`;

            if (!fs.existsSync(`${dir}/zipFiles`)) {
              fs.mkdirSync(`${dir}/zipFiles`);
            }

            if (!fs.existsSync(`${dir}/images`)) {
              fs.mkdirSync(`${dir}/images`);
            }

            const products = scrapperZip[scrapperZip.length - 1].products;

            if (scanProducts.length > 0) {
              scanProducts.forEach((scanProd) => {
                scanProd.products.forEach((prod) => {
                  // product checking
                  scrapperZip[scrapperZip.length - 1].products.forEach(
                    (scrapProd) => {
                      if (scrapProd.productId !== prod.productId) {
                        products.push(prod);
                      }
                    },
                  );

                  prod.images.forEach((image) => {
                    const imageSplit = image.split('/');
                    const imageFileName = imageSplit[imageSplit.length - 1];
                    fs.copyFileSync(
                      image,
                      `${dir}/${currFormatDate}/${imageFileName}`,
                    );
                  });
                });
              });
            }

            zip.addLocalFolder(`${dir}/${currFormatDate}`);
            zip.writeZip(output);
            // Log Successful Creation of Zip File
            this.logger.log('Create Zip File Success');

            const zipFilePath = fs.realpathSync(
              `${dir}/zipFiles/${currFormatDate}.zip`,
            );

            if (scrapperZip[scrapperZip.length - 1].isNewUploaded === true) {
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
                  products: {
                    connect: products.map((prod) => ({
                      productId: prod.productId,
                    })),
                  },
                  locations: {
                    connect: {
                      locid: location,
                    },
                  },
                },
              });
            } else {
              await this.prismaService.scraperZip.update({
                where: {
                  id: scrapperZip[scrapperZip.length - 1].id,
                },
                data: {
                  products: {
                    set: products,
                  },
                  isNewUploaded: true,
                },
              });
            }
          } else {
            return {
              error: {
                status: 500,
                message:
                  'Error updating the zip file \n Possible Cause: \n - isNewUploaded is true',
              },
            };
          }
        }
      }

      return { data: { status: 200, message: 'Generate Scan Report Success' } };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
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
          },
        });
      }

      const zip = new AdmZip(scanReport.filePath);
      const data = zip.toBuffer();
      const splittedFilePath = scanReport.filePath.split('/');
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
