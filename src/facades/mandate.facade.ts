import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Mandate, MandateRelations, MandateRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class MandateFacade {
  constructor(@repository(MandateRepository) private mandateRepository: MandateRepository) {}

  async create(entity: DataObject<Mandate>, options?: Options): Promise<Mandate> {
    return this.mandateRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Mandate>[], options?: Options): Promise<Mandate[]> {
    return this.mandateRepository.createAll(entities, options);
  }

  async save(entity: Mandate, options?: Options): Promise<Mandate> {
    return this.mandateRepository.save(entity, options);
  }

  async find(filter?: Filter<Mandate>, options?: Options): Promise<(Mandate & MandateRelations)[]> {
    return this.mandateRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Mandate>, options?: Options): Promise<(Mandate & MandateRelations) | null> {
    return this.mandateRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Mandate>, options?: Options): Promise<Mandate & MandateRelations> {
    return this.mandateRepository.findById(id,filter, options);
  }

  async update(entity: Mandate, options?: Options): Promise<void> {
    return this.mandateRepository.update(entity, options);
  }

  async delete(entity: Mandate, options?: Options): Promise<void> {
    return this.mandateRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Mandate>, where?: Where<Mandate>, options?: Options): Promise<Count> {
    return this.mandateRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Mandate>, options?: Options): Promise<void> {
    return this.mandateRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Mandate>, options?: Options): Promise<void> {
    return this.mandateRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Mandate>, options?: Options): Promise<Count> {
    return this.mandateRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.mandateRepository.deleteById(id, options);
  }

  async count(where?: Where<Mandate>, options?: Options): Promise<Count> {
    return this.mandateRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.mandateRepository.exists(id, options);
  }
}
