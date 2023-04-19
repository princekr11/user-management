import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Mandate} from 'common';
import {MandateFacade} from '../facades';
const API_PREFIX = Mandate.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class MandateController {
  constructor(@service(MandateFacade) public mandateFacade: MandateFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Mandate model instance',
    content: {'application/json': {schema: getModelSchemaRef(Mandate)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Mandate, {
            title: 'New Mandate',
            exclude: ['id']
          })
        }
      }
    })
    mandate: Omit<Mandate, 'id'>
  ): Promise<Mandate> {
    return this.mandateFacade.create(mandate);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Mandate model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Mandate) where?: Where<Mandate>): Promise<Count> {
    return this.mandateFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Mandate model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Mandate, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Mandate) filter?: Filter<Mandate>): Promise<Mandate[]> {
    return this.mandateFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Mandate PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Mandate, {partial: true})
        }
      }
    })
    mandate: Mandate,
    @param.where(Mandate) where?: Where<Mandate>
  ): Promise<Count> {
    return this.mandateFacade.updateAll(mandate, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Mandate model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Mandate, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Mandate, {exclude: 'where'}) filter?: FilterExcludingWhere<Mandate>
  ): Promise<Mandate> {
    return this.mandateFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Mandate PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Mandate, {partial: true})
        }
      }
    })
    mandate: Mandate
  ): Promise<void> {
    await this.mandateFacade.updateById(id, mandate);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Mandate PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() mandate: Mandate): Promise<void> {
    await this.mandateFacade.replaceById(id, mandate);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Mandate DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.mandateFacade.deleteById(id);
  }
}
