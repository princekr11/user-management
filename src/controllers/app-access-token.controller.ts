import {authorize} from '@loopback/authorization';
import {service, inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response,RestBindings,Request} from '@loopback/rest';
import {AppAccessToken} from 'common';
import {AppAccessTokenFacade} from '../facades';
const API_PREFIX = AppAccessToken.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AppAccessTokenController {
  constructor(@service(AppAccessTokenFacade) public appAccessTokenFacade: AppAccessTokenFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppAccessToken model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppAccessToken)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppAccessToken, {
            title: 'New AppAccessToken',
            exclude: ['id']
          })
        }
      }
    })
    appAccessToken: Omit<AppAccessToken, 'id'>
  ): Promise<AppAccessToken> {
    return this.appAccessTokenFacade.create(appAccessToken);
  }

  @post(`/${API_PREFIX}/recreateTokenWithRefreshToken`)
  @response(200, {
    description: 'Refresh Token',
    content: {
      'application/json': {
        schema: {
          example: {
            appAccessToken: 'dfggrwfasfgegwarsgfasgvaeg',
            appRefreshToken:'string'
          }
        }
      }
    }
  })
  async refreshUsertToken( @requestBody({
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required:['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              minLength:0,
              maxLength:64
            }
          },
          example: {
            refreshToken: 'kjsgdjshgdjh'
          }
        }
      }
    }
  })
  refreshTokenRequest: {refreshToken:string},
  @inject(RestBindings.Http.REQUEST) request: Request): Promise<object> {
    // @ts-ignore:

    return this.appAccessTokenFacade.recreateTokenWithRereshToken(refreshTokenRequest.refreshToken,request);
  }
  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AppAccessToken model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AppAccessToken) where?: Where<AppAccessToken>): Promise<Count> {
    return this.appAccessTokenFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AppAccessToken model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AppAccessToken, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AppAccessToken) filter?: Filter<AppAccessToken>): Promise<AppAccessToken[]> {
    return this.appAccessTokenFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppAccessToken PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppAccessToken, {partial: true})
        }
      }
    })
    appAccessToken: AppAccessToken,
    @param.where(AppAccessToken) where?: Where<AppAccessToken>
  ): Promise<Count> {
    return this.appAccessTokenFacade.updateAll(appAccessToken, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AppAccessToken model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AppAccessToken, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AppAccessToken, {exclude: 'where'}) filter?: FilterExcludingWhere<AppAccessToken>
  ): Promise<AppAccessToken> {
    return this.appAccessTokenFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppAccessToken PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppAccessToken, {partial: true})
        }
      }
    })
    appAccessToken: AppAccessToken
  ): Promise<void> {
    await this.appAccessTokenFacade.updateById(id, appAccessToken);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppAccessToken PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() appAccessToken: AppAccessToken): Promise<void> {
    await this.appAccessTokenFacade.replaceById(id, appAccessToken);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppAccessToken DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.appAccessTokenFacade.deleteById(id);
  }
}
