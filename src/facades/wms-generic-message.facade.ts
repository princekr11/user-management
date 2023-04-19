import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {WmsGenericMessage, WmsGenericMessageRelations, WmsGenericMessageRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class WmsGenericMessageFacade {
  constructor(@repository(WmsGenericMessageRepository) private wmsGenericMessageRepository: WmsGenericMessageRepository) {}

  async create(entity: DataObject<WmsGenericMessage>, options?: Options): Promise<WmsGenericMessage> {
    return this.wmsGenericMessageRepository.create(entity, options);
  }

  async createAll(entities: DataObject<WmsGenericMessage>[], options?: Options): Promise<WmsGenericMessage[]> {
    return this.wmsGenericMessageRepository.createAll(entities, options);
  }

  async save(entity: WmsGenericMessage, options?: Options): Promise<WmsGenericMessage> {
    return this.wmsGenericMessageRepository.save(entity, options);
  }

  async find(filter?: Filter<WmsGenericMessage>, options?: Options): Promise<(WmsGenericMessage & WmsGenericMessageRelations)[]> {
    return this.wmsGenericMessageRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<WmsGenericMessage>,
    options?: Options
  ): Promise<(WmsGenericMessage & WmsGenericMessageRelations) | null> {
    return this.wmsGenericMessageRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<WmsGenericMessage>,
    options?: Options
  ): Promise<WmsGenericMessage & WmsGenericMessageRelations> {
    return this.wmsGenericMessageRepository.findById(id,filter, options);
  }

  async update(entity: WmsGenericMessage, options?: Options): Promise<void> {
    return this.wmsGenericMessageRepository.update(entity, options);
  }

  async delete(entity: WmsGenericMessage, options?: Options): Promise<void> {
    return this.wmsGenericMessageRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<WmsGenericMessage>, where?: Where<WmsGenericMessage>, options?: Options): Promise<Count> {
    return this.wmsGenericMessageRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<WmsGenericMessage>, options?: Options): Promise<void> {
    return this.wmsGenericMessageRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<WmsGenericMessage>, options?: Options): Promise<void> {
    return this.wmsGenericMessageRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<WmsGenericMessage>, options?: Options): Promise<Count> {
    return this.wmsGenericMessageRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.wmsGenericMessageRepository.deleteById(id, options);
  }

  async count(where?: Where<WmsGenericMessage>, options?: Options): Promise<Count> {
    return this.wmsGenericMessageRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.wmsGenericMessageRepository.exists(id, options);
  }
}
