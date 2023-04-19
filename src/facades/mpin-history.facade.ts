import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {MpinHistory, MpinHistoryRelations, MpinHistoryRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class MpinHistoryFacade {
  constructor(@repository(MpinHistoryRepository) private mpinHistoryRepository: MpinHistoryRepository) {}

  async create(entity: DataObject<MpinHistory>, options?: Options): Promise<MpinHistory> {
    return this.mpinHistoryRepository.create(entity, options);
  }

  async createAll(entities: DataObject<MpinHistory>[], options?: Options): Promise<MpinHistory[]> {
    return this.mpinHistoryRepository.createAll(entities, options);
  }

  async save(entity: MpinHistory, options?: Options): Promise<MpinHistory> {
    return this.mpinHistoryRepository.save(entity, options);
  }

  async find(filter?: Filter<MpinHistory>, options?: Options): Promise<(MpinHistory & MpinHistoryRelations)[]> {
    return this.mpinHistoryRepository.find(filter, options);
  }

  async findOne(filter?: Filter<MpinHistory>, options?: Options): Promise<(MpinHistory & MpinHistoryRelations) | null> {
    return this.mpinHistoryRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<MpinHistory>, options?: Options): Promise<MpinHistory & MpinHistoryRelations> {
    return this.mpinHistoryRepository.findById(id,filter, options);
  }

  async update(entity: MpinHistory, options?: Options): Promise<void> {
    return this.mpinHistoryRepository.update(entity, options);
  }

  async delete(entity: MpinHistory, options?: Options): Promise<void> {
    return this.mpinHistoryRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<MpinHistory>, where?: Where<MpinHistory>, options?: Options): Promise<Count> {
    return this.mpinHistoryRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<MpinHistory>, options?: Options): Promise<void> {
    return this.mpinHistoryRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<MpinHistory>, options?: Options): Promise<void> {
    return this.mpinHistoryRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<MpinHistory>, options?: Options): Promise<Count> {
    return this.mpinHistoryRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.mpinHistoryRepository.deleteById(id, options);
  }

  async count(where?: Where<MpinHistory>, options?: Options): Promise<Count> {
    return this.mpinHistoryRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.mpinHistoryRepository.exists(id, options);
  }
}
