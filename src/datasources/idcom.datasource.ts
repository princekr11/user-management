import {inject, lifeCycleObserver, LifeCycleObserver, Provider} from '@loopback/core';
import {juggler} from '@loopback/repository';

const certificate = Buffer.from(process.env.USR_MGMT_IDCOM_DS_CERTIFICATE as string, 'base64').toString('utf8');
const privateKey = Buffer.from(process.env.USR_MGMT_IDCOM_DS_PRIVATE_KEY as string, 'base64').toString('utf8');
const apiKey = Buffer.from(process.env.USR_MGMT_IDCOM_FCD_CLIENT_KEY as string, 'base64').toString('utf8');

const config = {
  name: 'idcom',
  connector: 'rest',
  baseUrl: process.env.USR_MGMT_IDCOM_DS_BASE_URL,
  crud: false,
  options: {
    strictSSL: false,
    timeout: 1200000,
    proxy: process.env.PROXY_SERVER ?? ''
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
          cert: certificate,
          key: privateKey
          // }
        },
        body: {
          RequestEncryptedValue: '{RequestEncryptedValue}',
          SymmetricKeyEncryptedValue: '{SymmetricKeyEncryptedValue}',
          Scope: '{Scope}',
          TransactionId: '{TransactionId}',
          OAuthTokenValue: ''
        }
      },
      functions: {
        fetchAuthCodeWithRedirectUrl: ['RequestEncryptedValue', 'SymmetricKeyEncryptedValue', 'Scope', 'TransactionId']
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
          cert: certificate,
          key: privateKey
          // }
        },
        body: {
          RequestEncryptedValue: '{RequestEncryptedValue}',
          SymmetricKeyEncryptedValue: '{SymmetricKeyEncryptedValue}',
          Scope: '{Scope}',
          TransactionId: '{TransactionId}',
          OAuthTokenValue: ''
        }
      },
      functions: {
        fetchIdToken: ['RequestEncryptedValue', 'SymmetricKeyEncryptedValue', 'Scope', 'TransactionId']
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
          cert: certificate,
          key: privateKey
          // }
        },
        body: {
          // RequestEncryptedValue: '{RequestEncryptedValue}',
          // SymmetricKeyEncryptedValue: '{SymmetricKeyEncryptedValue}',
          // Scope: '{Scope}',
          // TransactionId: '{TransactionId}',
          // 'Id-token-jwt': '',
          // OAuthTokenValue: '',
          IDCOM_Token: '{IDCOM_Token}'
        }
      },
      functions: {
        //decryptIdToken: ['RequestEncryptedValue', 'SymmetricKeyEncryptedValue', 'Scope', 'TransactionId', 'IDCOM_Token']
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
export class IdcomDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'idcom';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.idcom', {optional: true})
    dsConfig: object = config
  ) {
    super(dsConfig);
  }
}
