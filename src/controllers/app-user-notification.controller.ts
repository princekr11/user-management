import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {AppUserNotification} from 'common';
import {AppUserNotificationFacade} from '../facades';
const API_PREFIX = AppUserNotification.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class AppUserNotificationController {
  constructor(@service(AppUserNotificationFacade) public AppUserNotificationFacade: AppUserNotificationFacade,
  @inject('additionalHeaders') private additionalHeaders: any) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'AppUserNotification model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppUserNotification)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppUserNotification, {
            title: 'New AppUserNotification',
            exclude: ['id']
          })
        }
      }
    })
    AppUserNotification: Omit<AppUserNotification, 'id'>
  ): Promise<AppUserNotification> {
    return this.AppUserNotificationFacade.create(AppUserNotification);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'AppUserNotification model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(AppUserNotification) where?: Where<AppUserNotification>): Promise<Count> {
    return this.AppUserNotificationFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of AppUserNotification model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AppUserNotification, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(AppUserNotification) filter?: Filter<AppUserNotification>): Promise<AppUserNotification[]> {
    return this.AppUserNotificationFacade.find(filter);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'AppUserNotification model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AppUserNotification, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AppUserNotification, {exclude: 'where'}) filter?: FilterExcludingWhere<AppUserNotification>
  ): Promise<AppUserNotification> {
    return this.AppUserNotificationFacade.findById(id, filter);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'AppUserNotification DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.AppUserNotificationFacade.deleteById(id);
  }

  @post(`/${API_PREFIX}/{appUserId}/createUserNotification`)
  @response(200, {
    description: 'AppUserNotification model instance',
    content: {'application/json': {schema: getModelSchemaRef(AppUserNotification)}}
  })
  async createNomineeByAccountId(
    @param.path.number('appUserId') appUserId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {

                transactionSms: {
                    type: 'boolean'
                }, 

                transactionEmail : {
                    type: 'boolean'
                },

                transactionPushnotification : {
                    type: 'boolean'
                },

                upcomingPaymentsSms: {
                    type: 'boolean'
                },

                upcomingPaymentsEmail : {
                    type: 'boolean'
                },

                upcomingPaymentsPushnotification : {
                    type: 'boolean'
                },

                rebalanceSms : {
                    type: 'boolean'
                },

                rebalanceEmail : {
                    type: 'boolean'
                },

                rebalancePushnotification: {
                    type: 'boolean'
                },
             
            },
            required : ['transactionSms','transactionEmail','transactionPushnotification','upcomingPaymentsSms','upcomingPaymentsEmail','upcomingPaymentsPushnotification','rebalanceSms','rebalanceEmail','rebalancePushnotification'],
            example: `{
              "transactionSms": true,
              "transactionEmail": true,
              "transactionPushnotification": false,
              "upcomingPaymentsSms": true,
              "upcomingPaymentsEmail": true,
              "upcomingPaymentsPushnotification":true,
              "rebalanceSms":true,
              "rebalanceEmail":true,
              "rebalancePushnotification":true
            }`
          }
        }
      }
    })
    AppUserNotification: AppUserNotification
  ): Promise<AppUserNotification> {
    return this.AppUserNotificationFacade.createAppUserNotification(appUserId, AppUserNotification);
  }


  @get(`${API_PREFIX}/{userid}/getUserNotification`)
  @response(200, {
    description : "Get AppUserNotification by appUserId",
    content: {
        'application/json':{
            schema: getModelSchemaRef(AppUserNotification,{includeRelations: false})
        }
    }
  })
  async findUserNotification(
    @param.path.number('userid') appUserId: number
  ): Promise<AppUserNotification | any> {
    return await this.AppUserNotificationFacade.findUserNotification(appUserId,this.additionalHeaders)
  }
}
