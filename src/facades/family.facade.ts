import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Family, FamilyRelations, FamilyRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class FamilyFacade {
  constructor(@repository(FamilyRepository) private familyRepository: FamilyRepository) {}

  async create(entity: DataObject<Family>, options?: Options): Promise<Family> {
    return this.familyRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Family>[], options?: Options): Promise<Family[]> {
    return this.familyRepository.createAll(entities, options);
  }

  async save(entity: Family, options?: Options): Promise<Family> {
    return this.familyRepository.save(entity, options);
  }

  async find(filter?: Filter<Family>, options?: Options): Promise<(Family & FamilyRelations)[]> {
    return this.familyRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Family>, options?: Options): Promise<(Family & FamilyRelations) | null> {
    return this.familyRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Family>, options?: Options): Promise<Family & FamilyRelations> {
    return this.familyRepository.findById(id,filter, options);
  }

  async update(entity: Family, options?: Options): Promise<void> {
    return this.familyRepository.update(entity, options);
  }

  async delete(entity: Family, options?: Options): Promise<void> {
    return this.familyRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Family>, where?: Where<Family>, options?: Options): Promise<Count> {
    return this.familyRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Family>, options?: Options): Promise<void> {
    return this.familyRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Family>, options?: Options): Promise<void> {
    return this.familyRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Family>, options?: Options): Promise<Count> {
    return this.familyRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.familyRepository.deleteById(id, options);
  }

  async count(where?: Where<Family>, options?: Options): Promise<Count> {
    return this.familyRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.familyRepository.exists(id, options);
  }
}
