import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Group, GroupRelations, GroupRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class GroupFacade {
  constructor(@repository(GroupRepository) private groupRepository: GroupRepository) {}

  async create(entity: DataObject<Group>, options?: Options): Promise<Group> {
    return this.groupRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Group>[], options?: Options): Promise<Group[]> {
    return this.groupRepository.createAll(entities, options);
  }

  async save(entity: Group, options?: Options): Promise<Group> {
    return this.groupRepository.save(entity, options);
  }

  async find(filter?: Filter<Group>, options?: Options): Promise<(Group & GroupRelations)[]> {
    return this.groupRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Group>, options?: Options): Promise<(Group & GroupRelations) | null> {
    return this.groupRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Group>, options?: Options): Promise<Group & GroupRelations> {
    return this.groupRepository.findById(id,filter, options);
  }

  async update(entity: Group, options?: Options): Promise<void> {
    return this.groupRepository.update(entity, options);
  }

  async delete(entity: Group, options?: Options): Promise<void> {
    return this.groupRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Group>, where?: Where<Group>, options?: Options): Promise<Count> {
    return this.groupRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Group>, options?: Options): Promise<void> {
    return this.groupRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Group>, options?: Options): Promise<void> {
    return this.groupRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Group>, options?: Options): Promise<Count> {
    return this.groupRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.groupRepository.deleteById(id, options);
  }

  async count(where?: Where<Group>, options?: Options): Promise<Count> {
    return this.groupRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.groupRepository.exists(id, options);
  }
}
