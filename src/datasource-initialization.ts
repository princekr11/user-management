import {Class} from '@loopback/repository';
import {juggler} from '@loopback/service-proxy/dist/legacy-juggler-bridge';
import {UserManagementService} from './application';
import {
  CacheRedisRemoteDataSource,
  LoggingRestRemoteDataSource,
  MasterDataRemoteRestDataSource,
  OrderExecutionRemoteRestDataSource,
  ReportingRemoteRestDataSource,
  TransactionRemoteRestDataSource,
  UserManagementRemoteRestDataSource
} from 'common/dist/datasources';

import {LoggingUtils} from 'common';

export abstract class DatasourceInitialization {
  public static async init(app: UserManagementService) {
     LoggingUtils.info('Initializing datasources');
    await app.dataSource(LoggingRestRemoteDataSource as unknown as Class<juggler.DataSource>, 'logging_remote_rest');
    await app.dataSource(MasterDataRemoteRestDataSource as unknown as Class<juggler.DataSource>, 'master_data_remote_rest');
    await app.dataSource(OrderExecutionRemoteRestDataSource as unknown as Class<juggler.DataSource>, 'order_execution_remote_rest');
    // await app.dataSource(ReportingRemoteRestDataSource as unknown as Class<juggler.DataSource>, 'reporting_remote_rest');
    await app.dataSource(TransactionRemoteRestDataSource as unknown as Class<juggler.DataSource>, 'transaction_remote_rest');
    // await app.dataSource(UserManagementRemoteRestDataSource as unknown as Class<juggler.DataSource>, 'user_management_remote_rest');
    await app.dataSource(CacheRedisRemoteDataSource as unknown as Class<juggler.DataSource>, 'cache_redis');

  }
}
