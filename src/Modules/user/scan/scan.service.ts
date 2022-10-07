import { Injectable, Logger } from '@nestjs/common';
import { BarcodeData } from 'src/Cache/BarCodes';
import { Jobs } from 'src/Cache/Jobs';
import { SCANENV } from 'src/constants/common.constants';
import { ScanQueryDto } from 'src/dto/user.scan.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { addDays } from 'src/utils/common.utils';
import { uuid } from 'src/utils/uuid.utils';
import { validateUserScan } from 'src/validations/user.scans.validations';
import { getLotNo, getScrapperData } from './scrapper.utils';

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
    const isProductAlreadyScanned = await this.prismaService.scans.findUnique({
      where: { barcode: item.barcode },
      rejectOnNotFound: false,
    });
    if (isProductAlreadyScanned) {
      return { error: { status: 409, message: 'Product already scanned' } };
    }
    const userdata = await this.prismaService.user.findUnique({
      where: { email: scaninfo.email },
    });
    const params = {
      barcode: item.barcode,
      areaname: item.areaname,
      locationItemId: item.itemtype,
      auctionId: item.auction,
      userid: userdata.id,
      username: userdata.firstname + ' ' + userdata.lastname,
      locid: islocationExists.locid,
    };

    BarcodeData.set(item.barcode, {}, 300);

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

      Jobs.set(() => getScrapperData(data, params));
      return { data: { message: 'Scan Product Job Started' } };
    } catch (err) {
      console.log('err?.response?.status>>>>>>>>>>>>', err);
      if (err?.response?.status === 404) {
        return { error: { status: 404, message: 'No product found' } };
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

      const userdata = await this.prismaService.user.findUnique({
        where: { email: scaninfo.email },
      });
      const lastScannedItem = await this.prismaService.scans.findMany({
        orderBy: { id: 'desc' },
        take: 1,
      });

      const lastScannedIndex = lastScannedItem[0]?.id + 1 || 1;
      const ScanData = {
        ScanId: uuid(),
        tag: item.areaname + lastScannedIndex + item.itemtype,
        auctionId: item.auction,
        locid: islocationExists.locid,
        scannedBy: userdata.id,
        scannedName: userdata.firstname + '' + userdata.lastname,
        tagexpireAt: addDays(30),
        // barcode: uuid(),
        barcode: scaninfo.barcode,
      };
      if (!item.barcode) {
        await this.prismaService.scans.create({
          data: {
            ...ScanData,
            status: 'FAILED',
            rejectedreason: 'The Program could not read barcode',
          },
        });
        return { data: { message: 'Successfully marked as failed' } };
      }
      const isProductAlreadyScanned = await this.prismaService.scans.findUnique(
        {
          where: { barcode: item.barcode },
          rejectOnNotFound: false,
        },
      );
      if (isProductAlreadyScanned) {
        return { error: { status: 409, message: 'Product already scanned' } };
      }

      await this.prismaService.scans.create({
        data: {
          ...ScanData,
          status: 'FAILED',
          rejectedreason: 'Some other issue occur',
        },
      });
      return { data: { message: 'Successfully marked as failed' } };
    } catch (error) {
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
