import {
  Controller,
  HttpException,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { requestTokenDto } from 'src/dto/tokens.dto';
import { ScanQueryDto } from 'src/dto/user.scan.module.dto';
import { AuthGuard } from 'src/guards/jwt.guard';
import { UserScanRoute } from '../routes/user.routes';
import { ScanService } from './scan.service';

@Controller(UserScanRoute)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(200)
  async getScanned(@Body() query: ScanQueryDto, @Req() req: requestTokenDto) {
    const { email } = req;
    const { data, error } = await this.scanService.getScanProduct({
      ...query,
      email,
    });
    if (data) {
      return {
        success: true,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }

  @UseGuards(AuthGuard)
  @Post('/failed')
  @HttpCode(200)
  async scanFailedItem(
    @Body() query: ScanQueryDto,
    @Req() req: requestTokenDto,
  ) {
    const { email } = req;
    const { data, error } = await this.scanService.createFailedProducts({
      ...query,
      email,
    });
    if (data) {
      return {
        success: true,
        data,
      };
    } else {
      throw new HttpException(error.message, error.status);
    }
  }
}
