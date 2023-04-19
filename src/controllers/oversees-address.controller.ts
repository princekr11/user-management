import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {OverseesAddress} from 'common';
import {OverseesAddressFacade} from '../facades';
const API_PREFIX = OverseesAddress.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class OverseesAddressController {
  constructor(@service(OverseesAddressFacade) public overseesAddressFacade: OverseesAddressFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'OverseesAddress model instance',
    content: {'application/json': {schema: getModelSchemaRef(OverseesAddress)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OverseesAddress, {
            title: 'New OverseesAddress',
            exclude: ['id']
          })
        }
      }
    })
    overseesAddress: Omit<OverseesAddress, 'id'>
  ): Promise<OverseesAddress> {
    return this.overseesAddressFacade.create(overseesAddress);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'OverseesAddress model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(OverseesAddress) where?: Where<OverseesAddress>): Promise<Count> {
    return this.overseesAddressFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of OverseesAddress model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(OverseesAddress, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(OverseesAddress) filter?: Filter<OverseesAddress>): Promise<OverseesAddress[]> {
    return this.overseesAddressFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'OverseesAddress PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OverseesAddress, {partial: true})
        }
      }
    })
    overseesAddress: OverseesAddress,
    @param.where(OverseesAddress) where?: Where<OverseesAddress>
  ): Promise<Count> {
    return this.overseesAddressFacade.updateAll(overseesAddress, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'OverseesAddress model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(OverseesAddress, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(OverseesAddress, {exclude: 'where'}) filter?: FilterExcludingWhere<OverseesAddress>
  ): Promise<OverseesAddress> {
    return this.overseesAddressFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'OverseesAddress PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OverseesAddress, {partial: true})
        }
      }
    })
    overseesAddress: OverseesAddress
  ): Promise<void> {
    await this.overseesAddressFacade.updateById(id, overseesAddress);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'OverseesAddress PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() overseesAddress: OverseesAddress): Promise<void> {
    await this.overseesAddressFacade.replaceById(id, overseesAddress);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'OverseesAddress DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.overseesAddressFacade.deleteById(id);
  }
}
