import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {AppRole} from 'common';
import {AppRoleFacade} from '../facades';
const API_PREFIX = AppRole.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AppRoleController {
  constructor(@service(AppRoleFacade) public appRoleFacade: AppRoleFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppRole model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppRole)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppRole, {
            title: 'New AppRole',
            exclude: ['id']
          })
        }
      }
    })
    appRole: Omit<AppRole, 'id'>
  ): Promise<AppRole> {
    return this.appRoleFacade.create(appRole);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AppRole model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AppRole) where?: Where<AppRole>): Promise<Count> {
    return this.appRoleFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AppRole model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AppRole, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AppRole) filter?: Filter<AppRole>): Promise<AppRole[]> {
    return this.appRoleFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppRole PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppRole, {partial: true})
        }
      }
    })
    appRole: AppRole,
    @param.where(AppRole) where?: Where<AppRole>
  ): Promise<Count> {
    return this.appRoleFacade.updateAll(appRole, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AppRole model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AppRole, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AppRole, {exclude: 'where'}) filter?: FilterExcludingWhere<AppRole>
  ): Promise<AppRole> {
    return this.appRoleFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppRole PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppRole, {partial: true})
        }
      }
    })
    appRole: AppRole
  ): Promise<void> {
    await this.appRoleFacade.updateById(id, appRole);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppRole PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() appRole: AppRole): Promise<void> {
    await this.appRoleFacade.replaceById(id, appRole);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppRole DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.appRoleFacade.deleteById(id);
  }


  @get(`/${API_PREFIX}/fetchRoles`)
  @response(200, {
    description: 'Array of AppRole model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AppRole, {includeRelations: false})
        }
      }
    }
  })
  async fetchRoles(@param.filter(AppRole) filter?: Filter<AppRole>): Promise<AppRole[]> {
    return this.appRoleFacade.find(filter);
  }
}



