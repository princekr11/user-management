import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import { settings } from 'cluster';
import {LoggingUtils, Option} from 'common';
const fs = require('fs');

const prepareConfig = () => {
  const config = {
    name: process.env.USR_MGMT_DS_LOCAL_POSTGRES_NAME,
    connector: 'postgresql',
    host: process.env.USR_MGMT_DS_LOCAL_POSTGRES_HOST,
    port: process.env.USR_MGMT_DS_LOCAL_POSTGRES_PORT,
    user: process.env.USR_MGMT_DS_LOCAL_POSTGRES_USER,
    password: process.env.USR_MGMT_DS_LOCAL_POSTGRES_PASS,
    database: process.env.USR_MGMT_DS_LOCAL_POSTGRES_DBS,
    min: process.env.USR_MGMT_DS_LOCAL_POSTGRES_MIN,
    max: process.env.USR_MGMT_DS_LOCAL_POSTGRES_MAX,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 20000,
    ssl: Option.GLOBALOPTIONS.BOOLEANVARS[process.env.GLOBAL_DS_LOCAL_POSTGRES_SSL!],
    debug: Option.GLOBALOPTIONS.BOOLEANVARS[process.env.GLOBAL_DS_LOCAL_POSTGRES_DEBUG!],
    // normalizeUndefinedInQuery: "throw"
    
  };

  if (Option.GLOBALOPTIONS.BOOLEANVARS[process.env.GLOBAL_DS_LOCAL_POSTGRES_SSL!] && Option.GLOBALOPTIONS.BOOLEANVARS[process.env.GLOBAL_DS_LOCAL_POSTGRES_SSL!] === true) {
    if (process.env.COMMON_POSTGRES_SERVER_CERT && process.env.COMMON_POSTGRES_CLIENT_CERT && process.env.COMMON_POSTGRES_CLIENT_KEY) {
      config.ssl = {
        rejectUnauthorized: false,
        ca: fs.readFileSync(process.env.COMMON_POSTGRES_SERVER_CERT).toString(),
        key: fs.readFileSync(process.env.COMMON_POSTGRES_CLIENT_KEY).toString(),
        cert: fs.readFileSync(process.env.COMMON_POSTGRES_CLIENT_CERT).toString()
      };
      LoggingUtils.info({message: 'ssl is set to true for postgres connection' }, 'prepareConfig');
    } else {
      LoggingUtils.fatal({message: `ssl was set to true but not all env variables were populated.`}, 'prepareConfig');
      throw new Error('ssl was set to true but not all env variables were populated')

    }
  }

  return config;
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class LocalDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'local';
  static readonly defaultConfig = prepareConfig();

  constructor(
    @inject('datasources.config.local', {optional: true})
    dsConfig: object = prepareConfig()
  ) {
    super(dsConfig);
  }
}
