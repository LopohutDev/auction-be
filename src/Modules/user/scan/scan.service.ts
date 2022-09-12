import { Injectable, Logger } from '@nestjs/common';
import { BarcodeData } from 'src/Cache/BarCodes';
import { ScanQueryDto } from 'src/dto/user.scan.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
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
    const islocationExists = await this.prismaService.warehouses.findFirst({
      where: { areaname: item.location },
    });
    if (!islocationExists) {
      return { error: { status: 404, message: 'Invalid Loaction' } };
    }
    const isItemExists = await this.prismaService.itemType.findUnique({
      where: { name: item.itemtype },
    });
    if (!isItemExists) {
      return { error: { status: 404, message: 'No item Type exists' } };
    }
    const { data } = BarcodeData.get(item.barcode);
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, ...sendedData } = data;
      return { data: sendedData };
    }
    const { data: scrapperdata, error: scrappererror } = await getScrapperData(
      item.barcode,
    );
    if (scrappererror) {
      return { error: scrappererror };
    }
    BarcodeData.set(item.barcode, scrapperdata);
    return { data: scrapperdata };
  }
}
