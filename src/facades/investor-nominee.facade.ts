import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {stringTypeToWrapper} from '@loopback/rest';
import {
  InvestorNominee,
  InvestorNomineeRelations,
  InvestorNomineeRepository,
  AccountRepository,
  Account,
  LoggingUtils,
  RestError,
  AppUserRepository,
  AppUser,
  InvestorDetailsRepository,
  InvestorDetails,
  Address,
  AddressRepository,
  Option
} from 'common';
import AppConstant from 'common/dist/constants/app-constant';
import moment from 'moment-timezone';
import _ from 'underscore';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class InvestorNomineeFacade {
  constructor(
    @repository(InvestorNomineeRepository) private investorNomineeRepository: InvestorNomineeRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository,
    @repository(AddressRepository) private addressRepository: AddressRepository
  ) {}

  getAge(dateString: string) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async create(entity: DataObject<InvestorNominee>, options?: Options): Promise<InvestorNominee> {
    return this.investorNomineeRepository.create(entity, options);
  }

  async find(filter?: Filter<InvestorNominee>, options?: Options): Promise<(InvestorNominee & InvestorNomineeRelations)[]> {
    return this.investorNomineeRepository.find(filter, options);
  }

  async updateAll(data: DataObject<InvestorNominee>, where?: Where<InvestorNominee>, options?: Options): Promise<Count> {
    return this.investorNomineeRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<InvestorNominee>, options?: Options): Promise<void> {
    return this.investorNomineeRepository.updateById(id, data, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<InvestorNominee>,
    options?: Options
  ): Promise<InvestorNominee & InvestorNomineeRelations> {
    return this.investorNomineeRepository.findById(id, filter, options);
  }

  async count(where?: Where<InvestorNominee>, options?: Options): Promise<Count> {
    return this.investorNomineeRepository.count(where, options);
  }

  async delete(entity: InvestorNominee, options?: Options): Promise<void> {
    return this.investorNomineeRepository.delete(entity, options);
  }

  async deleteAll(where?: Where<InvestorNominee>, options?: Options): Promise<Count> {
    return this.investorNomineeRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.investorNomineeRepository.deleteById(id, options);
  }
  async exists(id: number, options?: Options): Promise<boolean> {
    return this.investorNomineeRepository.exists(id, options);
  }
  async createNomineeByAccountId(
    accountId: number,
    nominee: DataObject<InvestorNominee & {dateOfBirth: string; nomineeAddress: DataObject<Address>}>,
    options?: Options
  ): Promise<InvestorNominee> {
    try {
      let nomineeData!: InvestorNominee;
      let guardianAddress!: DataObject<Address>;

      const account: Account | null = await this.accountRepository.findOne({
        where: {
          id: accountId,
          isActive: true
        }
      });
      if (!account) {
        return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
      }
      if (!nominee) {
        return Promise.reject(new RestError(400, 'Nominee details required', {systemcode: 1090}));
      }
      //check if age<18 in that case check if guardian is available if not availabe ,reject

      const ageInYear = this.getAge(typeof nominee.dateOfBirth == 'string' ? nominee.dateOfBirth : '');

      if (ageInYear < 18 && !nominee.guardianRelationship && !nominee.guardianName) {
        return Promise.reject(new RestError(404, 'Nominee guardian not found', {systemcode: 1324}));
      }

      if (!nominee.nomineeAddress) {
        return Promise.reject(new RestError(404, 'Nominee address details not found', {systemcode: 1374}));
      }

      if (ageInYear < 18 && !nominee.guardianRelationship && !nominee.guardianAddress) {
        return Promise.reject(new RestError(404, 'Guardian address details not found', {systemcode: 1375}));
      }

      if (
        nominee.dateOfBirth &&
        moment(nominee.dateOfBirth).isValid() &&
        moment(moment().format('YYYY-MM-DD')).isSameOrBefore(moment(nominee.dateOfBirth).format('YYYY-MM-DD'))
      ) {
        return Promise.reject(new RestError(404, "Dob should be less than today's date", {systemcode: 1389}));
      }

      if (nominee.name && !AppConstant.REGEX_ALPHABETS_WITH_SPACE.test(nominee.name)) {
        return Promise.reject(
          new RestError(404, "Nominee name shouldn't contains any special characters or numbers. Please update!!", {systemcode: 1390})
        );
      }

      if (nominee.guardianName && !AppConstant.REGEX_ALPHABETS_WITH_SPACE.test(nominee.guardianName) && ageInYear < 18) {
        return Promise.reject(
          new RestError(404, "Guardian name shouldn't contains any special characters or numbers. Please update!!", {systemcode: 1391})
        );
      }

      let nomineeObj: Partial<InvestorNominee> = {};
      nomineeObj.relationshipId = nominee.relationshipId;
      nomineeObj.nomineePercentage = nominee.nomineePercentage;
      nomineeObj.accountId = accountId;
      if (ageInYear < 18) {
        nomineeObj.guardianName = nominee.guardianName;
        nomineeObj.guardianRelationship = nominee.guardianRelationship;
        nomineeObj.guardianPanCardNumber = nominee.guardianPanCardNumber;

        // storing guardian address details in address table if the nominee is minor

        guardianAddress = await this.addressRepository.create(nominee.guardianAddress);
        nomineeObj.guardianAddressId = guardianAddress.id;
      }

      // storing details in AppUser
      const user = await this.appUserRepository
        .create({name: nominee.name, appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['nomineeUserStatus'].value})
        .catch(err => {
          throw new Error(err);
        });
      if (user) {
        let dob = moment(new Date(String(nominee.dateOfBirth)))
          .utcOffset('+05:30')
          .format('YYYY-MM-DD');
        nomineeObj.appUserId = user.id;
        let investorDetails: any = {birthDate: dob, appUserId: user.id, investorTypeId: nominee.investorTypeId};

        // storing details in investorDetails and address details tables

        let parallalExecutedServices = await Promise.all([
          this.investorDetailsRepository.create(investorDetails),
          this.addressRepository.create(nominee.nomineeAddress)
        ]).catch(err => {
          throw new Error(err);
        });
        let nomineeAddressId = parallalExecutedServices[1]['id'];

        nomineeObj.addressId = nomineeAddressId;

        // storing summarised details in investor nominee table

        nomineeData = await this.investorNomineeRepository.create(nomineeObj).catch(err => {
          throw new Error(err);
        });
      }
      return nomineeData;
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async saveOnboardingSelectedNominees(
    accountId: number,
    nomineeDetails: Array<Partial<InvestorNominee>>,
    options?: Options
  ): Promise<object> {
    try {
      if (!nomineeDetails || nomineeDetails.length === 0) {
        return Promise.reject(new RestError(400, 'Nominee details required', {systemcode: 1090}));
      }
      let nomineeIds = _.pluck(nomineeDetails, 'id');

      const account: Account | null = await this.accountRepository.findOne({
        fields: ['id', 'primaryHolderId', 'primaryHolder', 'investorNominees'],
        where: {
          id: accountId,
          isActive: true
        },
        include: [
          {
            relation: 'primaryHolder',
            scope: {
              fields: ['id', 'appUserStatus'],
              where: {isActive: true}
            }
          }
        ]
      });

      //** Data validation checks goes below */
      if (!account) {
        return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
      }

      if (!account.primaryHolder) {
        return Promise.reject(new RestError(404, 'User details not found', {systemcode: 1379}));
      }

      let investorNominees = await this.investorNomineeRepository.find({
        where: {isActive: true, id: {inq: nomineeIds}},
        include: [
          {
            relation: 'address',
            scope: {
              where: {isActive: true}
            }
          },
          {
            relation: 'guardianAddress',
            scope: {
              where: {isActive: true}
            }
          },
          {
            relation: 'appUser',
            scope: {
              where: {isActive: true},
              include: [
                {
                  relation: 'investorDetails',
                  scope: {
                    where: {isActive: true}
                  }
                }
              ]
            }
          }
        ]
      });

      if (!investorNominees || !(investorNominees.length > 0)) {
        return Promise.reject(new RestError(404, 'investor nominee details not found', {systemcode: 1380}));
      }

      let primaryHolder: Partial<AppUser> = account.primaryHolder;

      if (!(account.primaryHolder.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['declarationCompleted'].value)) {
        return Promise.reject(new RestError(481, `Oops you've landed on wrong page. Please restart the application`, {systemcode: 1381}));
      }

      if (investorNominees.length > 3) {
        return Promise.reject(new RestError(400, "can't select more than three nominees", {systemcode: 1382}));
      }

      let combinedNomineePercentage: number = 0;
      investorNominees.forEach(nominee => {
        combinedNomineePercentage += nominee.nomineePercentage ?? 0;
      });

      if (100 - combinedNomineePercentage !== 0) {
        return Promise.reject(new RestError(465, 'Please adjust the nominee percentage', {systemcode: 1383}));
      }
      let isNomineeNameFault: Boolean = false;
      let isNomineeGuardianNameFault: Boolean = false;


      investorNominees.some(investorNominee => {

        let birthDate = moment(investorNominee?.appUser?.investorDetails?.birthDate).format('YYYY-MM-DD');
        const ageInYear = this.getAge(birthDate ?? '');

        if (investorNominee.guardianName && !AppConstant.REGEX_ALPHABETS_WITH_SPACE.test(investorNominee.guardianName) && ageInYear < 18) {
          return (isNomineeGuardianNameFault = true);
        }
        if (
          investorNominee.appUser &&
          investorNominee.appUser.name &&
          !AppConstant.REGEX_ALPHABETS_WITH_SPACE.test(investorNominee.appUser.name)
        ) {
          return (isNomineeNameFault = true);
        }
      });

      if (isNomineeNameFault) {
        return Promise.reject(
          new RestError(404, "Nominee name shouldn't contains any special characters or numbers. Please update!!", {systemcode: 1390})
        );
      }

      if (isNomineeGuardianNameFault) {
        return Promise.reject(
          new RestError(404, "Guardian name shouldn't contains any special characters or numbers. Please update!!", {systemcode: 1391})
        );
      }

      //** End of data checks */

      //** updating all nominees mutual funds flag to false */
      await this.investorNomineeRepository.updateAll({isMfNominee: false}, {accountId, isActive: true}).catch(err => {
        throw new Error(err);
      });

      //** updating selected nominees precentages and mutual funds flag to true*/

      await Promise.all(
        investorNominees.map(async (nominee: Partial<InvestorNominee>) => {
          let nomineeObj: Partial<InvestorNominee> = {};
          let nomineeId = nominee.id;

          nomineeObj.nomineePercentage = nominee.nomineePercentage;
          nomineeObj.isMfNominee = true;

          await this.investorNomineeRepository.updateById(nomineeId, nomineeObj).catch(err => {
            throw new Error(err);
          });
        })
      ).catch(err => {
        throw new Error(err);
      });

      await this.appUserRepository.updateById(primaryHolder.id!, {
        appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['nomineeCompleted'].value
      });

      await this.duplicateSelectedNominees(investorNominees, account);

      return Promise.resolve({success: true});
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async duplicateSelectedNominees(investorNominees: Array<DataObject<InvestorNominee>>, account: Partial<Account>): Promise<object> {
    try {
      if (!investorNominees || !(investorNominees.length > 0)) {
        return Promise.reject(new RestError(465, 'No nominees available to duplicate', {systemcode: 1384}));
      }

      await Promise.all(
        investorNominees.map(async nominee => {
          let nomineeId = nominee.id;

          let investorDetails = await this.investorDetailsRepository
            .findOne({
              fields: ['id', 'birthDate', 'investorTypeId', 'appUser', 'appUserId'],
              where: {appUserId: nominee.appUserId},
              include: [
                {
                  relation: 'appUser',
                  scope: {
                    fields: ['id', 'name', 'appUserStatus'],
                    where: {
                      isActive: true
                    }
                  }
                }
              ]
            })
            .catch(err => {
              throw new Error(err);
            });

          let nomineeAppUser: Partial<AppUser> | null = investorDetails?.appUser;

          if (!investorDetails) {
            return Promise.reject(new RestError(465, 'Nominee investor detials not found', {systemcode: 1385}));
          }
          if (!nomineeAppUser) {
            return Promise.reject(new RestError(465, 'No nominee app user found', {systemcode: 1386}));
          }

          if (!nominee.addressId || !nominee.address) {
            return Promise.reject(new RestError(465, 'Address details not found', {systemcode: 1387}));
          }

          const newNomineeAppUser = await this.appUserRepository
            .create({name: nomineeAppUser.name, appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['nomineeUserStatus'].value})
            .catch(err => {
              throw new Error(err);
            });

          if (!newNomineeAppUser) {
            return Promise.reject(new RestError(465, 'User not created successfully', {systemcode: 1388}));
          }

          await this.investorDetailsRepository
            .create({
              birthDate: moment(new Date(investorDetails.birthDate as any)).utcOffset('+05:30').format('YYYY-MM-DD') as any,
              appUserId: newNomineeAppUser.id,
              investorTypeId: investorDetails.investorTypeId
            })
            .catch(err => {
              throw new Error(err);
            });

          let nomineeAddress: Partial<Address> = nominee.address;
          delete nomineeAddress.id;
          delete nomineeAddress.createdDate;
          delete nomineeAddress.lastModifiedDate;

          let newNomineeAddress: Address = await this.addressRepository.create(nomineeAddress).catch(err => {
            throw new Error(err);
          });

          let investorNominee: Partial<InvestorNominee> = {
            nomineePercentage: nominee.nomineePercentage,
            guardianRelationship: nominee.guardianRelationship,
            guardianName: nominee.guardianName,
            isMfNominee: false,
            isSyncedViaBank: nominee.isSyncedViaBank ?? false,
            guardianPanCardNumber: nominee.guardianPanCardNumber,
            appUserId: newNomineeAppUser.id,
            accountId: nominee.accountId,
            relationshipId: nominee.relationshipId,
            addressId: newNomineeAddress.id,
            serviceProviderAccountId: nominee.serviceProviderAccountId
          };

          if (nominee.guardianAddressId && nominee.guardianAddress) {
            let guardianAddress: Partial<Address> = nominee.guardianAddress;
            delete guardianAddress.id;
            delete guardianAddress.createdDate;
            delete guardianAddress.lastModifiedDate;
            let newGuardianAddress = await this.addressRepository.create(guardianAddress).catch(err => {
              throw new Error(err);
            });
            investorNominee.guardianAddressId = newGuardianAddress.id;
          }
          await this.investorNomineeRepository.create(investorNominee).catch(err => {
            throw new Error(err);
          });
        })
      ).catch(err => {
        throw new Error(err);
      });

      return Promise.resolve({success: true});
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }
}
