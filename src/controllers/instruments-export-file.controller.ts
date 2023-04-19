import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {InstrumentsExportFile} from 'common';
import {InstrumentsExportFileFacade} from '../facades';
const API_PREFIX = InstrumentsExportFile.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class InstrumentsExportFileController {
  constructor(@service(InstrumentsExportFileFacade) public InstrumentsExportFileFacade: InstrumentsExportFileFacade,
  @inject('additionalHeaders') private additionalHeaders: any) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'InstrumentsExportFile model instance',
    content: {'application/json': {schema: getModelSchemaRef(InstrumentsExportFile)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InstrumentsExportFile, {
            title: 'New InstrumentsExportFile',
            exclude: ['id']
          })
        }
      }
    })
    InstrumentsExportFile: Omit<InstrumentsExportFile, 'id'>
  ): Promise<InstrumentsExportFile> {
    return this.InstrumentsExportFileFacade.create(InstrumentsExportFile, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'InstrumentsExportFile model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(InstrumentsExportFile) where?: Where<InstrumentsExportFile>): Promise<Count> {
    return this.InstrumentsExportFileFacade.count(where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of InstrumentsExportFile model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InstrumentsExportFile, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(InstrumentsExportFile) filter?: Filter<InstrumentsExportFile>): Promise<InstrumentsExportFile[]> {
    return this.InstrumentsExportFileFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'InstrumentsExportFile PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InstrumentsExportFile, {partial: true})
        }
      }
    })
    InstrumentsExportFile: InstrumentsExportFile,
    @param.where(InstrumentsExportFile) where?: Where<InstrumentsExportFile>
  ): Promise<Count> {
    return this.InstrumentsExportFileFacade.updateAll(InstrumentsExportFile, where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'InstrumentsExportFile model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InstrumentsExportFile, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(InstrumentsExportFile, {exclude: 'where'}) filter?: FilterExcludingWhere<InstrumentsExportFile>
  ): Promise<InstrumentsExportFile> {
    return this.InstrumentsExportFileFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'InstrumentsExportFile PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InstrumentsExportFile, {partial: true})
        }
      }
    })
    InstrumentsExportFile: InstrumentsExportFile
  ): Promise<void> {
    await this.InstrumentsExportFileFacade.updateById(id, InstrumentsExportFile, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'InstrumentsExportFile PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() InstrumentsExportFile: InstrumentsExportFile): Promise<void> {
    await this.InstrumentsExportFileFacade.replaceById(id, InstrumentsExportFile, this.additionalHeaders);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'InstrumentsExportFile DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.InstrumentsExportFileFacade.deleteById(id, this.additionalHeaders);
  }



}
