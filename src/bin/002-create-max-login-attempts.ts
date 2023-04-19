import {UamLoginAttemptsConfigRepository, LoggingUtils, UamLoginAttemptsConfig} from 'common';
import {UserManagementService} from '../application';
import {DatasourceInitialization} from '../datasource-initialization';
import {RepositoryInitialization} from '../repository-initiliazation';
import {ValidateSequence, AppRole} from 'common';
import * as dotenv from 'dotenv';
import * as path from 'path';
try {
  dotenv.config({path: path.resolve(__dirname, '../../.env')});
} catch (error) {}

export async function createBaseData() {
  const app = new UserManagementService();
  await app.boot();
  await DatasourceInitialization.init(app);
  RepositoryInitialization.init(app);

  const baseData: Partial<UamLoginAttemptsConfig> = {
    // id: 1,
    maxLoginAttempts: 5,
    maxDormancyDays: 90,
    maxDormancyDaysBeforeFirstLogin: 30,
    createdDate: new Date(),
    lastModifiedDate: new Date()
  };

  const repository = await app.getRepository(UamLoginAttemptsConfigRepository);

  const existingId = await repository.findOne({where: {id: 1}});
  if (existingId) {
    await repository.updateById(1,baseData);
  } else {
    await repository.create(baseData);
  }

  LoggingUtils.info('base data created successfully');
  //exit the process when everything is done
  process.exit(0);
}

createBaseData().catch(err => {
  LoggingUtils.error('Could not create base data- ' + err);
  process.exit(1);
});
