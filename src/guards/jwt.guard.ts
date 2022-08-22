import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { validateToken } from './strategies/jwt.strategy';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;
    const { data, error } = validateToken(authorization);
    if (data) {
      request.email = data.email;
      request.reId = data.reId;
      request.roles = data.roles;
      return true;
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
