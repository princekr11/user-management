import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Address} from 'common';
import {AddressFacade} from '../facades';
const API_PREFIX = Address.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AddressController {
  constructor(@service(AddressFacade) public addressFacade: AddressFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Address model instance',
    content: {'application/json': {schema: getModelSchemaRef(Address)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Address, {
            title: 'New Address',
            exclude: ['id']
          })
        }
      }
    })
    address: Omit<Address, 'id'>
  ): Promise<Address> {
    return this.addressFacade.create(address);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Address model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Address) where?: Where<Address>): Promise<Count> {
    return this.addressFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Address model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Address, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Address) filter?: Filter<Address>): Promise<Address[]> {
    return this.addressFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Address PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Address, {partial: true})
        }
      }
    })
    address: Address,
    @param.where(Address) where?: Where<Address>
  ): Promise<Count> {
    return this.addressFacade.updateAll(address, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Address model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Address, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Address, {exclude: 'where'})
    filter?: FilterExcludingWhere<Address>
  ): Promise<Address> {
    return this.addressFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Address PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Address, {partial: true})
        }
      }
    })
    address: Address
  ): Promise<void> {
    await this.addressFacade.updateById(id, address);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Address PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() address: Address): Promise<void> {
    await this.addressFacade.replaceById(id, address);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Address DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.addressFacade.deleteById(id);
  }
}
