import {LoggingUtils, QueueUtils} from 'common';
import {UserManagementService} from './application';
import _ from 'underscore';
import QueueConfiguration from 'common/dist/queues/queue-configuration';
import * as dotenv from 'dotenv';
dotenv.config()
export async function updateQueues(args: string[]) {
  LoggingUtils.info('Updating messaging queues');

  const app = new UserManagementService();
  await app.boot();

  QueueUtils.listQueues()
    .then((existingQueues: Array<string>) => {
      let promises: Array<Promise<any>> = [];
      _.each(Object.keys(QueueConfiguration.queues), function (key) {
        if (existingQueues.indexOf(QueueConfiguration.queues[key].queueName) == -1) {
          LoggingUtils.info('Creating queue ' + QueueConfiguration.queues[key].queueName);
          promises.push(QueueUtils.createQueue(QueueConfiguration.queues[key].queueName));
        }
      });
      return Promise.all(promises);
    })
    .then(() => {
      LoggingUtils.info('Queues updated!');
      process.exit(0);
    });
}

updateQueues(process.argv).catch(err => {
  LoggingUtils.error('Cannot update queues' + err);
  process.exit(1);
});
