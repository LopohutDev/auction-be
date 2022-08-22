import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
} from '@nestjs/common';
import { registerBodyDto } from 'src/dto/auth.module.dto';
import { controllerReturnDto } from 'src/dto/common.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(200)
  async registerController(
    @Body() userinfo: registerBodyDto,
  ): Promise<controllerReturnDto> {
    const { success, error } = await this.authService.registerUser(userinfo);
    if (success) {
      return {
        success,
        message: 'Successfully created the user',
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
