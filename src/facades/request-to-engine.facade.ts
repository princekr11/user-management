import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {LoggingUtils, Option, RestError} from 'common';
import {RequestToEngine, RequestToEngineRelations, RequestToEngineRepository} from 'common';
import AppConstant from 'common/dist/constants/app-constant';
import _ = require('underscore');

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class RequestToEngineFacade {
  constructor(@repository(RequestToEngineRepository) private RequestToEngineRepository: RequestToEngineRepository) {}

  async create(entity: DataObject<RequestToEngine>, options?: Options): Promise<RequestToEngine> {
    return this.RequestToEngineRepository.create(entity, options);
  }

  async createAll(entities: DataObject<RequestToEngine>[], options?: Options): Promise<RequestToEngine[]> {
    return this.RequestToEngineRepository.createAll(entities, options);
  }

  async save(entity: RequestToEngine, options?: Options): Promise<RequestToEngine> {
    return this.RequestToEngineRepository.save(entity, options);
  }

  async find(filter?: Filter<RequestToEngine>, options?: Options): Promise<(RequestToEngine & RequestToEngineRelations)[]> {
    return this.RequestToEngineRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<RequestToEngine>,
    options?: Options
  ): Promise<(RequestToEngine & RequestToEngineRelations) | null> {
    return this.RequestToEngineRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<RequestToEngine>,
    options?: Options
  ): Promise<RequestToEngine & RequestToEngineRelations> {
    return this.RequestToEngineRepository.findById(id,filter, options);
  }

  async update(entity: RequestToEngine, options?: Options): Promise<void> {
    return this.RequestToEngineRepository.update(entity, options);
  }

  async delete(entity: RequestToEngine, options?: Options): Promise<void> {
    return this.RequestToEngineRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<RequestToEngine>, where?: Where<RequestToEngine>, options?: Options): Promise<Count> {
    return this.RequestToEngineRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<RequestToEngine>, options?: Options): Promise<void> {
    return this.RequestToEngineRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<RequestToEngine>, options?: Options): Promise<void> {
    return this.RequestToEngineRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<RequestToEngine>, options?: Options): Promise<Count> {
    return this.RequestToEngineRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.RequestToEngineRepository.deleteById(id, options);
  }

  async count(where?: Where<RequestToEngine>, options?: Options): Promise<Count> {
    return this.RequestToEngineRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.RequestToEngineRepository.exists(id, options);
  }


}
