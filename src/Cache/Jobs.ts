import { JobQueueDto } from 'src/dto/cache.dto';
import { scrapperReturnDataDto } from 'src/dto/user.scan.module.dto';

export const Jobs: JobQueueDto = {
  queue: [],
  set(priority?: number): void {
    if (!Jobs.queue.length) {
      const valuesToPush = {
        priority: priority || 1,
      };
      Jobs.queue.push(valuesToPush);
    } else if (!priority && Jobs.queue.length) {
      const valuesToPush = {
        priority: Jobs.queue[Jobs.queue.length - 1].priority + 1,
      };
      Jobs.queue.push(valuesToPush);
    } else {
      const tempqueue = [];
      let tempi = null;
      for (let i = 0; i < Jobs.queue.length; i += 1) {
        if (Jobs.queue[i].priority > priority && i === 0) {
          const values = {
            priority,
          };
          Jobs.queue = [values, ...Jobs.queue];
          return;
        } else if (Jobs.queue[i].priority <= priority) {
          tempqueue.push(this.queue[i]);
          tempi = i;
        } else if (Jobs.queue[i].priority > priority) {
          if (tempi) {
            tempqueue.push({ priority });
            tempi = null;
          }
          tempqueue.push(Jobs.queue[i]);
        }

        if (tempi !== null && i === Jobs.queue.length - 1) {
          tempqueue.push({ priority });
        }
      }
      Jobs.queue = tempqueue;
    }
  },
  dequeue(): void {
    Jobs.queue = Jobs.queue.slice(1);
  },
};
