import { Injectable, Logger } from '@nestjs/common';
import { SCANENV, WALLENV } from 'src/constants/common.constants';
import { ScanQueryDto } from 'src/dto/user.scan.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { validateUserScan } from 'src/validations/user.scans.validations';

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
    const params = {
      barcode: item.barcode,
      key: process.env[SCANENV],
    };
    const {
      default: { get },
    } = await import('axios');
    try {
      const { data } = await get('https://api.barcodelookup.com/v3/products', {
        params,
      });
      const storedata = data?.products?.length
        ? (data.products[0].stores as [])
        : [];
      const wallmartProduct = storedata.find((l) => l.name === 'Walmart');
      const AmazonProduct = storedata.find((l) => l.name === 'Amazon');
      if (!storedata.length || (!wallmartProduct && AmazonProduct)) {
        return { error: { status: 422, message: 'No store found' } };
      }
      if (wallmartProduct) {
        const params = {
          api_key: process.env[WALLENV],
          type: 'product',
          url: wallmartProduct?.link,
        };
        const { data } = await get('https://api.bluecartapi.com/request', {
          params,
        });
        if (data.request_info.success) {
          return {
            data: {
              productId: data.product.product_id,
              images: data.product.images,
              description: data.product.description,
              title: data.product.title,
            },
          };
        }
      } else {
        return { data };
      }
    } catch (error) {
      this.logger.error(error);
      if (error?.response?.status === 404) {
        return { error: { status: 404, message: 'No product found' } };
      }
      return { error: { status: 500, message: 'Something Went Wrong' } };
    }
  }
}
