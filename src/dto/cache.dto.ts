import { scrapperReturnDataDto } from './user.scan.module.dto';

type QueueDto = {
  func: () => Promise<scrapperReturnDataDto>;
  priority: number;
};

export type JobQueueDto = {
  queue: Array<QueueDto>;
  set: (func: () => Promise<scrapperReturnDataDto>, priority?: number) => void;
  dequeue: () => void;
};
