import {inject, lifeCycleObserver, LifeCycleObserver, Provider} from '@loopback/core';
import {juggler} from '@loopback/repository';
const apiKey = Buffer.from(process.env.USR_MGMT_IDCOM_FCD_CLIENT_KEY as string, 'base64').toString('utf8');

const config = {
  name: 'idcom_internal',
  connector: 'rest',
  baseUrl: process.env.USR_MGMT_IDCOM_DS_BASE_URL,
  crud: false,
  options: {
    strictSSL: false,
    timeout: 1200000,
    proxy:''
  },
  operations: [
    {
      template: {
        method: 'POST',
        url: `/idcom/Fetch_AuthCode`,
        query: {},
        headers: {
          accepts: 'application/json',
          'content-type': 'application/json',
          apikey: apiKey,
          scope: process.env.USR_MGMT_IDCOM_FCD_SCOPE
        },
        options: {
          // agentOptions: {
          // cert: certificate,
          // key: privateKey
          // }
        },
        body: {
          FintechID: '{FintechID}',
          Identifiers: '{Identifiers}',
          ProductCode: '{ProductCode}',
          ClientSecret: '{ClientSecret}',
          ClientID: '{ClientID}',
          Filler1: '',
          Filler2: '',
          Filler3: '',
          Filler4: '',
          Filler5: '',
          Filler6: '',
          Filler7: '',
          Filler8: '',
          Filler9: '',
          Filler10: ''
        }
      },
      functions: {
        fetchAuthCodeWithRedirectUrl: ['FintechID', 'Identifiers', 'ProductCode', 'ClientSecret', 'ClientID']
      }
    },
    {
      template: {
        method: 'POST',
        url: `/idcom/Fetch_IDToken`,
        query: {},
        headers: {
          accepts: 'application/json',
          'content-type': 'application/json',
          apikey: apiKey,
          scope: process.env.USR_MGMT_IDCOM_FCD_SCOPE
        },
        options: {
          // agentOptions: {
          // cert: certificate,
          // key: privateKey
          // }
        },
        body: {
          authCode: '{authCode}'
        }
      },
      functions: {
        fetchIdToken: ['authCode']
      }
    },
    {
      template: {
        method: 'POST',
        url: `/IDCOM_getDecryptedToken`,
        query: {},
        headers: {
          accepts: 'application/json',
          'content-type': 'application/json',
          apikey: apiKey,
          scope: process.env.USR_MGMT_IDCOM_FCD_SCOPE
        },
        options: {
          // agentOptions: {
          // cert: certificate,
          // key: privateKey
          // }
        },
        body: {
          IDCOM_Token: '{IDCOM_Token}'
        }
      },
      functions: {
        decryptIdToken: ['IDCOM_Token']
      }
    }
  ]
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class IdcomInternalDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'idcom_internal';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.idcom_internal', {optional: true})
    dsConfig: object = config
  ) {
    super(dsConfig);
  }
}
