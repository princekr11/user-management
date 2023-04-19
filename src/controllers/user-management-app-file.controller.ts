import {inject, service} from '@loopback/core';
import {authorize} from '@loopback/authorization';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response, Request, Response, RestBindings} from '@loopback/rest';
import {UserManagementAppFile} from 'common';
import {filter} from 'underscore';
import {UserManagementAppFileFacade} from '../facades';
const API_PREFIX = UserManagementAppFile.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class UserManagementAppFileController {
  constructor(
    @service(UserManagementAppFileFacade) public userManagementAppFileFacade: UserManagementAppFileFacade,
    @inject(RestBindings.Http.RESPONSE) public response: Response,
    @inject('additionalHeaders') private additionalHeaders: any
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'UserManagementAppFile model instance',
    content: {'application/json': {schema: getModelSchemaRef(UserManagementAppFile)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserManagementAppFile, {
            title: 'New UserManagementAppFile',
            exclude: ['id']
          })
        }
      }
    })
    appFile: Omit<UserManagementAppFile, 'id'>
  ): Promise<UserManagementAppFile> {
    return this.userManagementAppFileFacade.create(appFile);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'UserManagementAppFile model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(UserManagementAppFile) where?: Where<UserManagementAppFile>): Promise<Count> {
    return this.userManagementAppFileFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of UserManagementAppFile model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UserManagementAppFile, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(UserManagementAppFile) filter?: Filter<UserManagementAppFile>): Promise<UserManagementAppFile[]> {
    return this.userManagementAppFileFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'UserManagementAppFile PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserManagementAppFile, {partial: true})
        }
      }
    })
    appFile: UserManagementAppFile,
    @param.where(UserManagementAppFile) where?: Where<UserManagementAppFile>
  ): Promise<Count> {
    return this.userManagementAppFileFacade.updateAll(appFile, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'UserManagementAppFile model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(UserManagementAppFile, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(UserManagementAppFile, {exclude: 'where'}) filter?: FilterExcludingWhere<UserManagementAppFile>
  ): Promise<UserManagementAppFile> {
    return this.userManagementAppFileFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UserManagementAppFile PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserManagementAppFile, {partial: true})
        }
      }
    })
    appFile: UserManagementAppFile
  ): Promise<void> {
    await this.userManagementAppFileFacade.updateById(id, appFile);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UserManagementAppFile PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() appFile: UserManagementAppFile): Promise<void> {
    await this.userManagementAppFileFacade.replaceById(id, appFile);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UserManagementAppFile DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userManagementAppFileFacade.deleteById(id);
  }

  @get(`/${API_PREFIX}/getContainerDetails`)
  @response(200, {
    description: 'For fetching documents based on container',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          example: {
            id: 1,
            isActive: true,
            createdDate: '2022-03-07T18:30:00.000Z',
            lastModifiedDate: '2022-03-07T18:30:00.000Z',
            path: '0c871c3d-896a-42fd-ae54-191b7230c230',
            containerName: 'signatures',
            checksum: null,
            originalFileName: 'signature-ruban',
            name: '0c871c3d-896a-42fd-ae54-191b7230c230',
            size: 6672,
            extension: 'jpeg',
            mimeType: 'image/png',
            batchCode: null,
            sampleModel: {}
          }
        }
      }
    }
  })
  async getContainerDetails(
    @param.query.object('ContainerFilter') ContainerFilter: {containerName: string; originalFileName: string}
  ): Promise<object> {
    return this.userManagementAppFileFacade.getContainerDetails(ContainerFilter);
  }

  // @post(`/${API_PREFIX}/{accountId}/documents/{documentType}/uploadDocument`)
  // @response(200, {
  //   description: 'UserManagementAppFile model instance',
  //   content: {
  //     'application/json': {
  //       schema: {
  //         type: 'object',

  //         example: `{success: true}`
  //       }
  //     }
  //   }
  // })
  // async uploadDocument(
  //   @param.path.number('accountId') accountId: number,
  //   @param.path.number('documentType') documentType: number,
  //   @requestBody({
  //     content: {
  //       'multipart/form-data': {
  //         'x-parser': 'stream',
  //         schema: {
  //           type: 'object',
  //           properties: {
  //             file: {
  //               type: 'string',
  //               format: 'binary'
  //             }
  //           }
  //         }
  //       }
  //     }
  //   })
  //   request: Request
  // ): Promise<object> {
  //   return this.userManagementAppFileFacade.uploadDocument(accountId, documentType, request, this.response);
  // }

  @get(`/${API_PREFIX}/userManagementDownloadFile`)
  @response(200, {
    description: 'API for downloading the file',
    content: {
      'application/json': {
        schema: {
          type: 'array'
        }
      }
    }
  })
  async userManagementDownloadFile(
    @param.query.object('ContainerFilter') ContainerFilter: {containerName: string; fileName: string; request: Request; response: Response}
  ): Promise<object> {
    return this.userManagementAppFileFacade.userManagementDownloadFile(
      ContainerFilter.containerName,
      ContainerFilter.fileName,
      ContainerFilter.request,
      ContainerFilter.response
    );
  }
  @post(`/${API_PREFIX}/downloadMultipleUserManagementFiles`)
  @response(200, {
    description: 'API for downloading multiple files',
    content: {
      'application/json': {
        schema: {
          type: 'array'
        } 
      }
    }
  })
  async downloadMultipleuserManagementDownloadFile(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            properties: {
              ContainerFilter: {
                type: 'object',
                properties: {
                  containerName: {
                    type: 'string'
                  },
                  fileName: {
                    type: 'string'
                  }
                }
              }
            },
            example: 
            [
              {
              "containerName": "sting",
              "fileName": "string"
              }
            ]
          }
        }
      }
    })
    ContainerFilter: any
  ): Promise<object> {
    return this.userManagementAppFileFacade.downloadMultipleuserManagementDownloadFile(ContainerFilter);
  }

  @get(`/${API_PREFIX}/userManagementAppFileDetails`)
  @response(200, {
    description: 'Array of userManagementAppFile model instances',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async userManagementAppFileDetails(
    @param.query.object('filter') filter: any,
    @param.query.object('where') where: any): Promise<any> {
    return this.userManagementAppFileFacade.userManagementAppFileMappingDetails(filter,where, this.additionalHeaders);
  }
}
