import {authorize} from '@loopback/authorization';
import {service, inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, Response, response, RestBindings} from '@loopback/rest';
import {Account, InvestorNominee, InvestorNomineeRelations, RiskProfileQuestionSubmittedAnswer, PathParamsValidations} from 'common';
import {AccountFacade, skippedNomineeType, AppUserFacade} from '../facades';
const API_PREFIX = Account.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AccountController {
  constructor(
    @service(AccountFacade) public accountFacade: AccountFacade,
    @service(AppUserFacade) public appUserFacade: AppUserFacade,
    @inject('additionalHeaders') private additionalHeaders: any,
    @inject('userProfile') private userProfile: any,
    @inject(RestBindings.Http.RESPONSE) private res: Response
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Account model instance',
    content: {'application/json': {schema: getModelSchemaRef(Account)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {
            title: 'New Account',
            exclude: ['id']
          })
        }
      }
    })
    account: Omit<Account, 'id'>
  ): Promise<Account> {
    return this.accountFacade.create(account);
  }

  @post(`/${API_PREFIX}/{id}/pdf`)
  @response(200, {
    description: 'Account model instance',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async createPdf(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['aofType'],
            properties: {
              aofType: {
                type: 'string',
                minLength: 1,
                maxLength: 5
              }
            }
          }
        }
      }
    })
    data: {aofType: string}
  ): Promise<any> {
    PathParamsValidations.idValidations(id);
    return this.accountFacade.generateAOF(id, data.aofType, {}, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Account model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Account) where?: Where<Account>): Promise<Count> {
    return this.accountFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Account model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Account, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Account) filter?: Filter<Account>): Promise<Account[]> {
    return this.accountFacade.find(filter, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/fetchAccounts`)
  @response(200, {
    description: 'Array of Account model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Account, {includeRelations: false})
        }
      }
    }
  })
  async fetchAccounts(@param.filter(Account) filter?: Filter<Account>): Promise<Account[]> {
    return this.accountFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Account PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {partial: true})
        }
      }
    })
    account: Account,
    @param.where(Account) where?: Where<Account>
  ): Promise<Count> {
    return this.accountFacade.updateAll(account, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Account model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Account, {exclude: 'where'}) filter?: FilterExcludingWhere<Account>
  ): Promise<Account> {
    return this.accountFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Account PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {partial: true})
        }
      }
    })
    account: Account
  ): Promise<void> {
    await this.accountFacade.updateById(id, account);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Account PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() account: Account): Promise<void> {
    await this.accountFacade.replaceById(id, account);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Account DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.accountFacade.deleteById(id);
  }

  @post(`${API_PREFIX}/{id}/submitRiskProfileAnswers/`)
  @response(204, {
    description: 'To submit Risk profile answers',
    content: {'application/json': {schema: getModelSchemaRef(Account)}}
  })
  async submitRiskProfileAnswers(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(RiskProfileQuestionSubmittedAnswer, {partial: true})
          }
        }
      }
    })
    answers: Array<RiskProfileQuestionSubmittedAnswer>
  ): Promise<Account> {
    PathParamsValidations.idValidations(id);
    return this.accountFacade.submitRiskProfileAnswers(id, answers, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}/fetchNomineeDetails`)
  @response(200, {
    description: 'For fetching nominee details of user based on account',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              address: {
                type: 'object',
                properties: {
                  addressId: {
                    type: 'number'
                  },
                  addressLine1: {
                    type: 'string'
                  },
                  addressLine2: {
                    type: 'string'
                  },
                  stateId: {
                    type: 'number'
                  },
                  state: {
                    type: 'string'
                  },
                  countryId: {
                    type: 'number'
                  },
                  country: {
                    type: 'string'
                  },
                  landmark: {
                    type: 'string'
                  },
                  pincode: {
                    type: 'string'
                  },
                  city: {
                    type: 'string'
                  }
                }
              },
              guardianAddress: {
                type: 'object',
                properties: {
                  guardianAddressId: {
                    type: 'number'
                  },
                  addressLine1: {
                    type: 'string'
                  },
                  addressLine2: {
                    type: 'string'
                  },
                  stateId: {
                    type: 'number'
                  },
                  state: {
                    type: 'string'
                  },
                  countryId: {
                    type: 'number'
                  },
                  country: {
                    type: 'string'
                  },
                  landmark: {
                    type: 'string'
                  },
                  pincode: {
                    type: 'string'
                  },
                  city: {
                    type: 'string'
                  }
                }
              },
              nomineeId: {
                type: 'number'
              },
              name: {
                type: 'string'
              },
              nomineeAppUserId: {
                type: 'number'
              },
              relationshipName: {
                type: 'string'
              },
              relationshipId: {
                type: 'number'
              },
              percentage: {
                type: 'number'
              },
              dateOfBirth: {
                type: 'string'
              },
              guardianRelationship: {
                type: 'number'
              },
              guardianName: {
                type: 'string'
              },
              isMfNominee: {
                type: 'boolean'
              },
              guardianPanCardNumber: {
                type: 'string'
              }
            }
          },
          example: `[
              {
                address: {
                  addressId: 130525,
                  addressLine1: 'ABCDefgh',
                  addressLine2: 'IJKL',
                  landmark: '',
                  pincode: '',
                  city: '',
                  state: 'Arunachal Pradesh',
                  stateId: 3,
                  country: '',
                  countryId: null
                },
                guardianAddress: {
                  guardianAddressId: 130525,
                  addressLine1: 'ABCDefgh',
                  addressLine2: 'IJKL',
                  landmark: '',
                  pincode: '',
                  city: '',
                  state: 'Arunachal Pradesh',
                  stateId: 3,
                  country: '',
                  countryId: null
                }
                nomineeId: 498,
                name: 'shefali',
                nomineeAppUserId: 451,
                relationshipName: 'Father',
                relationshipId: 2,
                percentage: null,
                dateOfBirth  : null,
                guardianRelationship: 3,
                guardianName:'lucky',
                isMfNominee: true,
                guardianPanCardNumber: 'ABCDE1234A'
              }
            ]`
        }
      }
    },
    param
  })
  async fetchNomineeDetailsById(
    @param.path.number('id') accountId: number,
    @param.query.boolean('isOnboardedNominee') isOnboardedNominee: boolean
  ): Promise<object> {
    PathParamsValidations.idValidations(accountId);
    return this.accountFacade.fetchNomineeByAccountIdNew(accountId, isOnboardedNominee, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}/{nomineeAppUserId}/updateNomineeDetails`)
  @response(200, {
    description: 'nominee details update success',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            }
          }
        }
      }
    }
  })
  async updateNomineeDetailsById(
    @param.path.number('id') id: number,
    @param.path.number('nomineeAppUserId') nomineeAppUserId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nomineePercentage', 'relationshipId', 'dateOfBirth'],
            properties: {
              nomineeAddress: {
                type: 'object',
                required: ['stateId', 'addressLine1', 'pincode', 'city'],
                properties: {
                  stateId: {
                    type: 'number',
                    minimum: 1,
                    maximum: 1000
                  },
                  addressLine1: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 200
                  },
                  addressLine2: {
                    type: 'string',
                    maxLength: 120
                  },
                  addressLine3: {
                    type: 'string',
                    maxLength: 120
                  },

                  pincode: {
                    type: 'string',
                    pattern: '[0-9]',
                    minLength: 1,
                    maxLength: 6
                  },
                  city: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
                  }
                }
              },
              guardianAddress: {
                type: 'object',
                required: ['stateId', 'addressLine1', 'pincode', 'city'],
                properties: {
                  stateId: {
                    type: 'number',
                    minimum: 1,
                    maximum: 1000
                  },
                  addressLine1: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 200
                  },
                  addressLine2: {
                    type: 'string',
                    maxLength: 120
                  },
                  addressLine3: {
                    type: 'string',
                    maxLength: 120
                  },

                  pincode: {
                    type: 'string',
                    pattern: '[0-9]',
                    minLength: 1,
                    maxLength: 6
                  },
                  city: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
                  }
                }
              },
              id: {
                type: 'number',
                minimum: 1,
                maximum: 2147483647
              },
              name: {
                type: 'string',
                minLength: 1,
                maxLength: 100
              },
              nomineePercentage: {
                type: 'number',
                minimum: 1,
                maximum: 100
              },
              relationshipId: {
                type: 'number',
                minimum: 1
              },
              dateOfBirth: {
                type: 'string',
                pattern: '^\\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])$'
              },
              guardianName: {
                type: 'string',
                minLength: 1,
                maxLength: 100
              },
              guardianRelationship: {
                type: 'number',
                minimum: 1
              },
              guardianPanCardNumber: {
                type: 'string',
                pattern: '([A-Z]){5}([0-9]){4}([A-Z]){1}$'
              },
              investorTypeId: {
                type: 'number'
              }
            },
            example: `{
              "nomineeAddress":{
                 "stateId":2,
                 "addressLine1":"ABCD",
                 "addressLine2":"G",
                 "addressLine3":"H",
                 "landmark":"abc",
                 "pincode":"507301",
                 "district":"khammam",
                 "city":"Mumbai"
              },
              "guardianAddress":{
                 "stateId":2,
                 "addressLine1":"ABCD",
                 "addressLine2":"P",
                 "addressLine3":"Q",
                 "landmark":"xyz",
                 "pincode":"507301",
                 "district":"khammam",
                 "city":"Mumbai"
              },
              "id":2,
              "name":"A",
              "relationshipId":1,
              "nomineePercentage":10,
              "dateOfBirth":"1993-04-03",
              "guardianName":"Amit",
              "guardianRelationship":1,
              "guardianPanCardNumber":"AZLPN4486H",
              "investorTypeId": 2
           }`
          }
        }
      }
    })
    nomineeDetails: InvestorNominee
  ): Promise<Object> {
    PathParamsValidations.idValidations(id);
    PathParamsValidations.idValidations(nomineeAppUserId);
    return this.accountFacade.updateNomineeDetailsById(id, nomineeAppUserId, nomineeDetails);
  }

  @get(`/${API_PREFIX}/{id}/fetchBankDetails`)
  @response(200, {
    description: 'For fetching bank details of account',
    content: {
      'application/json': {
        schema: {
          type: 'array'
        }
      }
    },
    param
  })
  async getBankDetailsById(@param.path.number('id') accountId: number): Promise<object> {
    PathParamsValidations.idValidations(accountId);
    return this.accountFacade.getBankDetailsById(accountId, this.additionalHeaders);
  }

  @get(`${API_PREFIX}/{accountId}/fetchBankBalance`)
  @response(204, {
    description: 'For fetching bank balance of account',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {bankBalance: 107187156, bankAccountNo: '1234567'}
        }
      }
    },
    param
  })
  async getBankBalanceByAccountNo(@param.path.number('accountId') accountId: number): Promise<object> {
    return this.accountFacade.getBankBalanceByAccountId(accountId, this.userProfile.TrxId, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}/fetchNominees`)
  @response(200, {
    description: 'For fetching nominees based on account, bank account and service provider account',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          example: `[{
            name: 'Am',
            relationshipName: 'Mother',
            nomineePercentage: 10,
            dateOfBirth: '1992-01-23'
          }]`
        }
      }
    },
    param
  })
  async getNomineesById(@param.path.number('id') accountId: number): Promise<object> {
    PathParamsValidations.idValidations(accountId);
    return this.accountFacade.getNomineesById(accountId, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}/fetchBankAccounts`)
  @response(200, {
    description: 'For fetching bank accounts based on account',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          example: `{
            accountNumber: '000000000',
            accountType: 'Saving Bank',
            accountName: 'A',
            branchName: 'AI',
            holdingPattern: 'Single',
            holdingPatternId: 1,
            isDefault: true,
            isActive: true
          }`
        }
      }
    },
    param
  })
  async getBankAccountsById(@param.path.number('id') accountId: number): Promise<object> {
    PathParamsValidations.idValidations(accountId);
    return this.accountFacade.getBankAccountsByAccountId(accountId, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}/fetchFolioByAccountId`)
  @response(200, {
    description: 'For fetching bank accounts based on account',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceProviderAccountNumber: {type: 'string'},
              serviceProviderAccountId: {type: 'number'},
              existingInvestment: {type: 'number'}
            }
          }
        }
      }
    }
  })
  async fetchFolioByAccountId(
    @param.path.number('id') accountId: number,
    @param.query.number('instrumentId') instrumentId: number
  ): Promise<any> {
    PathParamsValidations.idValidations(accountId);
    PathParamsValidations.idValidations(instrumentId);
    return this.accountFacade.fetchFolioByAccountId(accountId, instrumentId, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}/updateRiskProfileByAccountId`)
  @response(200, {
    description: 'For fetching bank accounts based on account',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account, {includeRelations: false})
      }
    }
  })
  async updateRiskProfileByAccountId(
    @param.path.number('id') accountId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['riskProfileId'],
            properties: {
              riskProfileId: {
                type: 'number',
                minimum: 1
              }
            }
          }
        }
      }
    })
    details: any
  ): Promise<Account> {
    PathParamsValidations.idValidations(accountId);
    return this.accountFacade.updateRiskProfileByAccountId(accountId, details.riskProfileId, this.additionalHeaders);
  }
  @post(`${API_PREFIX}/{id}/skippedNominee`)
  @response(204, {
    description: 'skipe nominee',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            }
          }
        }
      }
    }
  })
  async updateSkippedNomineeFlag(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['skippedNominee'],
            properties: {
              skippedNominee: {
                type: 'boolean'
              }
            }
          }
        }
      }
    })
    skipNomineeRequest: skippedNomineeType
  ): Promise<any> {
    PathParamsValidations.idValidations(id);
    return this.accountFacade.updateSkippedNomineeById(id, skipNomineeRequest, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}/dataRefreshByAccountId`)
  @response(204, {
    description: 'Data Refresher by Account ID',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            }
          }
        }
      }
    }
  })
  async dataRefreshByAccountId(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id);
    return this.accountFacade.dataRefreshByAccountId(id);
  }

  @get(`/${API_PREFIX}/{id}/fatcaGenerationByAccountId`)
  @response(204, {
    description: 'Fatca Generation by Account ID',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            }
          }
        }
      }
    }
  })
  async fatcaGenerationByAccountId(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id);
    return this.accountFacade.fatcaGenerationByAccountId(id);
  }

  @get(`/${API_PREFIX}/exportInvestorMaster/{exportFormat}`)
  @response(200, {
    description: 'Export Investor Master in XLSX format',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async exportInvestorMaster(
    @param.path.string('exportFormat') exportFormat: string,
    @param.query.object('queryParameters', {
      type: 'object',
      example: {
        order: 'id ASC',
        where: [{primaryHolderName: 'string'}, {secondaryHolderName: 'string'}],
        export: true
      }
    })
    filterObject: object
  ): Promise<Account[]> {
    return this.accountFacade.exportInvestorMaster(filterObject, exportFormat, this.res, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}/orderItemsRepotingReplicatorByAccountId`)
  @response(204, {
    description: 'Execute orderitems reporting replicatin for passed account id',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            }
          }
        }
      }
    }
  })
  async orderItemsRepotingReplicatorByAccountId(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id);
    return this.accountFacade.orderItemsRepotingReplicatorByAccountId(id);
  }

  //API to fetch mobile & email from RTA
  @post(`/${API_PREFIX}/{id}/fetchMobileEmailRta`)
  @response(200, {
    description: 'fetch mobile & email from RTA',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'OTP sent to user!'
          }
        }
      }
    }
  })
  async fetchMobileEmailRta(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['serviceProviderAccountID', 'refreshFlag'],
            properties: {
              serviceProviderAccountID: {
                type: 'number',
                minimum: 1
              },
              refreshFlag: {
                type: 'boolean'
              }
            }
          }
        }
      }
    })
    fetchRta: {serviceProviderAccountID: number; refreshFlag: boolean},
    @param.path.number('id') id: number
  ): Promise<object | undefined> {
    PathParamsValidations.idValidations(id);
    return await this.appUserFacade.fetchRta(fetchRta, id, this.userProfile.TrxId, this.additionalHeaders);
  }

  //API to generateZipForDocuments RTA
  @post(`/${API_PREFIX}/generateZipForDocuments`)
  @response(200, {
    description: 'Generate Documents for RTA',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Generated the documents!'
          }
        }
      }
    }
  })
  async generateZipForDocuments(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              accountIDs: {
                type: 'array',
                items: {
                  type: 'number'
                }
              },
              rtaId: {
                type: 'number'
              }
            },
            required: ['accountIDs', 'rtaId']
          }
        }
      }
    })
    generatedDocuments: {
      accountIDs: Array<number>;
      rtaId: number;
    }
  ): Promise<object> {
    return await this.accountFacade.generateZipForDocuments(
      generatedDocuments.accountIDs,
      generatedDocuments.rtaId,
      this.additionalHeaders
    );
  }

  //Investor Master details API for HDFC Delta Portal
  @get(`/${API_PREFIX}/investorMaster`)
  @response(200, {
    description: 'Array of Account model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Account, {includeRelations: false})
        }
      }
    }
  })
  async investorMasterDetails(
    @param.query.object('queryParameters', {
      type: 'object',
      example: {
        limit: 10,
        offset: 0,
        order: 'id ASC',
        where: [{primaryHolderName: 'string'}, {secondaryHolderName: 'string'}]
      }
    })
    filterObject: object
  ): Promise<Account[]> {
    return this.accountFacade.investorMasterDetails(filterObject, this.additionalHeaders);
  }
}
