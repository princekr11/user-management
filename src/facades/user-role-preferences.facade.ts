import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {UserRolePreferences, UserRolePreferencesRelations, UserRolePreferencesRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class UserRolePreferencesFacade {
  constructor(@repository(UserRolePreferencesRepository) private userRolePreferencesRepository: UserRolePreferencesRepository) {}

  async create(entity: DataObject<UserRolePreferences>, options?: Options): Promise<UserRolePreferences> {
    return this.userRolePreferencesRepository.create(entity, options);
  }

  async createAll(entities: DataObject<UserRolePreferences>[], options?: Options): Promise<UserRolePreferences[]> {
    return this.userRolePreferencesRepository.createAll(entities, options);
  }

  async save(entity: UserRolePreferences, options?: Options): Promise<UserRolePreferences> {
    return this.userRolePreferencesRepository.save(entity, options);
  }

  async find(filter?: Filter<UserRolePreferences>, options?: Options): Promise<(UserRolePreferences & UserRolePreferencesRelations)[]> {
    return this.userRolePreferencesRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<UserRolePreferences>,
    options?: Options
  ): Promise<(UserRolePreferences & UserRolePreferencesRelations) | null> {
    return this.userRolePreferencesRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<UserRolePreferences>,
    options?: Options
  ): Promise<UserRolePreferences & UserRolePreferencesRelations> {
    return this.userRolePreferencesRepository.findById(id,filter, options);
  }

  async update(entity: UserRolePreferences, options?: Options): Promise<void> {
    return this.userRolePreferencesRepository.update(entity, options);
  }

  async delete(entity: UserRolePreferences, options?: Options): Promise<void> {
    return this.userRolePreferencesRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<UserRolePreferences>, where?: Where<UserRolePreferences>, options?: Options): Promise<Count> {
    return this.userRolePreferencesRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<UserRolePreferences>, options?: Options): Promise<void> {
    return this.userRolePreferencesRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<UserRolePreferences>, options?: Options): Promise<void> {
    return this.userRolePreferencesRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<UserRolePreferences>, options?: Options): Promise<Count> {
    return this.userRolePreferencesRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.userRolePreferencesRepository.deleteById(id, options);
  }

  async count(where?: Where<UserRolePreferences>, options?: Options): Promise<Count> {
    return this.userRolePreferencesRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.userRolePreferencesRepository.exists(id, options);
  }
}
