import {authorize} from '@loopback/authorization';
import {service, inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response, Request, RestBindings} from '@loopback/rest';
import {Ekyc} from '../models';
import {EkycFacade} from '../facades';
import { PathParamsValidations } from 'common';
const API_PREFIX = Ekyc.modelName;

@authorize({})
export class EkycController {
  constructor(
    @service(EkycFacade) public ekycFacade: EkycFacade,
    @inject('userProfile') private userProfile: any,
    @inject('additionalHeaders') private additionalHeaders: any
  ) {}
  //verify ekyc api
  @get(`/${API_PREFIX}/checkEkycStatus`)
  @response(200, {
    description: 'fetch KRAKYC',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        },
        example: {
          success: true
        }
      }
    }
  })
  async fetchKRAKYC(@inject(RestBindings.Http.REQUEST) request: Request): Promise<object> {
    // @ts-ignore:
    return this.ekycFacade.fetchKRAKYC(this.userProfile.appUserId, true, this.userProfile.TrxId, this.additionalHeaders);
  }

  //verify ekyc api by id
  @post(`/${API_PREFIX}/checkEkycStatusById`)
  @response(200, {
    description: 'fetch KRAKYC',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        },
        example: {
          success: true
        }
      }
    }
  })
  async fetchKRAKYCBYID(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userId'],
            properties: {
              userId: {
                type: 'string',
                pattern: '[0-9]',
                minLength: 0
              }
            },
            example: {
              userId: '1'
            }
          }
        }
      }
    })
    data: {
      userId: any;
    }
  ): Promise<object> {
    // @ts-ignore:
    return this.ekycFacade.fetchKRAKYC(data.userId, true, this.userProfile.TrxId, this.additionalHeaders);
  }
  //get pan ekyc
  @get(`/${API_PREFIX}/verifyPan`)
  @response(200, {
    description: 'Verify EKYC PAN CONTROLLER',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        },
        example: {
          success: true
        }
      }
    }
  })
  async updateKRAKYC(@inject(RestBindings.Http.REQUEST) request: Request): Promise<any> {
    // @ts-ignore:
    return this.ekycFacade.updateKRAKYC(this.userProfile.appUserId, this.userProfile.TrxId);
  }

  @post(`/${API_PREFIX}/{id}/kycCompleted`)
  @response(200, {
    description: 'Setting is_kyc_done flag to TRUE',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {success: true}
        }
      }
    }
  })
  async kycCompleted(
    @param.path.number('id') id: number): Promise<object> {
    PathParamsValidations.idValidations(id)
    return this.ekycFacade.kycCompleted(id);
  }
}
