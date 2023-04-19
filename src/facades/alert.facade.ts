import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Alert, AlertRelations, AlertRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AlertFacade {
  constructor(@repository(AlertRepository) private alertRepository: AlertRepository) {}

  async create(entity: DataObject<Alert>, options?: Options): Promise<Alert> {
    return this.alertRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Alert>[], options?: Options): Promise<Alert[]> {
    return this.alertRepository.createAll(entities, options);
  }

  async save(entity: Alert, options?: Options): Promise<Alert> {
    return this.alertRepository.save(entity, options);
  }

  async find(filter?: Filter<Alert>, options?: Options): Promise<(Alert & AlertRelations)[]> {
    return this.alertRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Alert>, options?: Options): Promise<(Alert & AlertRelations) | null> {
    return this.alertRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Alert>, options?: Options): Promise<Alert & AlertRelations> {
    return this.alertRepository.findById(id,filter, options);
  }

  async update(entity: Alert, options?: Options): Promise<void> {
    return this.alertRepository.update(entity, options);
  }

  async delete(entity: Alert, options?: Options): Promise<void> {
    return this.alertRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Alert>, where?: Where<Alert>, options?: Options): Promise<Count> {
    return this.alertRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Alert>, options?: Options): Promise<void> {
    return this.alertRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Alert>, options?: Options): Promise<void> {
    return this.alertRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Alert>, options?: Options): Promise<Count> {
    return this.alertRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.alertRepository.deleteById(id, options);
  }

  async count(where?: Where<Alert>, options?: Options): Promise<Count> {
    return this.alertRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.alertRepository.exists(id, options);
  }
}
