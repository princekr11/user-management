import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {ServiceRequestDocument} from 'common';
import {ServiceRequestDocumentFacade} from '../facades';
const API_PREFIX = ServiceRequestDocument.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class ServiceRequestDocumentController {
  constructor(@service(ServiceRequestDocumentFacade) public serviceRequestDocumentFacade: ServiceRequestDocumentFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'ServiceRequestDocument model instance',
    content: {'application/json': {schema: getModelSchemaRef(ServiceRequestDocument)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ServiceRequestDocument, {
            title: 'New ServiceRequestDocument',
            exclude: ['id']
          })
        }
      }
    })
    serviceRequestDocument: Omit<ServiceRequestDocument, 'id'>
  ): Promise<ServiceRequestDocument> {
    return this.serviceRequestDocumentFacade.create(serviceRequestDocument);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'ServiceRequestDocument model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(ServiceRequestDocument) where?: Where<ServiceRequestDocument>): Promise<Count> {
    return this.serviceRequestDocumentFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of ServiceRequestDocument model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ServiceRequestDocument, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(ServiceRequestDocument) filter?: Filter<ServiceRequestDocument>): Promise<ServiceRequestDocument[]> {
    return this.serviceRequestDocumentFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'ServiceRequestDocument PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ServiceRequestDocument, {partial: true})
        }
      }
    })
    serviceRequestDocument: ServiceRequestDocument,
    @param.where(ServiceRequestDocument) where?: Where<ServiceRequestDocument>
  ): Promise<Count> {
    return this.serviceRequestDocumentFacade.updateAll(serviceRequestDocument, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'ServiceRequestDocument model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ServiceRequestDocument, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(ServiceRequestDocument, {exclude: 'where'}) filter?: FilterExcludingWhere<ServiceRequestDocument>
  ): Promise<ServiceRequestDocument> {
    return this.serviceRequestDocumentFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'ServiceRequestDocument PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ServiceRequestDocument, {partial: true})
        }
      }
    })
    serviceRequestDocument: ServiceRequestDocument
  ): Promise<void> {
    await this.serviceRequestDocumentFacade.updateById(id, serviceRequestDocument);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'ServiceRequestDocument PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() serviceRequestDocument: ServiceRequestDocument): Promise<void> {
    await this.serviceRequestDocumentFacade.replaceById(id, serviceRequestDocument);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'ServiceRequestDocument DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.serviceRequestDocumentFacade.deleteById(id);
  }
}
