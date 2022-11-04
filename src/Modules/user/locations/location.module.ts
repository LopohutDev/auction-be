import { Module } from '@nestjs/common';
import { UserLocationController } from './location.controller';
import { UserLocationService } from './location.service';

@Module({
  controllers: [UserLocationController],
  providers: [UserLocationService],
})
export class UserLocationModule {}
