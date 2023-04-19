import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {
  AdvisoryClientMaster,
  AdvisoryClientMasterRelations,
  AdvisoryClientMasterRepository,
  AppUserRepository,
  LoggingUtils,
  RestError,
  Option
} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AdvisoryClientMasterFacade {
  constructor(
    @repository(AdvisoryClientMasterRepository) private advisoryClientMasterRepository: AdvisoryClientMasterRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository
  ) {}

  async create(entity: DataObject<AdvisoryClientMaster>, options?: Options): Promise<AdvisoryClientMaster> {
    try {
      const advisoryClientMaster = await this.advisoryClientMasterRepository.create(entity, options);
      if (!entity.customerId) return Promise.reject(new RestError(404, 'Please provide customer ID', {systemcode: 1125}));
      if (
        entity &&
        entity.customerId &&
        entity.customerFlag &&
        entity.customerFlag == Option.GLOBALOPTIONS.ADVISORYCUSTOMERFLAG.ADVISORY.value
      ) {
        await this.appUserRepository
          .findOne(
            {
              where: {
                isActive: true,
                bosCode: entity.customerId
              }
            },
            options
          )
          .then((fetchedUser: any) => {
            if (!fetchedUser) {
              return advisoryClientMaster;
            }
            if (fetchedUser && fetchedUser.id) {
              this.appUserRepository.updateAll(
                {
                  appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.advisoryUser.value
                },
                {
                  id: fetchedUser.id,
                  isActive: true
                },
                options
              );
            }
          });
      }
      return advisoryClientMaster;
    } catch (err) {
      LoggingUtils.error(err);
      return Promise.reject(new RestError(err.status, err.message));
    }
  }

  async createAll(entities: DataObject<AdvisoryClientMaster>[], options?: Options): Promise<AdvisoryClientMaster[]> {
    return this.advisoryClientMasterRepository.createAll(entities, options);
  }

  async save(entity: AdvisoryClientMaster, options?: Options): Promise<AdvisoryClientMaster> {
    return this.advisoryClientMasterRepository.save(entity, options);
  }

  async find(filter?: Filter<AdvisoryClientMaster>, options?: Options): Promise<(AdvisoryClientMaster & AdvisoryClientMasterRelations)[]> {
    return this.advisoryClientMasterRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<AdvisoryClientMaster>,
    options?: Options
  ): Promise<(AdvisoryClientMaster & AdvisoryClientMasterRelations) | null> {
    return this.advisoryClientMasterRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<AdvisoryClientMaster>,
    options?: Options
  ): Promise<AdvisoryClientMaster & AdvisoryClientMasterRelations> {
    return this.advisoryClientMasterRepository.findById(id, filter, options);
  }

  async update(entity: AdvisoryClientMaster, options?: Options): Promise<void> {
    return this.advisoryClientMasterRepository.update(entity, options);
  }

  async delete(entity: AdvisoryClientMaster, options?: Options): Promise<void> {
    return this.advisoryClientMasterRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AdvisoryClientMaster>, where?: Where<AdvisoryClientMaster>, options?: Options): Promise<Count> {
    return this.advisoryClientMasterRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AdvisoryClientMaster>, options?: Options): Promise<void> {
    return this.advisoryClientMasterRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AdvisoryClientMaster>, options?: Options): Promise<void> {
    return this.advisoryClientMasterRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AdvisoryClientMaster>, options?: Options): Promise<Count> {
    return this.advisoryClientMasterRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.advisoryClientMasterRepository.deleteById(id, options);
  }

  async count(where?: Where<AdvisoryClientMaster>, options?: Options): Promise<Count> {
    return this.advisoryClientMasterRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.advisoryClientMasterRepository.exists(id, options);
  }
}
