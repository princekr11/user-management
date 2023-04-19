import {/* inject, */ BindingScope, injectable} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {AccountAppFileMapping, AccountAppFileMappingRelations, AccountAppFileMappingRepository, LoggingUtils} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AccountAppFileMappingFacade {
  constructor(@repository(AccountAppFileMappingRepository) private accountAppFileMappingRepository: AccountAppFileMappingRepository) {}

  async create(entity: DataObject<AccountAppFileMapping>, options?: Options): Promise<AccountAppFileMapping> {
    return this.accountAppFileMappingRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AccountAppFileMapping>[], options?: Options): Promise<AccountAppFileMapping[]> {
    return this.accountAppFileMappingRepository.createAll(entities, options);
  }

  async save(entity: AccountAppFileMapping, options?: Options): Promise<AccountAppFileMapping> {
    return this.accountAppFileMappingRepository.save(entity, options);
  }

  async find(
    filter?: Filter<AccountAppFileMapping>,
    options?: Options
  ): Promise<(AccountAppFileMapping & AccountAppFileMappingRelations)[]> {
    return this.accountAppFileMappingRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<AccountAppFileMapping>,
    options?: Options
  ): Promise<(AccountAppFileMapping & AccountAppFileMappingRelations) | null> {
    return this.accountAppFileMappingRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<AccountAppFileMapping>,
    options?: Options
  ): Promise<AccountAppFileMapping & AccountAppFileMappingRelations> {
    return this.accountAppFileMappingRepository.findById(id,filter, options);
  }

  async update(entity: AccountAppFileMapping, options?: Options): Promise<void> {
    return this.accountAppFileMappingRepository.update(entity, options);
  }

  async delete(entity: AccountAppFileMapping, options?: Options): Promise<void> {
    return this.accountAppFileMappingRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AccountAppFileMapping>, where?: Where<AccountAppFileMapping>, options?: Options): Promise<Count> {
    return this.accountAppFileMappingRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AccountAppFileMapping>, options?: Options): Promise<void> {
    return this.accountAppFileMappingRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AccountAppFileMapping>, options?: Options): Promise<void> {
    return this.accountAppFileMappingRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AccountAppFileMapping>, options?: Options): Promise<Count> {
    return this.accountAppFileMappingRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.accountAppFileMappingRepository.deleteById(id, options);
  }

  async count(where?: Where<AccountAppFileMapping>, options?: Options): Promise<Count> {
    return this.accountAppFileMappingRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.accountAppFileMappingRepository.exists(id, options);
  }

  async accountAppFileMappingDetails(filter: any,filterObject: any, options: Options): Promise<any>{
    return new Promise(async (resolve, reject) => {
      let count: Count;
      let response: Object = {};


      count = await this.accountAppFileMappingRepository.count(filter, options);
      return this.accountAppFileMappingRepository
        .find({...filter}, options)
        .then(async (result: any[]) => {

          let searchCriteria = new Map();
          let valueToSearch: string;
          filterObject.where.find((data: Object) => {
            searchCriteria.set(Object.keys(data)[0], Object.values(data)[0]);
          });

          let updatedArray = result.filter(data => {
           
            if (searchCriteria.has('accountUniqueId')) {
              if (data.account  && data.account.uniqueId) {
                valueToSearch = searchCriteria.get('accountUniqueId').toLowerCase();
                if (!data.account.uniqueId.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }else{
                return false;
              }
            }

            if (searchCriteria.has('originalFileName')) {
              if (data.userManagementAppFile  && data.userManagementAppFile.originalFileName) {
                valueToSearch = searchCriteria.get('originalFileName').toLowerCase();
                if (!data.userManagementAppFile.originalFileName.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }else{
                return false;
              }
            }
           
            
              return true;
            
          });

          const data = updatedArray.slice(filterObject.offset, filterObject.limit + filterObject.offset);
          response = {
            data: data,
            count: updatedArray.length
          };
          return resolve(response);
        })
        .catch((error: any) => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }
}
