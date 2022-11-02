import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/Services/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class GlobalModule {}
