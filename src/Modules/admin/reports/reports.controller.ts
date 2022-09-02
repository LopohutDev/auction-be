import { Controller } from '@nestjs/common';
import { AdminReportsRoute } from '../routes/admin.routes';
import { ReportsService } from './reports.service';

@Controller(AdminReportsRoute)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}
}
