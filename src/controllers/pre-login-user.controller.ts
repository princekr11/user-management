import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, Request, requestBody, response, RestBindings} from '@loopback/rest';
import { PathParamsValidations } from 'common';
import {PreLoginUser, Device} from 'common';
import {PreLoginUserFacade} from '../facades';
const API_PREFIX = PreLoginUser.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class PreLoginUserController {
  constructor(@service(PreLoginUserFacade) public preLoginUserFacade: PreLoginUserFacade) {}
  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Pre Login User model instance',
    content: {'application/json': {schema: getModelSchemaRef(PreLoginUser)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PreLoginUser, {
            title: 'New PreLogin User',
            exclude: ['id']
          })
        }
      }
    })
    preLoginUser: Omit<PreLoginUser, 'id'>
  ): Promise<PreLoginUser> {
    return this.preLoginUserFacade.create(preLoginUser);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'PreLogin User model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(PreLoginUser) where?: Where<PreLoginUser>): Promise<Count> {
    return this.preLoginUserFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of PreLogin User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PreLoginUser, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(PreLoginUser) filter?: Filter<PreLoginUser>): Promise<PreLoginUser[]> {
    return this.preLoginUserFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'PreLogin User PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PreLoginUser, {partial: true})
        }
      }
    })
    preLoginUser: PreLoginUser,
    @param.where(PreLoginUser) where?: Where<PreLoginUser>
  ): Promise<Count> {
    return this.preLoginUserFacade.updateAll(preLoginUser, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'PreLogin User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PreLoginUser, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PreLoginUser, {exclude: 'where'}) filter?: FilterExcludingWhere<PreLoginUser>
  ): Promise<PreLoginUser> {
    return this.preLoginUserFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'PreLogin User PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PreLoginUser, {partial: true})
        }
      }
    })
    preLoginUser: PreLoginUser
  ): Promise<void> {
    await this.preLoginUserFacade.updateById(id, preLoginUser);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'PreLogin User PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() device: PreLoginUser): Promise<void> {
    await this.preLoginUserFacade.replaceById(id, device);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'PreLogin User DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.preLoginUserFacade.deleteById(id);
  }

  @post(`/${API_PREFIX}/savePreLoginData`)
  @response(200, {
    description: 'Save Pre Login Data for Device Id',
    content: {'application/json': {schema: getModelSchemaRef(PreLoginUser)}}
  })
  async savePreLoginData(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['deviceId', 'uniqueId'],
            properties: {
              deviceId: {
                type: 'number',
                minimum:1
              },
              uniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}'
              },
              userData: {
                type: 'object'
              }
            }
          }
        }
      }
    })
    preLoginUser: any
  ): Promise<PreLoginUser> {
    return this.preLoginUserFacade.savePreLoginData(preLoginUser.deviceId, preLoginUser.userData, preLoginUser.uniqueId);
  }

  @get(`/${API_PREFIX}/fetchPreLoginUsers`)
  @response(200, {
    description: 'Array of PreLoginUser model instances',
    content: {
      'application/json': {
        schema: {
          schema: {
            type: 'array',
            title: 'PreLoginUser response body',
            properties: {
              preLoginUserId: {
                type: 'number'
              },
              preLoginUser: {
                type: 'object',
                properties: {
                  id: { type: 'number'},
                  isActive: {type: 'boolean'},
                  createdDate: {type: 'string'},
                  lastModifiedDate: {type: 'string'},
                  userData: {
                    type: 'object'
                  }
                }
              }
            }
          },
          example: `[
            {
              "preLoginUserId": 13,
              "preLoginUser": {
                "id": 13,
                "isActive": true,
                "createdDate": "2022-04-21T05:35:31.909Z",
                "lastModifiedDate": "2022-05-09T13:17:56.993Z",
                "userData": {
                  "test": "data",
                  "goalPlanning": {
                    "cartItems": [
                      {
                        "startDateForSip": "2022-05-09T13:17:54.232Z",
                        "endDateForSip": "2025-05-09T00:00:00.000Z",
                        "totalAmount": 100,
                        "transactionTypeId": 1,
                        "frequency": 10,
                        "goalId": 1221,
                        "instrumentId": 21910,
                        "transactionSubType": 1,
                        "goalParam": {
                          "name": "Car",
                          "startDate": "2022-05-09T13:17:51.332Z",
                          "endDate": "2025-05-09T00:00:00.000Z",
                          "targetAmount": 700000,
                          "expectedCorpus": 700000,
                          "goalCategoryId": 1,
                          "type": 2
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]`
        },
      }
    }
  })
  async fetchPreLoginUsers(
    @param.query.number('deviceId') deviceId: number,
    @inject(RestBindings.Http.REQUEST) request: Request,
    @param.query.number('limit') limit?: number,
    @param.query.number('offset') offset?: number,
  ): Promise<Device[]> {
    PathParamsValidations.idValidations(deviceId)
    // PathParamsValidations.limitValidations(limit)
    // PathParamsValidations.genericNumericValidations(offset)
    return this.preLoginUserFacade.fetchPreLoginUsers(limit, offset, deviceId, request);
  }
}
