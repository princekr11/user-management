import {authorize} from '@loopback/authorization';
import {service, inject} from '@loopback/core';
import {get, response, param, requestBody, post} from '@loopback/rest';
import {IdcomIntegrationFacade} from '../facades/idcom-integration.facade';
const API_PREFIX = 'IDCOM';

/**
 * Controller for IDCOM Integration.
 */
@authorize({})
export class IdcomIntegrationController {
  constructor(
    @service(IdcomIntegrationFacade) public idcomIntegrationFacade: IdcomIntegrationFacade,
    @inject('userProfile') private userProfile: any,
  ) {}

  /**
   *  This Endpoint fetch auth coe and redirect url
   * @param idcomProps
   * @returns
   */
  @post(`${API_PREFIX}/getAuthCode/{userId}`)
  @response(200, {
    description: 'Fetching auth code from idcom',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          title: 'getAuthCode response body',
          properties: {
            redirectUrl: {type: 'string'},
            success: {type: 'boolean'}
          }
        }
      }
    }
  })
  async getAuthCode(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['deviceId'],
            properties: {
              deviceId: {
                type: 'number'
              }
            }
          }
        }
      }
    })
    device: any
  ): Promise<any> {
    return this.idcomIntegrationFacade.getAuthCode(this.userProfile.appUserId, device.deviceId,this.userProfile.TrxId);
  }

  @post(`${API_PREFIX}/getIdToken`)
  @response(200, {
    description: 'Request body of getIdToken',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          title: 'getAuthCode response body',
          properties: {
            authCode: {type: 'string'},
            IDToken: {type: 'string'},
            authStatus: {type: 'string'},
            success: {type: 'boolean'}
          }
        }
      }
    }
  })
  async getIdToken(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              authCode: {type: 'string'}
            }
          }
        }
      }
    })
    idcomProps: any
  ): Promise<any> {
    return this.idcomIntegrationFacade.getIdToken(idcomProps,this.userProfile.TrxId);
  }

  @post(`${API_PREFIX}/decryptIdToken`)
  @response(200, {
    description: 'Request body of decryptIdToken',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          title: 'decryptIdToken response body',
          properties: {
            customerID: {type: 'number'},
            fintechID: {type: 'string'},
            mobileNo: {type: 'number'},
            panNo: {type: 'string'},
            success: {type: 'boolean'}
          }
        }
      }
    }
  })
  async decryptIdToken(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              idToken: {type: 'string'},
              scope: {type: 'string'}
            }
          }
        }
      }
    })
    idcomProps: any
  ): Promise<any> {
    return this.idcomIntegrationFacade.decryptIdToken(idcomProps, this.userProfile.TrxId);
  }
}
