import {AppRoleRepository, LoggingUtils} from 'common';
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

  const baseData = [
    {
      id: 1,
      name: 'CLIENT',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    // {
    //   id: 2,
    //   name: 'RELATIONSHIPMANAGER',
    //   createdDate: new Date(),
    //   lastModifiedDate: new Date()
    // },
    // {
    //   id: 3,
    //   name: 'BUSINESSPARTNER',
    //   createdDate: new Date(),
    //   lastModifiedDate: new Date()
    // },
    {
      id: 4,
      name: 'OPERATIONS',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    {
      id: 5,
      name: 'SYSTEMADMIN',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    {
      id: 6,
      name: 'BUSINESS',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    {
      id: 7,
      name: 'UAMMAKER',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    // {
    //   id: 7,
    //   name: 'VALUEFYADMIN',
    //   createdDate: new Date(),
    //   lastModifiedDate: new Date()
    // }
    {
      id: 8,
      name: 'CALLCENTER',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    {
      id: 9,
      name: 'BSG',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    {
      id: 10,
      name: 'PRODUCT',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    },
    {
      id: 11,
      name: 'UAMREVIEWER',
      createdDate: new Date(),
      lastModifiedDate: new Date()
    }
  ];

  const repository = await app.getRepository(AppRoleRepository);
  //await repository.createAll(baseData);
  for (const record of baseData) {
    try {
      let dataExists = await repository.findOne({where: {or: [{id: record.id}, {name: record.name}]}});

      if (dataExists) {
        await repository.updateById(record.id, record);
      } else {
        await repository.create(record);
      }
    } catch (error) {
      LoggingUtils.error(error.message);
    }
  }
  await ValidateSequence.checkIfSequenceIsCorrect(repository, AppRole.definition.settings.postgresql.tableName, 'id');
  LoggingUtils.info('base data created successfully');
  //exit the process when everything is done
  process.exit(0);
}

createBaseData().catch(err => {
  LoggingUtils.error('Could not create base data- ' + err);
  process.exit(1);
});
