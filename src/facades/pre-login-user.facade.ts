import {injectable, /* inject, */ BindingScope, service} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Request} from '@loopback/rest';
import {PreLoginUser, PreLoginUserRelations, PreLoginUserRepository,DeviceRepository, RestError, LoggingUtils, Device, DeviceRelations} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class PreLoginUserFacade {
  constructor(
    @repository(PreLoginUserRepository) private preLoginUserRepository: PreLoginUserRepository,
    @repository(DeviceRepository) private deviceRepository: DeviceRepository
  ) {}

  async create(entity: DataObject<PreLoginUser>, options?: Options): Promise<PreLoginUser> {
    return this.preLoginUserRepository.create(entity, options);
  }

  async createAll(entities: DataObject<PreLoginUser>[], options?: Options): Promise<PreLoginUser[]> {
    return this.preLoginUserRepository.createAll(entities, options);
  }

  async save(entity: PreLoginUser, options?: Options): Promise<PreLoginUser> {
    return this.preLoginUserRepository.save(entity, options);
  }

  async find(filter?: Filter<PreLoginUser>, options?: Options): Promise<(PreLoginUser & PreLoginUserRelations)[]> {
    return this.preLoginUserRepository.find(filter, options);
  }

  async findOne(filter?: Filter<PreLoginUser>, options?: Options): Promise<(PreLoginUser & PreLoginUserRelations) | null> {
    return this.preLoginUserRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<PreLoginUser>,
    options?: Options
  ): Promise<PreLoginUser & PreLoginUserRelations> {
    return this.preLoginUserRepository.findById(id,filter, options);
  }

  async update(entity: PreLoginUser, options?: Options): Promise<void> {
    return this.preLoginUserRepository.update(entity, options);
  }

  async delete(entity: PreLoginUser, options?: Options): Promise<void> {
    return this.preLoginUserRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<PreLoginUser>, where?: Where<PreLoginUser>, options?: Options): Promise<Count> {
    return this.preLoginUserRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<PreLoginUser>, options?: Options): Promise<void> {
    return this.preLoginUserRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<PreLoginUser>, options?: Options): Promise<void> {
    return this.preLoginUserRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<PreLoginUser>, options?: Options): Promise<Count> {
    return this.preLoginUserRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.preLoginUserRepository.deleteById(id, options);
  }

  async count(where?: Where<PreLoginUser>, options?: Options): Promise<Count> {
    return this.preLoginUserRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.preLoginUserRepository.exists(id, options);
  }

  //todo Replace any used in this block
  async savePreLoginData(deviceId: number, userData: DataObject<PreLoginUser>,uniqueId: string, options?: Options): Promise<PreLoginUser> {
    return new Promise((resolve, reject) => {
      this.deviceRepository
        .findOne({
          where: {
            id: deviceId,
            uniqueId: uniqueId,
            isActive: true
          },
          include: [
            {
              relation: 'preLoginUser',
              scope: {
                where: {isActive: true}
              }
            }
          ]
        })
        .then((deviceDetails): any => {
          let promise;
          let preLoginDataToResolve: any;
          if (deviceDetails && !deviceDetails.preLoginUser) {
            promise = this.preLoginUserRepository
              .create({
                userData: userData
              })
              .then((data): any => {
                preLoginDataToResolve = data;
                return this.deviceRepository.updateAll(
                  {
                    preLoginUserId: preLoginDataToResolve.id
                  },
                  {
                    id: deviceId
                  }
                );
              })
              .then(() => {
                return Promise.resolve(preLoginDataToResolve);
              })
              .catch(err => {
                throw err;
              });
          } else if (deviceDetails && deviceDetails.preLoginUser) {
            const preLoginUserId: number = deviceDetails.preLoginUser.id;
            promise = this.preLoginUserRepository
              .updateAll(
                {
                  userData: userData
                },
                {
                  id: deviceDetails.preLoginUser.id
                }
              )
              .then(()=> {
                return this.preLoginUserRepository.findById(preLoginUserId);
              })
              .catch(err => {
                throw err;
              });
          } else {
            return reject(new RestError(400, 'Invalid Device Id', {systemcode : 1327}));
          }
          return promise;
        })
        .then((data): any => {
          return resolve(data);
        })
        .catch(error => {
          LoggingUtils.error(error);
          throw error;
        });
    });
  }

  async fetchPreLoginUsers(limit: number = 50, offset: number = 0, deviceId: number, request: Request): Promise<(Device & DeviceRelations)[]>{
    if(!(request.headers && request.headers["uniqueid"])) {
      return Promise.reject(new RestError(465, 'Device unique id is missing from headers', {systemcode : 1307}))
    }
    const uniqueId: string = request.headers["uniqueid"] as string

    if(!deviceId || !uniqueId){
      return Promise.reject(new RestError(400, 'Both deviceId and uniqueId not found', {systemcode : 1328} ));
    }
    try {
     const response = await this.deviceRepository
      .find({
        where: {
          id: deviceId,
          uniqueId : uniqueId,
          isActive: true
        },
        fields: {'preLoginUserId': true,'preLoginUser': true},
        limit: limit,
        offset: offset,
        include: [
          {
            relation: 'preLoginUser',
            scope: {
              where: {isActive: true}
            }
          }
        ]
      });
      if(!response){
        return Promise.reject(new RestError(400, 'No data found!', {systemcode : 1234} ));
      }
      return Promise.resolve(response);
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }
}
