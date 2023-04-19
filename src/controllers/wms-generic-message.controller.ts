import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {WmsGenericMessage} from 'common';
import {WmsGenericMessageFacade} from '../facades';
const API_PREFIX = WmsGenericMessage.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class WmsGenericMessageController {
  constructor(@service(WmsGenericMessageFacade) public wmsGenericMessageFacade: WmsGenericMessageFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'WmsGenericMessage model instance',
    content: {'application/json': {schema: getModelSchemaRef(WmsGenericMessage)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(WmsGenericMessage, {
            title: 'New WmsGenericMessage',
            exclude: ['id']
          })
        }
      }
    })
    wmsGenericMessage: Omit<WmsGenericMessage, 'id'>
  ): Promise<WmsGenericMessage> {
    return this.wmsGenericMessageFacade.create(wmsGenericMessage);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'WmsGenericMessage model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(WmsGenericMessage) where?: Where<WmsGenericMessage>): Promise<Count> {
    return this.wmsGenericMessageFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of WmsGenericMessage model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(WmsGenericMessage, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(WmsGenericMessage) filter?: Filter<WmsGenericMessage>): Promise<WmsGenericMessage[]> {
    return this.wmsGenericMessageFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'WmsGenericMessage PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(WmsGenericMessage, {partial: true})
        }
      }
    })
    wmsGenericMessage: WmsGenericMessage,
    @param.where(WmsGenericMessage) where?: Where<WmsGenericMessage>
  ): Promise<Count> {
    return this.wmsGenericMessageFacade.updateAll(wmsGenericMessage, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'WmsGenericMessage model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(WmsGenericMessage, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(WmsGenericMessage, {exclude: 'where'}) filter?: FilterExcludingWhere<WmsGenericMessage>
  ): Promise<WmsGenericMessage> {
    return this.wmsGenericMessageFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'WmsGenericMessage PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(WmsGenericMessage, {partial: true})
        }
      }
    })
    wmsGenericMessage: WmsGenericMessage
  ): Promise<void> {
    await this.wmsGenericMessageFacade.updateById(id, wmsGenericMessage);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'WmsGenericMessage PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() wmsGenericMessage: WmsGenericMessage): Promise<void> {
    await this.wmsGenericMessageFacade.replaceById(id, wmsGenericMessage);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'WmsGenericMessage DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.wmsGenericMessageFacade.deleteById(id);
  }
}
