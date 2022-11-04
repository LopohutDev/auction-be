import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './Modules/admin/admin.module';
import { AuthModule } from './Modules/auth/auth.module';
import { GlobalModule } from './Modules/global/global.module';
import { TasksModule } from './Modules/Tasks/tasks.module';
import { UserModule } from './Modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    GlobalModule,
    AuthModule,
    AdminModule,
    UserModule,
    TasksModule,
  ],
})
export class AppModule {}
