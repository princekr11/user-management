import {FileStorageComponent, LoggingUtils} from 'common';
import {UserManagementService} from './application';

export abstract class ServiceInitialization {
  //initiate whichever repositories are needed in the service or processor
  public static init(app: UserManagementService) {
     LoggingUtils.info('Initializing services');
    app.service(FileStorageComponent, 'fileStorageComponent');
  }
}
