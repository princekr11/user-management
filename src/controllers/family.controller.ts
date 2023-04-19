import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Family} from 'common';
import {FamilyFacade} from '../facades';
const API_PREFIX = Family.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class FamilyController {
  constructor(@service(FamilyFacade) public familyFacade: FamilyFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Family model instance',
    content: {'application/json': {schema: getModelSchemaRef(Family)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Family, {
            title: 'New Family',
            exclude: ['id']
          })
        }
      }
    })
    family: Omit<Family, 'id'>
  ): Promise<Family> {
    return this.familyFacade.create(family);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Family model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Family) where?: Where<Family>): Promise<Count> {
    return this.familyFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Family model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Family, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Family) filter?: Filter<Family>): Promise<Family[]> {
    return this.familyFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Family PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Family, {partial: true})
        }
      }
    })
    family: Family,
    @param.where(Family) where?: Where<Family>
  ): Promise<Count> {
    return this.familyFacade.updateAll(family, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Family model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Family, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Family, {exclude: 'where'}) filter?: FilterExcludingWhere<Family>
  ): Promise<Family> {
    return this.familyFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Family PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Family, {partial: true})
        }
      }
    })
    family: Family
  ): Promise<void> {
    await this.familyFacade.updateById(id, family);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Family PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() family: Family): Promise<void> {
    await this.familyFacade.replaceById(id, family);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Family DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.familyFacade.deleteById(id);
  }
}
