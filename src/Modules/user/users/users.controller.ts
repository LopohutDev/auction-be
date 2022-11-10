import {
  Body,
  Controller,
  HttpException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { usersDataDto } from 'src/dto/user.scan.module.dto';
import { AuthGuard } from 'src/guards/jwt.guard';
import { UserDelete } from '../routes/user.routes';
import { UsersService } from './users.service';

@Controller(UserDelete)
export class DeleteUsersController {
  constructor(private readonly userservice: UsersService) {}

  @UseGuards(AuthGuard)
  @Post()
  async deleteUsersController(@Body() userinfo: usersDataDto) {
    const { error, success, message } = await this.userservice.deleteUser(
      userinfo,
    );
    if (success) {
      return {
        success: success,
        message: message,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
