export const Jobs = {
  queue: [],
  set(func: () => void, priority?: number): void {
    if (!Jobs.queue.length) {
      const valuesToPush = {
        func,
        priority: priority || 1,
      };
      Jobs.queue.push(valuesToPush);
    } else if (!priority && Jobs.queue.length) {
      const valuesToPush = {
        func,
        priority: Jobs.queue[Jobs.queue.length - 1].priority + 1,
      };
      Jobs.queue.push(valuesToPush);
    } else {
      const tempqueue = [];
      let tempi = null;
      for (let i = 0; i < Jobs.queue.length; i += 1) {
        if (Jobs.queue[i].priority > priority && i === 0) {
          const values = {
            func,
            priority,
          };
          Jobs.queue = [values, ...Jobs.queue];
          return;
        } else if (Jobs.queue[i].priority <= priority) {
          tempqueue.push(this.queue[i]);
          tempi = i;
        } else if (Jobs.queue[i].priority > priority) {
          if (tempi) {
            tempqueue.push({ func, priority });
            tempi = null;
          }
          tempqueue.push(Jobs.queue[i]);
        }

        if (tempi !== null && i === Jobs.queue.length - 1) {
          tempqueue.push({ func, priority });
        }
      }
      Jobs.queue = tempqueue;
    }
  },
  dequeue(): void {
    Jobs.queue = Jobs.queue.slice(1);
  },
};
