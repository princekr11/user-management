import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {AppUserRoleMapping} from 'common';
import {AppUserRoleMappingFacade} from '../facades';
const API_PREFIX = AppUserRoleMapping.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AppUserRoleMappingController {
  constructor(@service(AppUserRoleMappingFacade) public appUserRoleMappingFacade: AppUserRoleMappingFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppUserRoleMapping model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppUserRoleMapping)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppUserRoleMapping, {
            title: 'New AppUserRoleMapping',
            exclude: ['id']
          })
        }
      }
    })
    appUserRoleMapping: Omit<AppUserRoleMapping, 'id'>
  ): Promise<AppUserRoleMapping> {
    return this.appUserRoleMappingFacade.create(appUserRoleMapping);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AppUserRoleMapping model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AppUserRoleMapping) where?: Where<AppUserRoleMapping>): Promise<Count> {
    return this.appUserRoleMappingFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AppUserRoleMapping model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AppUserRoleMapping, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AppUserRoleMapping) filter?: Filter<AppUserRoleMapping>): Promise<AppUserRoleMapping[]> {
    return this.appUserRoleMappingFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppUserRoleMapping PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppUserRoleMapping, {partial: true})
        }
      }
    })
    appUserRoleMapping: AppUserRoleMapping,
    @param.where(AppUserRoleMapping) where?: Where<AppUserRoleMapping>
  ): Promise<Count> {
    return this.appUserRoleMappingFacade.updateAll(appUserRoleMapping, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AppUserRoleMapping model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AppUserRoleMapping, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AppUserRoleMapping, {exclude: 'where'}) filter?: FilterExcludingWhere<AppUserRoleMapping>
  ): Promise<AppUserRoleMapping> {
    return this.appUserRoleMappingFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppUserRoleMapping PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppUserRoleMapping, {partial: true})
        }
      }
    })
    appUserRoleMapping: AppUserRoleMapping
  ): Promise<void> {
    await this.appUserRoleMappingFacade.updateById(id, appUserRoleMapping);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppUserRoleMapping PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() appUserRoleMapping: AppUserRoleMapping): Promise<void> {
    await this.appUserRoleMappingFacade.replaceById(id, appUserRoleMapping);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppUserRoleMapping DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.appUserRoleMappingFacade.deleteById(id);
  }
}
