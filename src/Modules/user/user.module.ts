import { Module } from '@nestjs/common';
import { UserLocationModule } from './locations/location.module';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [ScanModule, UserLocationModule],
})
export class UserModule {}
