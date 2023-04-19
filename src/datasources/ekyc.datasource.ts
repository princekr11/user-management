import {inject, lifeCycleObserver, LifeCycleObserver, Provider} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'ekcy',
  connector: 'rest',
  baseUrl: process.env.USR_MGMT_DS_KRA_KCY_BASE_URL,
  crud: false,
  options: {
    headers: {
      accepts: 'application/json',
      'Content-Type': 'application/json'
    },
    strictSSL: false,
    timeout: 1200000,
    proxy: process.env.PROXY_SERVER ?? ''
  },
  operations: [
    {
      template: {
        method: 'POST',
        url: `/verifyKyc`,
        headers: {
          token: '{token}'
        },
        query: {},
        body: {
          request: '{request}',
          checksum: '{checksum}'
        }
      },
      functions: {
        verifyKycFunction: ['request', 'checksum', 'token']
      }
    },
    {
      template: {
        method: 'POST',
        url: `/eKyc`,
        headers: {
          token: '{token}'
        },
        query: {},
        body: {
          request: '{request}',
          checksum: '{checksum}'
        }
      },
      functions: {
        getPanEkycFunction: ['request', 'checksum', 'token']
      }
    }
  ]
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class EkycDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'ekyc';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.ekyc', {optional: true})
    dsConfig: object = config
  ) {
    super(dsConfig);
  }
}
