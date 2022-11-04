import { Module } from '@nestjs/common';
import { ItemTypeController } from './itemtype.controller';
import { ItemTypeService } from './itemtype.service';

@Module({
  controllers: [ItemTypeController],
  providers: [ItemTypeService],
})
export class ItemTypeModule {}
