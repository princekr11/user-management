import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {AccountReferral, PathParamsValidations} from 'common';
import {AccountReferralFacade} from '../facades/account-referral.facade';
const API_PREFIX = AccountReferral.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AccountReferralController {
  constructor(@service(AccountReferralFacade) public accountReferralFacade: AccountReferralFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AccountReferral model instance',
    content: {'application/json': {schema: getModelSchemaRef(AccountReferral)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountReferral, {
            title: 'New AccountReferral',
            exclude: ['id']
          })
        }
      }
    })
    accountReferral: Omit<AccountReferral, 'id'>
  ): Promise<AccountReferral> {
    return this.accountReferralFacade.create(accountReferral);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AccountReferral model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AccountReferral) where?: Where<AccountReferral>): Promise<Count> {
    return this.accountReferralFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AccountReferral model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AccountReferral, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AccountReferral) filter?: Filter<AccountReferral>): Promise<AccountReferral[]> {
    return this.accountReferralFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AccountReferral PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountReferral, {partial: true})
        }
      }
    })
    AccountReferral: AccountReferral,
    @param.where(AccountReferral) where?: Where<AccountReferral>
  ): Promise<Count> {
    return this.accountReferralFacade.updateAll(AccountReferral, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AccountReferral model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AccountReferral, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AccountReferral, {exclude: 'where'})
    filter?: FilterExcludingWhere<AccountReferral>
  ): Promise<AccountReferral> {
    return this.accountReferralFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AccountReferral PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountReferral, {partial: true})
        }
      }
    })
    accountReferral: AccountReferral
  ): Promise<void> {
    await this.accountReferralFacade.updateById(id, accountReferral);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AccountReferral PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() accountReferral: AccountReferral): Promise<void> {
    await this.accountReferralFacade.replaceById(id, accountReferral);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AccountReferral DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.accountReferralFacade.deleteById(id);
  }

  @post(`/${API_PREFIX}/{accountId}/postAccountReferral`)
  @response(200, {
    description: 'Add Referal code',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Referral Code Added!'
          }
        }
      }
    }
  })
  async postAccountReferral(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              referralCode: {
                type: 'string'
              }
            },
            required: ['referralCode']
          }
        }
      }
    })
    ReferralCode: AccountReferral,
    @param.path.number('accountId') accountId: number
  ): Promise<any> {
    return await this.accountReferralFacade.postReferralCode(accountId, ReferralCode);
  }

  @get(`/${API_PREFIX}/{accountID}/fetchAccountReferrals`)
  @response(200, {
    description: 'AccountReferral model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AccountReferral, {includeRelations: false})
      }
    }
  })
  async findByAccountID(
    @param.path.number('accountID') accountID: number,
    @param.query.string('referralCode') referralCode: string
  ): Promise<AccountReferral> {
    PathParamsValidations.idValidations(accountID);
    return this.accountReferralFacade.getAccountReferrals(accountID, referralCode);
  }
}
