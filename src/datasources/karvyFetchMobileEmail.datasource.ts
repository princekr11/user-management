import {inject, lifeCycleObserver, LifeCycleObserver, Provider} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'kravy',
  connector: 'rest',
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
        url: process.env.USR_MGMT_DS_KRA_FETCH_MOBILE_EMAIL_BASE_URL,
        headers: {},
        query: {},
        body: {
          Appid: '{Appid}',
          Apppwd: '{Apppwd}',
          AppIden: '{AppIden}',
          AgentCode: '{AgentCode}',
          BranchCode: '{BranchCode}',
          AMC_Code: '{AMC_Code}',
          Folio_No: '{Folio_No}'
        }
      },
      functions: {
        KarvyGetMobileAndEmailBasedOnFolio: ['Appid', 'Apppwd', 'AppIden', 'AgentCode', 'BranchCode', 'AMC_Code', 'Folio_No']
      }
    },
    {
      template: {
        method: 'POST',
        url: process.env.USR_MGMT_DS_CAMS_FETCH_MOBILE_EMAIL_BASE_URL,
        headers: {},
        query: {},
        body: {
          Contact_Details_Request: {
            AMCCode: '{AMCCode}',
            ApplicationID: '{ApplicationID}',
            Password: '{Password}',
            FolioNo: '{FolioNo}',
            PAN: '{PAN}'
          }
        }
      },
      functions: {
        CamsGetMobileAndEmailBasedOnFolio: ['AMCCode', 'ApplicationID', 'Password', 'FolioNo', 'PAN']
      }
    }
  ]
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class KarvyDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'karvy';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.karvy', {optional: true})
    dsConfig: object = config
  ) {
    super(dsConfig);
  }
}
