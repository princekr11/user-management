import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {OverseesAddress, OverseesAddressRelations, OverseesAddressRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class OverseesAddressFacade {
  constructor(@repository(OverseesAddressRepository) private overseesAddressRepository: OverseesAddressRepository) {}

  async create(entity: DataObject<OverseesAddress>, options?: Options): Promise<OverseesAddress> {
    return this.overseesAddressRepository.create(entity, options);
  }

  async createAll(entities: DataObject<OverseesAddress>[], options?: Options): Promise<OverseesAddress[]> {
    return this.overseesAddressRepository.createAll(entities, options);
  }

  async save(entity: OverseesAddress, options?: Options): Promise<OverseesAddress> {
    return this.overseesAddressRepository.save(entity, options);
  }

  async find(filter?: Filter<OverseesAddress>, options?: Options): Promise<(OverseesAddress & OverseesAddressRelations)[]> {
    return this.overseesAddressRepository.find(filter, options);
  }

  async findOne(filter?: Filter<OverseesAddress>, options?: Options): Promise<(OverseesAddress & OverseesAddressRelations) | null> {
    return this.overseesAddressRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<OverseesAddress>,
    options?: Options
  ): Promise<OverseesAddress & OverseesAddressRelations> {
    return this.overseesAddressRepository.findById(id,filter, options);
  }

  async update(entity: OverseesAddress, options?: Options): Promise<void> {
    return this.overseesAddressRepository.update(entity, options);
  }

  async delete(entity: OverseesAddress, options?: Options): Promise<void> {
    return this.overseesAddressRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<OverseesAddress>, where?: Where<OverseesAddress>, options?: Options): Promise<Count> {
    return this.overseesAddressRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<OverseesAddress>, options?: Options): Promise<void> {
    return this.overseesAddressRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<OverseesAddress>, options?: Options): Promise<void> {
    return this.overseesAddressRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<OverseesAddress>, options?: Options): Promise<Count> {
    return this.overseesAddressRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.overseesAddressRepository.deleteById(id, options);
  }

  async count(where?: Where<OverseesAddress>, options?: Options): Promise<Count> {
    return this.overseesAddressRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.overseesAddressRepository.exists(id, options);
  }
}
