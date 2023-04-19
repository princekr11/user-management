import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {AdvisoryClientMaster} from 'common';
import {AdvisoryClientMasterFacade} from '../facades';
const API_PREFIX = AdvisoryClientMaster.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AdvisoryClientMasterController {
  constructor(@service(AdvisoryClientMasterFacade) public advisoryClientMasterFacade: AdvisoryClientMasterFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AdvisoryClientMaster model instance',
    content: {'application/json': {schema: getModelSchemaRef(AdvisoryClientMaster)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AdvisoryClientMaster, {
            title: 'New AdvisoryClientMaster',
            exclude: ['id']
          })
        }
      }
    })
    advisoryClientMaster: Omit<AdvisoryClientMaster, 'id'>
  ): Promise<AdvisoryClientMaster> {
    return this.advisoryClientMasterFacade.create(advisoryClientMaster);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AdvisoryClientMaster model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AdvisoryClientMaster) where?: Where<AdvisoryClientMaster>): Promise<Count> {
    return this.advisoryClientMasterFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AdvisoryClientMaster model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AdvisoryClientMaster, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AdvisoryClientMaster) filter?: Filter<AdvisoryClientMaster>): Promise<AdvisoryClientMaster[]> {
    return this.advisoryClientMasterFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AdvisoryClientMaster PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AdvisoryClientMaster, {partial: true})
        }
      }
    })
    advisoryClientMaster: AdvisoryClientMaster,
    @param.where(AdvisoryClientMaster) where?: Where<AdvisoryClientMaster>
  ): Promise<Count> {
    return this.advisoryClientMasterFacade.updateAll(advisoryClientMaster, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AdvisoryClientMaster model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AdvisoryClientMaster, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AdvisoryClientMaster, {exclude: 'where'})
    filter?: FilterExcludingWhere<AdvisoryClientMaster>
  ): Promise<AdvisoryClientMaster> {
    return this.advisoryClientMasterFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AdvisoryClientMaster PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AdvisoryClientMaster, {partial: true})
        }
      }
    })
    advisoryClientMaster: AdvisoryClientMaster
  ): Promise<void> {
    await this.advisoryClientMasterFacade.updateById(id, advisoryClientMaster);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AdvisoryClientMaster PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() advisoryClientMaster: AdvisoryClientMaster): Promise<void> {
    await this.advisoryClientMasterFacade.replaceById(id, advisoryClientMaster);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AdvisoryClientMaster DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.advisoryClientMasterFacade.deleteById(id);
  }
}
