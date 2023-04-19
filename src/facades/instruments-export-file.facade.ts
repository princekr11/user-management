import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {LoggingUtils, Option, RestError} from 'common';
import {InstrumentsExportFile, InstrumentsExportFileRelations, InstrumentsExportFileRepository} from 'common';
import AppConstant from 'common/dist/constants/app-constant';
import _ = require('underscore');

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class InstrumentsExportFileFacade {
  constructor(@repository(InstrumentsExportFileRepository) private InstrumentsExportFileRepository: InstrumentsExportFileRepository) {}

  async create(entity: DataObject<InstrumentsExportFile>, options?: Options): Promise<InstrumentsExportFile> {
    return this.InstrumentsExportFileRepository.create(entity, options);
  }

  async createAll(entities: DataObject<InstrumentsExportFile>[], options?: Options): Promise<InstrumentsExportFile[]> {
    return this.InstrumentsExportFileRepository.createAll(entities, options);
  }

  async save(entity: InstrumentsExportFile, options?: Options): Promise<InstrumentsExportFile> {
    return this.InstrumentsExportFileRepository.save(entity, options);
  }

  async find(filter?: Filter<InstrumentsExportFile>, options?: Options): Promise<(InstrumentsExportFile & InstrumentsExportFileRelations)[]> {
    return this.InstrumentsExportFileRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<InstrumentsExportFile>,
    options?: Options
  ): Promise<(InstrumentsExportFile & InstrumentsExportFileRelations) | null> {
    return this.InstrumentsExportFileRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<InstrumentsExportFile>,
    options?: Options
  ): Promise<InstrumentsExportFile & InstrumentsExportFileRelations> {
    return this.InstrumentsExportFileRepository.findById(id,filter, options);
  }

  async update(entity: InstrumentsExportFile, options?: Options): Promise<void> {
    return this.InstrumentsExportFileRepository.update(entity, options);
  }

  async delete(entity: InstrumentsExportFile, options?: Options): Promise<void> {
    return this.InstrumentsExportFileRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<InstrumentsExportFile>, where?: Where<InstrumentsExportFile>, options?: Options): Promise<Count> {
    return this.InstrumentsExportFileRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<InstrumentsExportFile>, options?: Options): Promise<void> {
    return this.InstrumentsExportFileRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<InstrumentsExportFile>, options?: Options): Promise<void> {
    return this.InstrumentsExportFileRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<InstrumentsExportFile>, options?: Options): Promise<Count> {
    return this.InstrumentsExportFileRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.InstrumentsExportFileRepository.deleteById(id, options);
  }

  async count(where?: Where<InstrumentsExportFile>, options?: Options): Promise<Count> {
    return this.InstrumentsExportFileRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.InstrumentsExportFileRepository.exists(id, options);
  }


}
