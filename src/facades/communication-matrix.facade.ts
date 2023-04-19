import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {
  CommunicationMatrix,
  CommunicationMatrixRelations,
  CommunicationMatrixRepository,
  LoggingUtils,
  RestError,
  CommunicationTopic,
  CommunicationTopicRepository,
  NotificationUtils,
  NotificationTopics
} from 'common';
import {toPlainObject} from 'lodash';
import moment from 'moment';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class CommunicationMatrixFacade {
  constructor(
    @repository(CommunicationMatrixRepository) private communicationMatrixRepository: CommunicationMatrixRepository,
    @repository(CommunicationTopicRepository) private communicationTopicRepository: CommunicationTopicRepository
  ) {}

  async create(entity: DataObject<CommunicationMatrix>, options?: Options): Promise<CommunicationMatrix> {
    return this.communicationMatrixRepository.create(entity, options);
  }

  async createAll(entities: DataObject<CommunicationMatrix>[], options?: Options): Promise<CommunicationMatrix[]> {
    return this.communicationMatrixRepository.createAll(entities, options);
  }

  async save(entity: CommunicationMatrix, options?: Options): Promise<CommunicationMatrix> {
    return this.communicationMatrixRepository.save(entity, options);
  }

  async find(filter?: Filter<CommunicationMatrix>, options?: Options): Promise<(CommunicationMatrix & CommunicationMatrixRelations)[]> {
    return this.communicationMatrixRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<CommunicationMatrix>,
    options?: Options
  ): Promise<(CommunicationMatrix & CommunicationMatrixRelations) | null> {
    return this.communicationMatrixRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<CommunicationMatrix>,
    options?: Options
  ): Promise<CommunicationMatrix & CommunicationMatrixRelations> {
    return this.communicationMatrixRepository.findById(id, {include: [{relation: 'communicationTopic'}]}, options);
  }

  async update(entity: CommunicationMatrix, options?: Options): Promise<void> {
    return this.communicationMatrixRepository.update(entity, options);
  }

  async delete(entity: CommunicationMatrix, options?: Options): Promise<void> {
    return this.communicationMatrixRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<CommunicationMatrix>, where?: Where<CommunicationMatrix>, options?: Options): Promise<Count> {
    return this.communicationMatrixRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<CommunicationMatrix>, options?: Options): Promise<void> {
    return this.communicationMatrixRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<CommunicationMatrix>, options?: Options): Promise<void> {
    return this.communicationMatrixRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<CommunicationMatrix>, options?: Options): Promise<Count> {
    return this.communicationMatrixRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.communicationMatrixRepository.deleteById(id, options);
  }

  async count(where?: Where<CommunicationMatrix>, options?: Options): Promise<Count> {
    return this.communicationMatrixRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.communicationMatrixRepository.exists(id, options);
  }

  async findByAccountId(id: number, options?: Options): Promise<CommunicationMatrix[] | RestError> {
    try {
      let cm = await this.communicationMatrixRepository.find(
        {
          where: {
            accountId: id,
            isActive: true
          },
          include: [
            {
              relation: 'communicationTopic'
            }
          ]
        },
        options
      );
      if (!cm) {
        return new RestError(404, 'Communication matrix not found', {systemcode: 1243});
      }
      return cm;
    } catch (err) {
      LoggingUtils.error(`Some Error Occured ${JSON.stringify(err)}`);
      return new RestError(400, 'Something went wrong', {systemcode: 1244});
    }
  }

  async updateModeOfNotification(id: number, settings: any, options: Options): Promise<{success: boolean} | RestError> {
    try {
      const topics = await this.communicationTopicRepository.find(
        {
          where: {
            subCategory: settings.subCategory,
            isActive: true
          }
        },
        options
      );
      if (topics.length == 0) return {success: false, message: 'No topics Found'};
      let topicIds = topics.map((data: any) => data.id);
      let modes: any = {};
      if (settings.modeEmail != undefined) modes['modeEmail'] = settings.modeEmail;
      if (settings.modeSms != undefined) modes['modeSms'] = settings.modeSms;
      if (settings.modePush != undefined) modes['modePush'] = settings.modePush;
      await this.communicationMatrixRepository.updateAll(
        modes,
        {and: [{accountId: id}, {isActive: true}, {communicationTopicId: {inq: topicIds}}]},
        options
      );
      return {success: true};
      // if (!cm) {
      //   return new RestError(404, 'Communication matrix not found');
      // }
      // cm.modeEmail = settings.modeEmail;
      // cm.modePush = settings.modePush;
      // cm.modeSms = settings.modeSms;
      // await this.communicationMatrixRepository.save(cm);
      // return {success : true}
    } catch (err) {
      LoggingUtils.error(`Some Error Occured ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async addCommunicationMatrix(accountId: number | undefined, options?: Options): Promise<any> {
    try {
      if (accountId == undefined) throw 'USER ACCOUNT ID IS IN VALID';
      const communicationTopic = await this.communicationTopicRepository.find({where: {isActive: true}}, options);
      const communicationTopicMap = communicationTopic.map(data => {
        return {
          accountId: accountId,
          communicationTopicId: data.id,
          modeEmail: data.modeEmail,
          modeSms: data.modeSms,
          modePush: data.modePush,
          toggleNotification: data.toggleNotification
        };
      });
      const result = await this.communicationMatrixRepository.createAll(communicationTopicMap, options);
      return result;
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async testNotification(accountId: number | undefined, options?: Options): Promise<any> {
    try {
      if (accountId == undefined) throw 'USER ACCOUNT ID IS IN VALID';
      const date = moment().format('DD/MM/YY');
      await NotificationUtils.sendNotificationEvent({
        accountId: accountId,
        topicId: NotificationTopics.TOPICS.login.askReset.value,
        templateKeys: {date: date},
        notificationType: NotificationTopics.TOPICS.login.askReset.topic
      });
      return {message: 'notification send'};
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }
}
