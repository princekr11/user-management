import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {AccountAppFileMapping} from 'common';
import {AccountAppFileMappingFacade} from '../facades';
const API_PREFIX = AccountAppFileMapping.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AccountAppFileMappingController {
  constructor(
    @service(AccountAppFileMappingFacade)
    public accountAppFileMappingFacade: AccountAppFileMappingFacade,
    @inject('additionalHeaders') private additionalHeaders: any
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AccountAppFileMapping model instance',
    content: {
      'application/json': {schema: getModelSchemaRef(AccountAppFileMapping)}
    }
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountAppFileMapping, {
            title: 'New AccountAppFileMapping',
            exclude: ['id']
          })
        }
      }
    })
    accountAppFileMapping: Omit<AccountAppFileMapping, 'id'>
  ): Promise<AccountAppFileMapping> {
    return this.accountAppFileMappingFacade.create(accountAppFileMapping);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AccountAppFileMapping model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AccountAppFileMapping) where?: Where<AccountAppFileMapping>): Promise<Count> {
    return this.accountAppFileMappingFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AccountAppFileMapping model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AccountAppFileMapping, {
            includeRelations: false
          })
        }
      }
    }
  })
  async find(@param.filter(AccountAppFileMapping) filter?: Filter<AccountAppFileMapping>): Promise<AccountAppFileMapping[]> {
    return this.accountAppFileMappingFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AccountAppFileMapping PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountAppFileMapping, {partial: true})
        }
      }
    })
    accountAppFileMapping: AccountAppFileMapping,
    @param.where(AccountAppFileMapping) where?: Where<AccountAppFileMapping>
  ): Promise<Count> {
    return this.accountAppFileMappingFacade.updateAll(accountAppFileMapping, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AccountAppFileMapping model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AccountAppFileMapping, {
          includeRelations: false
        })
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AccountAppFileMapping, {exclude: 'where'})
    filter?: FilterExcludingWhere<AccountAppFileMapping>
  ): Promise<AccountAppFileMapping> {
    return this.accountAppFileMappingFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AccountAppFileMapping PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountAppFileMapping, {partial: true})
        }
      }
    })
    accountAppFileMapping: AccountAppFileMapping
  ): Promise<void> {
    await this.accountAppFileMappingFacade.updateById(id, accountAppFileMapping);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AccountAppFileMapping PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() accountAppFileMapping: AccountAppFileMapping): Promise<void> {
    await this.accountAppFileMappingFacade.replaceById(id, accountAppFileMapping);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AccountAppFileMapping DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.accountAppFileMappingFacade.deleteById(id);
  }

  @get(`/${API_PREFIX}/accountAppFileMappingDetails`)
  @response(200, {
    description: 'Array of AccountAppFileMapping model instances',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async accountAppFileMappingDetails(
    @param.query.object('filter') filter: any,
    @param.query.object('where') where: any): Promise<any> {
    return this.accountAppFileMappingFacade.accountAppFileMappingDetails(filter,where, this.additionalHeaders);
  }
}
