import { Module } from '@nestjs/common';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [ScanModule],
})
export class UserModule {}
