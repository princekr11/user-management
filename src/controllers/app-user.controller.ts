import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  createHasManyThroughRepositoryFactory,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, Request, requestBody, response, RestBindings,Response} from '@loopback/rest';
import {AppUser, LogApiCallUtils,AdobeNtbUser, Option} from 'common';
import {AppUserFacade, FamilyMappingFacade,AdobNtbFacade} from '../facades';
import {ContactDetails, PANAndDOBDetails, VerifyOtpContactDetails} from '../facades';
import {authorize} from '@loopback/authorization';
import { PathParamsValidations } from 'common';
const API_PREFIX = AppUser.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories

@authorize({})
export class AppUserController {
  constructor(
    @service(AppUserFacade) public appUserFacade: AppUserFacade,
    @service(AdobNtbFacade) public adobNtbFacade: AdobNtbFacade,
    @inject('userProfile') private userProfile: any,
    @inject('additionalHeaders') private additionalHeaders: any,
    @inject(RestBindings.Http.RESPONSE) public response: Response,
    @service(FamilyMappingFacade) public familyMappingFacade: FamilyMappingFacade,
    @inject(RestBindings.Http.RESPONSE) private res: Response
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppUser model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppUser)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppUser, {
            title: 'New AppUser',
            exclude: ['id']
          })
        }
      }
    })
    appUser: Omit<AppUser, 'id'>
  ): Promise<AppUser> {
    return this.appUserFacade.create(appUser);
  }

  @post(`/${API_PREFIX}/adobeAnalyticsSA`)
  @response(200, {
    description: 'AppUser model instance',
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
  async adobeAnalyticsSA(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AdobeNtbUser, {
            title: 'Adobe ntb',
            exclude: ['id','appUserId','isActive','createdDate','lastModifiedDate','additionalProp1']
          })
        }
      }
    })
    adobeNtbUser: Omit<AdobeNtbUser, 'id'>
  ): Promise<any> {
    return this.adobNtbFacade.create(adobeNtbUser);
  }
  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AppUser model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AppUser) where?: Where<AppUser>): Promise<Count> {
    return this.appUserFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AppUser model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AppUser, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AppUser) filter?: Filter<AppUser>): Promise<AppUser[]> {
    return this.appUserFacade.find(filter);
  }

  @get(`/${API_PREFIX}/fetchAppUsers`)
  @response(200, {
    description: 'Array of AppUser model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AppUser, {includeRelations: false})
        }
      }
    }
  })
  async fetchAppUsers(@param.filter(AppUser) filter?: Filter<AppUser>): Promise<AppUser[]> {
    return this.appUserFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppUser PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppUser, {partial: true})
        }
      }
    })
    appUser: AppUser,
    @param.where(AppUser) where?: Where<AppUser>
  ): Promise<Count> {
    return this.appUserFacade.updateAll(appUser, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AppUser model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AppUser, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AppUser, {exclude: 'where'}) filter?: FilterExcludingWhere<AppUser>
  ): Promise<AppUser> {
    return this.appUserFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppUser PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppUser, {partial: true})
        }
      }
    })
    appUser: AppUser
  ): Promise<void> {
    await this.appUserFacade.updateById(id, appUser);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppUser PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() appUser: AppUser): Promise<void> {
    await this.appUserFacade.replaceById(id, appUser);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppUser DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.appUserFacade.deleteById(id);
  }

  @get(`/${API_PREFIX}/fetchUserDetailsByToken`)
  @response(200, {
    description: 'For fetching user details for a user',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AppUser, {includeRelations: true})
      }
    },
    param
  })
  async fetchUserDetailsByToken(@inject(RestBindings.Http.REQUEST) request: Request): Promise<object> {
    // @ts-ignore:
    return this.appUserFacade.fetchUserDetailsByToken(request.headers['Authorization'] || request.headers['authorization']);
  }

  @post(`/${API_PREFIX}/{id}/logout`)
  @response(200, {
    description: 'For logging out a user',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        },
        example: {
          success: true
        }
      }
    },
    param
  })
  async logout(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['deviceUniqueId'],
            properties: {
              deviceUniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}'
              }
            },
            example: {
              deviceUniqueId: 'afsdfasfgasfsafaqfasf'
            }
          }
        }
      }
    })
    crendentials: any,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    // @ts-ignore:
    return this.appUserFacade.logout(id, crendentials.deviceUniqueId, request.headers['Authorization'] || request.headers['authorization'], request, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/loginWithMpin`)
  @response(200, {
    description: 'login function for an existing user using device id and mpin',
    content: {
      'application/json': {
        schema: {
          example: {
            appAccessToken: 'dfggrwfasfgegwarsgfasgvaeg'
          }
        }
      }
    }
  })
  async loginWithMpin(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['deviceUniqueId', 'mpin'],
            properties: {
              deviceUniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}'
              },
              mpin: {
                type: 'string',
                pattern : '^\\d{4}$',
                minLength:0,
                maxLength:4
              }
            }
          },
          example: {
            deviceUniqueId: 'afsdfasfgasfsafaqfasf',
            mpin: '1234'
          }
        }
      }
    })
    crendentials: any,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<Record<string, string>> {
    return this.appUserFacade.loginWithMpin(crendentials.deviceUniqueId, crendentials.mpin, request, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/loginWithBiometric`)
  @response(200, {
    description: 'login function for an existing user using device id and mpin',
    content: {
      'application/json': {
        schema: {
          example: {
            appAccessToken: 'dfggrwfasfgegwarsgfasgvaeg'
          }
        }
      }
    }
  })
  async loginWithBiometric(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['deviceUniqueId', 'biometricToken'],
            properties: {
              deviceUniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}'

              },
              biometricSignature: {
                type: 'string'
              }
            }
          },
          example: {
            deviceUniqueId: 'afsdfasfgasfsafaqfasf',
            biometricSignature: '0bd623cf76bf35d1c709043ceef80032'
          }
        }
      }
    })
    crendentials: any,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<Record<string, string>> {
    return this.appUserFacade.loginWithBiometric(crendentials.deviceUniqueId, crendentials.biometricSignature, request, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/loginWithPassword`)
  @response(200, {
    description: 'login function for an existing user using user id and password',
    content: {
      'application/json': {
        schema: {
          example: {
            appAccessToken: 'dfggrwfasfgegwarsgfasgvaeg'
          }
        }
      }
    }
  })
  async loginWithPassword(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userCode', 'password'],
            properties: {
              userCode: {
                type: 'string',
                minLength:0,
                maxLength:50
              },
              password: {
                type: 'string',
                minLength:0,
                maxLength:255
              }
            }
          },
          example: {
            userCode: 'jack12',
            password: '1234'
          }
        }
      }
    })
    crendentials: any,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<Record<string, string>> {
    return this.appUserFacade.loginWithPassword(crendentials.userCode, crendentials.password, request, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/loginWithPasswordMock`)
  @response(200, {
    description: 'login function for an existing user using user id and password',
    content: {
      'application/json': {
        schema: {
          example: {
            appAccessToken: 'dfggrwfasfgegwarsgfasgvaeg'
          }
        }
      }
    }
  })
  async loginWithPasswordMock(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userCode', 'password'],
            properties: {
              userCode: {
                type: 'string',
                minLength:0,
                maxLength:50
              },
              password: {
                type: 'string',
                minLength:0,
                maxLength:255
              }
            }
          },
          example: {
            userCode: 'jack12',
            password: '1234'
          }
        }
      }
    })
    crendentials: any,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<Record<string, string>> {
    return this.appUserFacade.loginWithPasswordMock2(crendentials.userCode, crendentials.password);
  }

  @get(`/${API_PREFIX}/{id}/fetchPersonalDetails`)
  @response(200, {
    description: 'For fetching personal details of user',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: `{
            data: {
              name: 'string',
              gender: '',
              genderLabel: '',
              email: 'string',
              contactNumber: '0123456789',
              contactNumberCountryCode: '+91',
              PAN: 'fghfh',
              nationality: '',
              nationalityId: null,
              dateOfBirth: null,
              birthCity: '',
              birthState: '',
              birthStateId: null,
              fatherName: '',
              motherName: '',
              spouseName: '',
              maritalStatus: null,
              maritalStatusLabel: '',
              identificationType: '',
              identificationTypeId: null
            },
            metaData: {
              accountOpening: {
                name: 'string',
                gender: '',
                email: 'string',
                contactNumber: '0123456789',
                PAN: 'fghfh',
                nationality: '',
                dateOfBirth: null,
                birthCity: '',
                fatherName: '',
                motherName: '',
                spouseName: '',
                maritalStatus: '',
                birthState: ''
              },
              mfKYC: {
                name: 'string',
                gender: '',
                email: 'string',
                contactNumber: '0123456789',
                PAN: 'fghfh',
                nationality: '',
                dateOfBirth: null,
                fatherName: '',
                maritalStatus: ''
              },
              mfRTA: {
                name: 'string',
                email: 'string',
                contactNumber: '0123456789',
                PAN: 'fghfh',
                nationality: '',
                dateOfBirth: null,
                maritalStatus: '',
                birthCity: '',
                identificationType: '',
                birthState: ''
              }
            }
          }`
        }
      }
    },
    param
  })
  async getPersonalDetailsById(@param.path.number('id') userId: number): Promise<object> {
    PathParamsValidations.idValidations(userId)
    return this.appUserFacade.getPersonalDetailsById(userId);
  }

  //review User Details
  // this api is consolidation of fetchAddress,fetchPersonal,fetchProfessionalDetails
  @get(`/${API_PREFIX}/{id}/reviewUserDetails`)
  @response(200, {
    description: 'For fetching user details for review',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    },
    param
  })
  async reviewUserDetails(@param.path.number('id') userId: number): Promise<object> {
    PathParamsValidations.idValidations(userId)
    return this.appUserFacade.reviewUserDetails(userId,false, this.additionalHeaders);
  }
  @put(`/${API_PREFIX}/{id}/updatePersonalDetails`)
  @response(200, {
    description: 'User personal details PUT success',
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
  async updatePersonalDetailsById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['name','gender','email','contactNumber','contactNumberCountryCode','PAN','birthState','nationality','fatherName','mothersName','maritalStatus','identificationType'],
            properties: {
              name: {
                type: 'string',
                pattern: '^[A-Za-z\\s]{1,}[\\.]{0,1}[A-Za-z\\s]{0,}$',
                minLength:1,
                maxLength:255
              },
              gender: {
                type: 'string',
                minLength:0,
                maxLength:6
              },
              email: {
                type: 'string',
                pattern:'^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$'
              },
              contactNumber: {
                type: 'string',
                pattern:'^\\d{7,12}$'

              },
              contactNumberCountryCode: {
                type: 'string',
                pattern:'^(\\+?\\d{1,3}|\\d{1,4})$'
              },
              PAN: {
                type: 'string',
                pattern:'([A-Z]){5}([0-9]){4}([A-Z]){1}$'
              },
              birthState: {
                type: 'string',
                minLength:0,
                maxLength:10
              },
              nationality: {
                type: 'string',
                minLength:0,
                maxLength:10
              },
              fatherName: {
                type: 'string',
                pattern: '^[A-Za-z\\s]{1,}[\\.]{0,1}[A-Za-z\\s]{0,}$',
                minLength:1,
                maxLength:255
              },
              mothersName: {
                type: 'string',
                pattern: '^[A-Za-z\\s]{1,}[\\.]{0,1}[A-Za-z\\s]{0,}$',
                minLength:1,
                maxLength:255
              },
              spouseName: {
                type: 'string',
                pattern: '^[A-Za-z\\s]{1,}[\\.]{0,1}[A-Za-z\\s]{0,}$',
                maxLength:100
              },
              maritalStatus: {
                type: 'string',
                minLength:1,
                maxLength:2
              },
              identificationType: {
                type: 'string',
                minLength:1,
                maxLength:2
              }
            },
            example: `{
              name: 'abc',
              gender: 2,
              email: 'abc@me.com',
              contactNumber: '0123456789',
              contactNumberCountryCode: '+91',
              PAN: 'nbbm',
              birthState: 2,
              dateOfBirth: '1991-12-03',
              birthCity: 'Jaipur',
              nationality: 1,
              fatherName: '',
              mothersName: '',
              spouseName: '',
              maritalStatus: 2,
              identificationType: 2
            }`
          }
        }
      }
    })
    personalDetails: AppUser
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.updatePersonalDetailsById(id, personalDetails);
  }

  @get(`/${API_PREFIX}/{id}/fetchAddressDetails`)
  @response(200, {
    description: 'For fetching Address details of user',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: `{
            data: {
              correspondenceAddress: {
                addressLine1: '',
                addressLine2: '',
                city: '',
                pincode: '',
                landmark: '',
                state: '',
                stateId: null,
                addressType: '',
                addressTypeId: null,
                country: '',
                countryId: null,
                proofOfAddress: ''
              },
              permanentAddress: {
                addressLine1: '',
                addressLine2: '',
                city: '',
                pincode: '',
                landmark: '',
                state: '',
                stateId: null,
                addressType: '',
                addressTypeId: null,
                country: '',
                countryId: null,
                proofOfAddress: ''
              },
              overseesAddress: {
                addressLine1: '',
                addressLine2: '',
                city: '',
                pincode: '',
                landmark: '',
                stateId: '',
                state: null,
                addressType: '',
                addressTypeId: null,
                country: '',
                countryId: null
              }
            },
            metaData: {
              correspondenceAddress: {
                accountOpening: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: '',
                  landmark: '',
                  state: ''
                },
                mfKYC: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: '',
                  landmark: '',
                  state: '',
                  addressType: '',
                  country: '',
                  proofOfAddress: ''
                },
                mfRTA: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: '',
                  landmark: '',
                  state: '',
                  country: ''
                }
              },
              permanentAddress: {
                accountOpening: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: '',
                  landmark: ''
                },
                mfKYC: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: '',
                  landmark: '',
                  state: '',
                  addressType: '',
                  country: '',
                  proofOfAddress: ''
                },
                mfRTA: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: ''
                }
              },
              overseesAddress: {
                accountOpening: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: ''
                },
                mfKYC: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: ''
                },
                mfRTA: {
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  pincode: '',
                  landmark: '',
                  state: '',
                  country: ''
                }
              }
            }
          }`
        }
      }
    }
  })
  async getAddressDetailsById(@param.path.number('id') userId: number): Promise<object> {
    PathParamsValidations.idValidations(userId)
    return this.appUserFacade.getAddressDetailsById(userId);
  }

  @get(`/${API_PREFIX}/{id}/fetchCorrespondenceAddressDetails`)
  @response(200, {
    description: 'For fetching Address details of user',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: ` correspondenceAddress: {
            "addressLine1": "line11",
            "addressLine2": "line21",
            "addressLine3": "line31",
            "pincode": "930199",
            "landmark": "SOC SEC",
            "state": "Andhra Pradesh",
            "stateId": 2,
            "addressType": "Residential",
            "addressTypeId": 2,
            "country": "India",
            "countryId": 106
          }`
        }
      }
    }
  })
  async fetchCorrespondenceAddressDetails(@param.path.number('id') userId: number): Promise<object> {
    PathParamsValidations.idValidations(userId)
    return this.appUserFacade.fetchCorrespondenceAddressDetails(userId, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}/fetchProfessionalDetails`)
  @response(200, {
    description: 'For fetching professional details of user',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: ` {
            data: {
              employerName: 'A',
              employerCategory: '',
              occupationId: 5,
              occupation: 'Retired',
              sourceOfFunds: 'Rental Income',
              sourceOfFundsId: 5,
              grossAnnualIncome: '> 25 Lacs < = 1 Crore',
              grossAnnualIncomeId: 5,
              politicalExposure: 'Yes',
              grossMonthlyIncome: '> 25 Lacs < = 1 Crore',
              grossMonthlyIncomeId: 5,
              countryOfTaxResidency: 'Andorra',
              countryOfTaxResidencyId: 1,
              taxIdentificationNumber: '',
              taxStatus: 'AOP/BOI',
              taxStatusId: 5,
              countryId:106,
              country:'India',
              birthCity:'Mumbai',
              fatherName:'Jackson',
              motherName: 'Olivia',
              spouseName: 'Natasha',
              maritalStatus:'Single',
              addressTypeId:'Resiidential',
              taxResident:'No'
            },
            metaData: {
              accountOpening: {
                employerName: 'A',
                employerCategory: '',
                occupation: 'Retired',
                sourceOfFunds: 'Rental Income',
                grossAnnualIncome: '> 25 Lacs < = 1 Crore',
                grossMonthlyIncome: '> 25 Lacs < = 1 Crore',
                countryOfTaxResidency: 'Andorra',
                taxStatus: 'AOP/BOI'
              },
              mfRTA: {
                occupation: 'Retired',
                sourceOfFunds: 'Rental Income',
                grossAnnualIncome: '> 25 Lacs < = 1 Crore',
                countryOfTaxResidency: 'Andorra',
                taxIdentificationNumber: '',
                taxStatus: 'AOP/BOI'
              }
            }
          }`
        }
      }
    },
    param
  })
  async getProfessionalDetailsById(@param.path.number('id') userId: number): Promise<object> {
    PathParamsValidations.idValidations(userId)
    return this.appUserFacade.getProfessionalDetailsById(userId, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}/updateProfessionalDetails`)
  @response(200, {
    description: 'User personal details PUT success',
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
  async updateProfessionalDetailsById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['occupation','sourceOfFunds','grossAnnualIncome','politicalExposure','country','birthCity','fatherName','maritalStatus','addressTypeId','taxResident'],
            properties: {
              employerName: {
                type: 'string',
                pattern: '^[A-Za-z\\s]{1,}[\\.]{0,1}[A-Za-z\\s]{0,}$',
                minLength:1,
                maxLength:255
              },
              employerCategory: {
                type: 'string',
                minLength:1,
                maxLength:100
              },
              occupation: {
                type: 'number',
                minimum:1,
                maximum:1000,
              },
              sourceOfFunds: {
                type: 'number',
                minimum:1,
                maximum:1000
              },
              grossAnnualIncome: {
                type: 'number',
                minimum:1,
                maximum:100
              },
              politicalExposure: {
                type: 'string'
              },
              grossMonthlyIncome: {
                type: 'number',
                minimum:1
              },
              countryOfTaxResidency: {
                type: 'number',
                minimum:1,
                maximum:1000
              },
              taxStatus: {
                type: 'number',
                minimum:1
              },
              country: {
                type: 'number',
                minimum:1,
                maximum:1000
              },
              birthCity:{
                type:'string',
                minLength:3,
                maxLength:100
              },
              fatherName:{
                type:'string',
                minLength:3,
                maximum:100
              },
              motherName:{
                type:'string',
                minLength:3,
                maximum:100
              },
              spouseName:{
                type:'string',
                maximum:100
              },
              maritalStatus:{
                type:'number',
                minimum:1,
                maximum:100
              },
              addressTypeId:{
                type:'number',
                minimum:1,
                maximum:100
              },
              taxResident:{
                type: 'string',
                minLength : 2,
                maxLength : 3
              },
              countryOfTaxResidency2: {
                type: 'number',
                maximum:500
              },
              countryOfTaxResidency3: {
                type: 'number',
                maximum:500
              },
              countryOfTaxResidency4: {
                type: 'number',
                maximum:500
              },
              taxIdentificationNumber: {
                type : 'string',
                maximum: 100
              },
              taxIdentificationNumber2: {
                type : 'string',
                maximum: 100
              },
              taxIdentificationNumber3: {
                type : 'string',
                maximum: 100
              },
              taxIdentificationNumber4: {
                type : 'string',
                maximum: 100
              },
              identificationType: {
                type: 'number',
                minimum:1,
                maximum:100
              },
              identificationType2: {
                type: 'number',
                minimum:1,
                maximum:100
              },
              identificationType3: {
                type: 'number',
                minimum:1,
                maximum:100
              },
                identificationType4: {
                type: 'number',
                minimum:1,
                maximum:100
              }

            },
            example: `{
              employerName: 'A',
              employerCategory: 'hh',
              occupation: 5,
              sourceOfFunds: 5,
              grossAnnualIncome: 5,
              politicalExposure: 'Yes',
              grossMonthlyIncome: 5,
              countryOfTaxResidency: 1,
              countryOfTaxResidency2: 4,
              countryOfTaxResidency3: 5,
              taxStatus: 5,
              country: 106,
              birthCity:'Mumbai',
              fatherName:'Jackson',
              motherName: 'Olivia',
              spouseName: 'Natasha',
              maritalStatus:1,
              addressTypeId:10,
              taxResident:'No'
            }`
          }
        }
      }
    })
    professionalDetails: object
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.updateProfessionalDetailsById(id, professionalDetails, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}/updateAddressDetails`)
  @response(200, {
    description: 'User address details PUT success',
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
  async updateAddressDetailsById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['correspondenceAddress','permanentAddress','overseasAddress'],
            properties: {
              correspondenceAddress: {
                type: 'object',
                properties: {
                  addressLine1: {
                    type: 'string',
                    minLength:0,
                    maxLength:200
                  },
                  addressLine2: {
                    type: 'string',
                    minLength:0,
                    maxLength:1200
                  },
                  city: {
                    type: 'string',
                    minLength:0,
                    maximum:100
                  },
                  pincode: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:6
                  },
                  landmark: {
                    type: 'string',
                    minLength:0,
                    maxLength:30
                  },
                  state: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  addressType: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  country: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  proofOfAddress: {
                    type: 'string',
                    minLength:0,
                    maxLength:100,
                  }
                }
              },
              permanentAddress: {
                type: 'object',
                properties: {
                  addressLine1: {
                    type: 'string',
                    minLength:0,
                    maxLength:200
                  },
                  addressLine2: {
                    type: 'string',
                    minLength:0,
                    maxLength:120
                  },
                  city: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  pincode: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:6
                  },
                  landmark: {
                    type: 'string',
                    minLength:0,
                    maxLength:30
                  },
                  state: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  addressType: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  country: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  proofOfAddress: {
                    type: 'string',
                    minLength:0,
                    maxLength:100
                  }
                }
              },
              overseasAddress: {
                type: 'object',
                properties: {
                  addressLine1: {
                    type: 'string',
                    minLength:0,
                    maxLength:200
                  },
                  addressLine2: {
                    type: 'string',
                    minLength:0,
                    maxLength:120
                  },
                  city: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  pincode: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:6

                  },
                  landmark: {
                    type: 'string',
                    minLength:0,
                    maxLength:30
                  },
                  state: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  addressType: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:20
                  },
                  country: {
                    type: 'string',
                    pattern:'[0-9]',
                    minLength:0,
                    maxLength:10
                  },
                  proofOfAddress: {
                    type: 'string'
                  }
                }
              }
            },
            example: {
              correspondenceAddress: {
                addressLine1: 'A-2BCD',
                addressLine2: '(E)',
                city: 'Mumbai',
                pincode: '400056',
                landmark: '',
                state: 2,
                addressType: 2,
                country: 2,
                proofOfAddress: ''
              },
              permanentAddress: {
                addressLine1: 'A-2BCD',
                addressLine2: 'Go',
                city: 'Mumbai',
                pincode: '400063',
                landmark: '',
                state: 2,
                addressType: 2,
                country: 2,
                proofOfAddress: ''
              },
              overseasAddress: {
                addressLine1: 'A-2BCD',
                addressLine2: 'E',
                city: 'Mumbai',
                pincode: '400063',
                landmark: '',
                state: 2,
                addressType: 2,
                country: 2,
                proofOfAddress: ''
              }
            }
          }
        }
      }
    })
    addressDetails: object
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.updateAddressDetailsById(id, addressDetails);
  }

  @post(`/${API_PREFIX}/{id}/setupMpin`)
  @response(200, {
    description: 'AppUser model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppUser)}}
  })
  async setupMpin(
    @inject(RestBindings.Http.REQUEST) request: Request,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['mpin'],
            properties: {
              mpin: {
                type: 'string',
                pattern : '^\\d{4}$'
              }
            },
            example: `{
              mpin: '1234'
            }`
          }
        }
      }
    })
    data: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.setupMpin(id, data,request);
  }


  @post(`/${API_PREFIX}/{id}/resetMpin`)
  @response(200, {
    description: 'AppUser model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppUser)}}
  })
  async resetMpin(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['mpin'],
            properties: {
              mpin: {
                type: 'string',
                pattern : '^\\d{4}$'
              }
            },
            example: `{
              mpin: '1234'
            }`
          }
        }
      }
    })
    data: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.resetMpin(id, data);
  }


  @post(`/${API_PREFIX}/{id}/setupBiometric`)
  @response(200, {
    description: 'Sets up biometric for a device',
    content: {'application/json': {schema: getModelSchemaRef(AppUser)}}
  })
  async setupBiometric(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['deviceUniqueId'],
            properties: {
              deviceUniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}',
              },
              pubKey:{
                type:'string'
              }
            },
            example: `{
              deviceUniqueId: 'ABCD',
              'pubKey':'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8vSOTtkiMZzJjNjCKhfo5K7kNAPYs5gc2ustFHnM+dc5+7QPJYKmZ8WPyGoEH555VnEjm2is9PBnFs8WIz8Em+iGRKTbqxDbS95XEQtBgVkgJQPQSdKTXXTik/arPlRLKYq/GY7AC4vrujItx2IQ494c8FYksqpm/eCKrG70S6S5HH7W6/us+BQUvRzZtBoeQmj1iao1irarBJhLWUQDZNT+dVjf4/ry2/NC3OavFlswBPjm5sooimzYTM+DP3Btqet2odnnjrE0BjUmvqyGbWQCb2ti4sWSP5wKIGJtfP9FEyjmW7vGC6O1YTHRpNnufgIHiwxHEYO1vXjmcNEz9wIDAQAB'
            }`
          }
        }
      }
    })
    data: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.setupBiometric(id, data);
  }

  //disable biometric
  @post(`/${API_PREFIX}/{id}/disableBiometric`)
  @response(200, {
    description: 'Disable biometric on device',
    content: {'application/json': {schema: getModelSchemaRef(AppUser)}}
  })
  async disableBiometric(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['deviceUniqueId'],
            properties: {
              deviceUniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}'
              }
            },
            example: `{
              deviceUniqueId: 'ABCD'
            }`
          }
        }
      }
    })
    data: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.disableBiometric(id, data);
  }

  @post(`/${API_PREFIX}/generateOTP`)
  @response(200, {
    description: 'Generated OTP based on mobile no',
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
  async generateOTP(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['contactNumber','countryCode'],
            properties: {
              contactNumber: {
                type: 'string',
                pattern:'^\\d{7,12}$'
              },
              countryCode: {
                type: 'string',
                pattern:'^(\\+?\\d{1,3}|\\d{1,4})$'
              }
            }
          }
        }
      }
    })

    contactDetails: ContactDetails
  ): Promise<object> {
    let env = (process.env.MOCK_OTP ?? '')
    if (env.toLowerCase() === 'true') {

      return  this.appUserFacade.generateOTPMock(contactDetails,this.userProfile.TrxId,this.userProfile.ip);
    } else {
      return  this.appUserFacade.generateOTP(contactDetails,this.userProfile.TrxId,this.userProfile.ip);
    }
  }


  @post(`/${API_PREFIX}/{id}/updatePANOrDOB`)
  @response(200, {
    description: 'Upserts PAN/DOB.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Details successfully updated!'
          }
        }
      }
    }
  })
  async updatePANOrDOB(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['deviceId'],
            properties: {
              PAN: {
                type: 'string',
                pattern:'([A-Z]){5}([0-9]){4}([A-Z]){1}$'
              },
              DOB: {
                type: 'string',
                pattern: '^\\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$'
              },
              deviceId:{
                type: 'number',
                minimum:1
              }
            }
          }
        }
      }
    })
    panAndDOBDetails: PANAndDOBDetails
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    return await this.appUserFacade.updatePANOrDOB(id, panAndDOBDetails, this.userProfile, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/verifyOTP`)
  @response(200, {
    description: 'Verify OTP',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true
          }
        }
      }
    }
  })
  async verifyOTP(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['otp','contactNumber','deviceUniqueId','countryCode'],
            properties: {
              otp: {
                type: 'string',
                pattern:'[0-9]',
                minLength:0,
                maxLength:6
              },
              contactNumber: {
                type: 'string',
                pattern:'^\\d{7,12}$'

              },
              deviceUniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}'

              },
              countryCode: {
                type: 'string',
                pattern:'^(\\+?\\d{1,3}|\\d{1,4})$'

              }
            }
          }
        }
      }
    })
    contactDetails: VerifyOtpContactDetails,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<object> {
    //todo - remove the mock part. only in place as bank otp is not working

    let env = (process.env.MOCK_OTP ?? '')
    if (env.toLowerCase() === 'true') {

      return this.appUserFacade.verifyOTPMock(contactDetails, request, this.userProfile.TrxId);
    } else {
      return this.appUserFacade.verifyOTP(contactDetails, request, this.userProfile.TrxId);
    }

  }

  @get(`/${API_PREFIX}/checkIfExistingWealthfyCustomer`)
  @response(200, {
    description: 'Check if wealthfy customer exists',
    content: {
      'application/json': {
        schema: {
          type: 'boolean'
        }
      }
    }
  })
  async checkIfExistingWealthfyCustomer(@param.query.string('customerId') customerId: string): Promise<boolean> {
    return this.appUserFacade.checkIfExistingWealthfyCustomer(customerId,this.userProfile.TrxId);
  }

  @post(`${API_PREFIX}/handleIdcomCallback`)
  @response(200, {
    description: 'Request of getIdToken',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          title: 'getAuthCode response body',
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
  async handleIdcomCallback(
    @param.query.string('authcode') authCode: string,
    @param.query.boolean('success') success: boolean,
    @param.query.number('errorCode ') errorCode: number,
    @param.query.string('errorMessage ') errorMessage: string
  ): Promise<any> {
    const {logParams} = this.additionalHeaders;
    const response = await this.appUserFacade.handleIdcomCallback(authCode, success, this.userProfile, this.additionalHeaders, errorCode, errorMessage);
    LogApiCallUtils.sendMessageIncomingApiCall({
      url: logParams.url,
      request: logParams.query,
      response: response ,
      success: response.success ?? false,
      externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM,
    })
    return response;
  }

  @post(`${API_PREFIX}/handleEkycCallback`)
  @response(200, {
    description: 'Handle Ekyc Callback',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async handleEkycCallback(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              errDescription: {type: 'string'},
              sessId: {type: 'string'},
              ekycCompleted: {type: 'boolean'},
              ekycMessage: {type: 'string', nullable: true}
            }
          }
        }
      }
    })
    data: {
      errDescription: string;
      sessId: string;
      ekycCompleted: string;
      ekycMessage: string | null;
    }
  ): Promise<any> {
    const {logParams} = this.additionalHeaders;
    const response = await  this.appUserFacade.handleEkycCallback(data);
    LogApiCallUtils.sendMessageIncomingApiCall({
      url: logParams.url,
      request: data,
      response: response ,
      success: response.status,
      externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.EKYC,
    })
    return response;
  }
  @post(`/${API_PREFIX}/{id}/pollCallBackStatus`)
  @response(200, {
    description: 'For fetching Address details of user',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async pollCallBackStatus(@param.path.number('id') userId: number,
  @requestBody({
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required:['authCode'],
          properties: {
            authCode: {
              type: 'string',
              minLength:0
            }
          }
        }
      }
    }
  })
  idcomProps: any): Promise<object> {
    PathParamsValidations.idValidations(userId)
    return this.appUserFacade.getCallBackStatus(userId, idcomProps.authCode, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/{id}/{deviceId}/updateContactDetails`)
  @response(200, {
    description: 'Update contact details',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Details successfully updated!'
          }
        }
      }
    }
  })
  async updateContactDetails(
    @param.path.number('id') id: number,
    @param.path.number('deviceId') deviceId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['PAN','email'],
            properties: {
              PAN: {
                type: 'string',
                pattern:'([A-Z]){5}([0-9]){4}([A-Z]){1}$'
              },
              email: {
                type: 'string',
                pattern:'^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$'
              }
            }
          }
        }
      }
    })
    contactInfo: any
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    PathParamsValidations.idValidations(deviceId)
    return await this.appUserFacade.updateContactDetails(id, deviceId, contactInfo.email, contactInfo.PAN);
  }

  @post(`/${API_PREFIX}/{id}/sendRequestforFamilyAddition`)
  @response(200, {
    description: 'Generate request to add a member by member userCode',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Family mapping created. Ask member to authenticate on the app.',
            familyItem: {
              id: 20,
              isActive: true,
              createdDate: '2022-04-15T07:15:27.533Z',
              lastModifiedDate: '2022-04-15T07:15:27.533Z',
              name: 'Sharad Singh - 9999999999',
              familyRequestStatus: 1,
              numberOfRejects: 0,
              parentId: 61,
              childId: 9
            },
            parentDetails: {
              id: 61,
              name: 'Sharad Singh',
              userCode: 'INV13124'
            }
          }
        }
      }
    }
  })
  async sendRequestforFamilyAddition(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['userCode'],
            properties: {
              userCode: {
                type: 'string',
                pattern: '^\\d{4,15}$'
              }
            }
          }
        }
      }
    })
    memberDetails: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.sendRequestforFamilyAddition(id, memberDetails);
  }

  @post(`/${API_PREFIX}/{id}/approveRejectFamilyRequest`)
  @response(200, {
    description: 'Approve or reject a family addition request',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Family addition request is successfully approved.'
          }
        }
      }
    }
  })
  async approveRejectFamilyRequest(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['parentId','isApproved'],
            properties: {
              parentId: {
                type: 'number',
                minimum:1,
              },
              isApproved: {
                type: 'boolean'
              }
            }
          }
        }
      }
    })
    parentDetails: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.approveRejectFamilyRequest(id, parentDetails);
  }

  @get(`/${API_PREFIX}/{id}/getParents`)
  @response(200, {
    description: 'Get the list of parents',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            parents: [
              {
                id: 14,
                isActive: true,
                createdDate: '2022-04-14T12:35:00.218Z',
                lastModifiedDate: '2022-04-15T07:07:31.842Z',
                name: 'Sharad Singh - Pranav Date',
                familyRequestStatus: 2,
                numberOfRejects: 1,
                lastRejectDate: '2022-04-12T12:48:02.866Z',
                parentId: 61,
                childId: 3,
                familyRequestStatusLabel: 'Approved',
                parentAppUser: {
                  id: 61,
                  name: 'Sharad Singh'
                }
              }
            ]
          }
        }
      }
    }
  })
  async getParents(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.getParents(id);
  }

  @get(`/${API_PREFIX}/{id}/getChildren`)
  @response(200, {
    description: 'Get the list of children',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            families: [
              {
                id: 14,
                isActive: true,
                createdDate: '2022-04-14T12:35:00.218Z',
                lastModifiedDate: '2022-04-15T07:07:31.842Z',
                name: 'Sharad Singh - Pranav Date',
                familyRequestStatus: 2,
                numberOfRejects: 1,
                lastRejectDate: '2022-04-12T12:48:02.866Z',
                parentId: 61,
                childId: 3,
                familyRequestStatusLabel: 'Approved',
                childAppUser: {
                  id: 3,
                  name: 'Pranav Date'
                }
              }
            ]
          }
        }
      }
    }
  })
  async getChildren(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.getChildren(id);
  }

  @post(`/${API_PREFIX}/{id}/removeChild`)
  @response(200, {
    description: 'Remove a child',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Child successfully removed.'
          }
        }
      }
    }
  })
  async removeChild(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['childId'],
            properties: {
              childId: {
                type: 'number',
                minimum:1
              }
            }
          }
        }
      }
    })
    childDetails: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.removeChild(id, childDetails);
  }

  @post(`/${API_PREFIX}/{id}/removeParent`)
  @response(200, {
    description: 'Remove a parent',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Parent successfully removed.'
          }
        }
      }
    }
  })
  async removeParent(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['parentId'],
            properties: {
              parentId: {
                type: 'number',
                minimum:1
              }
            }
          }
        }
      }
    })
    parentDetails: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.removeParent(id, parentDetails);
  }

  @get(`/${API_PREFIX}/{id}/getPendingRequests`)
  @response(200, {
    description: 'Get the list of parents from whom family joining requests are pending',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            parents: [
              {
                id: 18,
                isActive: true,
                createdDate: '2022-04-14T12:35:56.871Z',
                lastModifiedDate: '2022-04-14T12:35:56.871Z',
                name: 'Dharmil - Pranav Date',
                familyRequestStatus: 1,
                numberOfRejects: 0,
                lastRejectDate: null,
                parentId: 2,
                childId: 3,
                familyRequestStatusLabel: 'Initiated',
                parentAppUser: {
                  id: 2,
                  name: 'Dharmil'
                }
              }
            ]
          }
        }
      }
    }
  })
  async getPendingRequests(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.getPendingRequests(id);
  }

  @get(`/${API_PREFIX}/{id}/getSentRequestsPending`)
  @response(200, {
    description: 'Get the list of children to whom sent request was sent and is pending',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            families: [
              {
                id: 18,
                isActive: true,
                createdDate: '2022-04-14T12:35:56.871Z',
                lastModifiedDate: '2022-04-14T12:35:56.871Z',
                name: 'Pranav Date - Dharmil',
                familyRequestStatus: 1,
                numberOfRejects: 0,
                lastRejectDate: null,
                parentId: 2,
                childId: 3,
                familyRequestStatusLabel: 'Initiated',
                childAppUser: {
                  id: 2,
                  name: 'Dharmil'
                }
              }
            ]
          }
        }
      }
    }
  })
  async getSentRequestsPending(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.familyMappingFacade.getSentRequestsPending(id);
  }

  // @TODO remove userId
  @get(`/${API_PREFIX}/{id}/processEmail`)
  @response(204, {
    description: 'trigger message in communication handler to process cas received from email',
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
  async processEmail(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.processEmail(id);
  }

  @get(`/${API_PREFIX}/{id}/{customerId}/getDematAcc`)
  @response(200, {
    description: 'Fetch demat account number and dpid',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            accNum: {type: 'string'},
            dpid: {type: 'string'},
          }
        }
      }
    }
  })
  async getDematAcc(@param.path.number('id') id: number, @param.path.number('customerId') customerId: number): Promise<any> {
    PathParamsValidations.idValidations(id)
    PathParamsValidations.idValidations(customerId)
    let env = process.env.NODE_ENV as string;
    if (env.toLowerCase() === 'dev') {
      return this.appUserFacade.mockGetDematAcc(id,customerId,this.userProfile.TrxId);
    } else {
      return this.appUserFacade.getDematAcc(id,customerId, this.userProfile.TrxId);
    }
  }

  @get(`/${API_PREFIX}/{id}/getSignature`)
  @response(200, {
    description: 'Fetch signature',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {type: Boolean}
          }
        }
      }
    }
  })
  async getSignature(@param.path.number('id') id: number): Promise<any> {
    PathParamsValidations.idValidations(id)
    let env = process.env.NODE_ENV as string;
    // if (env.toLowerCase() === 'dev') {
    //   return this.appUserFacade.mockGetDematAcc(id,customerId);
    // } else {
      return this.appUserFacade.getSignature(id, this.userProfile.TrxId);
   // }
  }

  @post(`/${API_PREFIX}/uploadRtaFile`, {
    responses: {
      200: {
        description: 'API to upload Rta file for operations team',
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
      }
    }
  })
  async uploadCamsRtaFile(
    @param.query.number('rtaId') rtaId: number,
    @requestBody({
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              files: {
                type: 'string',
                format: 'binary'
              }
            }
          }
        }
      }
    })
    request: Request
  ): Promise<object> {
    //@Todo - userID to be changed to pick from token later when authentication is implemented
    return this.appUserFacade.uploadRtaFile(this.userProfile.appUserId, rtaId, request, this.response,this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/exportSample/{rtaId}`)
  @response(200, {
    description: 'Export Sample Files for 2FA Update',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async exportSampleFile(
  @param.path.number('rtaId') rtaId: number,
  ): Promise<any> {
    return this.appUserFacade.exportSampleFile(rtaId,this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/auditTrail/{auditTrailFileId}`)
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
  async exportAuditTrial(
  @param.path.number('auditTrailFileId') auditTrailFileId: number,
  ): Promise<any> {
    return this.appUserFacade.exportAuditTrail(this.res, auditTrailFileId,this.additionalHeaders);
  }
  @post(`/${API_PREFIX}/{id}/uploadSignature`)
  @response(200, {
    description: 'Upload Signature',
    content: {
      'application/json': {
        schema: {
          type: 'object',

          example: {success: true}
        }
      }
    }
  })
  async uploadSignature(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              file: {
                type: 'string',
                format: 'binary'
              }
            }
          }
        }
      }
    })
    request: Request
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.uploadSignature(id, request, this.response);
  }

  //Only for testing validating mfrta
  @get(`/${API_PREFIX}/{id}/mfrtaCheck`)
  @response(200, {
    description: 'Validate Mfrta',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async mfrta(@param.path.number('id') id: number): Promise<any[]> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.validateMfRtaFields(id , this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/{id}/investmentAccountCreated`)
  @response(200, {
    description: 'Changing App User Status to investmentAccountReady',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {success: true}
        }
      }
    }
  })
  async investmentAccountCreated(
    @param.path.number('id') id: number): Promise<object> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.investmentAccountCreated(id);
  }

  @get(`/${API_PREFIX}/{id}/fetchExistingNominee`)
  @response(200, {
    description: 'Fetching Existing Nominee Associated with Bank',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {success: true}
        }
      }
    }
  })
  async fetchExistingNominee(
    @param.path.number('id') id: number): Promise<object> {
      PathParamsValidations.idValidations(id)
      return this.appUserFacade.fetchExistingNominee(id, this.userProfile.TrxId, this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/{id}/logoutInternalUser`)
  @response(200, {
    description: 'For logging out an internal user',
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
  async logoutInternalUser(
    @param.path.number('id') id: number,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<object> {
    PathParamsValidations.idValidations(id)
    // @ts-ignore:
    return this.appUserFacade.logoutInternalUser(id,request.headers['Authorization'] || request.headers['authorization'],this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/{id}/generateOTPForTransaction`)
  @response(200, {
    description: 'Generated OTP based Sell Transaction',
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
  async generateOTPForTransaction(
    @param.path.number('id') id :number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['cartItemId'],
            properties: {
              cartItemId: {
                type: 'number'
              }
            }
          }
        }
      }
    })

    cartDetails: any
  ): Promise<object> {
    let env = (process.env.MOCK_OTP ?? '')
    if (env.toLowerCase() === 'true') {
      return await this.appUserFacade.generateOTPForTransactionMock(id, cartDetails.cartItemId, this.additionalHeaders);
    } else {
      return await this.appUserFacade.generateOTPForTransaction(id, cartDetails.cartItemId, this.additionalHeaders);
    }
  }

  @post(`/${API_PREFIX}/{id}/verifyOTPForTransaction`)
  @response(200, {
    description: 'Verify OTP for transaction',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true
          }
        }
      }
    }
  })
  async verifyOTPForTransaction(
    @param.path.number('id') id :number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['otp','cartItemId'],
            properties: {
              otp: {
                type: 'string',
                pattern:'[0-9]',
                minLength:0,
                maxLength:6
              },
              cartItemId: {
                type: 'number'
              }
            }
          }
        }
      }
    })
    contactDetails: VerifyOtpContactDetails,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<object> {
    let env = process.env.MOCK_OTP ?? '';
    if (env.toLowerCase() === 'true') {
      return await this.appUserFacade.verifyOTPForTransactionMock(id, contactDetails, request, this.additionalHeaders);
    } else {
      return await this.appUserFacade.verifyOTPForTransaction(id, contactDetails, request, this.additionalHeaders);
    }
  }

  @post(`/${API_PREFIX}/{id}/updateDecleration`)
  @response(200, {
    description: 'AppUser model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppUser)}}
  })
  async updateDecleration(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['emailBelongsTo','contactNumberBelongsTo'],
            properties: {
              emailBelongsTo: {
                type: 'number'
              },
              contactNumberBelongsTo: {
                type: 'number'
              }
            },
            example: {emailBelongsTo: 1,contactNumberBelongsTo :1}
          }
        }
      }
    })
    data: any
  ): Promise<any> {
    PathParamsValidations.idValidations(id)
    return this.appUserFacade.updateDecleration(id, data,this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/{id}/generateOTPFor2FATransaction`)
  @response(200, {
    description: 'OTP generation for Rebalance and Purchase transactions',
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
  async generateOTPFor2FATransaction(
    @param.path.number('id') id :number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['txnReferenceNumber'],
            properties: {
              txnReferenceNumber : {
                type : 'string'
              }

            }
          }
        }
      }
    })

    otpGenerationDetails: any
  ): Promise<object> {
      return await this.appUserFacade.generateOTPFor2FATransaction(id,otpGenerationDetails.txnReferenceNumber,this.userProfile , this.additionalHeaders);
  }

  @post(`/${API_PREFIX}/{id}/verifyOTPFor2FATransaction`)
  @response(200, {
    description: 'Verify OTP for Purchase and Rebalance transaction',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true
          }
        }
      }
    }
  })
  async verifyOTPFor2FATransaction(
    @param.path.number('id') id :number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required:['txnOTP','txnReferenceNumber'],
            properties: {
              txnOTP: {
                type: 'string',
                pattern:'[0-9]',
                minLength:6,
                maxLength:6
              },
              txnReferenceNumber : {
                type : 'string'
              }
            }
          }
        }
      }
    })
    verifyOTPDetails: any,
    @inject(RestBindings.Http.REQUEST) request: Request
  ): Promise<object> {
    return await this.appUserFacade.verifyOTPFor2FATransaction(id, verifyOTPDetails.txnReferenceNumber, verifyOTPDetails.txnOTP, this.userProfile,verifyOTPDetails.transactionFlag, this.additionalHeaders);
  }

}
