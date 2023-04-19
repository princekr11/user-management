import {authorize} from '@loopback/authorization';
import {service, inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {post, put, requestBody, response, get, del, patch, getModelSchemaRef, param, RestBindings, Response} from '@loopback/rest';
import {UamIntegration, UamLoginAttemptsConfig} from 'common';
import {UamIntegrationFacade} from '../facades';
const API_PREFIX = UamIntegration.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class UamIntegrationController {
  constructor(
    @service(UamIntegrationFacade) public uamIntegrationFacade: UamIntegrationFacade,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
    @inject('additionalHeaders') private additionalHeaders: any,
    @inject('userProfile') private userProfile: any
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'UamIntegration model instance',
    content: {'application/json': {schema: getModelSchemaRef(UamIntegration)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UamIntegration, {
            title: 'New UamIntegration',
            exclude: ['id']
          })
        }
      }
    })
    uamIntegration: Omit<UamIntegration, 'id'>
  ): Promise<UamIntegration> {
    return this.uamIntegrationFacade.create(uamIntegration);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'UamIntegration model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(UamIntegration) where?: Where<UamIntegration>): Promise<Count> {
    return this.uamIntegrationFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of UamIntegration model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UamIntegration, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(UamIntegration) filter?: Filter<UamIntegration>): Promise<UamIntegration[]> {
    return this.uamIntegrationFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'UamIntegration PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UamIntegration, {partial: true})
        }
      }
    })
    UamIntegration: UamIntegration,
    @param.where(UamIntegration) where?: Where<UamIntegration>
  ): Promise<Count> {
    return this.uamIntegrationFacade.updateAll(UamIntegration, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'UamIntegration model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(UamIntegration, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(UamIntegration, {exclude: 'where'}) filter?: FilterExcludingWhere<UamIntegration>
  ): Promise<UamIntegration> {
    return this.uamIntegrationFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UamIntegration PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UamIntegration, {partial: true})
        }
      }
    })
    UamIntegration: UamIntegration
  ): Promise<void> {
    await this.uamIntegrationFacade.updateById(id, UamIntegration);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UamIntegration PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() UamIntegration: UamIntegration): Promise<void> {
    await this.uamIntegrationFacade.replaceById(id, UamIntegration);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'UamIntegration DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.uamIntegrationFacade.deleteById(id);
  }

  @post(`/${API_PREFIX}/createUserUsingUAM`)
  @response(200, {
    description: 'Create user using UAM',
    content: {
      'application/xml': {
        schema: {
          example: `<message>success</message>
          <statusCode>0</statusCode>
          <uniqueNumber>77jdghfj573</uniqueNumber>`
        }
      }
    }
  })
  async createUserUsingUAM(
    @requestBody({
      content: {
        'application/xml': {
          schema : {
            example: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <addUser xmlns="http://uamservice.tcs.com">
            <in>
            <last_Modified_Maker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Maker_Id>
            <last_Modified_Checker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Checker_Id>
            <last_Modified_Maker_Date_Time
            xmlns="http://uamservice.tcs.com/xsd">2019-09-09 12:00:00
            </last_Modified_Maker_Date_Time>
            <last_Modified_Checker_Date_Time xmlns="http://uamservice.tcs.com/xsd">
            2019-09-09 12:00:00</last_Modified_Checker_Date_Time>
            <email_Id xmlns="http://uamservice.tcs.com/xsd">gfdjh876@gmail.com</email_Id>
            <emp_Code xmlns="http://uamservice.tcs.com/xsd">INV23590</emp_Code>
            <mobile xmlns="http://uamservice.tcs.com/xsd">9673305847</mobile>
            <role_Id xmlns="http://uamservice.tcs.com/xsd">1</role_Id>
            <uniqueNumber xmlns="http://uamservice.tcs.com/xsd">77jdghfj573</uniqueNumber>
            <user_Id xmlns="http://uamservice.tcs.com/xsd">A2000</user_Id>
            <user_Name xmlns="http://uamservice.tcs.com/xsd">Abhay Verma</user_Name>
            <user_Type xmlns="http://uamservice.tcs.com/xsd">2</user_Type>
            <category xmlns="http://uamservice.tcs.com/xsd">2</category>
            <date_Of_Birth xmlns="http://uamservice.tcs.com/xsd">12/03/1999</date_Of_Birth>
            <salutation xmlns="http://uamservice.tcs.com/xsd">2</salutation>
            <gender xmlns="http://uamservice.tcs.com/xsd">2</gender>
            </in>
            </addUser>
            </s:Body>
            </s:Envelope>`
          }
        }
      }
    })
    uamIntegrationFacade: {
      requestXML: string;
    }
  ): Promise<any> {
    return this.uamIntegrationFacade.createUserUsingUAM(uamIntegrationFacade.requestXML);
  }

  @put(`/${API_PREFIX}/disableUserUsingUAM`)
  @response(200, {
    description: 'Disable User using UAM',
    content: {
      'application/xml': {
        schema: {}
      }
    }
  })
  async disableUserUsingUAM(
    @requestBody({
      content: {
        'application/xml': {
          example: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <lockUser xmlns="http://uamservice.tcs.com">
            <in>
            <last_Modified_Maker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Maker_Id>
            <last_Modified_Checker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Checker_Id>
            <last_Modified_Maker_Date_Time
            xmlns="http://uamservice.tcs.com/xsd">2019-09-09 12:00:00
            </last_Modified_Maker_Date_Time>
            <last_Modified_Checker_Date_Time xmlns="http://uamservice.tcs.com/xsd">
            2019-09-09 12:00:00</last_Modified_Checker_Date_Time>
            <email_Id xmlns="http://uamservice.tcs.com/xsd">gfdjh876@gmail.com</email_Id>
            <emp_Code xmlns="http://uamservice.tcs.com/xsd">INV23590</emp_Code>
            <mobile xmlns="http://uamservice.tcs.com/xsd">9673305847</mobile>
            <role_Id xmlns="http://uamservice.tcs.com/xsd">1</role_Id>
            <uniqueNumber xmlns="http://uamservice.tcs.com/xsd">77jdghfj573</uniqueNumber>
            <user_Id xmlns="http://uamservice.tcs.com/xsd">A2000</user_Id>
            <user_Name xmlns="http://uamservice.tcs.com/xsd">Abhay Verma</user_Name>
            <user_Type xmlns="http://uamservice.tcs.com/xsd">2</user_Type>
            <category xmlns="http://uamservice.tcs.com/xsd">2</category>
            <date_Of_Birth xmlns="http://uamservice.tcs.com/xsd">12/03/1999</date_Of_Birth>
            <salutation xmlns="http://uamservice.tcs.com/xsd">2</salutation>
            <gender xmlns="http://uamservice.tcs.com/xsd">2</gender>
            </in>
            </lockUser>
            </s:Body>
            </s:Envelope>`
        }
      }
    })
    uamIntegrationFacade: {
      requestXML: string;
    }
  ): Promise<any> {
    return this.uamIntegrationFacade.disableUserUsingUAM(uamIntegrationFacade.requestXML);
  }

  @put(`/${API_PREFIX}/enableUserUsingUAM`)
  @response(200, {
    description: 'Enable User using UAM',
    content: {
      'application/xml': {
        schema: {}
      }
    }
  })
  async enableUserUsingUAM(
    @requestBody({
      content: {
        'application/xml': {
          example: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <unlockUser xmlns="http://uamservice.tcs.com">
            <in>
            <last_Modified_Maker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Maker_Id>
            <last_Modified_Checker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Checker_Id>
            <last_Modified_Maker_Date_Time
            xmlns="http://uamservice.tcs.com/xsd">2019-09-09 12:00:00
            </last_Modified_Maker_Date_Time>
            <last_Modified_Checker_Date_Time xmlns="http://uamservice.tcs.com/xsd">
            2019-09-09 12:00:00</last_Modified_Checker_Date_Time>
            <email_Id xmlns="http://uamservice.tcs.com/xsd">gfdjh876@gmail.com</email_Id>
            <emp_Code xmlns="http://uamservice.tcs.com/xsd">INV23590</emp_Code>
            <mobile xmlns="http://uamservice.tcs.com/xsd">9673305847</mobile>
            <role_Id xmlns="http://uamservice.tcs.com/xsd">1</role_Id>
            <uniqueNumber xmlns="http://uamservice.tcs.com/xsd">77jdghfj573</uniqueNumber>
            <user_Id xmlns="http://uamservice.tcs.com/xsd">A2000</user_Id>
            <user_Name xmlns="http://uamservice.tcs.com/xsd">Abhay Verma</user_Name>
            <user_Type xmlns="http://uamservice.tcs.com/xsd">2</user_Type>
            <category xmlns="http://uamservice.tcs.com/xsd">2</category>
            <date_Of_Birth xmlns="http://uamservice.tcs.com/xsd">12/03/1999</date_Of_Birth>
            <salutation xmlns="http://uamservice.tcs.com/xsd">2</salutation>
            <gender xmlns="http://uamservice.tcs.com/xsd">2</gender>
            </in>
            </unlockUser>
            </s:Body>
            </s:Envelope>`
        }
      }
    })
    uamIntegrationFacade: {
      requestXML: string;
    }
  ): Promise<any> {
    return this.uamIntegrationFacade.enableUserUsingUAM(uamIntegrationFacade.requestXML);
  }

  @put(`/${API_PREFIX}/deleteUserUsingUAM`)
  @response(200, {
    description: 'Delete User using UAM',
    content: {
      'application/xml': {
        schema: {}
      }
    }
  })
  async deleteUserUsingUAM(
    @requestBody({
      content: {
        'application/xml': {
          example: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <deleteUser xmlns="http://uamservice.tcs.com">
            <in>
            <last_Modified_Maker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Maker_Id>
            <last_Modified_Checker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Checker_Id>
            <last_Modified_Maker_Date_Time
            xmlns="http://uamservice.tcs.com/xsd">2019-09-09 12:00:00
            </last_Modified_Maker_Date_Time>
            <last_Modified_Checker_Date_Time xmlns="http://uamservice.tcs.com/xsd">
            2019-09-09 12:00:00</last_Modified_Checker_Date_Time>
            <email_Id xmlns="http://uamservice.tcs.com/xsd">gfdjh876@gmail.com</email_Id>
            <emp_Code xmlns="http://uamservice.tcs.com/xsd">INV23590</emp_Code>
            <mobile xmlns="http://uamservice.tcs.com/xsd">9673305847</mobile>
            <role_Id xmlns="http://uamservice.tcs.com/xsd">1</role_Id>
            <uniqueNumber xmlns="http://uamservice.tcs.com/xsd">77jdghfj573</uniqueNumber>
            <user_Id xmlns="http://uamservice.tcs.com/xsd">A2000</user_Id>
            <user_Name xmlns="http://uamservice.tcs.com/xsd">Abhay Verma</user_Name>
            <user_Type xmlns="http://uamservice.tcs.com/xsd">2</user_Type>
            <category xmlns="http://uamservice.tcs.com/xsd">2</category>
            <date_Of_Birth xmlns="http://uamservice.tcs.com/xsd">12/03/1999</date_Of_Birth>
            <salutation xmlns="http://uamservice.tcs.com/xsd">2</salutation>
            <gender xmlns="http://uamservice.tcs.com/xsd">2</gender>
            </in>
            </deleteUser>
            </s:Body>
            </s:Envelope>`
        }
      }
    })
    uamIntegrationFacade: {
      requestXML: string;
    }
  ): Promise<any> {
    return this.uamIntegrationFacade.deleteUserUsingUAM(uamIntegrationFacade.requestXML);
  }

  @put(`/${API_PREFIX}/reopenUserUsingUAM`)
  @response(200, {
    description: 'Reopen User using UAM',
    content: {
      'application/xml': {
        schema: {}
      }
    }
  })
  async reopenUserUsingUAM(
    @requestBody({
      content: {
        'application/xml': {
          example: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <reopenUser xmlns="http://uamservice.tcs.com">
            <in>
            <last_Modified_Maker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Maker_Id>
            <last_Modified_Checker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Checker_Id>
            <last_Modified_Maker_Date_Time
            xmlns="http://uamservice.tcs.com/xsd">2019-09-09 12:00:00
            </last_Modified_Maker_Date_Time>
            <last_Modified_Checker_Date_Time xmlns="http://uamservice.tcs.com/xsd">
            2019-09-09 12:00:00</last_Modified_Checker_Date_Time>
            <email_Id xmlns="http://uamservice.tcs.com/xsd">gfdjh876@gmail.com</email_Id>
            <emp_Code xmlns="http://uamservice.tcs.com/xsd">INV23590</emp_Code>
            <mobile xmlns="http://uamservice.tcs.com/xsd">9673305847</mobile>
            <role_Id xmlns="http://uamservice.tcs.com/xsd">1</role_Id>
            <uniqueNumber xmlns="http://uamservice.tcs.com/xsd">77jdghfj573</uniqueNumber>
            <user_Id xmlns="http://uamservice.tcs.com/xsd">A2000</user_Id>
            <user_Name xmlns="http://uamservice.tcs.com/xsd">Abhay Verma</user_Name>
            <user_Type xmlns="http://uamservice.tcs.com/xsd">2</user_Type>
            <category xmlns="http://uamservice.tcs.com/xsd">2</category>
            <date_Of_Birth xmlns="http://uamservice.tcs.com/xsd">12/03/1999</date_Of_Birth>
            <salutation xmlns="http://uamservice.tcs.com/xsd">2</salutation>
            <gender xmlns="http://uamservice.tcs.com/xsd">2</gender>
            </in>
            </reopenUser>
            </s:Body>
            </s:Envelope>`
        }
      }
    })
    uamIntegrationFacade: {
      requestXML: string;
    }
  ): Promise<any> {
    return this.uamIntegrationFacade.reopenUserUsingUAM(uamIntegrationFacade.requestXML);
  }

  @put(`/${API_PREFIX}/unlockUserUsingUAM`)
  @response(200, {
    description: 'Unlock User using UAM',
    content: {
      'application/xml': {
        schema: {}
      }
    }
  })
  async unlockUserUsingUAM(
    @requestBody({
      content: {
        'application/xml': {
          example: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <unlockUser xmlns="http://uamservice.tcs.com">
            <in>
            <last_Modified_Maker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Maker_Id>
            <last_Modified_Checker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Checker_Id>
            <last_Modified_Maker_Date_Time
            xmlns="http://uamservice.tcs.com/xsd">2019-09-09 12:00:00
            </last_Modified_Maker_Date_Time>
            <last_Modified_Checker_Date_Time xmlns="http://uamservice.tcs.com/xsd">
            2019-09-09 12:00:00</last_Modified_Checker_Date_Time>
            <email_Id xmlns="http://uamservice.tcs.com/xsd">gfdjh876@gmail.com</email_Id>
            <emp_Code xmlns="http://uamservice.tcs.com/xsd">INV23590</emp_Code>
            <mobile xmlns="http://uamservice.tcs.com/xsd">9673305847</mobile>
            <role_Id xmlns="http://uamservice.tcs.com/xsd">1</role_Id>
            <uniqueNumber xmlns="http://uamservice.tcs.com/xsd">77jdghfj573</uniqueNumber>
            <user_Id xmlns="http://uamservice.tcs.com/xsd">A2000</user_Id>
            <user_Name xmlns="http://uamservice.tcs.com/xsd">Abhay Verma</user_Name>
            <user_Type xmlns="http://uamservice.tcs.com/xsd">2</user_Type>
            <category xmlns="http://uamservice.tcs.com/xsd">2</category>
            <date_Of_Birth xmlns="http://uamservice.tcs.com/xsd">12/03/1999</date_Of_Birth>
            <salutation xmlns="http://uamservice.tcs.com/xsd">2</salutation>
            <gender xmlns="http://uamservice.tcs.com/xsd">2</gender>
            </in>
            </unlockUser>
            </s:Body>
            </s:Envelope>`
        }
      }
    })
    uamIntegrationFacade: {
      requestXML: string;
    }
  ): Promise<any> {
    return this.uamIntegrationFacade.unlockUserUsingUAM(uamIntegrationFacade.requestXML);
  }

  @put(`/${API_PREFIX}/updateUserUsingUAM`)
  @response(200, {
    description: 'Update User using UAM',
    content: {
      'application/xml': {
        schema: {}
      }
    }
  })
  async updateUserUsingUAM(
    @requestBody({
      content: {
        'application/xml': {
          example: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <modifyUser xmlns="http://uamservice.tcs.com">
            <in>
            <last_Modified_Maker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Maker_Id>
            <last_Modified_Checker_Id
            xmlns="http://uamservice.tcs.com/xsd">80f92805d8f11020</last_Modified_Checker_Id>
            <last_Modified_Maker_Date_Time
            xmlns="http://uamservice.tcs.com/xsd">2019-09-09 12:00:00
            </last_Modified_Maker_Date_Time>
            <last_Modified_Checker_Date_Time xmlns="http://uamservice.tcs.com/xsd">
            2019-09-09 12:00:00</last_Modified_Checker_Date_Time>
            <email_Id xmlns="http://uamservice.tcs.com/xsd">gfdjh876@gmail.com</email_Id>
            <emp_Code xmlns="http://uamservice.tcs.com/xsd">INV23590</emp_Code>
            <mobile xmlns="http://uamservice.tcs.com/xsd">9673305847</mobile>
            <role_Id xmlns="http://uamservice.tcs.com/xsd">1</role_Id>
            <uniqueNumber xmlns="http://uamservice.tcs.com/xsd">77jdghfj573</uniqueNumber>
            <user_Id xmlns="http://uamservice.tcs.com/xsd">A2000</user_Id>
            <user_Name xmlns="http://uamservice.tcs.com/xsd">Abhay Verma</user_Name>
            <user_Type xmlns="http://uamservice.tcs.com/xsd">2</user_Type>
            <category xmlns="http://uamservice.tcs.com/xsd">2</category>
            <date_Of_Birth xmlns="http://uamservice.tcs.com/xsd">12/03/1999</date_Of_Birth>
            <salutation xmlns="http://uamservice.tcs.com/xsd">2</salutation>
            <gender xmlns="http://uamservice.tcs.com/xsd">2</gender>
            </in>
            </modifyUser>
            </s:Body>
            </s:Envelope>`
        }
      }
    })
    uamIntegrationFacade: {
      requestXML: string;
    }
  ): Promise<any> {
    return this.uamIntegrationFacade.updateUserUsingUAM(uamIntegrationFacade.requestXML);
  }

  @get(`/${API_PREFIX}/fetchUserIdPopulationReport`)
  @response(200, {
    description: 'For fetching user id population report',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    },
    param
  })
  async fetchUserIdPopulationReport(
    @param.query.number('offset') offset: number,
    @param.query.number('limit') limit: number,
    @param.query.object('searchFilter') searchFilter?: object,
    // @param.query.date('fromDate') fromDate?: Date,
    // @param.query.date('toDate') toDate?: Date,
    @param.array('orderBy', 'query', {type: 'object'}) orderBy?: Array<any>
  ): Promise<any> {
    return this.uamIntegrationFacade.fetchUserIdPopulationReport(
      searchFilter,
      // fromDate,
      // toDate,
      offset,
      limit,
      orderBy
    );
  }

  @get(`/${API_PREFIX}/exportUserIdPopulationReport/{exportFormat}`)
  @response(200, {
    description: 'For exporting userId PopulationReport by given export format(xlsx)', //pdf need to be done as per requirement
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    },
    param
  })
  async exportUserIdPopulationReport(
    @param.path.string('exportFormat') exportFormat: string,
    @param.query.date('fromDate') fromDate?: Date | string,
    @param.query.date('toDate') toDate?: Date | string,
    @param.query.object('searchFilter') searchFilter?: object,
    @param.array('orderBy', 'query', {type: 'object'}) orderBy?: Array<any>
  ): Promise<any> {
    return this.uamIntegrationFacade.exportUserIdPopulationReport(exportFormat, this.res, fromDate, toDate, searchFilter, orderBy);
  }

  @put(`/${API_PREFIX}/changeAppUserStatus`)
  @response(200, {
    description: 'API to update/lock/disable/delete user',
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
  async changeAppUserStatus(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object'
          }
        }
      }
    })
    details: any
  ): Promise<any> {
    return this.uamIntegrationFacade.changeAppUserStatus(details, this.userProfile.TrxId, this.userProfile);
  }

  @put(`/${API_PREFIX}/changeAppUserDetails`)
  @response(200, {
    description: 'API to update/lock/disable/delete user',
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
  async changeAppUserDetails(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object'
          }
        }
      }
    })
    details: any
  ): Promise<any> {
    return this.uamIntegrationFacade.changeAppUserStatus(details, this.userProfile.TrxId, this.userProfile);
  }

  @post(`/${API_PREFIX}/createUser`)
  @response(200, {
    description: 'API to create user',
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
  async createUser(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            example:
            '{"salutation":2,"name":"SUBHANKAR B","userCode":"SUBHANKARB","branchCode":"branch","branchName":"branch","departmentCode":"dept","departmentName":"dept","appRoleId":4,"appUserStatusValue":19,"dob":"","gender":1,"contactNumber":"","email":"SUBHANKARB@hdfcbank.com","category":1}'
          }
        }
      }
    })
    details: any
  ): Promise<any> {
    return this.uamIntegrationFacade.createUser(details, this.userProfile.TrxId, this.userProfile);
  }

  @get(`/${API_PREFIX}/downloadAdminActivityReport`)
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
  async downloadAdminActivityReport(@param.filter(UamIntegration) filter?: Filter<UamIntegration>): Promise<any> {
    return this.uamIntegrationFacade.downloadAdminActivityReport(this.res, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/updateConfigiurations`)
  @response(204, {
    description: 'changeMaxAllowedLoginAttempts success'
  })
  async updateMaxAllowedLoginAttempts(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            // required: ['maxAttempts'],
            properties: {
              maxLoginAttempts: {
                type: 'number',
                minimum: 1,
                maximum: 10
              },
              maxDormancyDays: {
                type: 'number',
                minimum: 1,
                maximum: 100
              },
              maxDormancyDaysBeforeFirstLogin: {
                type: 'number',
                minimum: 1,
                maximum: 100
              }
            }
          }
        }
      }
    })
    uamLoginAttemptsConfig: UamLoginAttemptsConfig
  ): Promise<void> {
    await this.uamIntegrationFacade.updateMaxAllowedLoginAttempts(uamLoginAttemptsConfig);
  }

  @get(`/${API_PREFIX}/fetchConfigurations`)
  @response(200, {
    description: 'Fetch configs',
    content: {
      'application/json': {
        schema: {
          type: 'object'
        }
      }
    }
  })
  async fetchConfigurations(): Promise<Partial<UamLoginAttemptsConfig>> {
    return this.uamIntegrationFacade.fetchConfigurations();
  }

  @get(`/${API_PREFIX}/downloadRoleRightsReport`)
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
  async downloadRoleRightsReport(@param.filter(UamIntegration) filter?: Filter<UamIntegration>): Promise<any> {
    return this.uamIntegrationFacade.downloadRoleRightsReport(this.res, filter, this.additionalHeaders);
  }
}
