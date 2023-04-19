import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {AnyObject, Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, Response, response, RestBindings} from '@loopback/rest';
import {UamLoginLogs} from 'common';
import {UamLoginLogsFacade} from '../facades';
const API_PREFIX = UamLoginLogs.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class UamLoginLogsController {
  constructor(
    @service(UamLoginLogsFacade) public uamLoginLogsFacade: UamLoginLogsFacade,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
    @inject('additionalHeaders') private additionalHeaders: any,
    ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'UamLoginLogs model instance',
    content: {'application/json': {schema: getModelSchemaRef(UamLoginLogs)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UamLoginLogs, {
            title: 'New UamLoginLogs',
            exclude: ['id']
          })
        }
      }
    })
    UamLoginLogs: Omit<UamLoginLogs, 'id'>
  ): Promise<UamLoginLogs> {
    return this.uamLoginLogsFacade.create(UamLoginLogs);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'UamLoginLogs model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(UamLoginLogs) where?: Where<UamLoginLogs>): Promise<Count> {
    return this.uamLoginLogsFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of UamLoginLogs model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UamLoginLogs, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(UamLoginLogs) filter?: Filter<UamLoginLogs>): Promise<UamLoginLogs[]> {
    return this.uamLoginLogsFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'UamLoginLogs PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UamLoginLogs, {partial: true})
        }
      }
    })
    UamLoginLogs: UamLoginLogs,
    @param.where(UamLoginLogs) where?: Where<UamLoginLogs>
  ): Promise<Count> {
    return this.uamLoginLogsFacade.updateAll(UamLoginLogs, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'UamLoginLogs model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(UamLoginLogs, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(UamLoginLogs, {exclude: 'where'}) filter?: FilterExcludingWhere<UamLoginLogs>
  ): Promise<UamLoginLogs> {
    return this.uamLoginLogsFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UamLoginLogs PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UamLoginLogs, {partial: true})
        }
      }
    })
    UamLoginLogs: UamLoginLogs
  ): Promise<void> {
    await this.uamLoginLogsFacade.updateById(id, UamLoginLogs);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UamLoginLogs PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() UamLoginLogs: UamLoginLogs): Promise<void> {
    await this.uamLoginLogsFacade.replaceById(id, UamLoginLogs);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UamLoginLogs DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.uamLoginLogsFacade.deleteById(id);
  }


  @get(`/${API_PREFIX}/fetchLoginLogs`)
  @response(200, {
    description: 'Array of UamLoginLogs model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UamLoginLogs, {includeRelations: false})
        }
      }
    }
  })
  async fetchLoginLogs(@param.filter(UamLoginLogs) filter?: Filter<UamLoginLogs>): Promise<AnyObject[]> {
    return this.uamLoginLogsFacade.fetchLoginLogs(filter);
  }

  @get(`/${API_PREFIX}/downloadLoginLogsReport`)
  @response(200, {
    description: 'API for downloading the file',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async downloadLoginLogsReport(@param.filter(UamLoginLogs) filter?: Filter<UamLoginLogs>): Promise<any> {
    return this.uamLoginLogsFacade.downloadLoginLogsReport(this.res, filter, this.additionalHeaders);
  }
}
