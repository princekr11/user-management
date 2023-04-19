import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import { FamilyMapping } from 'common';
import {FamilyMappingFacade} from '../facades';
const API_PREFIX = FamilyMapping.modelName;

//@TODO userId should be extracted from tokenData

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class FamilyMappingController {
  constructor(@service(FamilyMappingFacade) public familyMappingFacade: FamilyMappingFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'FamilyMapping model instance',
    content: {'application/json': {schema: getModelSchemaRef(FamilyMapping)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(FamilyMapping, {
            title: 'New FamilyMapping',
            exclude: ['id']
          })
        }
      }
    })
    FamilyMapping: Omit<FamilyMapping, 'id'>
  ): Promise<FamilyMapping> {
    return this.familyMappingFacade.create(FamilyMapping);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'FamilyMapping model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(FamilyMapping) where?: Where<FamilyMapping>): Promise<Count> {
    return this.familyMappingFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of FamilyMapping model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(FamilyMapping, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(FamilyMapping) filter?: Filter<FamilyMapping>): Promise<FamilyMapping[]> {
    return this.familyMappingFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'FamilyMapping PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(FamilyMapping, {partial: true})
        }
      }
    })
    FamilyMapping: FamilyMapping,
    @param.where(FamilyMapping) where?: Where<FamilyMapping>
  ): Promise<Count> {
    return this.familyMappingFacade.updateAll(FamilyMapping, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'FamilyMapping model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(FamilyMapping, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(FamilyMapping, {exclude: 'where'}) filter?: FilterExcludingWhere<FamilyMapping>
  ): Promise<FamilyMapping> {
    return this.familyMappingFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'FamilyMapping PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(FamilyMapping, {partial: true})
        }
      }
    })
    FamilyMapping: FamilyMapping
  ): Promise<void> {
    await this.familyMappingFacade.updateById(id, FamilyMapping);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'FamilyMapping PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() FamilyMapping: FamilyMapping): Promise<void> {
    await this.familyMappingFacade.replaceById(id, FamilyMapping);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'FamilyMapping DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.familyMappingFacade.deleteById(id);
  }
  
}



