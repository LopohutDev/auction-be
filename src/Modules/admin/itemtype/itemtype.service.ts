import { Injectable, Logger } from '@nestjs/common';
import { itemTypeBodyDto } from 'src/dto/admin.warehouse.module.dto';
import { PrismaService } from 'src/Services/prisma.service';

@Injectable()
export class ItemTypeService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ItemTypeService.name);

  async getItemType() {
    try {
      const data = await this.prismaService.itemType.findMany({
        select: { uuid: true, name: true },
      });
      const returndata = data.map((l) => ({ id: l.uuid, name: l.name }));
      return { data: returndata };
    } catch (error) {
      this.logger.error(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }

  async createNewItemType(itemType: itemTypeBodyDto) {
    const { name } = itemType;
    if (!name || !name.trim().length) {
      return { error: { status: 422, message: 'Name is required' } };
    }
    try {
      const isItemExists = await this.prismaService.itemType.findUnique({
        where: { name },
        rejectOnNotFound: false,
      });

      if (isItemExists) {
        return { error: { status: 409, message: 'Name already exists' } };
      }
      await this.prismaService.itemType.create({ data: { name } });
      return { success: true };
    } catch (error) {
      this.logger.error(error?.message || error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
