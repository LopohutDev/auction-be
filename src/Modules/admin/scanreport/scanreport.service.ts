import { Injectable, Logger } from '@nestjs/common';
import { getScanReportBodyDto } from 'src/dto/admin.reports.module.dto';
import { ScanDataReturnDto } from 'src/dto/user.scan.module.dto';
import { PrismaService } from 'src/Services/prisma.service';
import { valdiateScanAuction } from 'src/validations/admin.scan.validations';

@Injectable()
export class ScanReportsService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ScanReportsService.name);

  async getScanByAuction(
    reportinfo: getScanReportBodyDto,
  ): Promise<ScanDataReturnDto> {
    const { error } = valdiateScanAuction(reportinfo);
    if (error) {
      return { error };
    }
    const { location, auction } = reportinfo;
    try {
      const data = await this.prismaService.scans.findMany({
        where: { locid: location, auctionId: auction },
      });
      return { data };
    } catch (error) {
      this.logger.error(error);
      return { error: { status: 500, message: 'Server error' } };
    }
  }
}
