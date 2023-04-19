import {BindingScope, injectable, service} from '@loopback/core';
import {Options, repository} from '@loopback/repository';
import {EkycRepository} from '../repositories/ekyc.repository';
import {AppUserFacade} from './app-user.facade';
import {AccountFacade} from './account.facade';
import moment from 'moment-timezone';
import {exec} from 'child_process';
import {
  LoggingUtils,
  RestError,
  InvestorDetailsRepository,
  Option,
  AccountRepository,
  AppUserRepository,
  AppUser,
  applicationLog
} from 'common';
import {ConsolidatedDocumentFacade} from './consolidate-document.facade';
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
@injectable({scope: BindingScope.APPLICATION})
export class EkycFacade {
  constructor(
    @repository(EkycRepository)
    private ekycRepository: EkycRepository,
    @service(AppUserFacade) public appUserFacade: AppUserFacade,
    @service(AccountFacade) public accountFacade: AccountFacade,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @service(ConsolidatedDocumentFacade) private consolidatedDocumentFacade: ConsolidatedDocumentFacade
  ) {}
  //FETCH KRA KYC
  async fetchKRAKYC(token: string | undefined | null, isTokenId = false, transactionId: string, options?: Options): Promise<any> {
    try {
      if (!token) throw new ValidationError('User Token Is Not Valid');
      let userDeatils: AppUser | null;
      //id token is an user id
      if (isTokenId) {
        userDeatils = await this.appUserFacade.findOne({
          where: {
            id: parseInt(token)
          },
          include: [
            {
              relation: 'investorDetails'
            },
            {
              relation: 'primaryAccounts'
            }
          ]
        });
      } else {
        userDeatils = await this.appUserFacade.fetchUserDetailsByToken(token);
      }
      if (!userDeatils) throw new ValidationError('userDetails Missing');
      if (!userDeatils!.investorDetails!.panCardNumber) throw new ValidationError('panCardNumber Missing');
      if (!userDeatils!.investorDetails!.birthDate) throw new ValidationError('birthDate Missing');
      const randomNumber = await this.generateUniqueNumber();
      const encrytionCmd = `java -jar ${__dirname}/../../utils/EncryptionUtil.jar E {###panNumber###:###${
        userDeatils!.investorDetails!.panCardNumber
      }###\\,###arn_code###:###${process.env.USR_MGMT_FCD_EKYC_ARN_CODE}###\\,###dob###:###${moment(
        userDeatils!.investorDetails!.birthDate
      ).format('DD-MM-YYYY')}###\\,###source###:###${process.env.USR_MGMT_FCD_EKYC_SOURCE}###\\,###unique_id###:###${randomNumber}###} ${
        process.env.USR_MGMT_FCD_EKYC_CHECKSUM
      }`;
      // console.log(encrytionCmd);
      const encryptedData: any = await this.encryptRequest(encrytionCmd, randomNumber);
      const response: any = await this.ekycRepository.fetchKRAKYC(
        encryptedData.request,
        encryptedData.checksum,
        encryptedData.key,
        transactionId
      );
      //check response
      if (!response.request && !response.key) throw new Error('Verfiy Ekyc Response is not Valid');
      const decryptionCmd = `java -jar ${__dirname}/../../utils/EncryptionUtil.jar D ${response.request} ${response.key}`;
      //decrypt the request
      const decryptedData: any = await this.decryptRsponse(decryptionCmd);
      const investordetailObject: any = {};
      const appUserObject: any = {};
      const accountObject: any = {};
      const kycStatusMapping: any = {
        IN_PROGRESS: 'inProgress',
        INCOMPLETE: 'incomplete',
        VERIFIED: 'done',
        NOT_VERIFIED: 'pending',
        HOLD: 'hold',
        KYC_EXCEEDED: 'pending',
        SUSPENDED: 'failed'
      };
      //if kycVerifiedFlag true
      if (decryptedData.kycVerifiedFlag) {
        //update the investordetails table with the kyc status
        investordetailObject.kycStatus = Option.GLOBALOPTIONS.KYCSTATUS[kycStatusMapping[decryptedData.kycStatus]].value;
        const inverstorData = await this.investorDetailsRepository
          .updateAll(investordetailObject, {id: userDeatils?.investorDetails?.id})
          .catch(error => {
            throw new Error(error);
          });
        //update the user table with the pan holder name
        appUserObject.name = decryptedData.panHolderName;
        appUserObject.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['userRegistered'].value;
        const userData = await this.appUserRepository.updateAll(appUserObject, {id: userDeatils.id}).catch(error => {
          throw new Error(error);
        });
        //check the primary account exist
        accountObject.name = decryptedData.panHolderName;
        accountObject.accountStatus = Option.GLOBALOPTIONS.ACCOUNTSTATUS['active'].value;
        if (userDeatils.primaryAccounts![0]!.activationDate! == null || userDeatils.primaryAccounts![0]!.activationDate! == undefined) {
          accountObject.activationDate = moment().toDate();
        }
        LoggingUtils.debug('Updating accountOpeningDate in Account', 'fetchKRAKYC');
        const accountData = await this.accountRepository.updateAll(accountObject, {primaryHolderId: userDeatils.id}).catch(error => {
          throw new Error(error);
        });
        // LoggingUtils.debug(`Before Generating FATCA & AOF For user ${JSON.stringify(userDeatils)}`, 'fetchKRAKYC'); //@TODO remove this after testing
        if (userDeatils.primaryAccounts) {
          await this.accountFacade.sendInvestorAccountCreationNotification(userDeatils!.primaryAccounts![0]!.id!, options);
          // LoggingUtils.debug('Sending Queue message to generate FATCA', 'fetchKRAKYC');
          // await this.accountFacade.fatcaGenerationByAccountId(userDeatils.primaryAccounts![0]!.id!).catch(err => LoggingUtils.error(err));
          LoggingUtils.debug('Adding entry to consolidated documents ', 'fetchKRAKYC');
          const consolidateDoc = await this.consolidatedDocumentFacade.createConsolidatedDocumentEntry(
            userDeatils.id!,
            userDeatils.primaryAccounts![0]!.id!
          );
          LoggingUtils.debug(`Consolidated Documents entry done `, 'fetchKRAKYC');
          LoggingUtils.debug('Generating AOF For user', 'fetchKRAKYC');
          await this.accountFacade.generateAOF(userDeatils.primaryAccounts[0].id, 'ria', {}, options).catch(err => LoggingUtils.error(err));
          LoggingUtils.debug('Generating AOF method execution started', 'fetchKRAKYC');
        }
        return Option.GLOBALOPTIONS.KYCSTATUS[kycStatusMapping[decryptedData.kycStatus]];
      } else {
        //if kycVerifiedFlag is false
        const userData = await this.appUserRepository.updateAll(appUserObject, {id: userDeatils.id}).catch(error => {
          throw new Error(error);
        });
        investordetailObject.kycStatus = Option.GLOBALOPTIONS.KYCSTATUS[kycStatusMapping[decryptedData.kycStatus]].value;
        const inverstorData = await this.investorDetailsRepository
          .updateAll(investordetailObject, {appUserId: userDeatils.id})
          .catch(error => {
            throw new Error(error);
          });
        return Option.GLOBALOPTIONS.KYCSTATUS[kycStatusMapping[decryptedData.kycStatus]];
      }
    } catch (err: any) {
      let activityObj = {
        executionDate: new Date(),
        apiName: 'checkEkycStatus ->fetchKRAKYC',
        errorCode: JSON.stringify(err),
        details: JSON.stringify(err),
        status: 'failed'
      };
      applicationLog(activityObj);
      LoggingUtils.error(err);
      //catch validation error
      if (err instanceof ValidationError) {
        return Promise.reject(new RestError(400, err.message));
        //catch rest error
      } else if (err instanceof RestError) {
        return Promise.reject(new RestError(err.status, err.message));
      }
      //unknown error
      return Promise.reject(
        new RestError(465, JSON.parse(err.message).message ? JSON.parse(err.message).message : err.message, {systemcode: 1038})
      );
    }
  }
  //UDATE KRA KYC
  async updateKRAKYC(appUserId: string | undefined | null, transactionId: string): Promise<any> {
    try {
      //validate user token
      if (!appUserId) throw new ValidationError('User Token Is Not Valid');
      // const userDeatils: AppUser = await this.appUserFacade.fetchUserDetailsByToken(token);
      const userDeatils: AppUser | null = await this.appUserFacade.findOne({
        where: {
          id: parseInt(appUserId)
        },
        include: [
          {
            relation: 'investorDetails'
          },
          {
            relation: 'primaryAccounts',
            scope: {
              where: {
                isActive: true
              }
            }
          }
        ]
      });
      if (!userDeatils) throw new ValidationError('userDetails Missing');
      if (!userDeatils!.investorDetails!.panCardNumber) throw new ValidationError('panCardNumber Missing');
      if (!userDeatils!.email || !userDeatils!.contactNumber) throw new ValidationError('contactNumber Missing');
      const randomNumber = await this.generateUniqueNumber();
      let encrytionCmd = `java -jar ${__dirname}/../../utils/EncryptionUtil.jar E {###panNumber###:###${
        userDeatils!.investorDetails!.panCardNumber
      }###\\,###arn_code###:###${process.env.USR_MGMT_FCD_EKYC_ARN_CODE}###\\,###source###:###${
        process.env.USR_MGMT_FCD_EKYC_SOURCE
      }###\\,###unique_id###:###${randomNumber}###\\,###emailId###:###${userDeatils.email}###\\,###mobile###:###${
        userDeatils.contactNumber
      }###} ${process.env.USR_MGMT_FCD_EKYC_CHECKSUM}`;
      // console.log(encrytionCmd);
      const encryptedData: any = await this.encryptRequest(encrytionCmd, randomNumber);
      const response: any = await this.ekycRepository.updateKRAKYC(
        encryptedData.request,
        encryptedData.checksum,
        encryptedData.key,
        transactionId
      );
      //check response
      if (!response.request && !response.key) throw new Error('Verfiy Ekyc Response is not Valid');
      const decryptionCmd = `java -jar ${__dirname}/../../utils/EncryptionUtil.jar D ${response.request} ${response.key}`;
      //decrypt the request
      const decryptedData = await this.decryptRsponse(decryptionCmd);
      return decryptedData;
    } catch (err) {
      let activityObj = {
        executionDate: new Date(),
        apiName: 'verifyPan ->updateKRAKYC',
        errorCode: JSON.stringify(err),
        details: JSON.stringify(err),
        status: 'failed'
      };
      applicationLog(activityObj);
      LoggingUtils.error(err);
      if (err instanceof ValidationError) {
        return Promise.reject(new RestError(400, err.message));
      } else if (err instanceof RestError) {
        return Promise.reject(new RestError(err.status, err.message));
      }
      return Promise.reject(
        new RestError(465, JSON.parse(err.message).message ? JSON.parse(err.message).message : err.message, {systemcode: 1038})
      );
    }
  }

  async encryptRequest(cmd: string, randomNumber: Number) {
    return new Promise((resolve, reject) => {
      exec(cmd, function (err, stdout, stderr) {
        if (err || stderr) reject('ENCRYPTION ERROR');
        // console.log(stdout)
        resolve(JSON.parse(stdout));
      });
    });
  }
  //decrypt request
  async decryptRsponse(cmd: any) {
    return new Promise((resolve, reject) => {
      exec(cmd, function (err, stdout, stderr) {
        if (err || stderr) reject('ENCRYPTION ERROR');
        // console.log(stdout)
        resolve(JSON.parse(stdout));
      });
    });
  }
  //generates the unique number
  async generateUniqueNumber() {
    return Math.floor(Date.now() * Math.random());
  }

  async kycCompleted(id: number) {
    try {
      let investorDetail = await this.investorDetailsRepository
        .find({
          where: {
            appUserId: id,
            isActive: true
          }
        })
        .catch((err: any) => {
          throw new Error(err);
        });

      if (!investorDetail) {
        return Promise.reject(new RestError(400, 'User not found', {systemcode: 1030}));
      }

      let updatedInvestorDetails = await this.investorDetailsRepository
        .updateAll({isKYCDone: true}, {appUserId: id, isActive: true})
        .catch((err: any) => {
          throw new Error(err);
        });

      return updatedInvestorDetails;
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }
}
