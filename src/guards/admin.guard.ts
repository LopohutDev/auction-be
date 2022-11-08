import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Roles } from 'src/dto/auth.module.dto';
import { validateToken } from './strategies/jwt.strategy';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    const { data, error } = validateToken(authorization);
    if (data) {
      if (data.role !== Roles.ADMIN) {
        throw new HttpException('Invalid login. Please contact admin.', 403);
      } else {
        request.email = data.email;
        request.reId = data.reId;
        request.role = data.role;
        return true;
      }
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
