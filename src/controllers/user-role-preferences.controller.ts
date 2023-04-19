import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {UserRolePreferences} from 'common';
import {UserRolePreferencesFacade} from '../facades';
const API_PREFIX = UserRolePreferences.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class UserRolePreferencesController {
  constructor(@service(UserRolePreferencesFacade) public userRolePreferencesFacade: UserRolePreferencesFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'UserRolePreferences model instance',
    content: {'application/json': {schema: getModelSchemaRef(UserRolePreferences)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserRolePreferences, {
            title: 'New UserRolePreferences',
            exclude: ['id']
          })
        }
      }
    })
    userRolePreferences: Omit<UserRolePreferences, 'id'>
  ): Promise<UserRolePreferences> {
    return this.userRolePreferencesFacade.create(userRolePreferences);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'UserRolePreferences model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(UserRolePreferences) where?: Where<UserRolePreferences>): Promise<Count> {
    return this.userRolePreferencesFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of UserRolePreferences model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UserRolePreferences, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(UserRolePreferences) filter?: Filter<UserRolePreferences>): Promise<UserRolePreferences[]> {
    return this.userRolePreferencesFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'UserRolePreferences PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserRolePreferences, {partial: true})
        }
      }
    })
    userRolePreferences: UserRolePreferences,
    @param.where(UserRolePreferences) where?: Where<UserRolePreferences>
  ): Promise<Count> {
    return this.userRolePreferencesFacade.updateAll(userRolePreferences, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'UserRolePreferences model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(UserRolePreferences, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(UserRolePreferences, {exclude: 'where'}) filter?: FilterExcludingWhere<UserRolePreferences>
  ): Promise<UserRolePreferences> {
    return this.userRolePreferencesFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UserRolePreferences PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserRolePreferences, {partial: true})
        }
      }
    })
    userRolePreferences: UserRolePreferences
  ): Promise<void> {
    await this.userRolePreferencesFacade.updateById(id, userRolePreferences);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UserRolePreferences PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() userRolePreferences: UserRolePreferences): Promise<void> {
    await this.userRolePreferencesFacade.replaceById(id, userRolePreferences);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UserRolePreferences DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRolePreferencesFacade.deleteById(id);
  }
}
