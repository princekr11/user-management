import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {RequestToEngine} from 'common';
import {RequestToEngineFacade} from '../facades';
const API_PREFIX = RequestToEngine.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class RequestToEngineController {
  constructor(@service(RequestToEngineFacade) public RequestToEngineFacade: RequestToEngineFacade,
  @inject('additionalHeaders') private additionalHeaders: any) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'RequestToEngine model instance',
    content: {'application/json': {schema: getModelSchemaRef(RequestToEngine)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RequestToEngine, {
            title: 'New RequestToEngine',
            exclude: ['id']
          })
        }
      }
    })
    RequestToEngine: Omit<RequestToEngine, 'id'>
  ): Promise<RequestToEngine> {
    return this.RequestToEngineFacade.create(RequestToEngine, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'RequestToEngine model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(RequestToEngine) where?: Where<RequestToEngine>): Promise<Count> {
    return this.RequestToEngineFacade.count(where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of RequestToEngine model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(RequestToEngine, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(RequestToEngine) filter?: Filter<RequestToEngine>): Promise<RequestToEngine[]> {
    return this.RequestToEngineFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'RequestToEngine PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RequestToEngine, {partial: true})
        }
      }
    })
    RequestToEngine: RequestToEngine,
    @param.where(RequestToEngine) where?: Where<RequestToEngine>
  ): Promise<Count> {
    return this.RequestToEngineFacade.updateAll(RequestToEngine, where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'RequestToEngine model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(RequestToEngine, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(RequestToEngine, {exclude: 'where'}) filter?: FilterExcludingWhere<RequestToEngine>
  ): Promise<RequestToEngine> {
    return this.RequestToEngineFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RequestToEngine PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RequestToEngine, {partial: true})
        }
      }
    })
    RequestToEngine: RequestToEngine
  ): Promise<void> {
    await this.RequestToEngineFacade.updateById(id, RequestToEngine, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RequestToEngine PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() RequestToEngine: RequestToEngine): Promise<void> {
    await this.RequestToEngineFacade.replaceById(id, RequestToEngine, this.additionalHeaders);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RequestToEngine DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.RequestToEngineFacade.deleteById(id, this.additionalHeaders);
  }



}
