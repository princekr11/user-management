import {injectable, /* inject, */ BindingScope, service} from '@loopback/core';
import {AnyObject, Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {RoleRights, RoleRightsRelations, RoleRightsRepository, UamIntegrationRepository} from 'common';
import {UamIntegrationFacade} from './uam-integration.facade';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class RoleRightsFacade {
  constructor(@repository(RoleRightsRepository) private roleRightsRepository: RoleRightsRepository,
  @service(UamIntegrationFacade) private uamIntegrationFacade: UamIntegrationFacade
  ) {}

  async create(entity: DataObject<RoleRights>, options?: Options): Promise<RoleRights> {
    return this.roleRightsRepository.create(entity, options);
  }

  async createAll(entities: DataObject<RoleRights>[], options?: Options): Promise<RoleRights[]> {
    return this.roleRightsRepository.createAll(entities, options);
  }

  async save(entity: RoleRights, options?: Options): Promise<RoleRights> {
    return this.roleRightsRepository.save(entity, options);
  }

  async find(filter?: Filter<RoleRights>, options?: Options): Promise<(RoleRights & RoleRightsRelations)[]> {
    return this.roleRightsRepository.find(filter, options);
  }

  async findOne(filter?: Filter<RoleRights>, options?: Options): Promise<(RoleRights & RoleRightsRelations) | null> {
    return this.roleRightsRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<RoleRights>, options?: Options): Promise<RoleRights & RoleRightsRelations> {
    return this.roleRightsRepository.findById(id,filter, options);
  }

  async update(entity: RoleRights, options?: Options): Promise<void> {
    return this.roleRightsRepository.update(entity, options);
  }

  async delete(entity: RoleRights, options?: Options): Promise<void> {
    return this.roleRightsRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<RoleRights>, where?: Where<RoleRights>, options?: Options): Promise<Count> {
    return this.roleRightsRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<RoleRights>, options?: Options): Promise<void> {
    return this.roleRightsRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<RoleRights>, options?: Options): Promise<void> {
    return this.roleRightsRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<RoleRights>, options?: Options): Promise<Count> {
    return this.roleRightsRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.roleRightsRepository.deleteById(id, options);
  }

  async count(where?: Where<RoleRights>, options?: Options): Promise<Count> {
    return this.roleRightsRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.roleRightsRepository.exists(id, options);
  }

  async fetchRolesRights(filter?: Filter<RoleRights>, options?: Options): Promise<AnyObject[]> {
    const results =  await this.roleRightsRepository.find(filter, options);
    const resultsWithDepartment =  await this.uamIntegrationFacade.addDepartmentToResults(results)
    return resultsWithDepartment
  }

}
