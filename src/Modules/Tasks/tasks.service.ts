import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Jwt } from 'src/tokens/Jwt';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_2_HOURS)
  handleRemoveTokens() {
    const alltokens = Object.keys(Jwt.refreshTokens);
    let errors = 0;
    let success = 0;
    for (let i = 0; i < alltokens.length; i += 1) {
      const { error, success: totalsucess } = Jwt.removeExpiredToken(
        alltokens[i],
      );
      if (totalsucess) {
        success += 1;
      } else if (error) {
        errors += 1;
      }
    }
    this.logger.debug({
      totalRecords: alltokens.length,
      errors,
      success,
    });
  }
}
