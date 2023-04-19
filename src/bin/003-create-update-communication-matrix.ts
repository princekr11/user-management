import {
  Account,
  AccountRepository,
  CommunicationMatrixRepository,
  CommunicationTopicRepository,
  LoggingUtils,
  RandomizationUtils
} from 'common';
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
  const API_KEY = process.env.COMMON_API_KEY;
  const app = new UserManagementService();
  await app.boot();
  await DatasourceInitialization.init(app);
  RepositoryInitialization.init(app);
  const options = {
    headers: {
      Authorization: API_KEY,
      TrxId: Date.now() + '-seeders-create-update-communication-matrix',
      source: 'external-system'
    }
  };
  try {
    const accountRepositry = await app.getRepository(AccountRepository);
    const communicationMatrixRepository = await app.getRepository(CommunicationMatrixRepository);
    const communicationTopicRepository = await app.getRepository(CommunicationTopicRepository);
    const communicationTopics = await communicationTopicRepository.find({where: {isActive: true}}, options);
    const account = await accountRepositry.find({
      where: {
        isActive: true
      },
      fields: {id: true}
    });
    const accountIds = account.map(ele => ele.id);
    for (const accId of accountIds) {
      const communicationTopicMap = communicationTopics.map(data => {
        return {
          accountId: accId,
          communicationTopicId: data.id,
          modeEmail: data.modeEmail,
          modeSms: data.modeSms,
          modePush: data.modePush,
          toggleNotification: data.toggleNotification
        };
      });
      for (const matrix of communicationTopicMap) {
        const dataExist = await communicationMatrixRepository.findOne({
          where: {
            isActive: true,
            accountId: accId,
            communicationTopicId: matrix.communicationTopicId
          }
        });
        if (dataExist) {
          await communicationMatrixRepository.updateById(dataExist.id, matrix);
        } else {
          await communicationMatrixRepository.create(matrix);
        }
      }
    }
    await ValidateSequence.checkIfSequenceIsCorrect(communicationMatrixRepository, AppRole.definition.settings.postgresql.tableName, 'id');
    LoggingUtils.info('base data created successfully');
    //exit the process when everything is done
    process.exit(0);
  } catch (error) {
    LoggingUtils.error(error);
  }
}

createBaseData().catch(err => {
  LoggingUtils.error('Could not create base data- ' + err);
  process.exit(1);
});
