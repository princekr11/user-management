import { authorize } from '@loopback/authorization';
import { service } from '@loopback/core';
import { Count, CountSchema } from '@loopback/repository';
import { getModelSchemaRef, param, post, requestBody, response } from '@loopback/rest';
import { UserNotificationToken, CommunicationQueueMessage, QueueProducer, CommunicationQueueMessageEventType, PushNotificationTemplateName } from 'common';
import { UserNotificationTokenFacade } from '../facades';

const API_PREFIX = UserNotificationToken.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class UserNotificationTokenController {
  constructor(@service(UserNotificationTokenFacade) public userNotificationTokenFacade: UserNotificationTokenFacade) { }

  @post(`/${API_PREFIX}/{id}/create`)
  @response(200, {
    description: 'UserNotificationToken model instance',
    content: { 'application/json': { schema: getModelSchemaRef(UserNotificationToken) } }
  })
  async create(
    @param.path.number('id') appUserId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserNotificationToken, {
            title: 'New UserNotificationToken',
            exclude: ['id']
          })
        }
      }
    })
    userNotificationToken: Omit<UserNotificationToken, 'id'>
  ): Promise<UserNotificationToken> {
    return this.userNotificationTokenFacade.create(userNotificationToken);
  }

  @post(`/${API_PREFIX}/{id}/deactivate`)
  @response(200, {
    description: 'UserNotificationToken deactivate succes count',
    content: { 'application/json': { schema: CountSchema } }
  })
  async deactivateToken(
    @param.path.number('id') appUserId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserNotificationToken, {
            title: 'UserNotificationToken Details',
            exclude: ['id', 'isActive', 'createdDate', 'lastModifiedDate', 'deviceName', 'osName', 'config', 'appUserId']
          })
        }
      }
    })
    where: Pick<UserNotificationToken, 'registrationToken'>
  ): Promise<Count> {
    return this.userNotificationTokenFacade.deactivatToken(appUserId, where);
  }

  @post(`/${API_PREFIX}/testNotification`)
  @response(200, {
    description: 'UserNotificationToken POST Test success count',
    content: { 'application/json': { schema: CountSchema } }
  })
  async sendTestNoficationMessage(
    @requestBody() content: CommunicationQueueMessage
  ): Promise<Count> {
    let message = content ?? new CommunicationQueueMessage();
    if (!content) {
      message.eventType = CommunicationQueueMessageEventType.SEND_PUSH_NOTIFICATION;
      message.userId = 3;
      message.pushNotification = {
        notificationType: PushNotificationTemplateName.CART_ITEM_PENDING,
        data: {
          firstName: 'First Name',
          message: 'Test Message',
          count: 2
        }
      }
    }
    await QueueProducer.sendMessageInCommunicationQueue(message);
    return { count: 1 };
  }
}
