import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {CsrFatca} from 'common';
import {CsrFatcaFacade} from '../facades';

const API_PREFIX = CsrFatca.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class CsrFatcaController {
  constructor(
    @service(CsrFatcaFacade) public csrFatcaFacade: CsrFatcaFacade,
    @inject('additionalHeaders') private additionalHeaders: any
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'CsrFatca model instance',
    content: {'application/json': {schema: getModelSchemaRef(CsrFatca)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CsrFatca, {
            title: 'New CsrFatca',
            exclude: ['id']
          })
        }
      }
    })
    csrFatca: Omit<CsrFatca, 'id'>
  ): Promise<CsrFatca> {
    return this.csrFatcaFacade.create(csrFatca, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'CsrFatca model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(CsrFatca) where?: Where<CsrFatca>): Promise<Count> {
    return this.csrFatcaFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of CsrFatca model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CsrFatca, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(CsrFatca) filter?: Filter<CsrFatca>): Promise<CsrFatca[]> {
    return this.csrFatcaFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'CsrFatca PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CsrFatca, {partial: true})
        }
      }
    })
    csrFatca: CsrFatca,
    @param.where(CsrFatca) where?: Where<CsrFatca>
  ): Promise<Count> {
    return this.csrFatcaFacade.updateAll(csrFatca, where);
  }

  @put(`/${API_PREFIX}/updatecsrFatcaStatus`)
  @response(200, {
    description: 'csr FATCA Status update PUT success',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            count: {
              type: 'number'
            }
          }
        }
      }
    }
  })
  async updatecsrFatcaStatus(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              rtaId: {
                type: 'number'
              },
              accountIds: {
                type: 'array',
                items: {
                  type: 'number'
                }
              }
            },
            example: {
              rtaId: 1,
              accountIds: [4613, 20767]
            }
          }
        }
      }
    })
    csrFatca: CsrFatca,
    @param.where(CsrFatca) where?: Where<CsrFatca>
  ): Promise<Count> {
    return this.csrFatcaFacade.updatecsrFatcaStatus(csrFatca);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'CsrFatca model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CsrFatca, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CsrFatca, {exclude: 'where'})
    filter?: FilterExcludingWhere<CsrFatca>
  ): Promise<CsrFatca> {
    return this.csrFatcaFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'CsrFatca PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CsrFatca, {partial: true})
        }
      }
    })
    csrFatca: CsrFatca
  ): Promise<void> {
    await this.csrFatcaFacade.updateById(id, csrFatca);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'CsrFatca PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() csrFatca: CsrFatca): Promise<void> {
    await this.csrFatcaFacade.replaceById(id, csrFatca);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'CsrFatca DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.csrFatcaFacade.deleteById(id);
  }

  @get(`/${API_PREFIX}/generateFatca`)
  @response(200, {
    description: 'method to generate FATCA',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            }
          }
        }
      }
    }
  })
  async generateFatca(): Promise<any> {
    return this.csrFatcaFacade.generateFatca(this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/fetchFatca`)
  @response(200, {
    description: 'method to generate FATCA',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async fetchFatca(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number'
              },
              offset: {
                type: 'number'
              },
              where: {
                type: 'object',
                properties: {
                  generatedDate: {
                    type: 'string'
                  },
                  rtaId: {
                    type: 'number'
                  }
                }
              }
            },
            example: {
              limit: 100,
              offset: 0,
              where: {
                generatedDate: '%2022-09-12%',
                rtaId: 1
              }
            }
          }
        }
      }
    })
    paginator: any
  ): Promise<any> {
    return this.csrFatcaFacade.fetchFatca(paginator, this.additionalHeaders);
  }
}
