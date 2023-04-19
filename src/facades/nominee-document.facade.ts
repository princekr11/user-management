import {injectable, /* inject, */ BindingScope, service} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {LoggingUtils, Option, QueueProducer, RestError, TransactionalDataRefreshingQueueMessage, TransactionalDataRefreshingQueueMessageEventType} from 'common';
import {NomineeDocument, NomineeDocumentRelations, NomineeDocumentRepository, RequestToEngineRepository} from 'common';
import AppConstant from 'common/dist/constants/app-constant';
import _ = require('underscore');
import { NomineeDocumentGenerationEngine } from '../engines/nominee-document-generation.engine';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class NomineeDocumentFacade {
  constructor(@repository(NomineeDocumentRepository) private nomineeDocumentRepository: NomineeDocumentRepository,
  @service(NomineeDocumentGenerationEngine) private nomineeDocumentGenerationEngine : NomineeDocumentGenerationEngine,
  @repository(RequestToEngineRepository) private requestToEngineRepository: RequestToEngineRepository,) {}

  async create(entity: DataObject<NomineeDocument>, options?: Options): Promise<NomineeDocument> {
    return this.nomineeDocumentRepository.create(entity, options);
  }

  async createAll(entities: DataObject<NomineeDocument>[], options?: Options): Promise<NomineeDocument[]> {
    return this.nomineeDocumentRepository.createAll(entities, options);
  }

  async save(entity: NomineeDocument, options?: Options): Promise<NomineeDocument> {
    return this.nomineeDocumentRepository.save(entity, options);
  }

  async find(filter?: Filter<NomineeDocument>, options?: Options): Promise<(NomineeDocument & NomineeDocumentRelations)[]> {
    return this.nomineeDocumentRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<NomineeDocument>,
    options?: Options
  ): Promise<(NomineeDocument & NomineeDocumentRelations) | null> {
    return this.nomineeDocumentRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<NomineeDocument>,
    options?: Options
  ): Promise<NomineeDocument & NomineeDocumentRelations> {
    return this.nomineeDocumentRepository.findById(id,filter, options);
  }

  async update(entity: NomineeDocument, options?: Options): Promise<void> {
    return this.nomineeDocumentRepository.update(entity, options);
  }

  async delete(entity: NomineeDocument, options?: Options): Promise<void> {
    return this.nomineeDocumentRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<NomineeDocument>, where?: Where<NomineeDocument>, options?: Options): Promise<Count> {
    return this.nomineeDocumentRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<NomineeDocument>, options?: Options): Promise<void> {
    return this.nomineeDocumentRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<NomineeDocument>, options?: Options): Promise<void> {
    return this.nomineeDocumentRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<NomineeDocument>, options?: Options): Promise<Count> {
    return this.nomineeDocumentRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.nomineeDocumentRepository.deleteById(id, options);
  }

  async count(where?: Where<NomineeDocument>, options?: Options): Promise<Count> {
    return this.nomineeDocumentRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.nomineeDocumentRepository.exists(id, options);
  }

  async generateNomineeDocuments(obj: any, options: Options): Promise<any> {

    return new Promise(async (resolve, reject) => {

      let data = await this.requestToEngineRepository.create({
        eventType: 'NOMINEEDOCUMENTGENERATION',
        requestedDate: new Date(),
        status: Option.GLOBALOPTIONS['REQUESTTOENGINESTATUS']['initaited'].value,
        parameters : obj
      })
      let message = new TransactionalDataRefreshingQueueMessage();
      message.eventType = TransactionalDataRefreshingQueueMessageEventType.ENGINE_REQUEST_FROM_SERVICE;
      message.rowId = data.id
      //@todo -- need to remove the logs
      LoggingUtils.debug('sending message in Transaction Queue', message);
      await QueueProducer.sendMessageInTransactionalDataRefreshingMediumPriorityQueue(message);
      resolve({
        message: 'Process started to Generate Nominee Documents Please Check in Some Time.'
      })
    })

  }
  async nomineeDocumentDetails(filter: any,filterObject: any, options: Options): Promise<any>{
    return new Promise(async (resolve, reject) => {
      let count: Count;
      let response: Object = {};


      count = await this.nomineeDocumentRepository.count(filter, options);
      return this.nomineeDocumentRepository
        .find({...filter}, options)
        .then(async (result: any[]) => {

          let searchCriteria = new Map();
          let valueToSearch: string;
          filterObject.where.find((data: Object) => {
            searchCriteria.set(Object.keys(data)[0], Object.values(data)[0]);
          });

          let updatedArray = result.filter(data => {
            if (searchCriteria.has('amcCode')) {
              if (data.serviceProvider) {
                valueToSearch = searchCriteria.get('amcCode').toLowerCase();
                if (!data.serviceProvider.primaryAMCCode.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }
            }
            if (searchCriteria.has('accountUniqueId')) {
              if (data.account) {
                valueToSearch = searchCriteria.get('accountUniqueId').toLowerCase();
                if (!data.account.uniqueId.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }
            }
            if (searchCriteria.has('panNumber')) {
              if (data.account) {
                valueToSearch = searchCriteria.get('panNumber').toLowerCase();
                if (!data.account.primaryHolder.investorDetails.panCardNumber.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }
            }

              return true;

          });

          const data = updatedArray.slice(filterObject.offset, filterObject.limit + filterObject.offset);
          response = {
            data: data,
            count: updatedArray.length
          };
          return resolve(response);
        })
        .catch((error: any) => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }
  async nomineeDocumentStatusUpdate(ids: Array<number>,status : number,options? : Options){
    return this.nomineeDocumentRepository.updateAll({
      status : status
    },
    {
      id : {inq : ids}
    },
    options)
  }
}
