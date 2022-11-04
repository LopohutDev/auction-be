import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { usersQueryDataDto } from 'src/dto/admin.location.module.dto';
import { paginationDto } from 'src/dto/common.dto';
import { AdminGuard } from 'src/guards/admin.guard';
import { AdminUsers } from '../routes/admin.routes';
import { AdminUsersService } from './users.service';

@Controller(AdminUsers)
export class AdminUsersController {
  constructor(private readonly adminuserservice: AdminUsersService) {}

  @UseGuards(AdminGuard)
  @Post()
  async acceptAdminUsersController(@Body() userinfo: usersQueryDataDto) {
    const { error, success, message } =
      await this.adminuserservice.acceptAdminUser(userinfo);
    if (success) {
      return {
        success: true,
        message: message,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }

  @UseGuards(AdminGuard)
  @Get()
  async listAdminUsersController(@Query() pagination: paginationDto) {
    const { error, pageCount, data } =
      await this.adminuserservice.listAdminUser(pagination);
    if (data) {
      return {
        success: true,
        pageCount,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
