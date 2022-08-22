import { Injectable } from '@nestjs/common';
import { registerBodyDto } from 'src/dto/auth.module.dto';
import { successErrorDto } from 'src/dto/common.dto';
import { validateregisterUser } from 'src/validations/auth.validation';

@Injectable()
export class AuthService {
  async registerUser(userinfo: registerBodyDto): Promise<successErrorDto> {
    const { error } = validateregisterUser(userinfo);
    if (error) {
      return { error };
    }
    return {
      success: true,
    };
  }
}
