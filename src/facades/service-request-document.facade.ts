import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {ServiceRequestDocument, ServiceRequestDocumentRelations, ServiceRequestDocumentRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class ServiceRequestDocumentFacade {
  constructor(@repository(ServiceRequestDocumentRepository) private serviceRequestDocumentRepository: ServiceRequestDocumentRepository) {}

  async create(entity: DataObject<ServiceRequestDocument>, options?: Options): Promise<ServiceRequestDocument> {
    return this.serviceRequestDocumentRepository.create(entity, options);
  }

  async createAll(entities: DataObject<ServiceRequestDocument>[], options?: Options): Promise<ServiceRequestDocument[]> {
    return this.serviceRequestDocumentRepository.createAll(entities, options);
  }

  async save(entity: ServiceRequestDocument, options?: Options): Promise<ServiceRequestDocument> {
    return this.serviceRequestDocumentRepository.save(entity, options);
  }

  async find(
    filter?: Filter<ServiceRequestDocument>,
    options?: Options
  ): Promise<(ServiceRequestDocument & ServiceRequestDocumentRelations)[]> {
    return this.serviceRequestDocumentRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<ServiceRequestDocument>,
    options?: Options
  ): Promise<(ServiceRequestDocument & ServiceRequestDocumentRelations) | null> {
    return this.serviceRequestDocumentRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<ServiceRequestDocument>,
    options?: Options
  ): Promise<ServiceRequestDocument & ServiceRequestDocumentRelations> {
    return this.serviceRequestDocumentRepository.findById(id,filter, options);
  }

  async update(entity: ServiceRequestDocument, options?: Options): Promise<void> {
    return this.serviceRequestDocumentRepository.update(entity, options);
  }

  async delete(entity: ServiceRequestDocument, options?: Options): Promise<void> {
    return this.serviceRequestDocumentRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<ServiceRequestDocument>, where?: Where<ServiceRequestDocument>, options?: Options): Promise<Count> {
    return this.serviceRequestDocumentRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<ServiceRequestDocument>, options?: Options): Promise<void> {
    return this.serviceRequestDocumentRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<ServiceRequestDocument>, options?: Options): Promise<void> {
    return this.serviceRequestDocumentRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<ServiceRequestDocument>, options?: Options): Promise<Count> {
    return this.serviceRequestDocumentRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.serviceRequestDocumentRepository.deleteById(id, options);
  }

  async count(where?: Where<ServiceRequestDocument>, options?: Options): Promise<Count> {
    return this.serviceRequestDocumentRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.serviceRequestDocumentRepository.exists(id, options);
  }
}
