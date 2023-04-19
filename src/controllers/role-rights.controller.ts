import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {AnyObject, Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {RoleRights} from 'common';
import {RoleRightsFacade} from '../facades';
const API_PREFIX = RoleRights.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class RoleRightsController {
  constructor(@service(RoleRightsFacade) public roleRightsFacade: RoleRightsFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'RoleRights model instance',
    content: {'application/json': {schema: getModelSchemaRef(RoleRights)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RoleRights, {
            title: 'New RoleRights',
            exclude: ['id']
          })
        }
      }
    })
    RoleRights: Omit<RoleRights, 'id'>
  ): Promise<RoleRights> {
    return this.roleRightsFacade.create(RoleRights);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'RoleRights model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(RoleRights) where?: Where<RoleRights>): Promise<Count> {
    return this.roleRightsFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of RoleRights model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(RoleRights, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(RoleRights) filter?: Filter<RoleRights>): Promise<RoleRights[]> {
    return this.roleRightsFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'RoleRights PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RoleRights, {partial: true})
        }
      }
    })
    RoleRights: RoleRights,
    @param.where(RoleRights) where?: Where<RoleRights>
  ): Promise<Count> {
    return this.roleRightsFacade.updateAll(RoleRights, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'RoleRights model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(RoleRights, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(RoleRights, {exclude: 'where'}) filter?: FilterExcludingWhere<RoleRights>
  ): Promise<RoleRights> {
    return this.roleRightsFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RoleRights PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RoleRights, {partial: true})
        }
      }
    })
    RoleRights: RoleRights
  ): Promise<void> {
    await this.roleRightsFacade.updateById(id, RoleRights);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RoleRights PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() RoleRights: RoleRights): Promise<void> {
    await this.roleRightsFacade.replaceById(id, RoleRights);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RoleRights DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.roleRightsFacade.deleteById(id);
  }


  @get(`/${API_PREFIX}/fetchRolesRights`)
  @response(200, {
    description: 'Array of RoleRights model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(RoleRights, {includeRelations: false})
        }
      }
    }
  })
  async fetchRolesRights(@param.filter(RoleRights) filter?: Filter<RoleRights>): Promise<AnyObject[]> {
    return this.roleRightsFacade.fetchRolesRights(filter);
  }
}
