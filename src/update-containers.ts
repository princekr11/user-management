import {Context} from '@loopback/core';
import {FileStorageComponent, IStorageService, StorageDataSource, LoggingUtils} from 'common';
import {UserManagementService} from './application';
import {DatasourceInitialization} from './datasource-initialization';
import {RepositoryInitialization} from './repository-initiliazation';
import {FileStorageContainerConfig} from 'common';
import _ from 'underscore';

export async function updateFileContainers(): Promise<void> {
  let fileStorageService: IStorageService;
  return new Promise((resolve, reject) => {
    const app = new UserManagementService();
    app
      .boot()
      .then(() => {
        return DatasourceInitialization.init(app);
      })
      .then((): Promise<IStorageService> => {
        RepositoryInitialization.init(app);
        const fileStorageServiceInterface = Symbol('fileStorage');
        const binding = app.service(FileStorageComponent, {interface: fileStorageServiceInterface});
        var ctx = new Context();
        return binding.getValue(ctx) as Promise<IStorageService>;
      })
      .then((bindValue: IStorageService): Promise<any> => {
        fileStorageService = bindValue;
        return new Promise((resolve, reject) => {
          fileStorageService.getContainers(function (err: any, containers: any) {
            if (err) {
              return reject(err);
            }
            return resolve(containers);
          });
        });
      })
      .then((containers: any): any => {
        const existingContainers = _.pluck(containers, 'name');
        let promises: Array<Promise<void>> = [];
        const containersToMigrate: Array<string> = [];
        if (StorageDataSource.defaultConfig.provider === 'amazon' && StorageDataSource.defaultConfig.mainBucket) {
          if (existingContainers.indexOf(StorageDataSource.defaultConfig.mainBucket) == -1 && StorageDataSource.defaultConfig.mainBucket) {
            containersToMigrate.push(StorageDataSource.defaultConfig.mainBucket);
          }
        } else {
          _.each(FileStorageContainerConfig.containers, function (containerDefinition) {
            if (existingContainers.indexOf(FileStorageContainerConfig.getGcpContainerName(containerDefinition.name)) == -1) {
              containersToMigrate.push(FileStorageContainerConfig.getGcpContainerName(containerDefinition.name));
            }
          });
        }
        _.each(containersToMigrate, (container: string) => {
          promises.push(
            new Promise<void>(function (resolve, reject) {
              fileStorageService.createContainer({name: container}, function (err) {
                if (err) {
                  return reject(err);
                }
                return resolve();
              });
            })
          );
        });
        return Promise.all(promises);
      })
      .then(() => {
         LoggingUtils.info('File containers migrated successfully');
        return resolve();
      })
      .catch(reject);
  });
}

updateFileContainers()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    LoggingUtils.error(err);
    process.exit(1);
  });
