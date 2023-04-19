import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {AppRole, AppRoleRelations, AppRoleRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AppRoleFacade {
  constructor(@repository(AppRoleRepository) private appRoleRepository: AppRoleRepository) {}

  async create(entity: DataObject<AppRole>, options?: Options): Promise<AppRole> {
    return this.appRoleRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AppRole>[], options?: Options): Promise<AppRole[]> {
    return this.appRoleRepository.createAll(entities, options);
  }

  async save(entity: AppRole, options?: Options): Promise<AppRole> {
    return this.appRoleRepository.save(entity, options);
  }

  async find(filter?: Filter<AppRole>, options?: Options): Promise<(AppRole & AppRoleRelations)[]> {
    return this.appRoleRepository.find(filter, options);
  }

  async findOne(filter?: Filter<AppRole>, options?: Options): Promise<(AppRole & AppRoleRelations) | null> {
    return this.appRoleRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<AppRole>, options?: Options): Promise<AppRole & AppRoleRelations> {
    return this.appRoleRepository.findById(id,filter, options);
  }

  async update(entity: AppRole, options?: Options): Promise<void> {
    return this.appRoleRepository.update(entity, options);
  }

  async delete(entity: AppRole, options?: Options): Promise<void> {
    return this.appRoleRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AppRole>, where?: Where<AppRole>, options?: Options): Promise<Count> {
    return this.appRoleRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AppRole>, options?: Options): Promise<void> {
    return this.appRoleRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AppRole>, options?: Options): Promise<void> {
    return this.appRoleRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AppRole>, options?: Options): Promise<Count> {
    return this.appRoleRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.appRoleRepository.deleteById(id, options);
  }

  async count(where?: Where<AppRole>, options?: Options): Promise<Count> {
    return this.appRoleRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.appRoleRepository.exists(id, options);
  }
}
