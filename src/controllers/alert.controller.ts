import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Alert} from 'common';
import {AlertFacade} from '../facades';
const API_PREFIX = Alert.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AlertController {
  constructor(@service(AlertFacade) public alertFacade: AlertFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Alert model instance',
    content: {'application/json': {schema: getModelSchemaRef(Alert)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Alert, {
            title: 'New Alert',
            exclude: ['id']
          })
        }
      }
    })
    alert: Omit<Alert, 'id'>
  ): Promise<Alert> {
    return this.alertFacade.create(alert);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Alert model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Alert) where?: Where<Alert>): Promise<Count> {
    return this.alertFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Alert model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Alert, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Alert) filter?: Filter<Alert>): Promise<Alert[]> {
    return this.alertFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Alert PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Alert, {partial: true})
        }
      }
    })
    alert: Alert,
    @param.where(Alert) where?: Where<Alert>
  ): Promise<Count> {
    return this.alertFacade.updateAll(alert, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Alert model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Alert, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Alert, {exclude: 'where'}) filter?: FilterExcludingWhere<Alert>
  ): Promise<Alert> {
    return this.alertFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Alert PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Alert, {partial: true})
        }
      }
    })
    alert: Alert
  ): Promise<void> {
    await this.alertFacade.updateById(id, alert);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Alert PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() alert: Alert): Promise<void> {
    await this.alertFacade.replaceById(id, alert);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Alert DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.alertFacade.deleteById(id);
  }
}
