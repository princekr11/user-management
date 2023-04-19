import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {AppUserRoleMapping, AppUserRoleMappingRelations, AppUserRoleMappingRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AppUserRoleMappingFacade {
  constructor(@repository(AppUserRoleMappingRepository) private appUserRoleMappingRepository: AppUserRoleMappingRepository) {}

  async create(entity: DataObject<AppUserRoleMapping>, options?: Options): Promise<AppUserRoleMapping> {
    return this.appUserRoleMappingRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AppUserRoleMapping>[], options?: Options): Promise<AppUserRoleMapping[]> {
    return this.appUserRoleMappingRepository.createAll(entities, options);
  }

  async save(entity: AppUserRoleMapping, options?: Options): Promise<AppUserRoleMapping> {
    return this.appUserRoleMappingRepository.save(entity, options);
  }

  async find(filter?: Filter<AppUserRoleMapping>, options?: Options): Promise<(AppUserRoleMapping & AppUserRoleMappingRelations)[]> {
    return this.appUserRoleMappingRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<AppUserRoleMapping>,
    options?: Options
  ): Promise<(AppUserRoleMapping & AppUserRoleMappingRelations) | null> {
    return this.appUserRoleMappingRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<AppUserRoleMapping>,
    options?: Options
  ): Promise<AppUserRoleMapping & AppUserRoleMappingRelations> {
    return this.appUserRoleMappingRepository.findById(id,filter, options);
  }

  async update(entity: AppUserRoleMapping, options?: Options): Promise<void> {
    return this.appUserRoleMappingRepository.update(entity, options);
  }

  async delete(entity: AppUserRoleMapping, options?: Options): Promise<void> {
    return this.appUserRoleMappingRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AppUserRoleMapping>, where?: Where<AppUserRoleMapping>, options?: Options): Promise<Count> {
    return this.appUserRoleMappingRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AppUserRoleMapping>, options?: Options): Promise<void> {
    return this.appUserRoleMappingRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AppUserRoleMapping>, options?: Options): Promise<void> {
    return this.appUserRoleMappingRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AppUserRoleMapping>, options?: Options): Promise<Count> {
    return this.appUserRoleMappingRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.appUserRoleMappingRepository.deleteById(id, options);
  }

  async count(where?: Where<AppUserRoleMapping>, options?: Options): Promise<Count> {
    return this.appUserRoleMappingRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.appUserRoleMappingRepository.exists(id, options);
  }
}
