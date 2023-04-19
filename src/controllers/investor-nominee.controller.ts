import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Address, InvestorNominee, PathParamsValidations} from 'common';
import {InvestorNomineeFacade} from '../facades';
const API_PREFIX = InvestorNominee.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class InvestorNomineeController {
  constructor(
    @service(InvestorNomineeFacade) public investorNomineeFacade: InvestorNomineeFacade,
    @inject('additionalHeaders') private additionalHeaders: any
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'InvestorNominee model instance',
    content: {'application/json': {schema: getModelSchemaRef(InvestorNominee)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorNominee, {
            title: 'New InvestorNominee',
            exclude: ['id']
          })
        }
      }
    })
    investorNominee: Omit<InvestorNominee, 'id'>
  ): Promise<InvestorNominee> {
    return this.investorNomineeFacade.create(investorNominee);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'InvestorNominee model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(InvestorNominee) where?: Where<InvestorNominee>): Promise<Count> {
    return this.investorNomineeFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of InvestorNominee model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InvestorNominee, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(InvestorNominee) filter?: Filter<InvestorNominee>): Promise<InvestorNominee[]> {
    return this.investorNomineeFacade.find(filter);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'InvestorNominee model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InvestorNominee, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(InvestorNominee, {exclude: 'where'}) filter?: FilterExcludingWhere<InvestorNominee>
  ): Promise<InvestorNominee> {
    return this.investorNomineeFacade.findById(id, filter);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'InvestorNominee DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.investorNomineeFacade.deleteById(id);
  }

  @post(`/${API_PREFIX}/{accountId}/createNominee`)
  @response(200, {
    description: 'InvestorNominee model instance',
    content: {'application/json': {schema: getModelSchemaRef(InvestorNominee)}}
  })
  async createNomineeByAccountId(
    @param.path.number('accountId') accountId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'relationshipId', 'nomineePercentage', 'dateOfBirth'],
            properties: {
              name: {
                type: 'string',
                minLength: 1,
                maxLength: 255
              },
              relationshipId: {
                type: 'number'
              },
              nomineePercentage: {
                type: 'number',
                minimum: 1,
                maximum: 100
              },
              dateOfBirth: {
                type: 'string',
                pattern: '^\\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])$'
              },
              guardianName: {
                type: 'string',
                minLength: 1,
                maxLength: 100,

              },
              guardianRelationship: {
                type: 'number',
                minimum: 1
              },
              guardianPanCardNumber: {
                type: 'string',
                pattern: '([A-Z]){5}([0-9]){4}([A-Z]){1}$'
              },
              nomineeAddress: {
                type: 'object'
              },
              guardianAddress: {
                type: 'object'
              },
              investorTypeId: {
                type: 'number'
              }
            },
            example: `{
              "name": "A",
              "relationshipId": 1,
              "nomineePercentage": 10,
              "dateOfBirth": "1993-04-03",
              "guardianRelationship": 1,
              "guardianName":"Ramesh",
              "guardianPanCardNumber":"AZLPN4486H",
              "investorTypeId": 2,
              "nomineeAddress": {
                "addressLine1":"address line 1 here",
                "addressLine2":"address line 2 here",
                "addressLine3":"address line 3 here",
                "fullAddress":"full address here",
                "district":"district here",
                "city":"city here",
                "pincode": "507301",
                "landmark":"landmark here",
                "addressTypeId": 2,
                "stateId": 3
              },
              "guardianAddress": {
                "addressLine1":"address line 1 here",
                "addressLine2":"address line 2 here",
                "addressLine3":"address line 3 here",
                "fullAddress":"full address here",
                "district":"district here",
                "city":"city here",
                "pincode": "507301",
                "landmark":"landmark here",
                "addressTypeId": 2,
                "stateId": 3
              }
            }`
          }
        }
      }
    })
    investorNominee: Object
  ): Promise<InvestorNominee> {
    //validate account id
    PathParamsValidations.idValidations(accountId);
    return this.investorNomineeFacade.createNomineeByAccountId(accountId, investorNominee);
  }

  @post(`/${API_PREFIX}/{accountId}/saveOnboardingSelectedNominees`)
  @response(200, {
    description: 'Save selected investor nominee details while onboarding',
    content: {'application/json': {schema: getModelSchemaRef(InvestorNominee)}}
  })
  async saveOnboardingSelectedNominees(
    @param.path.number('accountId') accountId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            example: `
            [{
              "id":210,
              "appUserId":22443
            },
            {
              "id":211,
              "appUserId":22444
            },
            {
              "id":212,
              "appUserId":22445
            }]`
          }
        }
      }
    })
    investorNominee: Array<Partial<InvestorNominee>>
  ): Promise<object> {
    //validate account id
    PathParamsValidations.idValidations(accountId);
    return this.investorNomineeFacade.saveOnboardingSelectedNominees(accountId, investorNominee);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'investor nominee PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorNominee, {partial: true})
        }
      }
    })
    investorNominee: InvestorNominee,
    @param.where(InvestorNominee) where?: Where<InvestorNominee>
  ): Promise<Count> {
    return this.investorNomineeFacade.updateAll(investorNominee, where, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'investor Nominee PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorNominee, {partial: true})
        }
      }
    })
    investorNominee: InvestorNominee
  ): Promise<void> {
    await this.investorNomineeFacade.updateById(id, investorNominee, this.additionalHeaders);
  }
}
