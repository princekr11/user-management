import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {
  AccountRepository,
  AppUserRepository,
  BankAccount,
  BankAccountRelations,
  BankAccountRepository,
  InvestorDetailsRepository,
  InvestorTypeRepository,
  LoggingUtils,
  Option,
  RestError
} from 'common';
import {CoreBankingRepository} from '../repositories';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class BankAccountFacade {
  constructor(
    @repository(BankAccountRepository) private bankAccountRepository: BankAccountRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(InvestorTypeRepository) private investorTypeRepository: InvestorTypeRepository,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository,
    @repository(CoreBankingRepository) private coreBankingRepository: CoreBankingRepository,
  ) { }

  async create(entity: DataObject<BankAccount>, options?: Options): Promise<BankAccount> {
    return this.bankAccountRepository.create(entity, options);
  }

  async createAll(entities: DataObject<BankAccount>[], options?: Options): Promise<BankAccount[]> {
    return this.bankAccountRepository.createAll(entities, options);
  }

  async save(entity: BankAccount, options?: Options): Promise<BankAccount> {
    return this.bankAccountRepository.save(entity, options);
  }

  async find(filter?: Filter<BankAccount>, options?: Options): Promise<(BankAccount & BankAccountRelations)[]> {
    return this.bankAccountRepository.find(filter, options);
  }

  async findOne(filter?: Filter<BankAccount>, options?: Options): Promise<(BankAccount & BankAccountRelations) | null> {
    return this.bankAccountRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<BankAccount>, options?: Options): Promise<BankAccount & BankAccountRelations> {
    return this.bankAccountRepository.findById(id, filter, options);
  }

  async update(entity: BankAccount, options?: Options): Promise<void> {
    return this.bankAccountRepository.update(entity, options);
  }

  async delete(entity: BankAccount, options?: Options): Promise<void> {
    return this.bankAccountRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<BankAccount>, where?: Where<BankAccount>, options?: Options): Promise<Count> {
    return this.bankAccountRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<BankAccount>, options?: Options): Promise<void> {
    return this.bankAccountRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<BankAccount>, options?: Options): Promise<void> {
    return this.bankAccountRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<BankAccount>, options?: Options): Promise<Count> {
    return this.bankAccountRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.bankAccountRepository.deleteById(id, options);
  }

  async count(where?: Where<BankAccount>, options?: Options): Promise<Count> {
    return this.bankAccountRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.bankAccountRepository.exists(id, options);
  }

  // async validatePanAadharLink(customerId: string): Promise<number> {
  //   try {
  //     const demographicDetails: any = await this.coreBankingRepository.doDemographicDetailsInquiry(customerId);
  //     let panStatus: any = {};
  //     // finds PanStatus
  //     demographicDetails.dictionaryArray.forEach((object: any) => {
  //       if (object['nameValuePairDTOArray']) {
  //         panStatus = object['nameValuePairDTOArray'].find((nameValuePair: any) => {
  //           if (nameValuePair.name && nameValuePair.name === 'panStatus') {
  //             return nameValuePair;
  //           }
  //         })
  //       }
  //     });
  //     if (panStatus.value.toLowerCase() === 'operative') {
  //       return Option.GLOBALOPTIONS.PANAADHARLINKSTATUS.operative.value;
  //     } else if (panStatus.value.toLowerCase() === 'null') {
  //       return Option.GLOBALOPTIONS.PANAADHARLINKSTATUS.pending.value;
  //     } else {
  //       return Option.GLOBALOPTIONS.PANAADHARLINKSTATUS.nonOperative.value;
  //     }
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  async updateBankAccount(id: number, accountId: number, data: DataObject<BankAccount>, options?: Options): Promise<Object> {
    return new Promise((resolve, reject) => {
      if (!data.hasOwnProperty('isDefault') || data.isDefault == false) {
        return Promise.reject(new RestError(465, 'isDefault property needs to be set to true', {systemcode: 1241}));
      }
      // let panAadharLinkStatusG: number;
      let bankAccountData: BankAccount;
      this.bankAccountRepository
        .findOne({
          where: {
            id: id,
            accountId: accountId,
            isActive: true
          },
          include: [
            {
              relation: 'account',
              scope: {
                include: [{
                  relation: 'primaryHolder',
                  scope: {
                    include: ['investorDetails']
                  }
                }]
              }
            },
            {
              relation: 'bankAccountType'
            }
          ]
        }, options)
        .then((bankAccount : BankAccount | null) => {
          if (!bankAccount) {
            return Promise.reject(new RestError(404, 'Bank Account Not found', {systemcode: 1242} ));
          }
          bankAccountData = bankAccount
          return this.bankAccountRepository.updateAll({isDefault: false}, {accountId: accountId, isActive: true});
        })
        .then(() => {
          return this.bankAccountRepository.updateAll({isDefault: true}, {id: id});
        })
        .then(() => {
          // update appUser
          return this.appUserRepository.updateAll(
            {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['bankAccountIsReady'].value},
            {id: bankAccountData.account.primaryHolderId}
          );
        })
        .then(async () => {
          let investorTypeId;
          if (bankAccountData.bankAccountType.bosCode == 'NRE-SAVING') {
            //Finding NRE investor type & setting its id to investorTypeId
            let NREinvestorTypeData = await this.investorTypeRepository.findOne({where: {isActive: true, bseCode: '21'}}, options);
            if (NREinvestorTypeData) {
              investorTypeId = NREinvestorTypeData.id;
              return this.investorDetailsRepository.updateAll(
                {investorTypeId: investorTypeId},
                {isActive: true, appUserId: bankAccountData.account.primaryHolderId},
                options
              );
            }
          } else if (bankAccountData.bankAccountType.bosCode == 'NRO-SAVING') {
            //Finding NRO investor type & setting its id to investorTypeId
            let NROinvestorTypeData = await this.investorTypeRepository.findOne({where: {isActive: true, bseCode: '24'}}, options);
            if (NROinvestorTypeData) {
              investorTypeId = NROinvestorTypeData.id;
              return this.investorDetailsRepository.updateAll(
                {investorTypeId: investorTypeId},
                {isActive: true, appUserId: bankAccountData.account.primaryHolderId},
                options
              );
            }
          } else {
            return {};
          }
        })
        .then(() => {
          resolve({success: true});
        })
        .catch(error => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async fetchBankAccountDetailsById(bankAccountId: number, accountId: number): Promise<BankAccount> {
    const accountExists = await this.bankAccountRepository.findOne({
      where: {
        id: bankAccountId,
        accountId: accountId,
        isActive: true
      }
    })
    if (!accountExists) return Promise.reject(new RestError(404, "Bank Account couldn't be found", {systemcode: 1242}))
    return accountExists
  }
}
