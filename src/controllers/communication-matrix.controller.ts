import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {CommunicationMatrix, RestError} from 'common';
import {CommunicationMatrixFacade} from '../facades/communication-matrix.facade';
const API_PREFIX = CommunicationMatrix.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class CommunicationMatrixController {
  constructor(
    @service(CommunicationMatrixFacade) public communicationMatrixFacade: CommunicationMatrixFacade,
    @inject('additionalHeaders') private additionalHeaders: any
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'CommunicationMatrix model instance',
    content: {'application/json': {schema: getModelSchemaRef(CommunicationMatrix)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CommunicationMatrix, {
            title: 'New CommunicationMatrix',
            exclude: ['id']
          })
        }
      }
    })
    communicationMatrix: Omit<CommunicationMatrix, 'id'>
  ): Promise<CommunicationMatrix> {
    return this.communicationMatrixFacade.create(communicationMatrix);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'CommunicationMatrix model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(CommunicationMatrix) where?: Where<CommunicationMatrix>): Promise<Count> {
    return this.communicationMatrixFacade.count(where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of CommunicationMatrix model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CommunicationMatrix, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(CommunicationMatrix) filter?: Filter<CommunicationMatrix>): Promise<CommunicationMatrix[]> {
    return this.communicationMatrixFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'CommunicationMatrix PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CommunicationMatrix, {partial: true})
        }
      }
    })
    CommunicationMatrix: CommunicationMatrix,
    @param.where(CommunicationMatrix) where?: Where<CommunicationMatrix>
  ): Promise<Count> {
    return this.communicationMatrixFacade.updateAll(CommunicationMatrix, where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'CommunicationMatrix model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CommunicationMatrix, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CommunicationMatrix, {exclude: 'where'})
    filter?: FilterExcludingWhere<CommunicationMatrix>
  ): Promise<CommunicationMatrix> {
    return this.communicationMatrixFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'CommunicationMatrix PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CommunicationMatrix, {partial: true})
        }
      }
    })
    communicationMatrix: CommunicationMatrix
  ): Promise<void> {
    await this.communicationMatrixFacade.updateById(id, communicationMatrix, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'CommunicationMatrix PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() communicationMatrix: CommunicationMatrix): Promise<void> {
    await this.communicationMatrixFacade.replaceById(id, communicationMatrix, this.additionalHeaders);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'CommunicationMatrix DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.communicationMatrixFacade.deleteById(id, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{accountId}/fetchCommunicationMatrixByAccountId`)
  @response(200, {
    description: 'To fetch CommunicationMatrix model instance by account Id',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CommunicationMatrix, {includeRelations: false})
      }
    }
  })
  async findByAccountId(
    @param.path.number('accountId') id: number
    // @param.filter(CommunicationMatrix, {exclude: 'where'})
    // filter?: FilterExcludingWhere<CommunicationMatrix>
  ): Promise<CommunicationMatrix[] | RestError> {
    return this.communicationMatrixFacade.findByAccountId(id, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{accountId}/modeOfNotificationByAccountId`)
  @response(204, {
    description: 'Updates Mode of CommunicationMatrix PUT success'
  })
  async updateModeOfNotificationByAccountId(
    @param.path.number('accountId') accountId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['modeEmail', 'modeSms', 'modePush', 'id'],
            properties: {
              modeEmail: {
                type: 'boolean'
              },
              modeSms: {
                type: 'boolean'
              },
              modePush: {
                type: 'boolean'
              },
              subCategory: {
                type: 'string'
              }
            }
          }
        }
      }
    })
    settings: any
  ): Promise<{success: boolean} | RestError> {
    return this.communicationMatrixFacade.updateModeOfNotification(accountId, settings, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/addCommunicationMatrix/{accountId}`)
  @response(200, {
    description: 'CommunicationMatrix model count'
  })
  async addCommunicationMatrix(@param.path.number('accountId') accountId: number): Promise<Count> {
    return this.communicationMatrixFacade.addCommunicationMatrix(accountId, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/testNotification/{accountId}`)
  @response(200, {
    description: 'CommunicationMatrix model count'
  })
  async testNotification(@param.path.number('accountId') accountId: number): Promise<Count> {
    return this.communicationMatrixFacade.testNotification(accountId, this.additionalHeaders);
  }
}
