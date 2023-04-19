import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {BankAccount,PathParamsValidations} from 'common';
import {BankAccountFacade} from '../facades';
const API_PREFIX = BankAccount.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class BankAccountController {
  constructor(@service(BankAccountFacade) public bankAccountFacade: BankAccountFacade,
  @inject('additionalHeaders') private additionalHeaders: any,
  ) { }

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'BankAccount model instance',
    content: {'application/json': {schema: getModelSchemaRef(BankAccount)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BankAccount, {
            title: 'New BankAccount',
            exclude: ['id']
          })
        }
      }
    })
    bankAccount: Omit<BankAccount, 'id'>
  ): Promise<BankAccount> {
    return this.bankAccountFacade.create(bankAccount);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'BankAccount model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(BankAccount) where?: Where<BankAccount>): Promise<Count> {
    return this.bankAccountFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of BankAccount model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(BankAccount, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(BankAccount) filter?: Filter<BankAccount>): Promise<BankAccount[]> {
    return this.bankAccountFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'BankAccount PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BankAccount, {partial: true})
        }
      }
    })
    bankAccount: BankAccount,
    @param.where(BankAccount) where?: Where<BankAccount>
  ): Promise<Count> {
    return this.bankAccountFacade.updateAll(bankAccount, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'BankAccount model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(BankAccount, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(BankAccount, {exclude: 'where'}) filter?: FilterExcludingWhere<BankAccount>
  ): Promise<BankAccount> {
    return this.bankAccountFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'BankAccount PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BankAccount, {partial: true})
        }
      }
    })
    bankAccount: BankAccount
  ): Promise<void> {
    await this.bankAccountFacade.updateById(id, bankAccount);
  }

  // update by id post request
  @post(`/${API_PREFIX}/{accountId}/updateBankAccountDetailsById/{id}`)
  @response(204, {
    description: 'BankAccount Post success',
    content: {
      'application/json': {
        schema: {
          type: 'Object'
        },
        example: {
          success: true
        }
      }
    }
  })
  async updateBankAccount(
    @param.path.number('id') id: number,
    @param.path.number('accountId') accountId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BankAccount, {partial: true})
        }
      }
    })
    bankAccount: BankAccount
  ): Promise<Object> {
    PathParamsValidations.idValidations(id)
    PathParamsValidations.idValidations(accountId)
    return this.bankAccountFacade.updateBankAccount(id, accountId, bankAccount,this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'BankAccount PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() bankAccount: BankAccount): Promise<void> {
    await this.bankAccountFacade.replaceById(id, bankAccount);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'BankAccount DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.bankAccountFacade.deleteById(id);
  }

  @get(`/${API_PREFIX}/{accountId}/fetchBankAccountDetailsById/{bankAccountId}`)
  @response(200, {
    description: 'BankAccount model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(BankAccount, {includeRelations: false})
      }
    }
  })
  async fetchBankAccountDetailsById(
    @param.path.number('bankAccountId') bankAccountId: number,
    @param.path.number('accountId') accountId: number,
  ): Promise<BankAccount> {
    PathParamsValidations.idValidations(bankAccountId)
    PathParamsValidations.idValidations(accountId)
    return this.bankAccountFacade.fetchBankAccountDetailsById(bankAccountId, accountId);
  }

}
