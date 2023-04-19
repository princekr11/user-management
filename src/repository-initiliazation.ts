import {CoreBindings, inject} from '@loopback/core';
import {DefaultCrudRepository, Repository} from '@loopback/repository';
import {BaseLocalRepository, LoggingUtils} from 'common';
import * as LoggingRepositories from 'common/dist/repositories/logging';
import * as MasterDataRepositories from 'common/dist/repositories/master-data';
import * as OrderExecutionRepositories from 'common/dist/repositories/order-execution';
import * as ReportingRepositories from 'common/dist/repositories/reporting';
import * as TransactionRepositories from 'common/dist/repositories/transaction';
import * as UserManagementRepositories from 'common/dist/repositories/user-management';
import {UserManagementService} from './application';

export abstract class RepositoryInitialization {
  //initiate whichever repositories are needed in the service or processor
  public static init(app: UserManagementService) {
     LoggingUtils.info('Initializing repositories');

    interface Collection {
      [key: string]: any;
    }

    const LoggingRepositoriesCollection: Collection = LoggingRepositories;
    for (const key in LoggingRepositoriesCollection) {
      inject('datasources.logging_remote_rest')(LoggingRepositoriesCollection[key], undefined, 0);
      app.repository(LoggingRepositoriesCollection[key]);
    }

    const MasterDataRepositoriesCollection: Collection = MasterDataRepositories;
    for (const key in MasterDataRepositoriesCollection) {
      inject('datasources.master_data_remote_rest')(MasterDataRepositoriesCollection[key], undefined, 0);
      app.repository(MasterDataRepositoriesCollection[key]);
    }

    const OrderExecutionRepositoriesCollection: Collection = OrderExecutionRepositories;
    for (const key in OrderExecutionRepositoriesCollection) {
      inject('datasources.order_execution_remote_rest')(OrderExecutionRepositoriesCollection[key], undefined, 0);
      app.repository(OrderExecutionRepositoriesCollection[key]);
    }

    // const ReportingRepositoriesCollection: Collection = ReportingRepositories;
    // for (const key in ReportingRepositoriesCollection) {
    //   inject('datasources.reporting_remote_rest')(ReportingRepositoriesCollection[key], undefined, 0);
    //   app.repository(ReportingRepositoriesCollection[key]);
    // }

    const TransactionRepositoriesCollection: Collection = TransactionRepositories;
    for (const key in TransactionRepositoriesCollection) {
      inject('datasources.transaction_remote_rest')(TransactionRepositoriesCollection[key], undefined, 0);
      app.repository(TransactionRepositoriesCollection[key]);
    }

    const UserManagementRepositoriesCollection: Collection = UserManagementRepositories;
    for (const key in UserManagementRepositoriesCollection) {
      inject('datasources.local')(UserManagementRepositoriesCollection[key], undefined, 0);
      app.repository(UserManagementRepositoriesCollection[key]);
    }
  }
}
