import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BarcodeData } from 'src/Cache/BarCodes';

import { Jobs } from 'src/Cache/Jobs';

import { PrismaService } from 'src/Services/prisma.service';

import { Jwt } from 'src/tokens/Jwt';
import setAuction from '../admin/auction /auction.utils';

@Injectable()
export class TasksService {
  constructor(private readonly prismaService: PrismaService) {}
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
      module: 'Tokens',
      totalRecords: alltokens.length,
      errors,
      success,
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  handleRemoveBarcodes() {
    const barcodes = Object.keys(BarcodeData.data);
    let errors = 0;
    let success = 0;
    for (let i = 0; i < barcodes.length; i += 1) {
      const { error, success: totalsucess } = BarcodeData.removeExpiredData(
        barcodes[i],
      );
      if (totalsucess) {
        success += 1;
      } else if (error) {
        errors += 1;
      }
    }
    this.logger.debug({
      module: 'Barcodes',
      totalRecords: barcodes.length,
      errors,
      success,
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePriorityQueue() {
    const jobs = Jobs.queue;
    if (!jobs.length) {
      this.logger.debug({ module: 'Queues', message: 'Already cleared' });
    } else {
      const len = Jobs.queue.length;
      try {
        for await (const que of Jobs.queue) {
          const { data, error } = await que.func();
          this.logger.debug({ data, error });
          Jobs.dequeue();
        }
        this.logger.debug({
          module: 'Queue',
          message: `Total queue ${len} is cleared now`,
        });
      } catch (error) {
        this.logger.debug({
          module: 'Queue',
          message: `Facing issue ie: ${error?.message || error}`,
        });
      }
    }
  }
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async addFutureAuction() {
    let arr = [];
    const currDate = new Date();

    const futureMonthLastDay = new Date(
      currDate.getFullYear(),
      currDate.getMonth() + 2,
      0,
    );

    const allLocations = await this.prismaService.location.findMany({});

    if (allLocations) {
      allLocations.map((row) => {
        for (let i = 1; i <= futureMonthLastDay.getDate(); i++) {
          const { newArr, n } = setAuction(i, row);
          i = n;
          arr = [...arr, newArr];
        }
      });
    }
    await this.prismaService.auction.createMany({
      data: arr,
    });
  }
}
