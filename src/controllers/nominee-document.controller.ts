import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {NomineeDocument} from 'common';
import {NomineeDocumentFacade} from '../facades';
const API_PREFIX = NomineeDocument.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class NomineeDocumentController {
  constructor(@service(NomineeDocumentFacade) public NomineeDocumentFacade: NomineeDocumentFacade,
  @inject('additionalHeaders') private additionalHeaders: any) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'NomineeDocument model instance',
    content: {'application/json': {schema: getModelSchemaRef(NomineeDocument)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NomineeDocument, {
            title: 'New NomineeDocument',
            exclude: ['id']
          })
        }
      }
    })
    NomineeDocument: Omit<NomineeDocument, 'id'>
  ): Promise<NomineeDocument> {
    return this.NomineeDocumentFacade.create(NomineeDocument, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'NomineeDocument model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(NomineeDocument) where?: Where<NomineeDocument>): Promise<Count> {
    return this.NomineeDocumentFacade.count(where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of NomineeDocument model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(NomineeDocument, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(NomineeDocument) filter?: Filter<NomineeDocument>): Promise<NomineeDocument[]> {
    return this.NomineeDocumentFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'NomineeDocument PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NomineeDocument, {partial: true})
        }
      }
    })
    NomineeDocument: NomineeDocument,
    @param.where(NomineeDocument) where?: Where<NomineeDocument>
  ): Promise<Count> {
    return this.NomineeDocumentFacade.updateAll(NomineeDocument, where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'NomineeDocument model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(NomineeDocument, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(NomineeDocument, {exclude: 'where'}) filter?: FilterExcludingWhere<NomineeDocument>
  ): Promise<NomineeDocument> {
    return this.NomineeDocumentFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'NomineeDocument PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NomineeDocument, {partial: true})
        }
      }
    })
    NomineeDocument: NomineeDocument
  ): Promise<void> {
    await this.NomineeDocumentFacade.updateById(id, NomineeDocument, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'NomineeDocument PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() NomineeDocument: NomineeDocument): Promise<void> {
    await this.NomineeDocumentFacade.replaceById(id, NomineeDocument, this.additionalHeaders);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'NomineeDocument DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.NomineeDocumentFacade.deleteById(id, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/generateNomineeDocuments`)
  @response(200, {
    description: 'Generate NomineeDocuments',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Generated NomineeDocuments!'
          }
        }
      }
    }
  })
  async generateNomineeDocuments(
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
                type: 'number'
              },
              serviceProviderId: {
                type: 'number'
              },
              date : {
                type : 'string'
              }
            }
          }
        }
      }
    })
    generateNomineeDocuments : {rtaId:number,accountId: number,serviceProviderId : number, date : string},
  ): Promise<object> {
      return await this.NomineeDocumentFacade.generateNomineeDocuments(generateNomineeDocuments,this.additionalHeaders);
  }
  
  @get(`/${API_PREFIX}/nomineeDocumentDetails`)
  @response(200, {
    description: 'Array of nomineeDocument model instances',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async userCartDetails(
    @param.query.object('filter') filter: any,
    @param.query.object('where') where: any): Promise<any> {
    return this.NomineeDocumentFacade.nomineeDocumentDetails(filter,where, this.additionalHeaders);
  }


  @post(`/${API_PREFIX}/updateStatus`)
  @response(200, {
    description: 'NomineeDocument model instance',
    content: {'application/json': {schema: getModelSchemaRef(NomineeDocument)}}
  })
  async updateStatus(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ids: {
                type: 'array',
                items: {
                  type: 'number'
                }
              },
              status: {
                type: 'number'
              }
            },
            required :['ids','status'],
           
          }
        }
      }
    })
    NomineeDocument: {ids: Array<number>, status : number}
  ): Promise<any> {
    return this.NomineeDocumentFacade.nomineeDocumentStatusUpdate( NomineeDocument.ids,NomineeDocument.status, this.additionalHeaders);
  }
}
