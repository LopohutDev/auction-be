import * as clusters from 'node:cluster';
import * as os from 'os';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClusterService {
  static clusterize(callback: () => void): void {
    const cluster = clusters as any;
    if (
      (cluster?.isPrimary || cluster?.isMaster) &&
      process.env.NODE_ENV === 'production'
    ) {
      console.log(`Primary server started on ${process.pid}`);
      const numCPUs = os.cpus()?.length;
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
      cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died. Restarting`);
        cluster.fork();
      });
    } else {
      console.log(`Cluster server started on ${process.pid}`);
      callback();
    }
  }
}
