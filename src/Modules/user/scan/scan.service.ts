import { Injectable, Logger } from '@nestjs/common';
import { SCANENV } from 'src/constants/common.constants';
import { PrismaService } from 'src/Services/prisma.service';

@Injectable()
export class ScanService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ScanService.name);

  async getScanProduct(barcode: string) {
    const params = {
      barcode,
      key: process.env[SCANENV],
    };
    const {
      default: { get },
    } = await import('axios');
    try {
      const { data } = await get('https://api.barcodelookup.com/v3/products', {
        params,
      });
      return { data };
    } catch (error) {
      this.logger.error(error);
      if (error?.response?.status === 404) {
        return { error: { status: 404, message: 'No product found' } };
      }
      return { error: { status: 500, message: 'Something Went Wrong' } };
    }
  }
}
