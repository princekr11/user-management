import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {AppUserNotification, AppUserNotificationRelations, AppUserNotificationRepository, LoggingUtils, RestError} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AppUserNotificationFacade {
  constructor(@repository(AppUserNotificationRepository) private AppUserNotificationRepository: AppUserNotificationRepository) {}

  async create(entity: DataObject<AppUserNotification>, options?: Options): Promise<AppUserNotification> {
    return this.AppUserNotificationRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AppUserNotification>[], options?: Options): Promise<AppUserNotification[]> {
    return this.AppUserNotificationRepository.createAll(entities, options);
  }

  async save(entity: AppUserNotification, options?: Options): Promise<AppUserNotification> {
    return this.AppUserNotificationRepository.save(entity, options);
  }

  async find(filter?: Filter<AppUserNotification>, options?: Options): Promise<(AppUserNotification & AppUserNotificationRelations)[]> {
    return this.AppUserNotificationRepository.find(filter, options);
  }

  async findOne(filter?: Filter<AppUserNotification>, options?: Options): Promise<(AppUserNotification & AppUserNotificationRelations) | null> {
    return this.AppUserNotificationRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<AppUserNotification>,
    options?: Options
  ): Promise<AppUserNotification & AppUserNotificationRelations> {
    return this.AppUserNotificationRepository.findById(id,filter, options);
  }

  async update(entity: AppUserNotification, options?: Options): Promise<void> {
    return this.AppUserNotificationRepository.update(entity, options);
  }

  async delete(entity: AppUserNotification, options?: Options): Promise<void> {
    return this.AppUserNotificationRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AppUserNotification>, where?: Where<AppUserNotification>, options?: Options): Promise<Count> {
    return this.AppUserNotificationRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AppUserNotification>, options?: Options): Promise<void> {
    return this.AppUserNotificationRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AppUserNotification>, options?: Options): Promise<void> {
    return this.AppUserNotificationRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AppUserNotification>, options?: Options): Promise<Count> {
    return this.AppUserNotificationRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.AppUserNotificationRepository.deleteById(id, options);
  }

  async count(where?: Where<AppUserNotification>, options?: Options): Promise<Count> {
    return this.AppUserNotificationRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.AppUserNotificationRepository.exists(id, options);
  }


  async createAppUserNotification(appUserId: number, entity : DataObject<AppUserNotification>): Promise<any>{
    return new Promise((resolve,reject) => {

        try {
            entity.appUserId = appUserId
            return resolve(this.create(entity))
        } catch (error) {
            throw error
        }
    })
  }

  async findUserNotification(appUserId: number,options: Options): Promise<any>{

    return new Promise(async (resolve,reject) => {
        try {
           this.AppUserNotificationRepository.findOne({
                where: {
                    appUserId: appUserId,
                    isActive: true
                }
            },options)
            .then((appUserNotification : AppUserNotification | null) => {
                if(appUserNotification)
                return resolve(appUserNotification)
                else
                return reject(new RestError(400,'No Records Found', {systemcode: 1134}))
            }).catch( (error: any) => {
                throw error
            })
        } catch (error) {
            LoggingUtils.error(error)
            throw error
        }
    })
  }
}
