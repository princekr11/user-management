import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Address, AddressRelations, AddressRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AddressFacade {
  constructor(@repository(AddressRepository) private addressRepository: AddressRepository) {}

  async create(entity: DataObject<Address>, options?: Options): Promise<Address> {
    return this.addressRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Address>[], options?: Options): Promise<Address[]> {
    return this.addressRepository.createAll(entities, options);
  }

  async save(entity: Address, options?: Options): Promise<Address> {
    return this.addressRepository.save(entity, options);
  }

  async find(filter?: Filter<Address>, options?: Options): Promise<(Address & AddressRelations)[]> {
    return this.addressRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Address>, options?: Options): Promise<(Address & AddressRelations) | null> {
    return this.addressRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Address>, options?: Options): Promise<Address & AddressRelations> {
    return this.addressRepository.findById(id,filter, options);
  }

  async update(entity: Address, options?: Options): Promise<void> {
    return this.addressRepository.update(entity, options);
  }

  async delete(entity: Address, options?: Options): Promise<void> {
    return this.addressRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Address>, where?: Where<Address>, options?: Options): Promise<Count> {
    return this.addressRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Address>, options?: Options): Promise<void> {
    return this.addressRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Address>, options?: Options): Promise<void> {
    return this.addressRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Address>, options?: Options): Promise<Count> {
    return this.addressRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.addressRepository.deleteById(id, options);
  }

  async count(where?: Where<Address>, options?: Options): Promise<Count> {
    return this.addressRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.addressRepository.exists(id, options);
  }
}
