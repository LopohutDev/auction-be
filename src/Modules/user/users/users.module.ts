import { Module } from '@nestjs/common';
import { DeleteUsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [DeleteUsersController],
  providers: [UsersService],
})
export class UsersModule {}
