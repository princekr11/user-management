import * as dotenv from 'dotenv';

import {inject} from '@loopback/core';
import {AppUserRepository, LoggingUtils, Option} from 'common';
import {UserManagementService} from './application';
import {DatasourceInitialization} from './datasource-initialization';
import {RepositoryInitialization} from './repository-initiliazation';
import {RepositoryTags} from '@loopback/repository';


dotenv.config();

export async function migrate(args: string[]) {
  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  LoggingUtils.info('Migrating schemas (%s existing schema)  ' + existingSchema);

  const app = new UserManagementService();
  await app.boot();
  await DatasourceInitialization.init(app);
  RepositoryInitialization.init(app);
  await app.migrateSchema({existingSchema});
  if(Option.GLOBALOPTIONS.BOOLEANVARS[process.env.GLOBAL_MIGRATION_CREATE_FOREIGN_KEYS!]) {
    await createForeignKeys(app);
  }
  else{
    process.exit(0);
  }

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  // process.exit(0);
}

//this function is really useless
//@todo - ketan to check why removing this function makes everything break
//DO NOT DELETE
async function init(app: UserManagementService) {
  LoggingUtils.info('init called');
  inject('datasources.local')(AppUserRepository, undefined, 0);
  app.repository(AppUserRepository);
}
migrate(process.argv).catch(err => {
  LoggingUtils.error('Cannot migrate database schema -- ' + err);
  process.exit(1);
});



async function createForeignKeys(app: any ){
  var _a;

  const dsBindings = app.findByTag(RepositoryTags.DATASOURCE);
  const operation = 'createForeignKeys'
  const localDatasources = dsBindings.filter((datasource : any) =>{
    return datasource.key === 'datasources.local'
  })
  //There is only one local data source atm
    const ds :any= await app.get(localDatasources[0].key)
    const disableMigration = (_a = ds.settings.disableMigration) !== null && _a !== void 0 ? _a : false;
    if (operation in ds.connector && typeof ds.connector[operation] === 'function' && !disableMigration) {
        LoggingUtils.info('Creating foreign keys for dataSource - ' + ds.name);
        let models = Object.keys(ds.connector._models)

        ds.connector[operation](models,function(err:any){
          if(err){
            LoggingUtils.error(err)
            LoggingUtils.error('Foreign Keys could not be created for datasource -' + ds.name)
            process.exit(1)
          }
          else{
            LoggingUtils.info('Foreign keys created for datasource -' + ds.name);
            process.exit(0)
          }

        });
    }
    else {
        LoggingUtils.info('Skipping creation of dataSource %s' + ds.key);
    }
}
