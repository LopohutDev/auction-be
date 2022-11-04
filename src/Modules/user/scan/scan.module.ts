import { Module } from '@nestjs/common';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';

@Module({
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
