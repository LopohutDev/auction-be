import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './Modules/auth/auth.module';

@Module({
  imports: [AuthModule, ConfigModule.forRoot()],
})
export class AppModule {}
