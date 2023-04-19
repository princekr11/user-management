import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, Request, requestBody, Response, response, RestBindings} from '@loopback/rest';
import {AuditTrailFile} from 'common';
import {AuditTrailFileFacade} from '../facades';
const API_PREFIX = AuditTrailFile.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AuditTrailFileController {
  constructor(
    @service(AuditTrailFileFacade) public AuditTrailFileFacade: AuditTrailFileFacade,
    @inject('additionalHeaders') private additionalHeaders: any,
    @inject(RestBindings.Http.RESPONSE) public res: Response,
    @inject('userProfile') private userProfile: any
    ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AuditTrailFile model instance',
    content: {'application/json': {schema: getModelSchemaRef(AuditTrailFile)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AuditTrailFile, {
            title: 'New AuditTrailFile',
            exclude: ['id']
          })
        }
      }
    })
    AuditTrailFile: Omit<AuditTrailFile, 'id'>
  ): Promise<AuditTrailFile> {
    return this.AuditTrailFileFacade.create(AuditTrailFile);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AuditTrailFile model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AuditTrailFile) where?: Where<AuditTrailFile>): Promise<Count> {
    return this.AuditTrailFileFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AuditTrailFile model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AuditTrailFile, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AuditTrailFile) filter?: Filter<AuditTrailFile>): Promise<AuditTrailFile[]> {
    return this.AuditTrailFileFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AuditTrailFile PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AuditTrailFile, {partial: true})
        }
      }
    })
    AuditTrailFile: AuditTrailFile,
    @param.where(AuditTrailFile) where?: Where<AuditTrailFile>
  ): Promise<Count> {
    return this.AuditTrailFileFacade.updateAll(AuditTrailFile, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AuditTrailFile model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AuditTrailFile, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AuditTrailFile, {exclude: 'where'}) filter?: FilterExcludingWhere<AuditTrailFile>
  ): Promise<AuditTrailFile> {
    return this.AuditTrailFileFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AuditTrailFile PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AuditTrailFile, {partial: true})
        }
      }
    })
    AuditTrailFile: AuditTrailFile
  ): Promise<void> {
    await this.AuditTrailFileFacade.updateById(id, AuditTrailFile);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AuditTrailFile PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() AuditTrailFile: AuditTrailFile): Promise<void> {
    await this.AuditTrailFileFacade.replaceById(id, AuditTrailFile);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AuditTrailFile DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.AuditTrailFileFacade.deleteById(id);
  }
}

