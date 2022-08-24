import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './Modules/admin/admin.module';
import { AuthModule } from './Modules/auth/auth.module';
import { GlobalModule } from './Modules/global/global.module';

@Module({
  imports: [ConfigModule.forRoot(), GlobalModule, AuthModule, AdminModule],
})
export class AppModule {}
