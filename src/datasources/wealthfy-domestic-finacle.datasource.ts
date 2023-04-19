import {inject, lifeCycleObserver, LifeCycleObserver, Provider} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'wealthfy_domestic_finacle',
  connector: 'rest',
  baseUrl: process.env.USR_MGMT_DS_WDF_URL,
  crud: false,
  options: {
    strictSSL: false,
    timeout: 1200000,
    proxy: ''
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: `/fetchUserSegmentDetails`,
        query: {
          userCode: '{userCode}'
        },
        headers: {
          accepts: 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.USR_MGMT_DS_WDF_API_KEY,
          source: 'external-system',
          version: '1.1.0'
        }
      },
      functions: {
        fetchUserSegmentDetailsFinacle: ['userCode']
      }
    }
  ]
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class WealthfyDomesticFinacleDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'wealthfy_domestic_finacle';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.wealthfy_domestic_finacle', {optional: true})
    dsConfig: object = config
  ) {
    super(dsConfig);
  }
}
