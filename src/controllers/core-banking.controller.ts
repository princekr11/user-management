import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {CoreBanking} from '../models';
import {CoreBankingFacade} from '../facades';
const API_PREFIX = CoreBanking.modelName;

@authorize({})
export class CoreBankingController {
  constructor(@service(CoreBankingFacade) public coreBankingFacade: CoreBankingFacade,
  @inject('additionalHeaders') private additionalHeaders: any,
  @inject('userProfile') private userProfile: any) { }

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Store data into delta db using fatca api',
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
  async storeCustomerAccountAmlFatcaDetailsIntoDB(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              mobileNumber: {
                type: 'string'
              },
              pan: {
                type: 'string'
              },
              dob: {
                type: 'string'
              },
              customerID: {
                type: 'string'
              }
            }
          }
        }
      }
    })
    customerDetails: {
      mobileNumber: '';
      pan: '';
      dob: '';
      customerID: '';
    }
  ): Promise<any> {
    return this.coreBankingFacade.fetchCustomerAccountAmlFatcaDetails(
      customerDetails.pan,
      customerDetails.dob,
      customerDetails.mobileNumber,
      customerDetails.customerID,
      this.userProfile.TrxId,
      this.additionalHeaders
    );
  }
}
