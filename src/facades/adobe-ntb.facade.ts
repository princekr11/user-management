import {BindingScope, injectable, service} from '@loopback/core';
import {repository,DataObject,Options} from '@loopback/repository';
import {AdobeNtbRepository,AdobeNtbUser} from 'common'
import {AppUserFacade} from './app-user.facade';
import {AccountFacade} from './account.facade'
import moment from 'moment-timezone';
import {exec} from 'child_process'
import {
  LoggingUtils, RestError,
  InvestorDetailsRepository,
  Option,
  AccountRepository,
  AppUserRepository,
  AppUser,
  applicationLog
} from 'common';
class ValidationError extends Error{
  constructor(message:string){
    super(message);
    this.name = 'ValidationError';
  }
}
@injectable({scope: BindingScope.APPLICATION})
export class AdobNtbFacade {
  constructor(@repository(AdobeNtbRepository)
  private adobentbRepository: AdobeNtbRepository,
    @service(AppUserFacade) public appUserFacade: AppUserFacade,
    @service(AccountFacade) public accountFacade:AccountFacade,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository) { }


    async create(entity:DataObject<AdobeNtbUser>,options?:Options) {
      try {
        if(!entity?.mobileNumber)  return Promise.reject(new RestError(400, 'Mobile Number Missing', {systemcode: 1121}));
        const appUser = await this.appUserRepository.findOne({where:{contactNumber:entity.mobileNumber}});
        if(!appUser) return Promise.reject(new RestError(400, 'No User Found', {systemcode: 1030}));
        entity.appUserId = appUser.id
        const data = await this.adobentbRepository.create(entity,options)
        return {status:'success'};
      } catch (error) {
        LoggingUtils.error(error);
        return Promise.reject(new RestError(400, 'Failed', {systemcode: 1124}));
      }
    }
}
