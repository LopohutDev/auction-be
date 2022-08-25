import { Module } from '@nestjs/common';
import { LocationModule } from './location/location.module';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [LocationModule, WarehouseModule],
})
export class AdminModule {}
