import {injectable, /* inject, */ BindingScope, inject, Getter} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import { Request, Response } from '@loopback/rest';
import {
  AuditTrailFile,
  AuditTrailFileRelations,
  AuditTrailFileRepository,
  FileStorageContainerConfig,
  IStorageService,
} from 'common';

import _ from 'underscore';
import * as fs from 'fs';
import * as path from 'path';
import { AuditTrailRepository, UserManagementAppFile, UserManagementAppFileRepository, RtaRepository } from 'common';


// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AuditTrailFileFacade {
  constructor(@repository(AuditTrailFileRepository) private AuditTrailFileRepository: AuditTrailFileRepository,
  // @repository.getter(UserManagementAppFileRepository)private AppFileGetter: Getter<UserManagementAppFileRepository>,
  // @repository(UserManagementAppFileRepository) private UserManagementAppFileRepository: UserManagementAppFileRepository,
  // @repository(AuditTrailRepository) private AuditTrailRepository: AuditTrailRepository,
  // @repository(RtaRepository) private RtaRepository: RtaRepository,
  @inject('services.fileStorageComponent')
    private fileStorageService: IStorageService) {}//

  async create(entity: DataObject<AuditTrailFile>, options?: Options): Promise<AuditTrailFile> {
    return this.AuditTrailFileRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AuditTrailFile>[], options?: Options): Promise<AuditTrailFile[]> {
    return this.AuditTrailFileRepository.createAll(entities, options);
  }

  async save(entity: AuditTrailFile, options?: Options): Promise<AuditTrailFile> {
    return this.AuditTrailFileRepository.save(entity, options);
  }

  async find(filter?: Filter<AuditTrailFile>, options?: Options): Promise<(AuditTrailFile & AuditTrailFileRelations)[]> {
    return this.AuditTrailFileRepository.find(filter, options);
  }

  async findOne(filter?: Filter<AuditTrailFile>, options?: Options): Promise<(AuditTrailFile & AuditTrailFileRelations) | null> {
    return this.AuditTrailFileRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<AuditTrailFile>, options?: Options): Promise<AuditTrailFile & AuditTrailFileRelations> {
    return this.AuditTrailFileRepository.findById(id,filter, options);
  }

  async update(entity: AuditTrailFile, options?: Options): Promise<void> {
    return this.AuditTrailFileRepository.update(entity, options);
  }

  async delete(entity: AuditTrailFile, options?: Options): Promise<void> {
    return this.AuditTrailFileRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AuditTrailFile>, where?: Where<AuditTrailFile>, options?: Options): Promise<Count> {
    return this.AuditTrailFileRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AuditTrailFile>, options?: Options): Promise<void> {
    return this.AuditTrailFileRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AuditTrailFile>, options?: Options): Promise<void> {
    return this.AuditTrailFileRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AuditTrailFile>, options?: Options): Promise<Count> {
    return this.AuditTrailFileRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.AuditTrailFileRepository.deleteById(id, options);
  }

  async count(where?: Where<AuditTrailFile>, options?: Options): Promise<Count> {
    return this.AuditTrailFileRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.AuditTrailFileRepository.exists(id, options);
  }
}
