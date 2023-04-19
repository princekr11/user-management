import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Group} from 'common';
import {GroupFacade} from '../facades';
const API_PREFIX = Group.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class GroupController {
  constructor(@service(GroupFacade) public groupFacade: GroupFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Group model instance',
    content: {'application/json': {schema: getModelSchemaRef(Group)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Group, {
            title: 'New Group',
            exclude: ['id']
          })
        }
      }
    })
    group: Omit<Group, 'id'>
  ): Promise<Group> {
    return this.groupFacade.create(group);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Group model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Group) where?: Where<Group>): Promise<Count> {
    return this.groupFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Group model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Group, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Group) filter?: Filter<Group>): Promise<Group[]> {
    return this.groupFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Group PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Group, {partial: true})
        }
      }
    })
    group: Group,
    @param.where(Group) where?: Where<Group>
  ): Promise<Count> {
    return this.groupFacade.updateAll(group, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Group model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Group, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Group, {exclude: 'where'}) filter?: FilterExcludingWhere<Group>
  ): Promise<Group> {
    return this.groupFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Group PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Group, {partial: true})
        }
      }
    })
    group: Group
  ): Promise<void> {
    await this.groupFacade.updateById(id, group);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Group PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() group: Group): Promise<void> {
    await this.groupFacade.replaceById(id, group);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Group DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.groupFacade.deleteById(id);
  }
}
