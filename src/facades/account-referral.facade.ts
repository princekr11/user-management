import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {AccountReferral, AccountReferralRepository, AccountReferralWithRelations, RestError} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AccountReferralFacade {
  constructor(@repository(AccountReferralRepository) private accountReferralRepository: AccountReferralRepository) {}

  async create(entity: DataObject<AccountReferral>, options?: Options): Promise<AccountReferral> {
    return this.accountReferralRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AccountReferral>[], options?: Options): Promise<AccountReferral[]> {
    return this.accountReferralRepository.createAll(entities, options);
  }

  async save(entity: AccountReferral, options?: Options): Promise<AccountReferral> {
    return this.accountReferralRepository.save(entity, options);
  }

  async find(filter?: Filter<AccountReferral>, options?: Options): Promise<(AccountReferral & AccountReferralWithRelations)[]> {
    return this.accountReferralRepository.find(filter, options);
  }

  async findOne(filter?: Filter<AccountReferral>, options?: Options): Promise<(AccountReferral & AccountReferralWithRelations) | null> {
    return this.accountReferralRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<AccountReferral>,
    options?: Options
  ): Promise<AccountReferral & AccountReferralWithRelations> {
    return this.accountReferralRepository.findById(id,filter, options);
  }

  async update(entity: AccountReferral, options?: Options): Promise<void> {
    return this.accountReferralRepository.update(entity, options);
  }

  async delete(entity: AccountReferral, options?: Options): Promise<void> {
    return this.accountReferralRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AccountReferral>, where?: Where<AccountReferral>, options?: Options): Promise<Count> {
    return this.accountReferralRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AccountReferral>, options?: Options): Promise<void> {
    return this.accountReferralRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AccountReferral>, options?: Options): Promise<void> {
    return this.accountReferralRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AccountReferral>, options?: Options): Promise<Count> {
    return this.accountReferralRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.accountReferralRepository.deleteById(id, options);
  }

  async count(where?: Where<AccountReferral>, options?: Options): Promise<Count> {
    return this.accountReferralRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.accountReferralRepository.exists(id, options);
  }

  async postReferralCode(accountId: number, referralcode: AccountReferral): Promise<any> {
    try {
      referralcode.accountId = accountId;
      let referralDoc = await this.findOne({where: {accountId, isActive:true}});
      if(referralDoc){
        return Promise.reject(new RestError(400, 'Referral code already exists for this account!', {systemcode : 1373}));
      }
      return this.create(referralcode);
    } catch (error) {
      return new RestError(400, error);
    }
  }

  async getAccountReferrals(accountId: number, referralcode: string): Promise<any> {
    try {
      const accountReferrals = this.accountReferralRepository.find({
        where: {referralCode: referralcode, accountId: accountId, isActive: true}
      });

      if (!accountReferrals) {
        return Promise.reject(new RestError(400, 'AccountReferrals not found', {systemcode : 1371}));
      }
      return accountReferrals;
    } catch (error) {
      return Promise.reject(new RestError(400, error));
    }
  }
}
