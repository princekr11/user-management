import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {DocumentUpload, DocumentUploadRelations, DocumentUploadRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class DocumentUploadFacade {
  constructor(@repository(DocumentUploadRepository) private documentUploadRepository: DocumentUploadRepository) {}

  async create(entity: DataObject<DocumentUpload>, options?: Options): Promise<DocumentUpload> {
    return this.documentUploadRepository.create(entity, options);
  }

  async createAll(entities: DataObject<DocumentUpload>[], options?: Options): Promise<DocumentUpload[]> {
    return this.documentUploadRepository.createAll(entities, options);
  }

  async save(entity: DocumentUpload, options?: Options): Promise<DocumentUpload> {
    return this.documentUploadRepository.save(entity, options);
  }

  async find(filter?: Filter<DocumentUpload>, options?: Options): Promise<(DocumentUpload & DocumentUploadRelations)[]> {
    return this.documentUploadRepository.find(filter, options);
  }

  async findOne(filter?: Filter<DocumentUpload>, options?: Options): Promise<(DocumentUpload & DocumentUploadRelations) | null> {
    return this.documentUploadRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<DocumentUpload>,
    options?: Options
  ): Promise<DocumentUpload & DocumentUploadRelations> {
    return this.documentUploadRepository.findById(id,filter, options);
  }

  async update(entity: DocumentUpload, options?: Options): Promise<void> {
    return this.documentUploadRepository.update(entity, options);
  }

  async delete(entity: DocumentUpload, options?: Options): Promise<void> {
    return this.documentUploadRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<DocumentUpload>, where?: Where<DocumentUpload>, options?: Options): Promise<Count> {
    return this.documentUploadRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<DocumentUpload>, options?: Options): Promise<void> {
    return this.documentUploadRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<DocumentUpload>, options?: Options): Promise<void> {
    return this.documentUploadRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<DocumentUpload>, options?: Options): Promise<Count> {
    return this.documentUploadRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.documentUploadRepository.deleteById(id, options);
  }

  async count(where?: Where<DocumentUpload>, options?: Options): Promise<Count> {
    return this.documentUploadRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.documentUploadRepository.exists(id, options);
  }
}
