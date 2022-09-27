import { Injectable, Logger } from '@nestjs/common';
import { BarcodeData } from 'src/Cache/BarCodes';
import { Jobs } from 'src/Cache/Jobs';
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
      where: { Warehouses: { some: { areaname: item.location } } },
    });
    if (!islocationExists) {
      return { error: { status: 404, message: 'Invalid Location' } };
    }
    const { data } = BarcodeData.get(item.barcode);
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, ...sendedData } = data;
      return { data: sendedData };
    }
    const params = {
      barcode: item.barcode,
      areaname: item.location,
      locationItemId: item.itemtype,
      auctionId: item.auction,
    };
    Jobs.set(() => getScrapperData(item.barcode, params));
    const { data: scrapperdata, error: scrappererror } = await getScrapperData(
      item.barcode,
      params,
    );
    if (scrappererror) {
      return { error: scrappererror };
    }
    BarcodeData.set(item.barcode, scrapperdata);
    const lastScannedItem = await this.prismaService.scans.findMany({
      orderBy: { id: 'desc' },
      take: 1,
    });
    const productData = {
      barcode: item.barcode,
      lotNo: 20 + 'D',
      startingBid: Number(scrapperdata.price),
      title: scrapperdata.title,
      description: scrapperdata.description,
      category: '',
      manufacturer: 'Walmart',
    };
    const createdData = {
      ScanId: uuid(),
      tag: item.location + lastScannedItem[0]?.id || 1 + item.itemtype,
      barcode: item.barcode,
      auctionId: item.auction,
      locid: islocationExists.locid,
      scannedBy: '2d381ae9-cb5d-46a6-abd9-aba176173f1c' as never,
      tagexpireAt: addDays(30),
    };
    try {
      await this.prismaService.scans.create({
        data: createdData,
      });
      await this.prismaService.products.create({ data: productData });
      return { data: scrapperdata };
    } catch (error) {
      return { error: { status: 500, message: 'Server Error' } };
    }
  }
}
