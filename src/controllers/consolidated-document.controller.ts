import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {ConsolidatedDocument} from 'common';
import {ConsolidatedDocumentFacade} from '../facades';
const API_PREFIX = ConsolidatedDocument.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class ConsolidatedDocumentController {
  constructor(@service(ConsolidatedDocumentFacade) public ConsolidatedDocumentFacade: ConsolidatedDocumentFacade,
  @inject('additionalHeaders') private additionalHeaders: any) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'ConsolidatedDocument model instance',
    content: {'application/json': {schema: getModelSchemaRef(ConsolidatedDocument)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ConsolidatedDocument, {
            title: 'New ConsolidatedDocument',
            exclude: ['id']
          })
        }
      }
    })
    ConsolidatedDocument: Omit<ConsolidatedDocument, 'id'>
  ): Promise<ConsolidatedDocument> {
    return this.ConsolidatedDocumentFacade.create(ConsolidatedDocument, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'ConsolidatedDocument model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(ConsolidatedDocument) where?: Where<ConsolidatedDocument>): Promise<Count> {
    return this.ConsolidatedDocumentFacade.count(where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of ConsolidatedDocument model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ConsolidatedDocument, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(ConsolidatedDocument) filter?: Filter<ConsolidatedDocument>): Promise<ConsolidatedDocument[]> {
    return this.ConsolidatedDocumentFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'ConsolidatedDocument PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ConsolidatedDocument, {partial: true})
        }
      }
    })
    ConsolidatedDocument: ConsolidatedDocument,
    @param.where(ConsolidatedDocument) where?: Where<ConsolidatedDocument>
  ): Promise<Count> {
    return this.ConsolidatedDocumentFacade.updateAll(ConsolidatedDocument, where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'ConsolidatedDocument model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ConsolidatedDocument, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(ConsolidatedDocument, {exclude: 'where'}) filter?: FilterExcludingWhere<ConsolidatedDocument>
  ): Promise<ConsolidatedDocument> {
    return this.ConsolidatedDocumentFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'ConsolidatedDocument PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ConsolidatedDocument, {partial: true})
        }
      }
    })
    ConsolidatedDocument: ConsolidatedDocument
  ): Promise<void> {
    await this.ConsolidatedDocumentFacade.updateById(id, ConsolidatedDocument, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'ConsolidatedDocument PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() ConsolidatedDocument: ConsolidatedDocument): Promise<void> {
    await this.ConsolidatedDocumentFacade.replaceById(id, ConsolidatedDocument, this.additionalHeaders);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'ConsolidatedDocument DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.ConsolidatedDocumentFacade.deleteById(id, this.additionalHeaders);
  }


  @post(`/${API_PREFIX}/updateStatus`)
  @response(200, {
    description: 'ConsolidatedDocument model instance',
    content: {'application/json': {schema: getModelSchemaRef(ConsolidatedDocument)}}
  })
  async updateStatus(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              rtaId: {
                type: 'number'
              },
              accountId: {
                type: 'array',
                items: {
                  type: 'number'
                }
              },
              status: {
                type: 'number'
              }
            },
            required :['rtaId','accountId','status'],

          }
        }
      }
    })
    ConsolidatedDocument: {rtaId : number,accountId: Array<number>, status : number}
  ): Promise<any> {
    return this.ConsolidatedDocumentFacade.consolidateStatusUpdate(ConsolidatedDocument.rtaId, ConsolidatedDocument.accountId,ConsolidatedDocument.status, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/filterRtaDocuments`)
  @response(200, {
    description: 'Array of generated rta documents instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ConsolidatedDocument, {includeRelations: false})
        }
      }
    }
  })
  async rtaGeneratedConsolidatedDocuments(
    @param.query.object('queryParameters', {
      type: 'object',
      example: {
        limit: 10,
        offset: 0,
        order: "id ASC",
        rtaId: 2,
        status: 4,
        where: [{"appUserName":"string"}, {"accountId":"string"}]
      }
    })
    filterObject: object): Promise<ConsolidatedDocument[]> {
    return this.ConsolidatedDocumentFacade.rtaGeneratedConsolidatedDocuments(filterObject, this.additionalHeaders);
  }

}
