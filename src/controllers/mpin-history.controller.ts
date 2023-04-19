import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {MpinHistory} from 'common';
import {MpinHistoryFacade} from '../facades';
const API_PREFIX = MpinHistory.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class MpinHistoryController {
  constructor(@service(MpinHistoryFacade) public mpinHistoryFacade: MpinHistoryFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'MpinHistory model instance',
    content: {'application/json': {schema: getModelSchemaRef(MpinHistory)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MpinHistory, {
            title: 'New MpinHistory',
            exclude: ['id']
          })
        }
      }
    })
    mpinHistory: Omit<MpinHistory, 'id'>
  ): Promise<MpinHistory> {
    return this.mpinHistoryFacade.create(mpinHistory);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'MpinHistory model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(MpinHistory) where?: Where<MpinHistory>): Promise<Count> {
    return this.mpinHistoryFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of MpinHistory model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(MpinHistory, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(MpinHistory) filter?: Filter<MpinHistory>): Promise<MpinHistory[]> {
    return this.mpinHistoryFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'MpinHistory PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MpinHistory, {partial: true})
        }
      }
    })
    mpinHistory: MpinHistory,
    @param.where(MpinHistory) where?: Where<MpinHistory>
  ): Promise<Count> {
    return this.mpinHistoryFacade.updateAll(mpinHistory, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'MpinHistory model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(MpinHistory, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(MpinHistory, {exclude: 'where'}) filter?: FilterExcludingWhere<MpinHistory>
  ): Promise<MpinHistory> {
    return this.mpinHistoryFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'MpinHistory PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MpinHistory, {partial: true})
        }
      }
    })
    mpinHistory: MpinHistory
  ): Promise<void> {
    await this.mpinHistoryFacade.updateById(id, mpinHistory);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'MpinHistory PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() mpinHistory: MpinHistory): Promise<void> {
    await this.mpinHistoryFacade.replaceById(id, mpinHistory);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'MpinHistory DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.mpinHistoryFacade.deleteById(id);
  }
}
