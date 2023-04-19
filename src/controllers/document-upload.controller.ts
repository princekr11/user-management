import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {DocumentUpload} from 'common';
import {DocumentUploadFacade} from '../facades';
const API_PREFIX = DocumentUpload.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class DocumentUploadController {
  constructor(@service(DocumentUploadFacade) public documentUploadFacade: DocumentUploadFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'DocumentUpload model instance',
    content: {'application/json': {schema: getModelSchemaRef(DocumentUpload)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DocumentUpload, {
            title: 'New DocumentUpload',
            exclude: ['id']
          })
        }
      }
    })
    documentUpload: Omit<DocumentUpload, 'id'>
  ): Promise<DocumentUpload> {
    return this.documentUploadFacade.create(documentUpload);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'DocumentUpload model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(DocumentUpload) where?: Where<DocumentUpload>): Promise<Count> {
    return this.documentUploadFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of DocumentUpload model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DocumentUpload, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(DocumentUpload) filter?: Filter<DocumentUpload>): Promise<DocumentUpload[]> {
    return this.documentUploadFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'DocumentUpload PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DocumentUpload, {partial: true})
        }
      }
    })
    documentUpload: DocumentUpload,
    @param.where(DocumentUpload) where?: Where<DocumentUpload>
  ): Promise<Count> {
    return this.documentUploadFacade.updateAll(documentUpload, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'DocumentUpload model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(DocumentUpload, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(DocumentUpload, {exclude: 'where'}) filter?: FilterExcludingWhere<DocumentUpload>
  ): Promise<DocumentUpload> {
    return this.documentUploadFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'DocumentUpload PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DocumentUpload, {partial: true})
        }
      }
    })
    documentUpload: DocumentUpload
  ): Promise<void> {
    await this.documentUploadFacade.updateById(id, documentUpload);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'DocumentUpload PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() documentUpload: DocumentUpload): Promise<void> {
    await this.documentUploadFacade.replaceById(id, documentUpload);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'DocumentUpload DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.documentUploadFacade.deleteById(id);
  }
}
