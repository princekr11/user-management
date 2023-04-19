import * as dotenv from 'dotenv';

import {inject} from '@loopback/core';
import {AppUserRepository, LoggingUtils, CorsHeaders} from 'common';
import {ApplicationConfig, UserManagementService} from './application';
import {DatasourceInitialization} from './datasource-initialization';
import {RepositoryInitialization} from './repository-initiliazation';
import {ServiceInitialization} from './service-initiliazation';
import {RestBindings} from '@loopback/rest';
export * from './application';

dotenv.config();

export async function main(options: ApplicationConfig = {}) {
  const app = new UserManagementService(options);
  if (process.env.LNPTESTING == "true") {
    app.restServer.basePath('/LNP/API/UserManagement');
  } else {
    app.restServer.basePath('/API/UserManagement');
  }
  await app.boot();
  await app.start();
  app.bind(RestBindings.ERROR_WRITER_OPTIONS).to({safeFields: ['extra']});
  await DatasourceInitialization.init(app);
  RepositoryInitialization.init(app);
  ServiceInitialization.init(app);
  const url = app.restServer.url;
  LoggingUtils.info(`Server is running at ${url}`);
  LoggingUtils.info(`Try ${url}/ping`);

  return app;
}

//this function is really useless
//@todo - ketan to check why removing this function makes everything break
//DO NOT DELETE
async function init(app: UserManagementService) {
  LoggingUtils.info('init called');
  inject('datasources.local')(AppUserRepository, undefined, 0);
  app.repository(AppUserRepository);
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: process.env.USR_MGMT_SRVC_PORT ?? 3018,
      host: process.env.HOST,
      cors: {
        "origin": process.env?.NODE_ENV?.toLowerCase() == 'production' ? CorsHeaders.ENV.PROD : [...CorsHeaders.ENV.UAT, "http://localhost:3018"],
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
      },
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: false,
        servers: [
          //@todo - have a better way to do this
          {
            url: 'https://delta-dev.finzipp.com/API/UserManagement'
          },
          {
            url: 'https://delta-test.finzipp.com/API/UserManagement'
          },
          {
            url: 'https://delta-uat.finzipp.com/API/UserManagement'
          },
          {
            url: 'http://127.0.0.1:3018/API/UserManagement'
          }
        ],
        expressSettings: {
          'trust proxy': true,
        }
      }
    }
  };
  main(config).catch(err => {
    LoggingUtils.error('Cannot start the application.- ' + err);
    process.exit(1);
  });
}
