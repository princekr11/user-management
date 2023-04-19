import {injectable, inject, BindingScope, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  DataObject,
  Filter,
  FilterExcludingWhere,
  Null,
  Options,
  relation,
  repository,
  Where
} from '@loopback/repository';
import {OperationVisibility, Request, Response} from '@loopback/rest';

import {
  AppUser,
  AppUserRelations,
  AppUserRepository,
  InvestorDetailsRepository,
  RestError,
  BankAccountRepository,
  Option,
  StateRepository,
  TransactionAppFile,
  CountryRepository,
  OccupationRepository,
  WealthSourceRepository,
  IncomeSlabRepository,
  PoliticallyExposureTypeRepository,
  InvestorTypeRepository,
  AccountRepository,
  InvestorDetails,
  IdentificationTypeRepository,
  AddressTypeRepository,
  AddressRepository,
  RelationshipRepository,
  InvestorNomineeRepository,
  OverseesAddressRepository,
  MpinHistory,
  MpinHistoryRepository,
  LoggingUtils,
  AppAccessTokenRepository,
  AppAccessToken,
  DeviceRepository,
  Device,
  OrderUtils,
  IdcomDetailsRepository,
  CryptoUtils,
  CsrFatcaRepository,
  RtaRepository,
  CommunicationQueueMessage,
  CommunicationQueueMessageEventType,
  QueueProducer,
  applicationLog,
  LogApiCallUtils,
  AppUserRoleMappingRepository,
  IStorageService,
  UserManagementAppFileRepository,
  ContainerUtils,
  ServiceProviderAccountRepository,
  DBFUtils,
  FileStorageContainerConfig,
  ExcelUtils,
  LoginAttempsConfig,
  UamIntegrationRepository,
  InvestorDetailsWithRelations,
  MimeTypesConfig,
  AuditTrailRepository,
  TransactionalDataRefreshingQueueMessage,
  TransactionalDataRefreshingQueueMessageEventType,
  UamLoginAttemptsConfigRepository,
  ValidationUtils,
  UamIntegration,
  FormatUtils,
  UamLoginLogs,
  UamLoginLogsRepository,
  CartItemRepository,
  CartRepository,
  NotificationTopics,
  NotificationUtils,
  Account,
  BankAccount,
  InvestorNominee,
  Address,
  TransactionTwoFaRepository,
  AuditTrailFile,
  AuditTrailFileRepository,
  OrderProcessingQueueMessage,
  OrderProcessingQueueMessageEventType,
  InstrumentRepository
} from 'common';
import {WealthfyDomesticFCPRepository, WealthfyDomesticFinacleRepository, KravyRepository, OtpMessages} from '../repositories';
import moment from 'moment-timezone';
import {isEmpty, where} from 'underscore';
import {AccountFacade, AdvisoryClientMasterFacade, AppAccessTokenFacade, DeviceFacade, UamLoginLogsFacade} from '.';
import {CoreBankingFacade} from './core-banking.facade';
import {IdcomIntegrationFacade} from './idcom-integration.facade';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import {xml2js} from 'xml-js';
import https from 'https';
import {uniqBy} from 'lodash';
import _, {map} from 'underscore';
const MAX_OTP_RETRY_COUNT = +(process.env.MAX_OTP_RETRY_COUNT ?? 3);
const MAX_TXN_OTP_RETRY_COUNT = 1000; //@todo need to change this back to 5 again
const EKYCCALLBACKPATH = '../../.tmp/ekycCallBack';
import {promisify} from 'util';
import AppConstant from 'common/dist/constants/app-constant';
import {ActiveDirectoryConfig} from 'common';
const util = require('util');
import NodeRSA from 'node-rsa';
import {ServiceProviderAccount} from 'common';
import {UserManagementAppFile} from 'common';
import Bluebird from 'bluebird';


//Setting up login via active directory for users in UAT and production envs
if ((process.env.AD_AUTHENTICATION && process.env.AD_AUTHENTICATION) === 'true' || process.env.NODE_ENV == 'production') {
  const ActiveDirectory = require('activedirectory');
  const ad = new ActiveDirectory(ActiveDirectoryConfig.getADConfig());
  var authenticateUserAgainstLDAP = function (userCode: string, password: string) {
    return new Promise(function (resolve, reject) {
      ad.authenticate(userCode, password, function (error: any, auth: any) {
        if (error) {
          LoggingUtils.error(error);
          reject(false);
        }
        if (auth) {
          LoggingUtils.info('successful login');
          resolve(auth);
        } else {
          reject(false);
        }
      });
    });
  };
}

/* Remove this block after ldap testing************************* */
if (process.env.AD_USER_PASSWORD && process.env.AD_USER_NAME && process.env.AD_BASE_DN && process.env.AD_DOMAIN && process.env.AD_URL) {
  const ActiveDirectory = require('activedirectory');
  const ad = new ActiveDirectory(ActiveDirectoryConfig.getADConfig());
  var authenticateUserAgainstLDAP = function (userCode: string, password: string) {
    return new Promise(function (resolve, reject) {
      ad.authenticate(userCode, password, function (error: any, auth: any) {
        if (error) {
          LoggingUtils.error(error);
          reject(false);
        }
        if (auth) {
          LoggingUtils.info('successful login');
          resolve(auth);
        } else {
          reject(false);
        }
      });
    });
  };
}
/******************************** */

export type ContactDetails = {
  contactNumber: string;
  email: string;
  countryCode: string;
};

export type PANAndDOBDetails = {
  PAN: string;
  DOB: string;
  deviceId: number;
};

export type VerifyOtpContactDetails = {
  contactNumber: string;
  deviceUniqueId: string;
  countryCode: string;
  otp: string;
  cartItemId?: number;
};

const INDIA = 'India';

type HistoryObj = {
  isActive: boolean;
  lastModifiedDate: Date | undefined;
  createdDate: Date | undefined;
  mpin: string;
  appUserId: number | undefined;
};

type UserAddressType = {
  data: any;
  metaData: any;
};
type UserPersonalDetailsType = {
  data: any;
  metaData: any;
};
type UserProfessionalDetailsType = {
  data: any;
  metaData: any;
};

type AppUserLogsFields = {
  id?: number;
  userCode?: string;
  appUserStatus: number;
  lastLoginDate?: Date;
};

const mpinNotAllowed: string[] = [
  '0123',
  '1234',
  '2345',
  '3456',
  '4567',
  '5678',
  '6789',
  '3210',
  '4321',
  '5432',
  '6543',
  '7654',
  '8765',
  '9876',
  '0000',
  '1111',
  '2222',
  '3333',
  '4444',
  '5555',
  '6666',
  '7777',
  '8888',
  '9999'
];

const sslCrt = process.env.COMMON_DOMAIN_CERT ? fs.readFileSync(process.env.COMMON_DOMAIN_CERT as string, {encoding: 'utf8'}) : '';
const sslCrtKey = process.env.COMMON_DOMAIN_KEY ? fs.readFileSync(process.env.COMMON_DOMAIN_KEY as string, {encoding: 'utf8'}) : '';
const sslCa = process.env.COMMON_OBP_ROOT_CA ? fs.readFileSync(process.env.COMMON_OBP_ROOT_CA as string, {encoding: 'utf8'}) : '';
// All business loigc goes inside Facade layer

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
@injectable({scope: BindingScope.APPLICATION})
export class AppUserFacade {
  constructor(
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(UamLoginLogsRepository) private uamLoginLogsRepository: UamLoginLogsRepository,
    @repository(WealthfyDomesticFCPRepository) private wealthfyDomesticFCPRepository: WealthfyDomesticFCPRepository,
    @repository(WealthfyDomesticFinacleRepository) private wealthfyDomesticFinacleRepository: WealthfyDomesticFinacleRepository,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository,
    @repository(BankAccountRepository) private bankAccountRepository: BankAccountRepository,
    @repository(StateRepository) private stateRepository: StateRepository,
    @repository(CountryRepository) private countryRepository: CountryRepository,
    @repository(OccupationRepository) private occupationRepository: OccupationRepository,
    @repository(WealthSourceRepository) private wealthSourceRepository: WealthSourceRepository,
    @repository(IncomeSlabRepository) private incomeSlabRepository: IncomeSlabRepository,
    @repository(PoliticallyExposureTypeRepository) private politicallyExposureTypeRepository: PoliticallyExposureTypeRepository,
    @repository(InvestorTypeRepository) private investorTypeRepository: InvestorTypeRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @repository(IdentificationTypeRepository) private identificationTypeRepository: IdentificationTypeRepository,
    @repository(AddressTypeRepository) private addressTypeRepository: AddressTypeRepository,
    @repository(AddressRepository) private addressRepository: AddressRepository,
    @repository(RelationshipRepository) private relationshipRepository: RelationshipRepository,
    @repository(InvestorNomineeRepository) private investorNomineeRepository: InvestorNomineeRepository,
    @repository(OverseesAddressRepository) private overseesAddressRepository: OverseesAddressRepository,
    @repository(MpinHistoryRepository) private mpinHistoryRepository: MpinHistoryRepository,
    @repository(AppAccessTokenRepository) private appAccessTokenRepository: AppAccessTokenRepository,
    @repository(DeviceRepository) private deviceRepository: DeviceRepository,
    @repository(IdcomDetailsRepository) private idcomDetailsRepository: IdcomDetailsRepository,
    @repository(CsrFatcaRepository) private csrFatcaRepository: CsrFatcaRepository,
    @repository(RtaRepository) private rtaRepository: RtaRepository,
    @repository(KravyRepository) private kravyRepository: KravyRepository,
    @repository(AppUserRoleMappingRepository) private appUserRoleMappingRepository: RtaRepository,
    @repository(ServiceProviderAccountRepository) private serviceProviderAccountRepository: ServiceProviderAccountRepository,
    @repository(UamLoginAttemptsConfigRepository) private uamLoginAttemptsConfigRepository: UamLoginAttemptsConfigRepository,
    @service(AppAccessTokenFacade) private appAccessTokenFacade: AppAccessTokenFacade,
    @service(CoreBankingFacade) private coreBankingFacade: CoreBankingFacade,
    @service(IdcomIntegrationFacade) private idComIntegrationFacade: IdcomIntegrationFacade,
    @service(AdvisoryClientMasterFacade) private advisoryClientMasterFacade: AdvisoryClientMasterFacade,
    @service(AccountFacade) private accountFacade: AccountFacade,
    @inject('services.fileStorageComponent')
    private fileStorageService: IStorageService,
    @repository(UserManagementAppFileRepository) private userManagementAppFileRepository: UserManagementAppFileRepository,
    @repository(UamIntegrationRepository) private uamIntegrationRepository: UamIntegrationRepository,
    @repository(AuditTrailRepository) private auditTrailRepository: AuditTrailRepository,
    @repository(CartItemRepository) private cartItemRepository: CartItemRepository,
    @repository(CartRepository) private cartRepository: CartRepository,
    @repository(TransactionTwoFaRepository) private transactionTwoFaRepository: TransactionTwoFaRepository,
    @repository(AuditTrailFileRepository) private auditTrailFileRepository: AuditTrailFileRepository,
    @repository(InstrumentRepository) private instrumentRepository: InstrumentRepository
  ) { }

  convertToCamelCase(value: string) {
    let newArray: any = [];
    const splitedValue = value.split(' ');
    _.each(splitedValue, function (item) {
      if (item !== ('and' || 'AND' || '&')) {
        let convertedValue = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
        newArray.push(convertedValue);
      } else {
        newArray.push(item);
      }
    });
    newArray = newArray.join(' ');
    return newArray;
  }

  async create(entity: DataObject<AppUser>, options?: Options): Promise<AppUser> {
    return this.appUserRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AppUser>[], options?: Options): Promise<AppUser[]> {
    return this.appUserRepository.createAll(entities, options);
  }

  async save(entity: AppUser, options?: Options): Promise<AppUser> {
    return this.appUserRepository.save(entity, options);
  }

  async find(filter?: Filter<AppUser>, options?: Options): Promise<(AppUser & AppUserRelations)[]> {
    return this.appUserRepository.find(filter, options);
  }

  async findOne(filter?: Filter<AppUser>, options?: Options): Promise<(AppUser & AppUserRelations) | null> {
    return this.appUserRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<AppUser>, options?: Options): Promise<AppUser & AppUserRelations> {
    return this.appUserRepository.findById(id, filter, options);
  }

  async update(entity: AppUser, options?: Options): Promise<void> {
    return this.appUserRepository.update(entity, options);
  }

  async delete(entity: AppUser, options?: Options): Promise<void> {
    return this.appUserRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AppUser>, where?: Where<AppUser>, options?: Options): Promise<Count> {
    return this.appUserRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AppUser>, options?: Options): Promise<void> {
    return this.appUserRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AppUser>, options?: Options): Promise<void> {
    return this.appUserRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AppUser>, options?: Options): Promise<Count> {
    return this.appUserRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.appUserRepository.deleteById(id, options);
  }

  async count(where?: Where<AppUser>, options?: Options): Promise<Count> {
    return this.appUserRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.appUserRepository.exists(id, options);
  }

  async fetchUserDetailsByToken(token: string | undefined | null): Promise<AppUser | any> {
    return this.appAccessTokenFacade.fetchUserDetailsByToken(token);
  }

  async logout(
    id: number,
    deviceUniqueId: string | undefined | null,
    token: string | undefined | null,
    req: Request,
    options?: Options
  ): Promise<AppUser> {
    return this.appAccessTokenFacade.logout(id, deviceUniqueId, token, req, options);
  }

  async logoutInternalUser(id: number, token: string, options?: Options): Promise<AppUser> {
    return this.appAccessTokenFacade.logoutInternalUser(id, token, options);
  }

  async loginWithMpin(deviceUniqueId: string, mpin: string, request: Request, options?: Options): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const logParams = options!.logParams;
      let id = '';
      this.deviceRepository
        .findOne({
          where: {
            uniqueId: deviceUniqueId,
            isActive: true
          },
          include: ['appUser']
        })
        .then(async (device: Device | null) => {
          if (device && device.appUser) {
            await this.checkLastMpinReset(device.appUser);
            return device;
          }
          return Promise.reject(new RestError(400, 'Invalid MPIN.', {systemcode: 1399}));
        })
        .then(async (device: Device | null) => {
          //check user login attemps
          if (device && device.appUser) {
            await this.checkLoginAttemps(device.appUser.id!);
            return device;
          }
          return Promise.reject(new RestError(400, 'Invalid MPIN.', {systemcode: 1399}));
        })
        .then(async (device: Device | null) => {
          if (device && device.appUser) {
            mpin = '' + mpin; // to handle numeric passwords
            id = device.appUser.id;
            device.appUser.mpin = '' + device.appUser.mpin;
            if (bcrypt.compareSync(mpin, device.appUser.mpin)) {
              await this.appUserRepository.updateById(device.appUser.id, {loginRetryCount: 0});
              return this.appAccessTokenFacade.createToken(device.appUser.id, request);
            }
          }
          return Promise.reject(new RestError(400, 'Invalid MPIN.', {systemcode: 1399}));
        })
        .then(data => {
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {login: true},
            transactionId: logParams.transactionId,
            appUserId: id
          });
          return resolve(data);
        })
        .catch((error: Error) => {
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {login: false},
            transactionId: logParams.transactionId,
            appUserId: id
          });
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async loginWithBiometric(
    deviceUniqueId: string,
    biometricSignature: string,
    request: Request,
    options?: Options
  ): Promise<Record<string, string>> {
    const logParams = options!.logParams;
    let id = '';
    try {
      const device = await this.deviceRepository.findOne({
        where: {
          uniqueId: deviceUniqueId,
          biometricSetup: true,
          isActive: true
        },
        include: ['appUser']
      });

      if (!device || !device.appUser) {
        LogApiCallUtils.sendMessageLoginApiCall({
          loginDate: new Date(),
          ipAddress: logParams.ipAddress,
          source: logParams.source,
          version: logParams.version,
          details: {login: false},
          transactionId: logParams.transactionId,
          appUserId: id
        });
        return Promise.reject(new RestError(400, 'Device not registered', {systemcode: 1012}));
      }
      //check if need to rest mpin
      await this.checkLastMpinReset(device.appUser);
      //check the user Login Attemps
      await this.checkLoginAttemps(device.appUser.id);
      const publicKeyBuffer = Buffer.from(device.publicKey, 'base64');
      const key = new NodeRSA();
      const signer = key.importKey(publicKeyBuffer, 'pkcs8-public-der');
      const signatureVerified = signer.verify(
        Buffer.from(device.biometricToken ? device.biometricToken : ''),
        biometricSignature,
        'utf8',
        'base64'
      );
      //if signature is not verified
      if (!signatureVerified) return Promise.reject(new RestError(400, 'Invalid Signature!', {systemcode: 1024}));

      // if (!(await bcrypt.compare(biometricToken, device.biometricToken)))
      //   return Promise.reject(new RestError(400, 'Invalid credentials!', {systemcode: 1024}));

      const tokenData = await this.appAccessTokenFacade.createToken(device.appUser.id, request);
      id = device.appUser.id;
      LogApiCallUtils.sendMessageLoginApiCall({
        loginDate: new Date(),
        ipAddress: logParams.ipAddress,
        source: logParams.source,
        version: logParams.version,
        transactionId: logParams.transactionId,
        details: {login: true},
        appUserId: id
      });
      return tokenData;
    } catch (err) {
      LogApiCallUtils.sendMessageLoginApiCall({
        loginDate: new Date(),
        ipAddress: logParams.ipAddress,
        source: logParams.source,
        version: logParams.version,
        details: {login: true},
        transactionId: logParams.transactionId,
        appUserId: id
      });
      LoggingUtils.error(err);
      throw err;
    }
  }

  async loginWithPassword(userCode: string, password: string, request: Request, options?: Options): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const logParams = options!.logParams;

      const allIpAddress = logParams.ipAddress.split(',');
      const userIpAddress = allIpAddress.length ? logParams.ipAddress : allIpAddress[0];
      const currentDate = new Date();
      const uamLoginLogsInput: DataObject<UamLoginLogs> = {
        userId: userCode,
        employeeCode: ' ',
        employeeName: ' ',
        loginDate: currentDate,
        loginTime: currentDate.toLocaleTimeString(),
        logoutTime: ' ',
        applicationName: 'WEALTHAPP',
        ipAddress: userIpAddress,
        assetDetails: 'NOT AVAILABLE'
      };

      let id: any = '';
      this.appUserRepository
        .findOne({
          where: {
            userCode: userCode,
            isActive: true
          }
        })
        .then(async (appUser: AppUser | null) => {
          if (!appUser || !appUser.id) {
            return Promise.reject(new RestError(400, 'User not allowed to login!', {systemcode: 1024}));
          }

          if (!appUser?.isActive) {
            return Promise.reject(new RestError(465, 'User not allowed to login!'));
          }

          if (appUser?.appUserStatus !== Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value) {
            return Promise.reject(new RestError(465, 'User not allowed to login!'));
          }

          //check the user login attems
          if ((process.env.AD_AUTHENTICATION && process.env.AD_AUTHENTICATION === 'true') || process.env.NODE_ENV == 'production') {
            if (!appUser || !appUser.id) {
              return Promise.reject(new RestError(400, 'User not allowed to login!', {systemcode: 1024}));
            } else {
              await this.checkLoginAttemps(appUser.id, true, true);
              return appUser;
            }
          }
          if (appUser) {
            await this.checkLoginAttemps(appUser.id!, false, true);
            return appUser;
          }
          return Promise.reject(new RestError(400, 'User not allowed to login!', {systemcode: 1024}));
        })
        .then(async (appUser: AppUser | null) => {
          if (appUser) {
            id = appUser.id;
            password = '' + password; // to handle numeric passwords

            if ((process.env.AD_AUTHENTICATION && process.env.AD_AUTHENTICATION === 'true') || process.env.NODE_ENV == 'production') {
              const adConfigDomain = ActiveDirectoryConfig.getADConfig().domain;
              const adLogin = await authenticateUserAgainstLDAP(`${userCode}@${adConfigDomain}`, password).catch(err => {
                LoggingUtils.error(err);
              });
              if (!adLogin) {
                // In case AD login fails, we check if the user is to be locked
                const maxAllowedLoginAttempts = await this.uamLoginAttemptsConfigRepository.findById(1);
                if (appUser.loginRetryCount + 1 >= maxAllowedLoginAttempts.maxLoginAttempts) {
                  await this.appUserRepository.updateAll(
                    {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].value, isActive: false},
                    {id: appUser.id}
                  );
                  const userLogs: AppUserLogsFields = {
                    id: appUser.id,
                    userCode: appUser.userCode,
                    appUserStatus: appUser.appUserStatus,
                    lastLoginDate: appUser.lastLoginDate
                  };
                  LoggingUtils.info(userLogs, 'User Locked');
                  // if(loginWithAD){
                  const latestUAMData = await this.uamIntegrationRepository.findOne({
                    where: {
                      appUserId: appUser.id,
                      isLatest: true
                    }
                  });
                  if (!latestUAMData) {
                    return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked', {systemcode: 1139}));
                  }

                  const currentLatestRecord = latestUAMData.id;

                  const newUamIntegrationRecord = this.markUserAsLocked(latestUAMData.toJSON(), appUser);

                  latestUAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].label;
                  await this.uamIntegrationRepository.updateAll({isLatest: false}, {id: currentLatestRecord});
                  await this.uamIntegrationRepository.create(newUamIntegrationRecord);
                  return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked'));
                }
                return Promise.reject(new RestError(400, 'Invalid credentials!', {systemcode: 1024}));
              } else {
                await this.appUserRepository.updateById(appUser.id, {loginRetryCount: 0});

                //We also need to log all such internal user logins in uamLoginLogs
                const uamIntegrationData = await this.uamIntegrationRepository.findOne({
                  where: {
                    userCode: userCode,
                    isLatest: true,
                    isActive: true,
                    order: ['id DESC']
                  }
                });

                const createdtokenResults = await this.appAccessTokenFacade.createToken(appUser.id!, request);
                uamLoginLogsInput.employeeCode = uamIntegrationData?.employeeCode;
                uamLoginLogsInput.employeeName = uamIntegrationData?.userName;
                uamLoginLogsInput.token = createdtokenResults.appAccessToken;
                await this.createUamLoginLogs(uamLoginLogsInput, 'login', null);

                return createdtokenResults;
              }
            } else {
              if (bcrypt.compareSync(password, appUser.password)) {
                await this.appUserRepository.updateById(appUser.id, {loginRetryCount: 0});

                const createdtokenResults = await this.appAccessTokenFacade.createToken(appUser.id!, request);
                uamLoginLogsInput.token = createdtokenResults.appAccessToken;
                await this.createUamLoginLogs(uamLoginLogsInput, 'login', null);

                return createdtokenResults;
              } else {
                // In case AD login fails, we check if the user is to be locked
                const maxAllowedLoginAttempts = await this.uamLoginAttemptsConfigRepository.findById(1);
                if (appUser.loginRetryCount + 1 >= maxAllowedLoginAttempts.maxLoginAttempts) {
                  await this.appUserRepository.updateAll(
                    {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].value, isActive: false},
                    {id: appUser.id}
                  );
                  const userLogs: AppUserLogsFields = {
                    id: appUser.id,
                    userCode: appUser.userCode,
                    appUserStatus: appUser.appUserStatus,
                    lastLoginDate: appUser.lastLoginDate
                  };
                  LoggingUtils.info(userLogs, 'User Locked');
                  // if(loginWithAD){
                  const latestUAMData = await this.uamIntegrationRepository.findOne({
                    where: {
                      appUserId: appUser.id,
                      isLatest: true
                    }
                  });
                  if (!latestUAMData) {
                    return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked', {systemcode: 1139}));
                  }

                  const currentLatestRecord = latestUAMData.id;

                  const newUamIntegrationRecord = this.markUserAsLocked(latestUAMData.toJSON(), appUser);

                  latestUAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].label;
                  await this.uamIntegrationRepository.updateAll({isLatest: false}, {id: currentLatestRecord});
                  await this.uamIntegrationRepository.create(newUamIntegrationRecord);
                  return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked', {systemcode: 1139}));
                }
              }
            }
          }
          return Promise.reject(new RestError(400, 'Invalid credentials!', {systemcode: 1024}));
        })
        .then((data: any) => {
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {login: true},
            transactionId: logParams.transactionId,
            appUserId: id
          });
          return resolve(data);
        })
        .catch((error: Error) => {
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {login: false, error},
            transactionId: logParams.transactionId,
            appUserId: id
          });
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async loginWithPasswordMock(userCode: string, password: string, request: Request, options?: Options): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const logParams = options!.logParams;
      let id: any = '';
      this.appUserRepository
        .findOne({
          where: {
            userCode: userCode,
            isActive: true
          }
        })
        .then(async (appUser: AppUser | null) => {
          if (!appUser || !appUser.id) {
            return Promise.reject(new RestError(400, 'User not allowed to login!', {systemcode: 1024}));
          }

          if (!appUser?.isActive) {
            return Promise.reject(new RestError(465, 'User not allowed to login!', {systemcode: 1024}));
          }

          if (appUser?.appUserStatus !== Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value) {
            return Promise.reject(new RestError(465, 'User not allowed to login!', {systemcode: 1024}));
          }

          //check the user login attems
          if (true) {
            if (!appUser || !appUser.id) {
              return Promise.reject(new RestError(400, 'User not allowed to login!', {systemcode: 1024}));
            } else {
              await this.checkLoginAttempsMock(appUser.id, true, true);
              return appUser;
            }
          }
          // if (appUser) {
          //   await this.checkLoginAttempsMock(appUser.id!, false, true);
          //   return appUser;
          // }
          return Promise.reject(new RestError(400, 'User not allowed to login!', {systemcode: 1024}));
        })
        .then(async (appUser: AppUser | null) => {
          if (appUser) {
            id = appUser.id;
            password = '' + password; // to handle numeric passwords

            if (true) {
              const adConfigDomain = ActiveDirectoryConfig.getADConfig().domain;
              const adLogin = await authenticateUserAgainstLDAP(`${userCode}@${adConfigDomain}`, password);
              if (!adLogin) {
                return Promise.reject(new RestError(400, 'Invalid credentials!', {systemcode: 1024}));
              } else {
                return this.appAccessTokenFacade.createToken(appUser.id!, request);
              }
            }
            // else {
            //   if (bcrypt.compareSync(password, appUser.password)) {
            //     return this.appAccessTokenFacade.createToken(appUser.id!, request);
            //   }
            // }
          }
          return Promise.reject(new RestError(400, 'Invalid credentials!', {systemcode: 1024}));
        })
        .then((data: any) => {
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {login: true},
            transactionId: logParams.transactionId,
            appUserId: id
          });
          return resolve(data);
        })
        .catch((error: Error) => {
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {login: false, error},
            transactionId: logParams.transactionId,
            appUserId: id
          });
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async loginWithPasswordMock2(userCode: string, password: string): Promise<any> {
    try {
      const adConfigDomain = ActiveDirectoryConfig.getADConfig().domain;
      const adLogin = await authenticateUserAgainstLDAP(`${userCode}@${adConfigDomain}`, password);
      return JSON.stringify(adLogin);
    } catch (err) {
      throw err;
    }
  }

  async checkIfExistingWealthfyCustomer(customerId: string, transactionId: string): Promise<boolean> {
    let customerExits: boolean;
    type UserDetails = {
      name: string;
      bosCode: string;
      description: string | null;
      maturityDays: string | null;
      maturityDate: Date;
      id: number;
      isActive: boolean;
      createdDate: Date;
      lastModifiedDate: Date;
      isISAAccountAvailable: boolean;
    };

    const FCPBUser: UserDetails = await this.wealthfyDomesticFCPRepository
      .fetchUserSegmentDetailsFCPB(customerId, transactionId)
      .catch(err => {
        return Promise.resolve(false);
      });
    if (
      (FCPBUser && FCPBUser.bosCode && (FCPBUser.bosCode === 'ISA' || FCPBUser.bosCode === 'PBG' || FCPBUser.bosCode === 'PBGP')) ||
      FCPBUser.isISAAccountAvailable
    ) {
      customerExits = true;
      return Promise.resolve(customerExits);
    } else {
      const finacleUser: UserDetails = await this.wealthfyDomesticFinacleRepository
        .fetchUserSegmentDetailsFinacle(customerId, transactionId)
        .catch(err => {
          return Promise.resolve(false);
        });
      if (
        (finacleUser &&
          finacleUser.bosCode &&
          (finacleUser.bosCode === 'ISA' || finacleUser.bosCode === 'PBG' || finacleUser.bosCode === 'PBGP')) ||
        finacleUser.isISAAccountAvailable
      ) {
        customerExits = true;
        return Promise.resolve(customerExits);
      } else {
        customerExits = false;
        return Promise.resolve(customerExits);
      }
    }
  }

  async getPersonalDetailsById(id: number, options?: Options): Promise<UserPersonalDetailsType> {
    type AccountOpening = {
      Name: string | '';
      Gender: string | '';
      Email: string | '';
      Mobile: string | '';
      PAN: string | '';
      Nationality: string | '';
      DateOfBirth: string | null;
      BirthCity: string | '';
      BirthState: string | '';
      FatherName: string | '';
      MothersName: string | '';
      MaritalStatus: string | '';
    };

    type MfKYC = {
      Name: string | '';
      Gender: string | '';
      Email: string | '';
      Mobile: string | '';
      PAN: string | '';
      Nationality: string | '';
      DateOfBirth: string | null;
      FatherName: string | '';
      MaritalStatus: string | '';
    };

    type MfRTA = {
      Name: string | '';
      Email: string | '';
      Mobile: string | '';
      PAN: string | '';
      Nationality: string | '';
      DateOfBirth: string | null;
      BirthCity: string | '';
      BirthState: string | '';
      FatherName: string | '';
      MothersName: string | '';
      MaritalStatus: string | '';
      IdentificationType: string | '';
    };

    type MetaData = {
      accountOpening: AccountOpening;
      mfKYC: MfKYC;
      mfRTA: MfRTA;
    };
    let metaData: any = {
      accountOpening: {},
      mfKYC: {},
      mfRTA: {}
    };

    type DataType = {
      Name: string | '';
      Gender: string | '';
      Email: string | '';
      Mobile: string | '';
      PAN: string | '';
      Nationality: string | '';
      DateOfBirth: string | null;
      BirthCity: string | '';
      BirthState: string | '';
      FatherName: string | '';
      MothersName: string | '';
      MaritalStatus: string | '';
      IdentificationType: string | '';
    };
    let data: any = {};
    return new Promise((resolve, reject) => {
      this.appUserRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            },
            include: [
              {
                relation: 'investorDetails',
                scope: {
                  include: ['countryOfBirth', 'identificationType', 'permanentAddress', 'stateOfBirth']
                }
              }
            ]
          },
          options
        )
        .then(user => {
          if (!user) {
            return Promise.reject(new RestError(404, 'User not found', {systemcode: 1030}));
          }

          data.name = user?.name ? user?.name : '';
          data.gender = user.gender ? user.gender : '';
          data.genderLabel = user.genderLabel ? user.genderLabel : '';
          data.email = user.email ? user.email : '';
          data.contactNumber = user.contactNumber ? user.contactNumber : '';
          data.contactNumberCountryCode = user.contactNumberCountryCode ? user.contactNumberCountryCode : '';
          data.PAN = user.investorDetails && user.investorDetails.panCardNumber ? user.investorDetails.panCardNumber : '';
          data.nationality =
            user.investorDetails && user.investorDetails.countryOfBirth && user.investorDetails.countryOfBirth.bseCodeForNationality
              ? user.investorDetails.countryOfBirth.bseCodeForNationality
              : '';
          data.nationalityId =
            user.investorDetails && user.investorDetails.countryOfBirth && user.investorDetails.countryOfBirth.id
              ? user.investorDetails.countryOfBirth.id
              : null;
          data.dateOfBirth =
            user.investorDetails && user.investorDetails.birthDate && moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              ? moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              : null;
          data.birthCity = user.investorDetails && user.investorDetails.birthCity ? user.investorDetails.birthCity : '';
          data.birthState =
            user.investorDetails && user.investorDetails.stateOfBirth && user.investorDetails.stateOfBirth.name
              ? user.investorDetails.stateOfBirth.name
              : '';
          data.birthStateId =
            user.investorDetails && user.investorDetails.stateOfBirth && user.investorDetails.stateOfBirth.id
              ? user.investorDetails.stateOfBirth.id
              : null;
          data.fatherName = user.investorDetails && user.investorDetails.fatherName ? user.investorDetails.fatherName : '';
          data.motherName = user.investorDetails && user.investorDetails.motherName ? user.investorDetails.motherName : '';
          data.spouseName = user.investorDetails && user.investorDetails.spouseName ? user.investorDetails.spouseName : '';
          data.maritalStatus = user.investorDetails && user.investorDetails.maritalStatus ? user.investorDetails.maritalStatus : null;
          data.maritalStatusLabel =
            user.investorDetails && user.investorDetails.maritalStatusLabel ? user.investorDetails.maritalStatusLabel : '';
          data.identificationType =
            user.investorDetails && user.investorDetails.identificationType && user.investorDetails.identificationType.name
              ? user.investorDetails.identificationType.name
              : '';
          data.identificationTypeId =
            user.investorDetails && user.investorDetails.identificationType && user.investorDetails.identificationType.id
              ? user.investorDetails.identificationType.id
              : null;
          metaData.accountOpening.name = user.name ? user.name : '';
          metaData.accountOpening.gender = user.genderLabel ? user.genderLabel : '';
          metaData.accountOpening.email = user.email ? user.email : '';
          metaData.accountOpening.contactNumber = user.contactNumber ? user.contactNumber : '';
          metaData.accountOpening.PAN =
            user.investorDetails && user.investorDetails.panCardNumber ? user.investorDetails.panCardNumber : '';
          metaData.accountOpening.nationality =
            user.investorDetails && user.investorDetails.countryOfBirth && user.investorDetails.countryOfBirth.bseCodeForNationality
              ? user.investorDetails.countryOfBirth.bseCodeForNationality
              : '';
          metaData.accountOpening.dateOfBirth =
            user.investorDetails && user.investorDetails.birthDate && moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              ? moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              : null;
          metaData.accountOpening.birthCity = user.investorDetails && user.investorDetails.birthCity ? user.investorDetails.birthCity : '';
          metaData.accountOpening.fatherName =
            user.investorDetails && user.investorDetails.fatherName ? user.investorDetails.fatherName : '';
          metaData.accountOpening.motherName =
            user.investorDetails && user.investorDetails.motherName ? user.investorDetails.motherName : '';

          metaData.accountOpening.spouseName =
            user.investorDetails && user.investorDetails.spouseName ? user.investorDetails.spouseName : '';
          metaData.accountOpening.maritalStatus =
            user.investorDetails && user.investorDetails.maritalStatusLabel ? user.investorDetails.maritalStatusLabel : '';
          metaData.accountOpening.birthState =
            user.investorDetails && user.investorDetails.stateOfBirth && user.investorDetails.stateOfBirth.name
              ? user.investorDetails.stateOfBirth.name
              : '';

          metaData.mfKYC.name = user.name ? user.name : '';
          metaData.mfKYC.gender = user.genderLabel ? user.genderLabel : '';
          metaData.mfKYC.email = user.email ? user.email : '';
          metaData.mfKYC.contactNumber = user.contactNumber ? user.contactNumber : '';
          metaData.mfKYC.PAN = user.investorDetails && user.investorDetails.panCardNumber ? user.investorDetails.panCardNumber : '';
          metaData.mfKYC.nationality =
            user.investorDetails && user.investorDetails.countryOfBirth && user.investorDetails.countryOfBirth.bseCodeForNationality
              ? user.investorDetails.countryOfBirth.bseCodeForNationality
              : '';
          metaData.mfKYC.dateOfBirth =
            user.investorDetails && user.investorDetails.birthDate && moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              ? moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              : null;
          metaData.mfKYC.fatherName = user.investorDetails && user.investorDetails.fatherName ? user.investorDetails.fatherName : '';
          metaData.mfKYC.maritalStatus =
            user.investorDetails && user.investorDetails.maritalStatusLabel ? user.investorDetails.maritalStatusLabel : '';

          // mfrta obj -> Name, gender(YO), dob, pan, mobile, email,birthCity(ymc),birthstone(ymc),nationality,maritialstatus,IdentificationType
          metaData.mfRTA.name = user.name ?? '';
          metaData.mfRTA.email = user.email ?? '';
          metaData.mfRTA.contactNumber = user.contactNumber ?? '';
          metaData.mfRTA.PAN = user.investorDetails && user.investorDetails.panCardNumber ? user.investorDetails.panCardNumber : '';
          metaData.mfRTA.dateOfBirth =
            user.investorDetails && user.investorDetails.birthDate && moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              ? moment(user.investorDetails.birthDate).format('YYYY-MM-DD')
              : null;
          //DL-1992 to consider identificationtype as pan card number & birth state as birth city
          metaData.mfRTA.identificationType = metaData.mfRTA.PAN;
          /**
           * we're inputting value from app screen hence not blocking user if missing this values
           */
          // metaData.mfRTA.maritalStatus =
          //   user.investorDetails && user.investorDetails.maritalStatusLabel ? user.investorDetails.maritalStatusLabel : '';
          // metaData.mfRTA.birthCity = user.investorDetails && user.investorDetails.birthCity ? user.investorDetails.birthCity : '';
          // metaData.mfRTA.birthState = metaData.mfRTA.birthCity;
          //DL-1992 need to verify nationality, Which value to be set from country ? As of now setting country name
          // metaData.mfRTA.nationality =
          //   user.investorDetails && user.investorDetails.countryOfBirth && user.investorDetails.countryOfBirth.name
          //     ? user.investorDetails.countryOfBirth.name
          //     : '';

          return resolve({data: data, metaData: metaData});
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async updatePersonalDetailsById(id: number, personalDetails: any, options?: Options): Promise<object> {
    return new Promise((resolve, reject) => {
      this.appUserRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            }
          },
          options
        )
        .then((user: AppUser | null): Promise<InvestorDetails> => {
          if (!user) {
            return Promise.reject(new RestError(400, 'User not found', {systemcode: 1030}));
          }
          if (!personalDetails && !personalDetails.name) {
            return Promise.reject(new RestError(400, 'User name required!', {systemcode: 1151}));
          }

          //updating state and country table
          let investorDetailsDataObj: any = {};
          investorDetailsDataObj.panCardNumber = personalDetails.PAN;
          investorDetailsDataObj.fatherName = personalDetails.fatherName;
          investorDetailsDataObj.motherName = personalDetails.mothersName;
          investorDetailsDataObj.spouseName = personalDetails.spouseName;
          investorDetailsDataObj.maritalStatus = personalDetails.maritalStatus;
          investorDetailsDataObj.birthDate = personalDetails.dateOfBirth;
          investorDetailsDataObj.birthCity = personalDetails.birthCity;
          investorDetailsDataObj.lastModifiedDate = new Date();
          investorDetailsDataObj.gender = personalDetails.gender;
          investorDetailsDataObj.stateOfBirthId = personalDetails.birthState;
          investorDetailsDataObj.countryOfBirthId = personalDetails.nationality;
          investorDetailsDataObj.identificationTypeId = personalDetails.identificationType;

          return Promise.resolve(investorDetailsDataObj);
        })
        .then((investorDetailsObj: InvestorDetails) => {
          let userObject: any = {};
          userObject.name = personalDetails.name;
          userObject.email = personalDetails.email;
          userObject.contactNumber = personalDetails.contactNumber;
          userObject.updatedDetailsFlag = true;
          userObject.lastModifiedDate = new Date();
          userObject.contactNumberCountryCode = personalDetails.contactNumberCountryCode;

          const investorData = this.investorDetailsRepository.updateAll(
            investorDetailsObj,
            {
              isActive: true,
              appUserId: id
            },
            options
          );
          const userData = this.appUserRepository.updateAll(
            userObject,
            {
              id: id,
              isActive: true
            },
            options
          );
          return Promise.all([investorData, userData]);
        })
        .then(() => {
          return resolve({success: true});
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async getAddressDetailsById(id: number, options?: Options): Promise<UserAddressType> {
    let metaData: any = {
      correspondenceAddress: {accountOpening: {}, mfKYC: {}, mfRTA: {}},
      permanentAddress: {accountOpening: {}, mfKYC: {}, mfRTA: {}},
      overseesAddress: {accountOpening: {}, mfKYC: {}, mfRTA: {}}
    };
    let data: any = {correspondenceAddress: {}, permanentAddress: {}, overseesAddress: {}};
    return new Promise((resolve, reject) => {
      this.appUserRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            },
            include: [
              {
                relation: 'investorDetails',
                scope: {
                  include: [
                    {
                      relation: 'permanentAddress',
                      scope: {
                        include: [
                          {
                            relation: 'addressType'
                          },
                          {
                            relation: 'state',
                            scope: {
                              include: [
                                {
                                  relation: 'country'
                                }
                              ]
                            }
                          }
                        ]
                      }
                    },
                    {
                      relation: 'correspondenceAddress',
                      scope: {
                        include: [
                          {
                            relation: 'addressType'
                          },
                          {
                            relation: 'state',
                            scope: {
                              include: [
                                {
                                  relation: 'country'
                                }
                              ]
                            }
                          }
                        ]
                      }
                    },
                    {
                      relation: 'overseesAddress',
                      scope: {
                        include: [
                          {
                            relation: 'addressType'
                          },
                          {
                            relation: 'country'
                          }
                        ]
                      }
                    },
                    {
                      relation: 'investorType'
                    }
                  ]
                }
              }
            ]
          },
          options
        )
        .then(user => {
          if (!user) {
            return Promise.reject(new RestError(404, 'User not found', {systemcode: 1030}));
          }
          data.correspondenceAddress.addressLine1 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine1
              ? user.investorDetails.correspondenceAddress.addressLine1
              : '';
          data.correspondenceAddress.addressLine2 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine2
              ? user.investorDetails.correspondenceAddress.addressLine2
              : '';
          data.correspondenceAddress.addressLine3 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine3
              ? user.investorDetails.correspondenceAddress.addressLine3
              : '';
          data.correspondenceAddress.city =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.city
              ? user.investorDetails.correspondenceAddress.city
              : '';
          data.correspondenceAddress.pincode =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.pincode
              ? user.investorDetails.correspondenceAddress.pincode
              : '';
          data.correspondenceAddress.landmark =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.landmark
              ? user.investorDetails.correspondenceAddress.landmark
              : '';
          data.correspondenceAddress.state =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.name
              ? user.investorDetails.correspondenceAddress.state.name
              : '';
          data.correspondenceAddress.stateId =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.id
              ? user.investorDetails.correspondenceAddress.state.id
              : null;
          data.correspondenceAddress.addressType =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.addressType &&
              user.investorDetails.correspondenceAddress.addressType.name
              ? user.investorDetails.correspondenceAddress.addressType.name
              : '';
          data.correspondenceAddress.addressTypeId =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.addressType &&
              user.investorDetails.correspondenceAddress.addressType.id
              ? user.investorDetails.correspondenceAddress.addressType.id
              : null;
          data.correspondenceAddress.country =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.country &&
              user.investorDetails.correspondenceAddress.state.country.name
              ? user.investorDetails.correspondenceAddress.state.country.name
              : '';
          data.correspondenceAddress.countryId =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.country &&
              user.investorDetails.correspondenceAddress.state.country.id
              ? user.investorDetails.correspondenceAddress.state.country.id
              : null;

          data.correspondenceAddress.proofOfAddress = ''; //for now , will map properly later

          data.permanentAddress.addressLine1 =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.addressLine1
              ? user.investorDetails.permanentAddress.addressLine1
              : '';
          data.permanentAddress.addressLine2 =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.addressLine2
              ? user.investorDetails.permanentAddress.addressLine2
              : '';
          data.permanentAddress.addressLine3 =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.addressLine3
              ? user.investorDetails.permanentAddress.addressLine3
              : '';
          data.permanentAddress.city =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.city
              ? user.investorDetails.permanentAddress.city
              : '';
          data.permanentAddress.pincode =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.pincode
              ? user.investorDetails.permanentAddress.pincode
              : '';
          data.permanentAddress.landmark =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.landmark
              ? user.investorDetails.permanentAddress.landmark
              : '';
          data.permanentAddress.state =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.state &&
              user.investorDetails.permanentAddress.state.name
              ? user.investorDetails.permanentAddress.state.name
              : '';
          data.permanentAddress.stateId =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.state &&
              user.investorDetails.permanentAddress.state.id
              ? user.investorDetails.permanentAddress.state.id
              : null;
          data.permanentAddress.addressType =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.addressType &&
              user.investorDetails.permanentAddress.addressType.name
              ? user.investorDetails.permanentAddress.addressType.name
              : '';
          data.permanentAddress.addressTypeId =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.addressType &&
              user.investorDetails.permanentAddress.addressType.id
              ? user.investorDetails.permanentAddress.addressType.id
              : null;
          data.permanentAddress.country =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.state &&
              user.investorDetails.permanentAddress.state.country &&
              user.investorDetails.permanentAddress.state.country.name
              ? user.investorDetails.permanentAddress.state.country.name
              : '';
          data.permanentAddress.countryId =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.state &&
              user.investorDetails.permanentAddress.state.country &&
              user.investorDetails.permanentAddress.state.country.id
              ? user.investorDetails.permanentAddress.state.country.id
              : null;
          data.permanentAddress.proofOfAddress = ''; //for now , will map properly later

          data.overseesAddress.addressLine1 =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine1
              ? user.investorDetails.overseesAddress.addressLine1
              : '';
          data.overseesAddress.addressLine2 =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine2
              ? user.investorDetails.overseesAddress.addressLine2
              : '';
          data.overseesAddress.city =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.city
              ? user.investorDetails.overseesAddress.city
              : '';
          data.overseesAddress.pincode =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.pincode
              ? user.investorDetails.overseesAddress.pincode
              : '';
          data.overseesAddress.landmark =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.landmark
              ? user.investorDetails.overseesAddress.landmark
              : '';
          data.overseesAddress.state =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.state
              ? user.investorDetails.overseesAddress.state
              : null;
          data.overseesAddress.addressType =
            user.investorDetails &&
              user.investorDetails.overseesAddress &&
              user.investorDetails.overseesAddress.addressType &&
              user.investorDetails.overseesAddress.addressType.name
              ? user.investorDetails.overseesAddress.addressType.name
              : '';
          data.overseesAddress.addressTypeId =
            user.investorDetails &&
              user.investorDetails.overseesAddress &&
              user.investorDetails.overseesAddress.addressType &&
              user.investorDetails.overseesAddress.addressType.id
              ? user.investorDetails.overseesAddress.addressType.id
              : null;
          data.overseesAddress.country =
            user.investorDetails &&
              user.investorDetails.overseesAddress &&
              user.investorDetails.overseesAddress.country &&
              user.investorDetails.overseesAddress.country.name
              ? user.investorDetails.overseesAddress.country.name
              : '';
          data.overseesAddress.countryId =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.countryId
              ? user.investorDetails.overseesAddress.countryId
              : null;
          metaData.correspondenceAddress.accountOpening.addressLine1 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine1
              ? user.investorDetails.correspondenceAddress.addressLine1
              : '';
          metaData.correspondenceAddress.accountOpening.addressLine2 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine2
              ? user.investorDetails.correspondenceAddress.addressLine2
              : '';
          metaData.correspondenceAddress.accountOpening.city =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.city
              ? user.investorDetails.correspondenceAddress.city
              : '';
          metaData.correspondenceAddress.accountOpening.pincode =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.pincode
              ? user.investorDetails.correspondenceAddress.pincode
              : '';
          metaData.correspondenceAddress.accountOpening.landmark =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.landmark
              ? user.investorDetails.correspondenceAddress.landmark
              : '';
          metaData.correspondenceAddress.accountOpening.state =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.name
              ? user.investorDetails.correspondenceAddress.state.name
              : '';

          metaData.correspondenceAddress.mfKYC.addressLine1 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine1
              ? user.investorDetails.correspondenceAddress.addressLine1
              : '';
          metaData.correspondenceAddress.mfKYC.addressLine2 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine2
              ? user.investorDetails.correspondenceAddress.addressLine2
              : '';
          metaData.correspondenceAddress.mfKYC.city =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.city
              ? user.investorDetails.correspondenceAddress.city
              : '';
          metaData.correspondenceAddress.mfKYC.pincode =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.pincode
              ? user.investorDetails.correspondenceAddress.pincode
              : '';
          metaData.correspondenceAddress.mfKYC.landmark =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.landmark
              ? user.investorDetails.correspondenceAddress.landmark
              : '';
          metaData.correspondenceAddress.mfKYC.state =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.name
              ? user.investorDetails.correspondenceAddress.state.name
              : '';
          metaData.correspondenceAddress.mfKYC.addressType =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.addressType &&
              user.investorDetails.correspondenceAddress.addressType.name
              ? user.investorDetails.correspondenceAddress.addressType.name
              : '';
          metaData.correspondenceAddress.mfKYC.country =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.country &&
              user.investorDetails.correspondenceAddress.state.country.name
              ? user.investorDetails.correspondenceAddress.state.country.name
              : '';

          metaData.correspondenceAddress.mfKYC.proofOfAddress = '';

          metaData.correspondenceAddress.mfRTA.addressLine1 =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine1
              ? user.investorDetails.correspondenceAddress.addressLine1
              : '';
          // metaData.correspondenceAddress.mfRTA.addressLine2 =
          //   user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.addressLine2
          //     ? user.investorDetails.correspondenceAddress.addressLine2
          //     : '';
          metaData.correspondenceAddress.mfRTA.city =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.city
              ? user.investorDetails.correspondenceAddress.city
              : '';
          metaData.correspondenceAddress.mfRTA.pincode =
            user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.pincode
              ? user.investorDetails.correspondenceAddress.pincode
              : '';
          // metaData.correspondenceAddress.mfRTA.landmark =
          //   user.investorDetails && user.investorDetails.correspondenceAddress && user.investorDetails.correspondenceAddress.landmark
          //     ? user.investorDetails.correspondenceAddress.landmark
          //     : '';
          metaData.correspondenceAddress.mfRTA.state =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.name
              ? user.investorDetails.correspondenceAddress.state.name
              : '';
          metaData.correspondenceAddress.mfRTA.country =
            user.investorDetails &&
              user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.state &&
              user.investorDetails.correspondenceAddress.state.country &&
              user.investorDetails.correspondenceAddress.state.country.name
              ? user.investorDetails.correspondenceAddress.state.country.name
              : '';

          metaData.permanentAddress.accountOpening.addressLine1 =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.addressLine1
              ? user.investorDetails.permanentAddress.addressLine1
              : '';
          metaData.permanentAddress.accountOpening.addressLine2 =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.addressLine2
              ? user.investorDetails.permanentAddress.addressLine2
              : '';
          metaData.permanentAddress.accountOpening.city =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.city
              ? user.investorDetails.permanentAddress.city
              : '';
          metaData.permanentAddress.accountOpening.pincode =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.pincode
              ? user.investorDetails.permanentAddress.pincode
              : '';
          metaData.permanentAddress.accountOpening.landmark =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.landmark
              ? user.investorDetails.permanentAddress.landmark
              : '';
          metaData.permanentAddress.accountOpening.state =
            user.investorDetails &&
            user.investorDetails.permanentAddress &&
            user.investorDetails.permanentAddress.state &&
            user.investorDetails.permanentAddress.state.name;

          metaData.permanentAddress.mfKYC.addressLine1 =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.addressLine1
              ? user.investorDetails.permanentAddress.addressLine1
              : '';
          metaData.permanentAddress.mfKYC.addressLine2 =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.addressLine2
              ? user.investorDetails.permanentAddress.addressLine2
              : '';
          metaData.permanentAddress.mfKYC.city =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.city
              ? user.investorDetails.permanentAddress.city
              : '';
          metaData.permanentAddress.mfKYC.pincode =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.pincode
              ? user.investorDetails.permanentAddress.pincode
              : '';
          metaData.permanentAddress.mfKYC.landmark =
            user.investorDetails && user.investorDetails.permanentAddress && user.investorDetails.permanentAddress.landmark
              ? user.investorDetails.permanentAddress.landmark
              : '';
          metaData.permanentAddress.mfKYC.state =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.state &&
              user.investorDetails.permanentAddress.state.name
              ? user.investorDetails.permanentAddress.state.name
              : '';
          metaData.permanentAddress.mfKYC.addressType =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.addressType &&
              user.investorDetails.permanentAddress.addressType.name
              ? user.investorDetails.permanentAddress.addressType.name
              : '';
          metaData.permanentAddress.mfKYC.country =
            user.investorDetails &&
              user.investorDetails.permanentAddress &&
              user.investorDetails.permanentAddress.state &&
              user.investorDetails.permanentAddress.state.country &&
              user.investorDetails.permanentAddress.state.country.name
              ? user.investorDetails.permanentAddress.state.country.name
              : '';

          metaData.permanentAddress.mfKYC.proofOfAddress = '';

          metaData.overseesAddress.accountOpening.addressLine1 =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine1
              ? user.investorDetails.overseesAddress.addressLine1
              : '';
          metaData.overseesAddress.accountOpening.addressLine2 =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine2
              ? user.investorDetails.overseesAddress.addressLine2
              : '';
          metaData.overseesAddress.accountOpening.city =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.city
              ? user.investorDetails.overseesAddress.city
              : '';
          metaData.overseesAddress.accountOpening.pincode =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.pincode
              ? user.investorDetails.overseesAddress.pincode
              : '';

          metaData.overseesAddress.mfKYC.addressLine1 =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine1
              ? user.investorDetails.overseesAddress.addressLine1
              : '';
          metaData.overseesAddress.mfKYC.addressLine2 =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine2
              ? user.investorDetails.overseesAddress.addressLine2
              : '';
          metaData.overseesAddress.mfKYC.city =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.city
              ? user.investorDetails.overseesAddress.city
              : '';
          metaData.overseesAddress.mfKYC.pincode =
            user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.pincode
              ? user.investorDetails.overseesAddress.pincode
              : '';

          if (user.investorDetails && user.investorDetails.investorType && user.investorDetails.investorType.name === 'NRI-Others') {
            metaData.overseesAddress.mfRTA.addressLine1 =
              user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine1
                ? user.investorDetails.overseesAddress.addressLine1
                : '';
            // metaData.overseesAddress.mfRTA.addressLine2 =
            //   user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.addressLine2
            //     ? user.investorDetails.overseesAddress.addressLine2
            //     : '';
            metaData.overseesAddress.mfRTA.city =
              user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.city
                ? user.investorDetails.overseesAddress.city
                : '';
            metaData.overseesAddress.mfRTA.pincode =
              user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.pincode
                ? user.investorDetails.overseesAddress.pincode
                : '';
            // metaData.overseesAddress.mfRTA.landmark =
            //   user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.landmark
            //     ? user.investorDetails.overseesAddress.landmark
            //     : '';
            metaData.overseesAddress.mfRTA.state =
              user.investorDetails && user.investorDetails.overseesAddress && user.investorDetails.overseesAddress.state
                ? user.investorDetails.overseesAddress.state
                : '';
            metaData.overseesAddress.mfRTA.country =
              user.investorDetails &&
                user.investorDetails.overseesAddress &&
                user.investorDetails.overseesAddress.country &&
                user.investorDetails.overseesAddress.country.name
                ? user.investorDetails.overseesAddress.country.name
                : '';
          }
          return resolve({data: data, metaData: metaData});
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  //reviewUserDetails
  async reviewUserDetails(id: number, isMfrta = false, options?: Options) {
    try {
      LoggingUtils.debug('reviewUserDetails invoked ', 'reviewUserDetails');
      //fetch Address Details
      const userAddress: UserAddressType = await this.getAddressDetailsById(id, options);
      LoggingUtils.debug('user address fetched ', 'reviewUserDetails');
      //get Personal Details
      const personalDeatils: UserPersonalDetailsType = await this.getPersonalDetailsById(id, options);

      //PAN Number Masking
      if (personalDeatils && personalDeatils.data && personalDeatils.data.PAN) {
        personalDeatils.data.PAN = FormatUtils.panMaskFormat(personalDeatils.data.PAN);
      }
      if (
        personalDeatils &&
        personalDeatils.metaData &&
        personalDeatils.metaData.accountOpening &&
        personalDeatils.metaData.accountOpening.PAN
      ) {
        personalDeatils.metaData.accountOpening.PAN = FormatUtils.panMaskFormat(personalDeatils.metaData.accountOpening.PAN);
      }
      if (personalDeatils && personalDeatils.metaData && personalDeatils.metaData.mfKYC && personalDeatils.metaData.mfKYC.PAN) {
        personalDeatils.metaData.mfKYC.PAN = FormatUtils.panMaskFormat(personalDeatils.metaData.mfKYC.PAN);
      }
      if (personalDeatils && personalDeatils.metaData && personalDeatils.metaData.mfRTA && personalDeatils.metaData.mfRTA.PAN) {
        personalDeatils.metaData.mfRTA.PAN = FormatUtils.panMaskFormat(personalDeatils.metaData.mfRTA.PAN);
      }

      if (
        personalDeatils &&
        personalDeatils.data &&
        personalDeatils.data.identificationType &&
        AppConstant.PAN_NUMBER_REG_EX.test(personalDeatils.data.identificationType)
      ) {
        personalDeatils.data.identificationType = FormatUtils.panMaskFormat(personalDeatils.data.identificationType);
      }
      if (
        personalDeatils &&
        personalDeatils.metaData &&
        personalDeatils.metaData.accountOpening &&
        personalDeatils.metaData.accountOpening.identificationType &&
        AppConstant.PAN_NUMBER_REG_EX.test(personalDeatils.metaData.accountOpening.identificationType)
      ) {
        personalDeatils.metaData.accountOpening.identificationType = FormatUtils.panMaskFormat(
          personalDeatils.metaData.accountOpening.identificationType
        );
      }
      if (
        personalDeatils &&
        personalDeatils.metaData &&
        personalDeatils.metaData.mfKYC &&
        personalDeatils.metaData.mfKYC.identificationType &&
        AppConstant.PAN_NUMBER_REG_EX.test(personalDeatils.metaData.mfKYC.identificationType)
      ) {
        personalDeatils.metaData.mfKYC.identificationType = FormatUtils.panMaskFormat(personalDeatils.metaData.mfKYC.identificationType);
      }
      if (
        personalDeatils &&
        personalDeatils.metaData &&
        personalDeatils.metaData.mfRTA &&
        personalDeatils.metaData.mfRTA.identificationType &&
        AppConstant.PAN_NUMBER_REG_EX.test(personalDeatils.metaData.mfRTA.identificationType)
      ) {
        personalDeatils.metaData.mfRTA.identificationType = FormatUtils.panMaskFormat(personalDeatils.metaData.mfRTA.identificationType);
      }

      LoggingUtils.debug('personal details fetched ', 'reviewUserDetails');
      //get Professional Details
      const professionalDeatils: UserProfessionalDetailsType = await this.getProfessionalDetailsById(id, options);
      LoggingUtils.debug('professional details fetched ', 'reviewUserDetails');
      //get Bank details
      const accountDetails: any = await this.accountRepository.findOne({
        where: {primaryHolderId: id}
      });
      let bankAccountDetails: any;
      if (isMfrta === true) {
        bankAccountDetails = await this.accountFacade.mfrtaGetBankDetailsById(accountDetails.id, options);
      } else {
        bankAccountDetails = await this.accountFacade.getBankDetailsById(accountDetails.id, options);
      }

      const mfRTA = bankAccountDetails.metaData.mfRTA.map((ele: any) => {
        return {accountNumber: ele.accountNumber, ifscCode: ele.ifscCode};
      });
      bankAccountDetails['metaData']['mfRTA'] = mfRTA;
      LoggingUtils.debug('bank details fetched ', 'reviewUserDetails');

      //consolidated data
      const finalData = {
        userAddress: {...userAddress},
        userPersonalDetails: {...personalDeatils},
        userProfessionalDetails: {...professionalDeatils},
        userBankAccountsDetails: {...bankAccountDetails}
      };
      LoggingUtils.debug('final data fetched ', 'reviewUserDetails');
      return finalData;
    } catch (error) {
      LoggingUtils.error(error, 'reviewUserDetails');
      throw error;
    }
  }
  async getProfessionalDetailsById(id: number, options?: Options): Promise<UserProfessionalDetailsType> {
    let metaData: any = {accountOpening: {}, mfRTA: {}};
    let data: any = {};
    return new Promise((resolve, reject) => {
      this.appUserRepository
        .findOne(
          {
            fields: ['id', 'name', 'investorDetails'],
            where: {
              id: id,
              isActive: true
            },
            include: [
              {
                relation: 'investorDetails',
                scope: {
                  where: {isActive: true},
                  include: [
                    {
                      relation: 'occupation',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'wealthSource',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'incomeSlab',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'politicallyExposureType',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'taxResidentCountry',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'identificationType4',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'identificationType3',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'identificationType2',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'taxResidentCountry2',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'taxResidentCountry3',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'taxResidentCountry4',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'investorType',
                      scope: {
                        where: {isActive: true},
                        fields: ['id', 'name']
                      }
                    },
                    {
                      relation: 'correspondenceAddress',
                      scope: {
                        include: [
                          {
                            relation: 'addressType'
                          },
                          {
                            relation: 'state',
                            scope: {
                              include: [
                                {
                                  relation: 'country'
                                }
                              ]
                            }
                          }
                        ]
                      }
                    },
                  ]
                }
              }
            ]
          },
          options
        )
        .then(user => {
          if (!user) {
            return Promise.reject(new RestError(404, 'User not found', {systemcode: 1030}));
          }
          data.employerName = user.name ? user.name : '';
          data.employerCategory = '';
          data.occupationId =
            user.investorDetails && user.investorDetails.occupation && user.investorDetails.occupation.id
              ? user.investorDetails.occupation.id
              : null;
          data.occupation =
            user.investorDetails && user.investorDetails.occupation && user.investorDetails.occupation.name
              ? user.investorDetails.occupation.name
              : '';
          data.sourceOfFunds =
            user.investorDetails && user.investorDetails.wealthSource && user.investorDetails.wealthSource.name
              ? user.investorDetails.wealthSource.name
              : '';
          data.sourceOfFundsId =
            user.investorDetails && user.investorDetails.wealthSource && user.investorDetails.wealthSource.id
              ? user.investorDetails.wealthSource.id
              : null;
          data.grossAnnualIncome =
            user.investorDetails && user.investorDetails.incomeSlab && user.investorDetails.incomeSlab.name
              ? user.investorDetails.incomeSlab.name
              : '';
          data.grossAnnualIncomeId =
            user.investorDetails && user.investorDetails.incomeSlab && user.investorDetails.incomeSlab.id
              ? user.investorDetails.incomeSlab.id
              : null;
          data.politicalExposure =
            user.investorDetails && user.investorDetails.politicallyExposureType && user.investorDetails.politicallyExposureType.name
              ? user.investorDetails.politicallyExposureType.name
              : '';
          data.grossMonthlyIncome =
            user.investorDetails && user.investorDetails.incomeSlab && user.investorDetails.incomeSlab.name
              ? user.investorDetails.incomeSlab.name
              : '';
          data.grossMonthlyIncomeId =
            user.investorDetails && user.investorDetails.incomeSlab && user.investorDetails.incomeSlab.id
              ? user.investorDetails.incomeSlab.id
              : null;
          let taxResidentCountry =
            user.investorDetails && user.investorDetails.taxResidentCountry && user.investorDetails.taxResidentCountry.name
              ? user.investorDetails.taxResidentCountry.name
              : '';
          data.countryOfTaxResidency = taxResidentCountry;
          data.countryOfTaxResidencyId =
            user.investorDetails && user.investorDetails.taxResidentCountry && user.investorDetails.taxResidentCountry.id
              ? user.investorDetails.taxResidentCountry.id
              : null;

          data.taxIdentificationNumber =
            user.investorDetails && user.investorDetails.identificationNumber ? user.investorDetails.identificationNumber : '';
          // add identification fetching 2 and 3
          data.taxIdentificationNumber2 = user.investorDetails && user.investorDetails.identificationNumber2 ? user.investorDetails.identificationNumber2 : '';
          data.taxIdentificationNumber3 = user.investorDetails && user.investorDetails.identificationNumber3 ? user.investorDetails.identificationNumber3 : '';
          data.taxIdentificationNumber4 = user.investorDetails && user.investorDetails.identificationNumber4 ? user.investorDetails.identificationNumber4 : '';
          data.countryOfTaxResidency2 = user.investorDetails && user.investorDetails.taxResidentCountryId2 ? user.investorDetails.taxResidentCountryId2 : '';
          data.countryOfTaxResidency3 = user.investorDetails && user.investorDetails.taxResidentCountryId3 ? user.investorDetails.taxResidentCountryId3 : '';
          data.countryOfTaxResidency4 = user.investorDetails && user.investorDetails.taxResidentCountryId4 ? user.investorDetails.taxResidentCountryId4 : '';
          data.countryOfTaxResidency2Name = user.investorDetails && user.investorDetails.taxResidentCountry2 ? user.investorDetails.taxResidentCountry2.name : '';
          data.countryOfTaxResidency3Name = user.investorDetails && user.investorDetails.taxResidentCountry3 ? user.investorDetails.taxResidentCountry3.name : '';
          data.countryOfTaxResidency4Name = user.investorDetails && user.investorDetails.taxResidentCountry4 ? user.investorDetails.taxResidentCountry4.name : '';
          data.identificationType = user.investorDetails && user.investorDetails?.identificationTypeId ? user.investorDetails.identificationTypeId : '';
          data.identificationType2 = user.investorDetails && user.investorDetails?.identificationTypeId2 ? user.investorDetails.identificationTypeId2 : '';
          data.identificationType3 = user.investorDetails && user.investorDetails?.identificationTypeId3 ? user.investorDetails.identificationTypeId3 : '';
          data.identificationType4 = user.investorDetails && user.investorDetails?.identificationTypeId4 ? user.investorDetails.identificationTypeId4 : '';
          data.identificationType2Name = user.investorDetails && user.investorDetails?.identificationType2 ? user.investorDetails.identificationType2.name : '';
          data.identificationType3Name = user.investorDetails && user.investorDetails?.identificationType3 ? user.investorDetails.identificationType3.name : '';
          data.identificationType4Name = user.investorDetails && user.investorDetails?.identificationType4 ? user.investorDetails.identificationType4.name : '';

          data.taxStatus =
            user.investorDetails && user.investorDetails.investorType && user.investorDetails.investorType.name
              ? user.investorDetails.investorType.name
              : '';
          data.taxStatusId =
            user.investorDetails && user.investorDetails.investorType && user.investorDetails.investorType.id
              ? user.investorDetails.investorType.id
              : null;

          //Fetching data that was updated in professional details. Requires rework as things need to be moved in production (app as well as backend)
          //-------------------------
          data.countryId = user.investorDetails && user.investorDetails.taxResidentCountry && user.investorDetails.taxResidentCountry.id
            ? user.investorDetails.taxResidentCountry.id
            : null;
          data.country = user.investorDetails && user.investorDetails.taxResidentCountry && user.investorDetails.taxResidentCountry.name
            ? user.investorDetails.taxResidentCountry.name
            : '';
          data.birthCity = user.investorDetails && user.investorDetails.birthCity ? user.investorDetails.birthCity : '';
          data.fatherName = user.investorDetails && user.investorDetails.fatherName ? user.investorDetails.fatherName : '';
          data.motherName = user.investorDetails && user.investorDetails.motherName ? user.investorDetails.motherName : '';
          data.spouseName = user.investorDetails && user.investorDetails.spouseName ? user.investorDetails.spouseName : '';
          data.maritalStatusId = user.investorDetails && user.investorDetails.maritalStatus ? user.investorDetails.maritalStatus : null;
          data.maritalStatus = user.investorDetails && user.investorDetails.maritalStatusLabel ? user.investorDetails.maritalStatusLabel : '';
          data.addressType =
            user.investorDetails && user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.addressType &&
              user.investorDetails.correspondenceAddress.addressType.name
              ? user.investorDetails.correspondenceAddress.addressType.name : ''

          data.addressTypeId =
            // have to check with bank which adfdress to fetch for address type ?
            user.investorDetails && user.investorDetails.correspondenceAddress &&
              user.investorDetails.correspondenceAddress.addressType &&
              user.investorDetails.correspondenceAddress.addressType.id
              ? user.investorDetails.correspondenceAddress.addressType.id : null
          data.taxResident = user.investorDetails && user.investorDetails.taxResidentCountryId && user.investorDetails.taxResidentCountryId == 106 ? 'No' : 'Yes';
          //-------------------------

          //metaData
          metaData.accountOpening.employerName = user.name ? user.name : '';
          metaData.accountOpening.employerCategory = '';
          metaData.accountOpening.occupation =
            user.investorDetails && user.investorDetails.occupation && user.investorDetails.occupation.name
              ? user.investorDetails.occupation.name
              : '';
          metaData.accountOpening.sourceOfFunds =
            user.investorDetails && user.investorDetails.wealthSource && user.investorDetails.wealthSource.name
              ? user.investorDetails.wealthSource.name
              : '';
          metaData.accountOpening.grossAnnualIncome =
            user.investorDetails && user.investorDetails.incomeSlab && user.investorDetails.incomeSlab.name
              ? user.investorDetails.incomeSlab.name
              : '';
          metaData.accountOpening.grossMonthlyIncome =
            user.investorDetails && user.investorDetails.incomeSlab && user.investorDetails.incomeSlab.name
              ? user.investorDetails.incomeSlab.name
              : '';
          metaData.accountOpening.countryOfTaxResidency = taxResidentCountry;
          if (!taxResidentCountry && taxResidentCountry !== INDIA) {
            metaData.accountOpening.taxIdentificationNumber =
              user.investorDetails && user.investorDetails.identificationNumber ? user.investorDetails.identificationNumber : '';
          }
          metaData.accountOpening.taxStatus =
            user.investorDetails && user.investorDetails.investorType && user.investorDetails.investorType.name
              ? user.investorDetails.investorType.name
              : '';

          //Professional -> Sourceoffund, grossanualincome, political exposer, tax status, countryoftaxresidency, taxidentificationnumber,occupation
          metaData.mfRTA.occupation =
            user.investorDetails && user.investorDetails.occupation && user.investorDetails.occupation.name
              ? user.investorDetails.occupation.name
              : '';
          metaData.mfRTA.sourceOfFunds =
            user.investorDetails && user.investorDetails.wealthSource && user.investorDetails.wealthSource.name
              ? user.investorDetails.wealthSource.name
              : '';
          metaData.mfRTA.grossAnnualIncome =
            user.investorDetails && user.investorDetails.incomeSlab && user.investorDetails.incomeSlab.name
              ? user.investorDetails.incomeSlab.name
              : '';
          metaData.mfRTA.countryOfTaxResidency = taxResidentCountry;
          if (taxResidentCountry !== INDIA) {
            // set pan number over here DL-1992
            metaData.mfRTA.taxIdentificationNumber =
              user.investorDetails && user.investorDetails.panCardNumber ? user.investorDetails.panCardNumber : '';
          }
          metaData.mfRTA.taxStatus =
            user.investorDetails && user.investorDetails.investorType && user.investorDetails.investorType.name
              ? user.investorDetails.investorType.name
              : '';
          return resolve({data: data, metaData: metaData});
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async updateProfessionalDetailsById(id: number, professionalDetails: any, options?: Options): Promise<object> {
    return new Promise((resolve, reject) => {
      let investorDetail: InvestorDetails;
      const methodName = 'updateProfessionalDetailsById';
      LoggingUtils.debug('Step 1', methodName);
      this.appUserRepository
        .findOne({
          where: {
            id: id,
            isActive: true
          },
          include: ['investorDetails']
        })
        .then((user: AppUser | null): Promise<InvestorDetails> => {
          if (!user) {
            LoggingUtils.debug('Step 2', methodName);
            return Promise.reject(new RestError(400, 'User not found', {systemcode: 1030}));
          }

          if (!user.investorDetails) {
            LoggingUtils.debug('Step 2', methodName);
            return Promise.reject(new RestError(400, 'Investor details not found', {systemcode: 1030}));
          }
          // if (user.isProfessionalDetailsUpdated){
          //   return Promise.reject(new RestError(465, 'Professional details can be set only once', {}));
          // }
          if (!professionalDetails) {
            LoggingUtils.debug('Step 3', methodName);
            return Promise.reject(new RestError(400, 'ProfessionalDetails required!', {systemcode: 1032}));
          }

          if (professionalDetails.maritalStatus == Option.GLOBALOPTIONS.MARITALSTATUS.married.value && (!professionalDetails.spouseName || professionalDetails.spouseName.legth === 0)) {
            return Promise.reject(new RestError(400, 'Spouse name is required!', {systemcode: 1394}));
          }

          LoggingUtils.debug('Step 4', methodName);
          const politicalExposureData = professionalDetails.politicalExposure
            ? this.politicallyExposureTypeRepository.findOne(
              {
                where: {
                  name: professionalDetails.politicalExposure,
                  isActive: true
                }
              },
              options
            )
            : null;
          /**
           * this country is used for birth country
           */
          const countryData = professionalDetails.country
            ? this.countryRepository.findOne(
              {
                where: {
                  id: professionalDetails.country,
                  isActive: true
                }
              },
              options
            )
            : null;

          let investorDetailsDataObj: any = {};
          investorDetail = user.investorDetails;
          LoggingUtils.debug('Step 5', methodName);
          //USing country id instead of country name , Id won't change in near future.
          // if (professionalDetails.country !== 106) {
          //   LoggingUtils.debug('Step 6', methodName);
          //   investorDetailsDataObj.identificationNumber = professionalDetails.taxIdentificationNumber;
          // }

          return Promise.all([countryData, politicalExposureData]).then(values => {
            LoggingUtils.debug('Step 7', methodName);
            investorDetailsDataObj.birthCity = professionalDetails.birthCity;
            investorDetailsDataObj.fatherName = professionalDetails.fatherName;
            investorDetailsDataObj.motherName = professionalDetails.motherName ?? null;
            investorDetailsDataObj.spouseName = professionalDetails.spouseName ?? null;
            investorDetailsDataObj.maritalStatus = professionalDetails.maritalStatus;

            // investorDetailsDataObj.employerCategory = professionalDetails?.employerCategory;
            /**
             * check for birth country
             */
            if (values && values[0] != null) {
              LoggingUtils.debug('Step 8', methodName);
              // investorDetailsDataObj.taxResidentCountryId = values && values[0] && values[0].id;
              investorDetailsDataObj.countryOfBirthId = values && values[0] && values[0].id;
            }
            /**
             * Need to manage taxResident positive flow i.e value with YES and Country data for no value will be INDIA, 106
             */
            if (professionalDetails.taxResident.toLowerCase() == 'no') {
              investorDetailsDataObj.taxResidentCountryId = 106
              investorDetailsDataObj.identificationNumber = investorDetail.panCardNumber;
              investorDetailsDataObj.identificationTypeId = 3
            } else {
              // if yes selected then even for that we are showing taxResientCountry as india in app and idtype as PAN and idNumber as PAN number
              //update identificationNumber2,3 and 4
              investorDetailsDataObj.taxResidentCountryId = 106
              investorDetailsDataObj.identificationNumber = investorDetail.panCardNumber;
              investorDetailsDataObj.identificationTypeId = 3
              investorDetailsDataObj.identificationNumber2 = professionalDetails.taxIdentificationNumber2 ? professionalDetails.taxIdentificationNumber2 : null;
              investorDetailsDataObj.identificationNumber3 = professionalDetails.taxIdentificationNumber3 ? professionalDetails.taxIdentificationNumber3 : null;
              investorDetailsDataObj.identificationNumber4 = professionalDetails.taxIdentificationNumber4 ? professionalDetails.taxIdentificationNumber4 : null;

              //update country for all 3
              investorDetailsDataObj.taxResidentCountryId2 = professionalDetails.countryOfTaxResidency2 ? professionalDetails.countryOfTaxResidency2 : null;
              investorDetailsDataObj.taxResidentCountryId3 = professionalDetails.countryOfTaxResidency3 ? professionalDetails.countryOfTaxResidency3 : null;
              investorDetailsDataObj.taxResidentCountryId4 = professionalDetails.countryOfTaxResidency4 ? professionalDetails.countryOfTaxResidency4 : null;
              // update for type for all 3
              investorDetailsDataObj.identificationTypeId2 = professionalDetails.identificationType2 ? professionalDetails.identificationType2 : null;
              investorDetailsDataObj.identificationTypeId3 = professionalDetails.identificationType3 ? professionalDetails.identificationType3 : null;
              investorDetailsDataObj.identificationTypeId4 = professionalDetails.identificationType4 ? professionalDetails.identificationType4 : null;
            }

            if (values && values[1] != null) {
              LoggingUtils.debug('Step 9', methodName);
              investorDetailsDataObj.politicallyExposureTypeId = values && values[1] && values[1].id;
            }
            investorDetailsDataObj.occupationId = professionalDetails?.occupation;
            investorDetailsDataObj.wealthSourceId = professionalDetails?.sourceOfFunds;
            investorDetailsDataObj.incomeSlabId = professionalDetails?.grossAnnualIncome;
            // investorDetailsDataObj.investorTypeId = professionalDetails?.taxStatus;
            //Setting fatca registration status as done
            LoggingUtils.debug('Step 10', methodName);
            investorDetailsDataObj.fatcaRegistrationStatus = Option.GLOBALOPTIONS.FATCAREGISTRATIONSTATUS.done.value;
            LoggingUtils.debug('Step 11', methodName);
            return Promise.resolve(investorDetailsDataObj);
          });
        })
        .then(async (investorDetailsObj: InvestorDetails) => {
          LoggingUtils.debug('Step 12', methodName);
          let userObject: any = {};
          if (professionalDetails && professionalDetails.employerName) {
            LoggingUtils.debug('Step 13', methodName);
            userObject.name = professionalDetails?.employerName;
          }
          LoggingUtils.debug('Step 14', methodName);
          userObject.updatedDetailsFlag = true;
          userObject.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['FATCAReady'].value;
          // have to check if which address to upadte ? currently updating both address correspondence and permenant
          const addressIds = [];
          if (investorDetail.permanentAddressId) {
            addressIds.push(investorDetail.permanentAddressId);
          }

          if (investorDetail.correspondenceAddressId) {
            addressIds.push(investorDetail.correspondenceAddressId);
          }
          // updating permanent address Type
          if (addressIds.length > 0) {
            await this.addressRepository.updateAll({
              addressTypeId: professionalDetails.addressTypeId
            }, {
              id: {
                inq: addressIds
              },
              isActive: true
            })
          }


          const investorData = await this.investorDetailsRepository.updateAll(
            investorDetailsObj,
            {
              isActive: true,
              appUserId: id
            },
            options
          );
          LoggingUtils.debug('Step 15', methodName);
          const userData = await this.appUserRepository.updateAll(
            userObject,
            {
              id: id,
              isActive: true
            },
            options
          );
          LoggingUtils.debug('Step 16', methodName);
          //Add entries to csrFatca table for fatca genration
          const fetchAccount = await this.accountRepository.findOne({
            where: {
              primaryHolderId: id
            }
          });

          if (fetchAccount === null) {
            LoggingUtils.debug('Step 17', methodName);
            throw new Error('No Account found');
          }

          const fetchRTAKArvy = await this.rtaRepository.findOne(
            {
              where: {
                isActive: true,
                name: 'KFintech'
              }
            },
            options
          );

          const fetchRTACams = await this.rtaRepository.findOne(
            {
              where: {
                isActive: true,
                name: 'CAMS'
              }
            },
            options
          );

          if (fetchRTAKArvy === null || fetchRTACams === null) {
            LoggingUtils.debug('Step 18', methodName);
            throw new Error('No RTA found');
          }

          const csrFatca = await this.csrFatcaRepository.find(
            {
              where: {accountId: fetchAccount.id}
            },
            options
          );

          if (csrFatca && csrFatca.length === 0) {
            LoggingUtils.debug('Step 19', methodName);
            const csrFatcaCams = {
              accountId: fetchAccount.id,
              status: Option.GLOBALOPTIONS.FATCAGENERATIONSTATUS.pending.value,
              rtaId: fetchRTACams.id
            };
            const csrFatcaKarvy = {
              accountId: fetchAccount.id,
              status: Option.GLOBALOPTIONS.FATCAGENERATIONSTATUS.pending.value,
              rtaId: fetchRTAKArvy.id
            };

            const createCsrFatca = await this.csrFatcaRepository.createAll([csrFatcaCams, csrFatcaKarvy]);

            if (!createCsrFatca) {
              LoggingUtils.debug('Step 20', methodName);
              throw new Error('Error while creating csrFatca records');
            }
          } else if (csrFatca.length === 1) {
            LoggingUtils.debug('Step 21', methodName);
            let csr = {};
            if (csrFatca[0].rtaId == fetchRTACams.id) {
              csr = {
                accountId: fetchAccount.id,
                status: Option.GLOBALOPTIONS.FATCAGENERATIONSTATUS.pending.value,
                rtaId: fetchRTAKArvy.id
              };
            } else {
              csr = {
                accountId: fetchAccount.id,
                status: Option.GLOBALOPTIONS.FATCAGENERATIONSTATUS.pending.value,
                rtaId: fetchRTACams.id
              };
            }

            const createCsrFatca = await this.csrFatcaRepository.createAll([csr]);

            if (!createCsrFatca) {
              LoggingUtils.debug('Step 22', methodName);
              throw new Error('Error while creating csrFatca records');
            }
          }
          LoggingUtils.debug('Step 23', methodName);
          return Promise.all([investorData, userData]).catch((err: Error) => {
            LoggingUtils.error(err);
            return reject(err);
          });
        })
        .then(async () => {
          await this.appUserRepository.updateById(id, {isProfessionalDetailsUpdated: true});
          LoggingUtils.debug('Step 24', methodName);
        })
        .then(() => {
          LoggingUtils.debug('Step 25', methodName);
          return resolve({sucess: true});
        })
        .catch((err: Error) => {
          LoggingUtils.error(err, methodName);
          return reject(err);
        });
    });
  }

  async updateAddressDetailsById(id: number, addressDetails: any, options?: Options): Promise<object> {
    return new Promise((resolve, reject) => {
      this.appUserRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            }
          },
          options
        )
        .then((user: AppUser | null): Promise<any> => {
          if (!user) {
            return Promise.reject(new RestError(400, 'User not found', {systemcode: 1030}));
          }
          if (!addressDetails) {
            return Promise.reject(new RestError(400, 'Address Details required!', {systemcode: 1167}));
          }
          //updating state and country table
          let correspondenceAddress = addressDetails.correspondenceAddress;
          let permanentAddress = addressDetails.permanentAddress;
          let overseasAddress = addressDetails.overseasAddress;

          if (!correspondenceAddress && !correspondenceAddress.addressLine1) {
            return Promise.reject(new RestError(400, 'Correspondence address Line1 required!', {systemcode: 1168}));
          }

          const investorDetail = this.investorDetailsRepository.findOne({
            where: {
              appUserId: user.id,
              isActive: true
            }
          });
          return Promise.all([investorDetail, correspondenceAddress, permanentAddress, overseasAddress]).then(values => {
            let corresspondenceObj: any = {};
            let permanentObj: any = {};
            let overseasObj: any = {};
            //correspondenceAddress
            if (values && values.length > 0) {
              corresspondenceObj.lastModifiedDate = new Date();
              corresspondenceObj.stateId = values && values[1] && values[1].state;
              corresspondenceObj.addressTypeId = values && values[1] && values[1].addressType;
              corresspondenceObj.addressLine1 = values && values[1] && values[1].addressLine1;
              corresspondenceObj.addressLine2 = values && values[1] && values[1].addressLine2;
              corresspondenceObj.city = values && values[1] && values[1].city;
              corresspondenceObj.pincode = values && values[1] && values[1].pincode;
              corresspondenceObj.landmark = values && values[1] && values[1].landmark;

              const corresspondenceAddressId = values && values[0] && values[0].correspondenceAddressId;
              const updatedCoressPondenceAdd = this.addressRepository.updateAll(corresspondenceObj, {id: corresspondenceAddressId});
              //permanentAddress
              permanentObj.lastModifiedDate = new Date();
              permanentObj.stateId = values && values[2] && values[2].state;
              permanentObj.addressTypeId = values && values[2] && values[2].addressType;
              permanentObj.addressLine1 = values && values[2] && values[2].addressLine1;
              permanentObj.addressLine2 = values && values[2] && values[2].addressLine2;
              permanentObj.city = values && values[2] && values[2].city;
              permanentObj.pincode = values && values[2] && values[2].pincode;
              permanentObj.landmark = values && values[2] && values[2].landmark;

              const permanentAddressId = values && values[0] && values[0].permanentAddressId;
              const updatedPermanentAdd = this.addressRepository.updateAll(permanentObj, {id: permanentAddressId});

              //overseasAddress
              overseasObj.lastModifiedDate = new Date();
              overseasObj.stateId = values && values[3] && values[3].state;
              overseasObj.addressTypeId = values && values[3] && values[3].addressType;
              overseasObj.addressLine1 = values && values[3] && values[3].addressLine1;
              overseasObj.addressLine2 = values && values[3] && values[3].addressLine2;
              overseasObj.city = values && values[3] && values[3].city;
              overseasObj.pincode = values && values[3] && values[3].pincode;
              overseasObj.landmark = values && values[3] && values[3].landmark;

              const overseasAddressId = values && values[0] && values[0].overseesAddressId;
              const updatedOverseasAdd = this.overseesAddressRepository.updateAll(overseasObj, {id: overseasAddressId});
              return Promise.all([updatedCoressPondenceAdd, updatedPermanentAdd, updatedOverseasAdd]);
            }
          });
        })
        .then(() => {
          return resolve({success: true});
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async setupMpin(id: number, data: any, request: Request): Promise<any> {
    if (mpinNotAllowed.includes(data.mpin)) {
      return Promise.reject(new RestError(400, 'MPIN is repetitive or in series, Set unique MPIN', {systemcode: 1171}));
    }
    try {
      const isMpinSetupAlready = await this.appUserRepository.findOne({
        where: {
          id: id,
          isActive: true,
          mpinSetup: true
        }
      });

      if (isMpinSetupAlready) {
        return Promise.reject(new RestError(400, 'Mpin is already setup', {systemcode: 1177}));
      }
      // for ntb user
      let appUser = await this.appUserRepository.findOne({where: {id: id, isActive: true}});

      if (!appUser) {
        return Promise.reject(new RestError(404, 'User not found', {systemcode: 1030}));
      }

      //Bocked User should not be allowed to create Mpin
      const blockedUserStatus = [
        Option.GLOBALOPTIONS.APPUSERSTATUS['advisoryUser'].value,
        Option.GLOBALOPTIONS.APPUSERSTATUS['wealthfyDomesticUser'].value,
        Option.GLOBALOPTIONS.APPUSERSTATUS['blocked'].value
      ];

      if (blockedUserStatus.includes(appUser.appUserStatus)) {
        return Promise.reject(new RestError(465, 'You are not allowed to setup mpin', {systemcode: 1178}));
      }

      const hashMpin = bcrypt.hashSync(data.mpin, salt);

      const historyData = await this.mpinHistoryRepository.find({
        order: ['createdDate DESC'],
        limit: 3,
        where: {appUserId: id}
      });

      if (!historyData) {
        return Promise.reject(new RestError(400, 'history Data not found', {systemcode: 1179}));
      }

      for (let element of historyData) {
        const isEXists = bcrypt.compareSync(data.mpin, element.mpin);
        if (isEXists) {
          return Promise.reject(new RestError(400, 'Can not use a previously used mpin!', {systemcode: 1013}));
        }
      }

      if (appUser.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['NTBUser'].value) {
        await this.appUserRepository.updateById(id, {
          mpin: hashMpin,
          mpinResetDate: new Date(),
          mpinSetup: true
        });
        const userLogs: AppUserLogsFields = {
          id: appUser.id,
          userCode: appUser.userCode,
          appUserStatus: appUser.appUserStatus,
          lastLoginDate: appUser.lastLoginDate
        };
        LoggingUtils.info(userLogs, 'Mpin Created');
      } else if (historyData.length != 0) {
        // @todo Need to check if these two can be put in a transaction and committed together
        await this.appUserRepository.updateById(id, {
          mpin: hashMpin,
          mpinResetDate: new Date(),
          mpinSetup: true
        });
        LoggingUtils.info(
          {
            userCode: appUser.userCode,
            appUserStatus: appUser.appUserStatus,
            lastLoginDate: appUser.lastLoginDate
          },
          'Mpin Created'
        );
      } else {
        await this.appUserRepository.updateById(id, {
          mpin: hashMpin,
          appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['PINSetupCompleted'].value, // Pin setup completed
          mpinResetDate: new Date(),
          mpinSetup: true
        });
        LoggingUtils.info(
          {
            userCode: appUser.userCode,
            appUserStatus: appUser.appUserStatus,
            lastLoginDate: appUser.lastLoginDate
          },
          'Mpin Created'
        );
      }

      //update devices set mpi and biometric flag to true
      await this.deviceRepository.updateAll(
        {
          mpinSetup: true
          // biometricSetup : true
        },
        {
          appUserId: id
        }
      );
      let historyObj: HistoryObj = {
        isActive: false,
        lastModifiedDate: undefined,
        createdDate: undefined,
        mpin: '',
        appUserId: undefined
      };
      historyObj.isActive = true;
      historyObj.lastModifiedDate = new Date();
      historyObj.createdDate = new Date();
      historyObj.mpin = hashMpin;
      historyObj.appUserId = id;
      await this.mpinHistoryRepository.create(historyObj);
      let token = await this.appAccessTokenFacade.createToken(id, request);

      //for notification

      const account = await this.accountRepository.findOne({
        where: {
          isActive: true,
          primaryHolderId: id,
          fields: ['id']
        }
      })
      if (account == null || account == undefined) {
        await NotificationUtils.sendNotificationEvent({
          accountId: NotificationTopics.INVESTOR_WITHOUT_ACCOUNT,
          topicId: NotificationTopics.TOPICS.login.mpin.value,
          templateKeys: {date: moment().format('DD/MM/YY'), time: moment().format('HH:mm'), customerName: appUser!.name, emailId: 'mailto:smartwealth@hdfcbank.com'},
          notificationType: NotificationTopics.TOPICS.login.mpin.topic,
          userId: id
        })
      } else {
        await NotificationUtils.sendNotificationEvent({
          accountId: account!.id!,
          topicId: NotificationTopics.TOPICS.login.mpin.value,
          templateKeys: {date: moment().format('DD/MM/YY'), time: moment().format('HH:mm'), customerName: appUser!.name, emailId: 'mailto:smartwealth@hdfcbank.com'},
          notificationType: NotificationTopics.TOPICS.login.mpin.topic
        })
      }

      return {success: true, appAccessToken: token.appAccessToken, appRefreshToken: token.appRefreshToken};
    } catch (err: any) {
      LoggingUtils.error(err);
      throw err;
    }
    //});
  }

  async resetMpin(id: number, data: any): Promise<any> {
    if (mpinNotAllowed.includes(data.mpin)) {
      return Promise.reject(new RestError(400, 'MPIN is repetitive or in series, Set unique MPIN', {systemcode: 1181}));
    }
    try {
      const isMpinSetupAlready = await this.appUserRepository.findOne({
        where: {
          id: id,
          isActive: true,
          mpinSetup: true
        }
      });
      // for ntb user
      let appUser = await this.appUserRepository.findOne({where: {id: id, isActive: true}});

      if (!appUser) {
        return Promise.reject(new RestError(404, 'User not found', {systemcode: 1030}));
      }

      if (!isMpinSetupAlready) {
        return Promise.reject(
          new RestError(400, "Mpin isn't setup yet. Please go through the onboarding process to setup Mpin.", {systemcode: 1074})
        );
      }

      const hashMpin = bcrypt.hashSync(data.mpin, salt);

      const historyData = await this.mpinHistoryRepository.find({
        order: ['createdDate DESC'],
        limit: 3,
        where: {appUserId: id}
      });

      if (!historyData) {
        return Promise.reject(new RestError(400, 'history Data not found', {systemcode: 1192}));
      }

      for (let element of historyData) {
        const isEXists = bcrypt.compareSync(data.mpin, element.mpin);
        if (isEXists) {
          return Promise.reject(new RestError(400, 'Can not use a previously used mpin!', {systemcode: 1013}));
        }
      }

      if (appUser.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['NTBUser'].value) {
        await this.appUserRepository.updateById(id, {
          mpin: hashMpin,
          mpinResetDate: new Date(),
          mpinSetup: true
        });
        const userLogs: AppUserLogsFields = {
          id: appUser.id,
          userCode: appUser.userCode,
          appUserStatus: appUser.appUserStatus,
          lastLoginDate: appUser.lastLoginDate
        };
        LoggingUtils.info(userLogs, 'Mpin Changed');
      } else if (historyData.length != 0) {
        // @todo Need to check if these two can be put in a transaction and committed together
        await this.appUserRepository.updateById(id, {
          mpin: hashMpin,
          mpinResetDate: new Date(),
          mpinSetup: true
        });
        const userLogs: AppUserLogsFields = {
          id: appUser.id,
          userCode: appUser.userCode,
          appUserStatus: appUser.appUserStatus,
          lastLoginDate: appUser.lastLoginDate
        };
        LoggingUtils.info(userLogs, 'Mpin Changed');
      } else {
        await this.appUserRepository.updateById(id, {
          mpin: hashMpin,
          appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['PINSetupCompleted'].value, // Pin setup completed
          mpinResetDate: new Date(),
          mpinSetup: true
        });
        const userLogs: AppUserLogsFields = {
          id: appUser.id,
          userCode: appUser.userCode,
          appUserStatus: appUser.appUserStatus,
          lastLoginDate: appUser.lastLoginDate
        };
        LoggingUtils.info(userLogs, 'Mpin Changed');
      }

      //update devices set mpi and biometric flag to true
      await this.deviceRepository.updateAll(
        {
          mpinSetup: true
          // biometricSetup : true
        },
        {
          appUserId: id
        }
      );
      let historyObj: HistoryObj = {
        isActive: false,
        lastModifiedDate: undefined,
        createdDate: undefined,
        mpin: '',
        appUserId: undefined
      };
      historyObj.isActive = true;
      historyObj.lastModifiedDate = new Date();
      historyObj.createdDate = new Date();
      historyObj.mpin = hashMpin;
      historyObj.appUserId = id;
      await this.mpinHistoryRepository.create(historyObj);

      //for notification
      const account = await this.accountRepository.findOne({
        where: {
          isActive: true,
          primaryHolderId: id,
          fields: ['id']
        }
      })

      if (account === null || account === undefined) {
        await NotificationUtils.sendNotificationEvent({
          accountId: NotificationTopics.INVESTOR_WITHOUT_ACCOUNT,
          topicId: NotificationTopics.TOPICS.login.mpin.value,
          templateKeys: {date: moment().format('DD/MM/YY'), time: moment().format('HH:mm'), customerName: appUser.name, emailId: 'mailto:smartwealth@hdfcbank.com'},
          notificationType: NotificationTopics.TOPICS.login.mpin.topic,
          userId: id
        })
      } else {
        await NotificationUtils.sendNotificationEvent({
          accountId: account!.id!,
          topicId: NotificationTopics.TOPICS.login.mpin.value,
          templateKeys: {date: moment().format('DD/MM/YY'), time: moment().format('HH:mm'), customerName: appUser.name, emailId: 'mailto:smartwealth@hdfcbank.com'},
          notificationType: NotificationTopics.TOPICS.login.mpin.topic
        })
      }
      return {success: true};
    } catch (err: any) {
      LoggingUtils.error(err);
      throw err;
    }
    //});
  }

  async setupBiometric(id: number, data: {deviceUniqueId: string; pubKey: string}): Promise<any> {
    try {
      const currentDevice = await this.deviceRepository.findOne({
        where: {
          appUserId: id,
          uniqueId: data.deviceUniqueId,
          isActive: true
        }
      });

      // check if passed device exists
      if (!currentDevice) {
        LoggingUtils.error("User tried to setup biometric on a device which doesn't exist");
        return Promise.reject(new RestError(400, "Biometric couldn't be set on device", {systemcode: 1014}));
      }

      let uniqueBiometricToken: string | undefined
      if (currentDevice.publicKey === data.pubKey && currentDevice.uniqueId === data.deviceUniqueId && currentDevice.biometricToken && currentDevice.biometricToken.length > 0 && currentDevice.biometricSetup) {
        uniqueBiometricToken = currentDevice.biometricToken
      }
      else {
        uniqueBiometricToken = crypto.randomBytes(16).toString('hex');
      }
      // const hashedBiometricToken = bcrypt.hashSync(uniqueBiometricToken, salt);

      // setup biometric on device if exists
      const enableBiometric = this.deviceRepository.updateAll(
        {
          biometricSetup: true,
          biometricToken: uniqueBiometricToken,
          publicKey: data.pubKey
        },
        {
          id: currentDevice.id
        }
      );

      if (!enableBiometric) return Promise.reject(new RestError(400, "Biometric couldn't be set on device", {systemcode: 1014}));

      //for notification
      const account = await this.accountRepository.findOne({
        where: {
          isActive: true,
          primaryHolderId: id,
          fields: ['id', 'name']
        }
      })

      const appUser = await this.appUserRepository.findOne({
        where: {
          id: id,
          isActive: true,
          fields: ['id', 'email']
        }
      })

      appUser!.email = (appUser!.email ?? '')

      const currentDate = new Date()
      if (account == null || account == undefined) {
        await NotificationUtils.sendNotificationEvent({
          accountId: NotificationTopics.INVESTOR_WITHOUT_ACCOUNT,
          topicId: NotificationTopics.TOPICS.login.enableBiometric.value,
          templateKeys: {date: moment().format('DD/MM/YY'), time: moment().format('HH:mm'), customerName: appUser!.name, emailId: 'mailto:smartwealth@hdfcbank.com'},
          notificationType: NotificationTopics.TOPICS.login.enableBiometric.topic,
          userId: id
        })
      } else {
        await NotificationUtils.sendNotificationEvent({
          accountId: account!.id!,
          topicId: NotificationTopics.TOPICS.login.enableBiometric.value,
          templateKeys: {customerName: account!.name, emailId: "mailto:smartwealth@hdfcbank.com", date: moment().format('DD/MM/YY'), time: moment().format('HH:mm')},
          notificationType: NotificationTopics.TOPICS.login.enableBiometric.topic
        })
      }
      return {success: true, biometricToken: uniqueBiometricToken};
    } catch (err) {
      LoggingUtils.error(err);
      return Promise.reject(new RestError(400, "Biometric couldn't be set on device", {systemcode: 1014}));
    }
  }
  //disable biometric
  async disableBiometric(id: number, data: {deviceUniqueId: string}): Promise<any> {
    try {
      const currentDevice = await this.deviceRepository.findOne({
        where: {
          appUserId: id,
          uniqueId: data.deviceUniqueId,
          isActive: true
        }
      });

      // check if passed device exists
      if (!currentDevice) {
        LoggingUtils.error("User tried to disable biometric on a device which doesn't exist");
        return Promise.reject(new RestError(400, "Biometric couldn't be disabled", {systemcode: 1015}));
      }

      // setup biometric on device if exists
      const disableBiometric = await this.deviceRepository.updateAll(
        {
          biometricSetup: false
        },
        {
          id: currentDevice.id
        }
      );

      if (!disableBiometric) return Promise.reject(new RestError(400, "Biometric couldn't be disabled", {systemcode: 1015}));


      //for notification
      const account = await this.accountRepository.findOne({
        where: {
          isActive: true,
          primaryHolderId: id,
          fields: ['id']
        }
      });


      const appUser = await this.appUserRepository.findOne({
        where: {
          id: id,
          isActive: true,
          fields: ['id', 'email']
        }
      });

      if (account == null || account == undefined) {
        await NotificationUtils.sendNotificationEvent({
          accountId: NotificationTopics.INVESTOR_WITHOUT_ACCOUNT,
          topicId: NotificationTopics.TOPICS.login.disableBiometric.value,
          templateKeys: {date: moment().format('DD/MM/YY'), time: moment().format('HH:mm'), customerName: appUser!.name, emailId: 'mailto:smartwealth@hdfcbank.com'},
          notificationType: NotificationTopics.TOPICS.login.disableBiometric.topic,
          userId: id
        })
      } else {
        await NotificationUtils.sendNotificationEvent({
          accountId: account!.id!,
          topicId: NotificationTopics.TOPICS.login.disableBiometric.value,
          templateKeys: {customerName: account!.name, emailId: "mailto:smartwealth@hdfcbank.com", date: moment().format('DD/MM/YY'), time: moment().format('HH:mm')},
          notificationType: NotificationTopics.TOPICS.login.disableBiometric.topic
        })
      }
      return {success: true};
    } catch (err) {
      LoggingUtils.error(err);
      return Promise.reject(new RestError(400, "Biometric couldn't be disabled", {systemcode: 1015}));
    }
  }

  async generateOTP(contactDetails: ContactDetails, transactionId: string, ipAddress: string): Promise<Object> {
    try {
      if (process.env.CUG_LIMITED == "true" && process.env.CUG_LIMITED_CONTACT_LIST) {
        const contactNumberList = JSON.parse(process.env.CUG_LIMITED_CONTACT_LIST)
        let allow = false
        for (let i = 0; i < contactNumberList.length; i++) {
          if (String(contactNumberList[i]) == contactDetails.contactNumber) {
            allow = true
          }
        }
        if (!allow) return Promise.reject(new RestError(465, "Currently you do not have access to the application"))
      }

      if (!(contactDetails && contactDetails.contactNumber && contactDetails.countryCode)) {
        return Promise.reject(new RestError(400, 'Please provide valid debug!', {systemcode: 1020}));
      }

      const reg = /^\d+$/;
      if (!reg.test(contactDetails.contactNumber)) {
        return Promise.reject(new RestError(400, 'Please enter valid mobile number', {systemcode: 1194}));
      }

      if (contactDetails.countryCode == '+91') {
        if (contactDetails.contactNumber.length !== 10) {
          return Promise.reject(new RestError(400, 'Please enter 10 digit mobile number', {systemcode: 1193}));
        }
      } else {
        if (contactDetails.contactNumber.length > 12) {
          return Promise.reject(new RestError(400, 'Please enter valid mobile number', {systemcode: 1194}));
        }
      }

      let user: AppUser | null = await this.appUserRepository.findOne({
        where: {
          contactNumber: contactDetails.contactNumber,
          contactNumberCountryCode: contactDetails.countryCode,
          isActive: true
        }
      });

      if (user) {
        let currentTime = new Date();
        const generationTime = user.otpGeneration!;
        let otpCount = (user && user.otpRetryCount && user.otpRetryCount) || 0;
        let otpGenerationMaxTime = new Date(generationTime?.getTime() + 43200000);
        let otpVerificationCount = (user && user.otpVerificationCount && user.otpVerificationCount) || 0
        if (otpCount >= MAX_OTP_RETRY_COUNT || otpVerificationCount >= 3) {
          if (currentTime < otpGenerationMaxTime) {
            if (otpVerificationCount >= 3) {
              return Promise.reject(
                new RestError(400, 'You have reached the maximum number of attempts to verify the otp. Please try again after 12 hours.', {systemcode: 1016})
              );
            }
            else {
              return Promise.reject(
                new RestError(400, 'Max retry limit for OTP generation exceeded!. Kindly try after 12 hours!', {systemcode: 1016})
              );
            }

          } else {
            await this.appUserRepository.updateById(user.id, {
              otpRetryCount: 0,
              otpVerificationCount: 0
            });

            user.otpRetryCount = 0;
            user.otpVerificationCount = 0
          }
        }
        let resendTime = new Date(generationTime?.getTime() + 1 * 60000);
        if (currentTime.getTime() < resendTime.getTime()) {
          return Promise.reject(new RestError(400, 'Please retry after 1 minute!', {systemcode: 1017}));
        }
        await this.appUserRepository.updateById(user!.id, {
          otpRetryCount: user!.otpRetryCount! + 1
        });
        user!.otpRetryCount = user!.otpRetryCount! + 1
        const linkData = CryptoUtils.encodePseudonym(`0000000000000000000${contactDetails.countryCode}${contactDetails.contactNumber}`.slice(-19))
        const otpResponse = await this.getOTP(transactionId, linkData).catch(async err => {
          let activityObj = {
            executionDate: new Date(),
            apiName: 'Do Generate OTP',
            details: JSON.stringify(err),
            status: 'failed'
          };
          await this.appUserRepository.updateById(user!.id, {
            otpRetryCount: Math.max(user!.otpRetryCount! - 1, 0)
          });
          LoggingUtils.error(activityObj, 'Generate OTP');
          throw err;
        });
        if (otpResponse && otpResponse.passwordValue && otpResponse.hasOwnProperty('errorDetail') && otpResponse.errorDetail === null) {
          await this.appUserRepository.updateById(user!.id, {
            // otp: otpResponse.passwordValue,
            otpExpiry: new Date(otpResponse?.datetimeExpire),
            otpGeneration: new Date(otpResponse?.datatimeGen),
            //otpRetryCount: otpCount + 1
            // otpVerificationCount: 0
          });

          let publishOTPResponse = false;
          const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.onboardingOTP.smsTemplate)
          const otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue, transactionFlag: "SELL"}
          const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: NotificationTopics.OTP_MESSAGES.onboardingOTP.tempId}
          publishOTPResponse = await this.doPublishOTP(contactDetails.contactNumber, otpMessage, transactionId,'S').catch(
            async err => {
              let activityObj = {
                executionDate: new Date(),
                apiName: 'Publish OTP',
                details: JSON.stringify(err),
                status: 'failed'
              };
              await this.appUserRepository.updateById(user!.id, {
                otpRetryCount: Math.max(user!.otpRetryCount! - 1, 0)
              });
              LoggingUtils.error(activityObj, 'Publish OTP');
              return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
            }
          );

          if (publishOTPResponse) {
            await this.appUserRepository.updateById(user!.id, {
              otpRefNo: otpResponse.refNo
            });
            return Promise.resolve({success: true, message: 'OTP sent to user!'});
          } else {
            return Promise.reject(new RestError(400, 'Failed to publish OTP', {systemcode: 1018}));
          }
        } else {
          await this.appUserRepository.updateById(user!.id, {
            otpRetryCount: user!.otpRetryCount! - 1
          });
          return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
        }
      } else {
        let userObj = {
          contactNumber: contactDetails.contactNumber,
          contactNumberCountryCode: contactDetails.countryCode,
          isActive: true,
          email: contactDetails.email,
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          otpRetryCount: 0,
          appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['registrationInitiated'].value, //user registration flag.
          name: contactDetails.contactNumber,
          forceTNCAcceptanceRequired: true,
          forceTNCAcceptanceDate: new Date(),
          tncAcceptanceIpAddress: ipAddress
        };

        const userCreated: AppUser = await this.appUserRepository.create(userObj);
        const userLogs: AppUserLogsFields = {
          id: userCreated.id,
          userCode: userCreated.userCode,
          appUserStatus: userCreated.appUserStatus,
          lastLoginDate: userCreated.lastLoginDate
        };
        LoggingUtils.info(userLogs, 'User created');
        const userId = userCreated && userCreated.id;
        const appRole = await this.appUserRoleMappingRepository.create({
          isActive: true,
          createdDate: new Date(),
          appUserId: userId,
          appRoleId: 1
        });
        await this.appUserRepository.updateById(userCreated.id, {
          otpRetryCount: userCreated.otpRetryCount! + 1
        });
        userCreated.otpRetryCount = userCreated!.otpRetryCount! + 1
        const linkData = CryptoUtils.encodePseudonym(`0000000000000000000${contactDetails.countryCode}${contactDetails.contactNumber}`.slice(-19))
        const otpResponse = await this.getOTP(transactionId, linkData).catch(async err => {
          let activityObj = {
            executionDate: new Date(),
            apiName: 'Do Generate OTP',
            details: JSON.stringify(err),
            status: 'failed'
          };
          await this.appUserRepository.updateById(userCreated!.id, {
            otpRetryCount: Math.max(userCreated!.otpRetryCount! - 1, 0)
          });
          LoggingUtils.error(activityObj, 'Generate OTP');
          throw err;
        });;
        if (otpResponse && otpResponse.passwordValue && otpResponse.hasOwnProperty('errorDetail') && otpResponse.errorDetail === null) {
          await this.appUserRepository.updateById(userId, {
            // otp: otpResponse.passwordValue,
            otpExpiry: new Date(otpResponse?.datetimeExpire),
            otpGeneration: new Date(otpResponse?.datatimeGen),
            // otpVerificationCount: 0
          });

          //Since we can't send otp to the user if we are on Dev or UAT env
          const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.onboardingOTP.smsTemplate)
          const otpKeys = {customerName: userCreated!.name, otp: otpResponse.passwordValue, transactionFlag: "SELL"}
          const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: NotificationTopics.OTP_MESSAGES.onboardingOTP.tempId}
          let publishOTPResponse = false;
          publishOTPResponse = await this.doPublishOTP(contactDetails.contactNumber, otpMessage, transactionId,'S').catch(
            async err => {
              let activityObj = {
                executionDate: new Date(),
                apiName: 'Publish OTP',
                details: JSON.stringify(err),
                status: 'failed'
              };
              LoggingUtils.error(activityObj, 'Publish OTP');
              await this.appUserRepository.updateById(userId, {
                otpRetryCount: Math.max(userCreated.otpRetryCount! - 1, 0)
              });
              throw new Error(err);
            }
          );

          if (publishOTPResponse) {
            await this.appUserRepository.updateById(userCreated!.id, {
              otpRefNo: otpResponse.refNo
            });
            return Promise.resolve({success: true, message: 'OTP sent to user!'});
          } else {
            return Promise.reject(new RestError(400, 'Failed to publish OTP', {systemcode: 1018}));
          }
        } else {
          await this.appUserRepository.updateById(userId, {
            otpRetryCount: userCreated.otpRetryCount! - 1
          });
          return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
        }
      }
    } catch (err: any) {
      if (err instanceof RestError) {
        return Promise.reject(err);
      }
      throw err;
    }
  }

  async generateOTPMock(contactDetails: ContactDetails, transactionId: string, ipAddress: string): Promise<Object> {
    try {

      if (!(contactDetails && contactDetails.contactNumber && contactDetails.countryCode)) {
        return Promise.reject(new RestError(400, 'Please provide valid debug!', {systemcode: 1020}));
      }

      const reg = /^\d+$/;
      if (!reg.test(contactDetails.contactNumber)) {
        return Promise.reject(new RestError(400, 'Please enter valid mobile number', {systemcode: 1194}));
      }

      if (contactDetails.countryCode == '+91') {
        if (contactDetails.contactNumber.length !== 10) {
          return Promise.reject(new RestError(400, 'Please enter 10 digit mobile number', {systemcode: 1193}));
        }
      } else {
        if (contactDetails.contactNumber.length > 12) {
          return Promise.reject(new RestError(400, 'Please enter valid mobile number', {systemcode: 1194}));
        }
      }

      let user: AppUser | null = await this.appUserRepository.findOne({
        where: {
          contactNumber: contactDetails.contactNumber,
          contactNumberCountryCode: contactDetails.countryCode,
          isActive: true
        }
      });

      if (user) {
        let currentTime = new Date();
        const generationTime = user.otpGeneration!;
        let otpCount = (user && user.otpRetryCount && user.otpRetryCount) || 0;
        let otpGenerationMaxTime = new Date(generationTime?.getTime() + 43200000);

        let resendTime = new Date(generationTime?.getTime() + 1 * 60000);
        // if (currentTime.getTime() < resendTime.getTime()) {
        //   return Promise.reject(new RestError(400, 'Please retry after 1 minute!', {systemcode: 1017}));
        // }

        const linkData = CryptoUtils.encodePseudonym(`0000000000000000000${contactDetails.countryCode}${contactDetails.contactNumber}`.slice(-19))
        let otpResponse = await this.getOTPMock(transactionId, linkData).catch(async err => {
          LoggingUtils.error(err)
          LoggingUtils.error('Generate OTP originally failed but this is the mocked version so we move on');
          // throw err;
        });

        const currentDate = new Date()
        otpResponse = {passwordValue: "123456", errorDetail: null, refNo: "123456789", datetimeExpire: new Date(currentDate.getTime() + 120000), datatimeGen: currentDate}
        if (otpResponse && otpResponse.passwordValue && otpResponse.hasOwnProperty('errorDetail') && otpResponse.errorDetail === null) {
          await this.appUserRepository.updateById(user!.id, {
            // otp: otpResponse.passwordValue,
            otpExpiry: new Date(otpResponse?.datetimeExpire),
            otpGeneration: new Date(otpResponse?.datatimeGen),
            //otpRetryCount: otpCount + 1
            otpVerificationCount: 0
          });

          let publishOTPResponse = false;
          const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.onboardingOTP.smsTemplate)
          const otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue, transactionFlag: "SELL"}
          const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: NotificationTopics.OTP_MESSAGES.onboardingOTP.tempId}
          // publishOTPResponse = await this.doPublishOTP(contactDetails.contactNumber, otpMessage, transactionId).catch(
          //   async err => {

          //     LoggingUtils.error(err)
          //     LoggingUtils.error('Publish OTP originally failed but since we are mocking, we move on, just like she did :(');
          //     // return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
          //   }
          // );

          publishOTPResponse = true
          if (publishOTPResponse) {
            return Promise.resolve({success: true, message: 'OTP sent to user!'});
          } else {
            return Promise.reject(new RestError(400, 'Failed to publish OTP', {systemcode: 1018}));
          }
        } else {
          return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
        }
      } else {
        let userObj = {
          contactNumber: contactDetails.contactNumber,
          contactNumberCountryCode: contactDetails.countryCode,
          isActive: true,
          email: contactDetails.email,
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          otpRetryCount: 0,
          appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['registrationInitiated'].value, //user registration flag.
          name: contactDetails.contactNumber,
          forceTNCAcceptanceRequired: true,
          forceTNCAcceptanceDate: new Date(),
          tncAcceptanceIpAddress: ipAddress
        };

        const userCreated: AppUser = await this.appUserRepository.create(userObj);
        const userLogs: AppUserLogsFields = {
          id: userCreated.id,
          userCode: userCreated.userCode,
          appUserStatus: userCreated.appUserStatus,
          lastLoginDate: userCreated.lastLoginDate
        };
        LoggingUtils.info(userLogs, 'User created');
        const userId = userCreated && userCreated.id;
        const appRole = await this.appUserRoleMappingRepository.create({
          isActive: true,
          createdDate: new Date(),
          appUserId: userId,
          appRoleId: 1
        });
        // await this.appUserRepository.updateById(userCreated.id, {
        //   otpRetryCount: userCreated.otpRetryCount! + 1
        // });
        const linkData = CryptoUtils.encodePseudonym(`0000000000000000000${contactDetails.countryCode}${contactDetails.contactNumber}`.slice(-19))
        let otpResponse = await this.getOTP(transactionId, linkData).catch(async err => {
          LoggingUtils.error(err)
          LoggingUtils.error('Generate OTP originally failed but this is the mocked version so we move on');

        });;

        const currentDate = new Date()
        otpResponse = {passwordValue: "123456", errorDetail: null, refNo: "123456789", datetimeExpire: new Date(currentDate.getTime() + 120000), datatimeGen: currentDate, ...otpResponse}
        if (otpResponse && otpResponse.passwordValue && otpResponse.hasOwnProperty('errorDetail') && otpResponse.errorDetail === null) {


          //Since we can't send otp to the user if we are on Dev or UAT env
          const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.onboardingOTP.smsTemplate)
          const otpKeys = {customerName: userCreated!.name, otp: otpResponse.passwordValue, transactionFlag: "SELL"}
          const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: NotificationTopics.OTP_MESSAGES.onboardingOTP.tempId}
          let publishOTPResponse = false;
          publishOTPResponse = await this.doPublishOTP(contactDetails.contactNumber, otpMessage, transactionId, 'S').catch(
            async err => {
              LoggingUtils.error(err)
              LoggingUtils.error('Publish OTP originally failed but since we are mocking, we move on, just like she did :(');
            }
          );

          publishOTPResponse = true
          if (publishOTPResponse) {
            await this.appUserRepository.updateById(userCreated!.id, {
              otpRefNo: otpResponse.refNo
            });
            return Promise.resolve({success: true, message: 'OTP sent to user!'});
          } else {
            return Promise.reject(new RestError(400, 'Failed to publish OTP', {systemcode: 1018}));
          }
        } else {
          await this.appUserRepository.updateById(userId, {
            otpRetryCount: userCreated.otpRetryCount! - 1
          });
          return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
        }
      }
    } catch (err: any) {
      if (err instanceof RestError) {
        return Promise.reject(err);
      }
      throw err;
    }
  }

  async updatePANOrDOB(id: number, panAndDOBDetails: PANAndDOBDetails, userProfile: any, options: Options): Promise<any> {
    let isAdvisoryCustomer: Boolean, isWealthfyCustomer: Boolean, isNTB: Boolean;
    /**
     * 1 - pan validation
     * 2 - investor object creation
     * 3 - update / create record investor details
     * 4 - check for existing custome ETB based on pan and dob
     * 5 -- Single USer
     *      -- how/where to Fetching customerID
     *      -- ifAdvisoryCustomer --skip else continue
     *      -- ifWealthifyCustomer --Skip else continue
     *      -- provide redirect url for authentication
     * 5 -- Multiple USer
     *      -- providee redirect url
     * 5 -- No USer
     *      -- Set flag new to bank NTB and return
     */
    const methodName = 'updatePANOrDOB';
    const transactionId = userProfile.TrxId;
    let appUserId = id;
    let mobileNumber;
    try {
      LoggingUtils.debug(`Step 1 id :${id}`, methodName);
      // @TODO check if user registration flag
      // @TODO take appUserId from Token req.tokenData.appUserId
      if (!(panAndDOBDetails && (panAndDOBDetails.PAN || panAndDOBDetails.DOB) && panAndDOBDetails.deviceId)) {
        return Promise.reject(new RestError(400, 'Please provide valid request body!', {systemcode: 1020}));
      } else {
        //Validation check
        const investorExistingDetails = await this.investorDetailsRepository.find(
          {
            where: {
              isActive: true,
              appUserId: appUserId
            }
          },
          options
        );

        if (investorExistingDetails && investorExistingDetails.length > 1) {
          throw new Error('Data discrepancy, conect with customer support');
        }

        //Pan card validation
        LoggingUtils.debug('Step 2 Validating PAN', methodName);
        if (panAndDOBDetails.PAN) {
          if (investorExistingDetails.length == 1) {
            //existing pan doesnot match with entered pan
            if (investorExistingDetails[0].panCardNumber) {
              if (investorExistingDetails[0].panCardNumber !== panAndDOBDetails.PAN) {
                return Promise.reject(new RestError(465, `PAN card doesn't match with the existing records`, {systemcode: 1020}));
              }
            }
          }
          let isValidPan = await this.validatePAN(panAndDOBDetails.PAN);
          if (!isValidPan) {
            return Promise.reject(new RestError(465, 'Invalid Pan card number', {systemcode: 1020}));
          }
        }
        //Existing DOB Check
        if (panAndDOBDetails.DOB) {
          let existingDOB = null;
          if (investorExistingDetails.length == 1) {
            if (investorExistingDetails[0].birthDate) {
              existingDOB = moment(investorExistingDetails[0].birthDate).format('YYYY-MM-DD');
              if (existingDOB !== panAndDOBDetails.DOB) {
                return Promise.reject(new RestError(465, `Date of Birth doesn't match with the existing records`, {systemcode: 1020}));
              }
            }
          }
        }

        const existingAppuser = await this.appUserRepository.findOne(
          {
            where: {
              id: id,
              isActive: true
            }
          },
          options
        );

        mobileNumber = existingAppuser!.contactNumber;
        LoggingUtils.debug('Step 3 Building initial investor object', methodName);

        let newInvestorDeatils;
        // to check there are unique pan cards in the database
        if (panAndDOBDetails.PAN) {
          LoggingUtils.debug('Step 4 fetching existing Investor based on PAN', methodName);
          let existingUser = await this.investorDetailsRepository.findOne({
            where: {or: [{panCardNumber: panAndDOBDetails.PAN}, {appUserId: appUserId}, {panCardNumber: panAndDOBDetails.PAN, appUserId: appUserId}], isActive: true},
            include: [{relation: 'appUser'}]
          });
          if (existingUser && existingUser.appUserId === appUserId) {
            await this.investorDetailsRepository.updateById(existingUser.id, {panCardNumber: panAndDOBDetails.PAN}, options);
            LoggingUtils.debug('Step 5 investor details matches user', methodName);
            return await this.helperOnboarding(id, panAndDOBDetails, existingUser, transactionId, userProfile, options);
          } else if (existingUser && existingUser.appUserId !== appUserId) {
            LoggingUtils.error('Step 8 inverstor details user does not match', methodName);
            return Promise.reject(new RestError(465, 'User already linked to another PAN card', {systemcode: 1020}));
          } else {
            LoggingUtils.debug(`Step 9 creating new record for inverstor details`, methodName);
            let investorDetailsObj: any = {
              panCardNumber: panAndDOBDetails.PAN,
              appUserId: appUserId,
              isActive: true
            };
            newInvestorDeatils = await this.investorDetailsRepository.create(investorDetailsObj);
          }
        } else {
          LoggingUtils.debug('Step 10 fetching existing Investor based on DOB', methodName);
          let existingUser = await this.investorDetailsRepository.findOne({
            where: {or: [{appUserId: appUserId}, {dateOfBirth: panAndDOBDetails.DOB, appUserId: appUserId}], isActive: true},
            include: [{relation: 'appUser'}]
          });
          if (existingUser && existingUser.appUserId === appUserId) {
            await this.investorDetailsRepository.updateById(existingUser.id, {birthDate: panAndDOBDetails.DOB as any}, options);
            LoggingUtils.debug('Step 11 updating existing investor details', methodName);
            return await this.helperOnboarding(id, panAndDOBDetails, existingUser, transactionId, userProfile, options);
          } else {
            LoggingUtils.debug('Step 12 creating new investor details ', methodName);
            let investorDetailsObj: any = {
              appUserId: appUserId,
              birthDate: panAndDOBDetails.DOB,
              isActive: true
            };
            await this.investorDetailsRepository.create(investorDetailsObj);
          }
        }
        // to fetch customer Details from ETB
        LoggingUtils.debug('Step 13 Invoking ETB call ', methodName);
        let etbDetails = await this.coreBankingFacade.fetchCustomerAccountAmlFatcaDetails(
          panAndDOBDetails.PAN,
          panAndDOBDetails.DOB,
          mobileNumber,
          '',
          transactionId,
          appUserId,
          options
        );
        LoggingUtils.debug(`Step 14 ETB response `, methodName);
        if (etbDetails!.success) {
          LoggingUtils.debug('Step 15 ETB sync success Single User flow ', methodName);
          LoggingUtils.debug('Step 16 Validating MFRTA CHECKS ', methodName);
          const mfaChecks = await this.validateMfRtaFields(id, options);
          // fetching updated  user Details
          if (!mfaChecks.success) {
            LoggingUtils.debug('Step 17 update appuser for mftra ', methodName);
            let updatedUserStatus = await this.appUserRepository.updateAll(
              {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value, remarks: mfaChecks.remarks},
              {id: id}
            );
            //throw new Error('MFA RTA Checks failed');
            if (!updatedUserStatus) {
              //@todo add it to error logs
              return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
            }
            LoggingUtils.debug('Step 18 MFRTA VALIDATION FAILED ', methodName);
            return {
              success: false,
              message: 'mfRTA check failed',
              mfaChecks,
              isMFRTAcheckpass: false,
              appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value,
              remarks: mfaChecks.remarks
            };
          }
          LoggingUtils.debug('Step 19 Fetching Synced investor details ', methodName);
          const investorUser = await this.investorDetailsRepository.findOne({
            where: {
              appUserId: id
            },
            include: [
              {
                relation: 'appUser'
              }
            ]
          });
          LoggingUtils.debug(`Step 20 updated investor details `, methodName);
          if (investorUser && investorUser.appUser && investorUser.appUser.bosCode) {
            // need to check if advisory customer
            LoggingUtils.debug('Step 19 Check for advisory customer ', methodName);
            isAdvisoryCustomer = await this.checkIfAdvisoryCustomer(investorUser.appUser.bosCode);

            // updating the user Status
            if (isAdvisoryCustomer) {
              LoggingUtils.debug('Step 21 update app user status advisory ', methodName);
              let updatedUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.advisoryUser.value},
                {id: appUserId, isActive: true}
              );
              if (!updatedUserStatus) {
                //@todo add it to error logs
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }

              if (newInvestorDeatils?.id) await this.investorDetailsRepository.deleteById(newInvestorDeatils?.id!);
              LoggingUtils.debug('Step 22 Advisory customer ', methodName);
              return {success: true, message: 'Advisory customer', isAdvisoryCustomer};
            }

            // need to check if exists in wealthfy domestic
            LoggingUtils.debug('Step 23 Wealthfy customer check ', methodName);
            isWealthfyCustomer = await this.checkIfExistingWealthfyCustomer(investorUser.appUser.bosCode, transactionId); // @TODO need to revert this after lz testing
            // isWealthfyCustomer = false;

            if (isWealthfyCustomer) {
              LoggingUtils.debug('Step 24 update app user status wealthfy ', methodName);
              let updatedUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.wealthfyDomesticUser.value},
                {id: appUserId, isActive: true}
              );

              if (!updatedUserStatus) {
                //@todo add it to error logs
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }
              LoggingUtils.debug('Step 25 wealthfy customer ', methodName);
              return {success: true, message: 'Wealthfy customer', isWealthfyCustomer};
            }

            LoggingUtils.debug('Step 26 update app user status to single user ', methodName);
            let updateUserStatus = await this.appUserRepository.updateAll(
              {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value},
              {id: appUserId, isActive: true}
            );
            if (!updateUserStatus) {
              //@todo add it to error logs
              return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
            }
            LoggingUtils.debug('Step 27 Invoking idcom to get redirection url for authentication ', methodName);

            //IF ETB generate authentication redirection Link
            LoggingUtils.debug('Step 28 genearting idcom link for single customer flow as all above check pass ', methodName);
            const response = await this.idComIntegrationFacade.getAuthCode(id, panAndDOBDetails.deviceId, transactionId);
            if (!response.success) {
              return Promise.reject(
                new RestError(
                  465,
                  'Oops!! Our system is temporarily down. We apologize for the inconvenience, please try after some time.',
                  {systemcode: 1197}
                )
              );
            }
            //Recreating Appaccess token data
            LoggingUtils.debug(`Step 29 Response recived form idcom `, methodName);
            let tokenUpdated: Array<any> = [];
            if (userProfile.resolvedRoles && Array.isArray(userProfile.resolvedRoles) && userProfile.resolvedRoles.indexOf('CLIENT') > -1) {
              tokenUpdated = await this.appAccessTokenFacade.recreateTokenData(appUserId);
              if (!tokenUpdated || !Array.isArray(tokenUpdated)) tokenUpdated = [];
              LoggingUtils.debug(`Step 30 refreshing token `, methodName);
            }
            LoggingUtils.debug('Step 31 returning response single customer flow ends for update pan or dob', methodName);
            return {
              success: true,
              redirectUrl: response.redirectURL,
              authCode: response.authCode,
              successUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_SUCCESS as string,
              failureUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_FAILURE as string,
              isMultipleCustomerId: false,
              tokenUpdated: tokenUpdated.length > 0 ? true : false
            };
          } else {
            Promise.reject(new RestError(400, 'BosCode not found', {systemcode: 1199}));
          }
        } else if (!etbDetails!.success && etbDetails!.code == 'MULTIPLE_CUSTOMER_DATA') {
          //IF ETB with multiple custId generate authentication redirection Link
          LoggingUtils.debug('Step 32 ETB success , multiple customer flow start ', methodName);
          LoggingUtils.debug('Step 33 update app user status to multiple user ', methodName);
          let updateUserStatus = await this.appUserRepository.updateAll(
            {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.multipleCustomerID.value},
            {id: appUserId, isActive: true}
          );
          if (!updateUserStatus) {
            //@todo add it to error logs
            return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
          }
          LoggingUtils.debug('Step 34 Invoking idcom to get redirection url for authentication ', methodName);
          const response = await this.idComIntegrationFacade.getAuthCode(id, panAndDOBDetails.deviceId, transactionId);
          if (!response.success) {
            return Promise.reject(
              new RestError(465, 'Oops!! Our system is temporarily down. We apologize for the inconvenience, please try after some time.', {
                systemcode: 1197
              })
            );
          }
          LoggingUtils.debug(`Step 35 Response recived Multiple customer update pan or dob flow ends `, methodName);
          return {
            success: true,
            redirectUrl: response.redirectURL,
            authCode: response.authCode,
            successUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_SUCCESS as string,
            failureUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_FAILURE as string,
            isMultipleCustomerId: true
          };
        } else if (!etbDetails!.success && etbDetails!.code == 'NO_DATA') {
          LoggingUtils.debug('Step 36 no data found from etb new user/NTB flow ', methodName);
          isNTB = true;
          LoggingUtils.debug('Step 37 updating app user status as NTB ', methodName);
          let updateUserStatus = await this.appUserRepository.updateAll(
            {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.NTBUser.value},
            {id: appUserId, isActive: true}
          );
          if (!updateUserStatus) {
            //@todo add it to error logs
            return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
          }
          LoggingUtils.debug('Step 38 NTB flow end for update pan or dob ', methodName);
          return {success: true, message: 'NTB customer', isNTB};
        } else if (!etbDetails!.success && etbDetails!.code == 'USER_EXIST') {
          LoggingUtils.error('Step 39 User exist error form etb ', methodName);
          throw new Error('User already completed the steps');
        } else if (!etbDetails!.success && etbDetails!.bankErrorCode) {
          LoggingUtils.debug(etbDetails, methodName);
          LoggingUtils.error('Step 40 ETB received error from bank ', methodName);
          return Promise.reject(new RestError(465, `We couldn't connect with your bank account, please try again.`, {systemcode: 1201}));
        } else {
          LoggingUtils.error('Step 50 Error occured in when syncing ETB ', methodName);
          throw new Error('Something went wrong with ETB Sync');
        }
      }
    } catch (err: any) {
      LoggingUtils.error(err, methodName);
      // return Promise.reject(new RestError(400, err.message));
      throw err;
    }
  }

  async verifyOTP(contactDetails: VerifyOtpContactDetails, request: Request, transactionId: string): Promise<Object> {
    try {
      if (!(contactDetails && contactDetails.otp && contactDetails.contactNumber && contactDetails.countryCode)) {
        return Promise.reject(new RestError(400, 'Please provide valid info!', {systemcode: 1020}));
      }
      const user = await this.appUserRepository.findOne({
        where: {
          contactNumber: contactDetails.contactNumber,
          contactNumberCountryCode: contactDetails.countryCode,
          isActive: true
        }
      });
      if (!user) {
        return Promise.reject(new RestError(404, 'User not found!', {systemcode: 1030}));
      }
      let otpVerificationCountLocal = 0
      if (user.otpVerificationCount == null) {
        await this.appUserRepository.updateById(user.id, {
          otpVerificationCount: 1
        });
        otpVerificationCountLocal = 1
      } else if (user.otpVerificationCount + 1 > 3) {
        return Promise.reject(
          new RestError(472, 'You have reached the maximum number of attempts to verify the otp. Please try again after 12 hours.', {
            systemcode: 1016
          })
        );
      } else {
        await this.appUserRepository.updateById(user.id, {
          otpVerificationCount: user.otpVerificationCount + 1
        });
        otpVerificationCountLocal = user.otpVerificationCount + 1
      }
      const activeDevices = await this.deviceRepository
        .find({
          where: {
            appUserId: user.id,
            isActive: true
          }
        })
        .catch((err: any) => {
          LoggingUtils.error(`Error occured while finding device. Error ${err}`, 'verifyOTP');
          throw new RestError(400, 'Error occured while finding device', {systemcode: 1033});
        });

      let deviceBindLimit = AppConstant.DEVICE_BIND_LIMIT;

      const checkIfExistingDevice = activeDevices.filter(data => data.uniqueId == contactDetails.deviceUniqueId && data.isActive);

      let otpExpiry = user.otpExpiry!;
      let otpExpiryTime = new Date(otpExpiry.getTime());
      const currentTime = new Date();
      if (currentTime.getTime() > otpExpiryTime.getTime()) {
        return Promise.reject(new RestError(400, 'OTP is expired!', {systemcode: 1022}));
      }

      const linkData = CryptoUtils.encodePseudonym(`0000000000000000000${contactDetails.countryCode}${contactDetails.contactNumber}`.slice(-19))
      const response = await this.doVerifyOTP(contactDetails.otp, user!.otpRefNo!, transactionId, linkData).catch(async (err) => {
        LoggingUtils.error('Verify otp failed', 'verifyOTP')
        await this.appUserRepository.updateById(user.id, {
          otpVerificationCount: otpVerificationCountLocal - 1
        });
        throw err
      });
      if (response && response.statusCode == '00' && response.hasOwnProperty('errorDetail') && response.errorDetail === null) {
        //@todo uncomment when bank api will be working
        // if (contactDetails.otp === '123456') {
        const userId = user && user.id;
        // await this.appUserRepository.updateById(userId, {
        //   appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['Registration Initiated'].value
        // });

        const mpinSetup = user.mpinSetup;
        // this device id might have been with someone else, so, reset it here.
        // This is the part where we bind the device to the user
        // let existingDevice = await this.deviceRepository.findOne({where: {uniqueId: contactDetails.deviceUniqueId}});
        //let existingDevice: any = await this.deviceRepository.findOne({where: {uniqueId: contactDetails.deviceUniqueId}});

        // if (activeDevices.length >= deviceBindLimit && checkIfExistingDevice.length == 0) {

        await this.deviceRepository.updateAll({appUserId: null, isActive: false}, {appUserId: userId})
        // }

        const updateDevice = await this.deviceRepository.updateAll(
          {
            registeredDate: new Date(),
            uniqueId: contactDetails.deviceUniqueId,
            appUserId: userId,
            mpinSetup,
            isActive: true
          },
          {
            uniqueId: contactDetails.deviceUniqueId
          }
        );
        if (!updateDevice.count || !updateDevice) {
          throw new Error('Error Occured while updating device');
        }
        const deviceDetails = await this.deviceRepository.findOne({
          where: {
            uniqueId: contactDetails.deviceUniqueId,
            isActive: true
          }
        });
        if (!deviceDetails) throw new Error("Couldn't find device");

        let data = await this.appAccessTokenFacade.createToken(userId!, request, true);
        await this.appUserRepository.updateById(userId, {
          otpVerificationCount: 0
        });
        return Promise.resolve({
          success: true,
          appAccessToken: data.appAccessToken,
          appRefreshToken: data.appRefreshToken,
          deviceId: deviceDetails.id
        });
      } else {
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      }

    } catch (err: any) {
      if (err instanceof RestError) {
        return Promise.reject(err);
      } else {
        LoggingUtils.error(err);
        throw err;
      }
    }
  }

  async verifyOTPMock(contactDetails: VerifyOtpContactDetails, request: Request, transactionId: string): Promise<Object> {
    try {
      if (!(contactDetails && contactDetails.otp && contactDetails.contactNumber && contactDetails.countryCode)) {
        return Promise.reject(new RestError(400, 'Please provide valid info!', {systemcode: 1020}));
      }
      const user = await this.appUserRepository.findOne({
        where: {
          contactNumber: contactDetails.contactNumber,
          contactNumberCountryCode: contactDetails.countryCode,
          isActive: true
        }
      });
      if (!user) {
        return Promise.reject(new RestError(404, 'User not found!', {systemcode: 1030}));
      }
      if (user.otpVerificationCount == null) {
        await this.appUserRepository.updateById(user.id, {
          otpVerificationCount: 1
        });
      } else {
        await this.appUserRepository.updateById(user.id, {
          otpVerificationCount: user.otpVerificationCount + 1
        });
      }
      const activeDevices = await this.deviceRepository
        .find({
          where: {
            appUserId: user.id,
            isActive: true
          }
        })
        .catch((err: any) => {
          LoggingUtils.error(`Error occured while finding device. Error ${err}`, 'verifyOTP');
          throw new RestError(400, 'Error occured while finding device', {systemcode: 1033});
        });

      let deviceBindLimit = AppConstant.DEVICE_BIND_LIMIT;

      if (process.env.NODE_ENV?.toLowerCase() == 'dev') {
        deviceBindLimit = 100000
      }

      const checkIfExistingDevice = activeDevices.filter(data => data.uniqueId == contactDetails.deviceUniqueId && data.isActive);

      if (activeDevices.length >= deviceBindLimit && checkIfExistingDevice.length == 0) {
        LoggingUtils.debug(
          `You are already logged in from ${deviceBindLimit} devices. Please remove atleast one device from My Account section to continue`,
          'verifyOTP'
        );
        return Promise.reject(
          new RestError(
            400,
            `You are already logged in from ${deviceBindLimit} devices. Please remove atleast one device from My Account section to continue`,
            {systemcode: 1035}
          )
        );
      }
      //let otpExpiry = user.otpExpiry!;
      //let otpExpiryTime = new Date(otpExpiry.getTime());
      //const currentTime = new Date();
      // if (currentTime.getTime() > otpExpiryTime.getTime()) {
      //   return Promise.reject(new RestError(400, 'OTP is expired!', {systemcode: 1022}));
      // }

      const linkData = CryptoUtils.encodePseudonym(`0000000000000000000${contactDetails.countryCode}${contactDetails.contactNumber}`.slice(-19))
      let response = await this.doVerifyOTPMock(contactDetails.otp, user!.otpRefNo!, transactionId, linkData).catch(err => {
        LoggingUtils.error('Verify OTP originally failed but we move on since we are mocking this')
      });

      response = {statusCode: "00", errorDetail: null}
      if (response && response.statusCode == '00' && response.hasOwnProperty('errorDetail') && response.errorDetail === null) {
        //@todo uncomment when bank api will be working
        // if (contactDetails.otp === '123456') {
        const userId = user && user.id;
        // await this.appUserRepository.updateById(userId, {
        //   appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['Registration Initiated'].value
        // });

        const mpinSetup = user.mpinSetup;
        // this device id might have been with someone else, so, reset it here.
        // This is the part where we bind the device to the user
        // let existingDevice = await this.deviceRepository.findOne({where: {uniqueId: contactDetails.deviceUniqueId}});
        //let existingDevice: any = await this.deviceRepository.findOne({where: {uniqueId: contactDetails.deviceUniqueId}});
        const updateDevice = await this.deviceRepository.updateAll(
          {
            registeredDate: new Date(),
            uniqueId: contactDetails.deviceUniqueId,
            appUserId: userId,
            mpinSetup
          },
          {
            uniqueId: contactDetails.deviceUniqueId
          }
        );
        if (!updateDevice.count || !updateDevice) {
          throw new Error('Error Occured while updating device');
        }
        const deviceDetails = await this.deviceRepository.findOne({
          where: {
            uniqueId: contactDetails.deviceUniqueId,
            isActive: true
          }
        });
        if (!deviceDetails) throw new Error("Couldn't find device");

        let data = await this.appAccessTokenFacade.createToken(userId!, request, true);
        await this.appUserRepository.updateById(userId, {
          otpVerificationCount: 0
        });
        return Promise.resolve({
          success: true,
          appAccessToken: data.appAccessToken,
          appRefreshToken: data.appRefreshToken,
          deviceId: deviceDetails.id
        });
      } else {
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      }
    } catch (err: any) {
      if (err instanceof RestError) {
        return Promise.reject(err);
      } else {
        LoggingUtils.error(err);
        throw err;
      }
    }
  }
  async getOTP(transactionId: string, linkData: string , refNo : string| null = null) {
    try {
      let env = process.env.MOCK_OTP ?? '';
      if (env.toLowerCase() === 'true') {
        let currentDate = new Date()
        return {passwordValue: "123456", errorDetail: null, refNo: refNo , datetimeExpire: new Date(currentDate.getTime() + 120000), datatimeGen: currentDate}
      }
      var otpResponse = await this.coreBankingFacade.getOTP(transactionId, linkData, refNo);
      //TODO To remove this
      let activityObj = {
        executionDate: new Date(),
        apiName: 'Generate OTP',
        errorCode: JSON.stringify(otpResponse),
        details: '',
        status: ''
      };
      applicationLog(activityObj);
      return otpResponse;
    } catch (err: any) {
      //TODO To remove this
      let activityObj = {
        executionDate: new Date(),
        apiName: 'Generate OTP',
        errorCode: JSON.stringify(otpResponse),
        details: JSON.stringify(err),
        status: 'failed'
      };
      applicationLog(activityObj);
      LoggingUtils.error(err);
      throw err;
    }
  }

  //This function is only for testing
  async getOTPMock(transactionId: string, linkData: string, refNo : string| null = "123456789") {

    let currentDate = new Date()
    return {passwordValue: "123456", errorDetail: null, refNo: refNo , datetimeExpire: new Date(currentDate.getTime() + 120000), datatimeGen: currentDate}

  }

  async doVerifyOTP(otp: string, refNo: string, transactionId: string, linkData: string) {
    try {
      let env = process.env.MOCK_OTP ?? '';
      if (env.toLowerCase() === 'true') {
        return {statusCode: "00", errorDetail: null}
      }
      var response = await this.coreBankingFacade.verifyOTP(otp, refNo, transactionId, linkData);
      //TODO To remove this
      let activityObj = {
        executionDate: new Date(),
        apiName: 'Verify OTP',
        errorCode: JSON.stringify(response),
        details: '',
        status: ''
      };
      // applicationLog(activityObj);
      return response;
    } catch (err: any) {
      //TODO To remove this
      let activityObj = {
        executionDate: new Date(),
        apiName: 'Verify OTP',
        errorCode: JSON.stringify(response),
        details: JSON.stringify(err),
        status: 'failed'
      };
      // applicationLog(activityObj);
      LoggingUtils.error(err);
      throw err;
    }
  }

  //this function is only for testing
  async doVerifyOTPMock(otp: string, refNo: string, transactionId: string, linkData: string) {
    return {statusCode: "00", errorDetail: null}
  }

  async getETBCustomerDetails(panAndDOBDetails?: PANAndDOBDetails, customerId?: string): Promise<any> {
    return Promise.resolve({});
  }

  /**
   * Check if customer is advisory customer or not.
   * @param customerId
   * @returns
   */
  async checkIfAdvisoryCustomer(customerId: string): Promise<boolean> {
    let advisoryCustomer: boolean;

    //fetching value form advisory client master
    const advisoryData = await this.advisoryClientMasterFacade.findOne({
      where: {customerId: customerId, isActive: true}
    });

    //@todd need to verify with pranav what to do id now record found
    // currently sending fasle
    if (isEmpty(advisoryData)) {
      advisoryCustomer = false;
    }

    //verifying the if custome is advisory customer or not
    if (advisoryData?.customerFlag == Option.GLOBALOPTIONS.ADVISORYCUSTOMERFLAG.ADVISORY.value) {
      advisoryCustomer = true;
    } else {
      advisoryCustomer = false;
    }

    return advisoryCustomer;
  }

  /**
   * Pancard validation test
   * @param panCardNumber
   * @returns
   */
  async validatePAN(panCardNumber: string): Promise<boolean> {
    /*eslint-disable */
    const re = /^[A-Z]{5}\d{4}[A-Z]{1}$/g;
    /*eslint-enable */
    return re.test(panCardNumber);
  }

  /**
   * This method will be used to handle callback form idocm
   * @param authCode
   * @param success
   * @param errorCode
   * @param errorMessage
   * @returns
   */
  async handleIdcomCallback(
    authCode: string,
    success: boolean,
    userProfile: any,
    options: Options,
    errorCode?: number,
    errorMessage?: string
  ): Promise<any> {
    /**
     *  ** Single Customer ID flow
     *  1 -> return for NTB and update Appuser Status
     *  2 -> existing customer -> fetch customerID -> do device binding.
     *  ** Mutiple Customer ID flow
     *  1 -> return for NTB and update Appuser Status
     *  2 -> existing customer -> fetch custoner ID
     *  3 -> ETB customer call using customerID
     *  4 -> check Advisory ifAdvisoryCustomer -> skip else continue
     *  5 -> check wealthify ifWealthifyCustomer -> skip else continue
     *  6 -> Device binding
     */
    let isAdvisoryCustomer: boolean;
    let isWealthfyCustomer: boolean;
    let idcomDataId: number | any;
    let transactionId = userProfile.TrxId;
    const methodName = 'handleIDcomCallback';
    try {
      //for failure
      LoggingUtils.debug('Step 1 handleIdcome callback invoked ', methodName);
      LoggingUtils.debug('Step 2 fetching record form idcomedetails table   ', methodName);
      const idcomData = await this.idcomDetailsRepository
        .findOne({
          where: {
            authCode: Buffer.from(authCode, 'utf8').toString('base64'),
            isActive: true
          },
          include: [{relation: 'appUser'}, {relation: 'device'}]
        })
        .catch(error => {
          throw new Error(error);
        });
      LoggingUtils.debug(`Step 3 idcomdetail record `, methodName);
      if (isEmpty(idcomData)) {
        LoggingUtils.debug('Step No record forund form idcomdetails end of method ', methodName);
        return new RestError(400, 'No Records found in Idcom Details', {systemcode: 1210});
      }
      LoggingUtils.debug('Step 4 storing appuser id and idcom id  ', methodName);
      let appUserId = idcomData!.appUserId;
      idcomDataId = idcomData!.id;

      if (!success) {
        if (errorCode && errorCode == 1000) {
          // update user Not found NTB customer
          // add to update AppUserStatus
          LoggingUtils.debug('Step 5 Flow for NTB USER ', methodName);
          LoggingUtils.debug('Step 6 upading appuser status for NTB ', methodName);
          let updateUserStatus = await this.appUserRepository.updateAll(
            {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.NTBUser.value},
            {id: appUserId, isActive: true}
          );
          if (!updateUserStatus) {
            //@todo add it to error logs
            await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
            return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
          }
          /**
           * ErrorCode 1000 is a special case and indicate user is not existing bank customer.
           * Hence updating status as NTB and returning with NTB flag and skipping rest of the flow
           */
          LoggingUtils.debug('Step 7 Flow for NTB USER ', methodName);
          await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: true});
          return {success: true, message: 'NTB customer', isNTB: true};
        }
        LoggingUtils.error({errorCode, errorMessage}, methodName);
        return new RestError(400, 'Failure from IDCOM', {systemcode: 1211});
      }

      LoggingUtils.debug('Step 8 Invoking fetch IDTOKEN from idcom ', methodName);
      const fetchIdToken = await this.idComIntegrationFacade.getIdToken({authCode}, transactionId).catch(error => {
        throw new Error('Error occured while fetching id Token');
      });
      LoggingUtils.debug(`Step 8 response for fetchIDtoken  `, methodName);
      if (fetchIdToken.success) {
        LoggingUtils.debug('Step 9 Idtoken recived ', methodName);
        LoggingUtils.debug('Step 10 decrypting id token ', methodName);
        const decryptIdToken = await this.idComIntegrationFacade
          .decryptIdToken(
            {
              idToken: fetchIdToken.IDToken,
              scope: process.env.USR_MGMT_IDCOM_FCD_SCOPE
            },
            transactionId
          )
          .catch(error => {
            throw new Error('Error occured while decrypting id Token');
          });
        LoggingUtils.debug(`Step 11 decrypted idToken`, methodName);
        LoggingUtils.debug(`Appuser status : ${idcomData!.appUser.appUserStatus}`, methodName);
        if (idcomData!.appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value) {
          LoggingUtils.debug('Step 12 Single User flow ', methodName);
          if (idcomData!.appUser.bosCode != decryptIdToken.customerID) {
            LoggingUtils.debug('Step 13 User code doesnot matched  ', methodName);
            await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
            return {success: false, message: 'Restart Onboarding process as customer id did not match'};
          }
          // Single customer flow
          LoggingUtils.debug('Step 14 customer id matched ', methodName);
          LoggingUtils.debug('Step 15 device bind single customer flow ', methodName);
          let deviceBind = await this.deviceBind(idcomData!.appUserId, idcomData!.deviceId);
          LoggingUtils.debug(`Step 16 device bind debug `, methodName);
          if (!deviceBind) {
            LoggingUtils.debug('Step 17 device bind failed ', methodName);
            await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
            return {success: false, message: 'Fail to bind user device'};
          }
          LoggingUtils.debug('Step 18 updating appuser staus idcom verified ', methodName);
          let updateUserStatus = await this.appUserRepository.updateAll(
            {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.IDCOMVerified.value, userCode: decryptIdToken.customerID},
            {id: appUserId, isActive: true}
          );
          if (!updateUserStatus) {
            //@todo add it to error logs
            await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
            return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
          }
          //Fetching and storing demat account and dpid
          LoggingUtils.debug('Step 19 fetching demat account ', methodName);
          await this.getDematAcc(appUserId, decryptIdToken.customerID, transactionId);
          LoggingUtils.debug('Step 20 End of single customer handle idcom callback ', methodName);
          let tokenUpdated: Array<any> = [];
          if (userProfile.resolvedRoles && Array.isArray(userProfile.resolvedRoles) && userProfile.resolvedRoles.indexOf('CLIENT') > -1) {
            tokenUpdated = await this.appAccessTokenFacade.recreateTokenData(appUserId);
            if (!tokenUpdated || !Array.isArray(tokenUpdated)) tokenUpdated = [];
          }
          await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: true});
          return {success: true, message: 'Proceed with mPin setup', tokenUpdated: tokenUpdated.length > 0 ? true : false};
        } else if (idcomData!.appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.multipleCustomerID.value) {
          //Multiple customer flow
          // to fetch customer Details from ETB
          LoggingUtils.debug('Step 21 multiple customer flow ', methodName);
          LoggingUtils.debug('Step 22 invoked ETP SYNC with customer id from decryptToken  ', methodName);
          let etbDetails = await this.coreBankingFacade.fetchCustomerAccountAmlFatcaDetails(
            '',
            '',
            '',
            decryptIdToken.customerID,
            transactionId,
            appUserId,
            options
          );
          LoggingUtils.debug(`Step 23 etb response `, methodName);
          if (etbDetails!.success) {
            LoggingUtils.debug('Step 24 etb success ', methodName);
            LoggingUtils.debug('Step 25 Validating MFRTA ', methodName);
            const mfaChecks = await this.validateMfRtaFields(appUserId, options);
            // fetching updated  user Details
            if (!mfaChecks.success) {
              LoggingUtils.debug('Step 26 failed mfrta validation ', methodName);
              let updatedUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value, remarks: mfaChecks.remarks},
                {id: appUserId}
              );
              LoggingUtils.debug('Step 27 app user status updated with mfrtacheck failed ', methodName);
              //throw new Error('MFA RTA Checks failed');
              if (!updatedUserStatus) {
                //@todo add it to error logs
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }
              LoggingUtils.debug('Step 28 flow end with mfrat failed ', methodName);
              await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: true});
              return {
                success: false,
                message: 'mfRTA check failed',
                mfaChecks,
                isMFRTAcheckpass: false,
                appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value,
                remarks: mfaChecks.remarks
              };
            }

            // fetching updated  userdetails
            LoggingUtils.debug('Step 29 fetching updated investor details ', methodName);
            const investorUser = await this.investorDetailsRepository.findOne({
              where: {
                appUserId: appUserId
              },
              include: [
                {
                  relation: 'appUser'
                }
              ]
            });
            LoggingUtils.debug(`Step 30 investor details  `, methodName);
            if (investorUser && investorUser.appUser && investorUser.appUser.bosCode) {
              // need to check if advisory customer
              LoggingUtils.debug('Step 30 advisory customer check ', methodName);
              isAdvisoryCustomer = await this.checkIfAdvisoryCustomer(investorUser.appUser.bosCode);
              // updating the user Status
              if (isAdvisoryCustomer) {
                LoggingUtils.debug('Step 31 update user status to advisory customer ', methodName);
                let updatedUserStatus = await this.appUserRepository.updateAll(
                  {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.advisoryUser.value},
                  {id: appUserId, isActive: true}
                );
                if (!updatedUserStatus) {
                  //@todo add it to error logs
                  await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
                  return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
                }
                LoggingUtils.debug('Step 32 flow end with advisory customer ', methodName);
                await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: true});
                return {success: true, message: 'Advisory customer', isAdvisoryCustomer};
              }

              // need to check if exists in wealthfy domestic
              LoggingUtils.debug('Step 33 wealthfy customer check ', methodName);
              isWealthfyCustomer = await this.checkIfExistingWealthfyCustomer(investorUser.appUser.bosCode, transactionId); // @TODO need to revert this after LZ testing
              // isWealthfyCustomer = false;
              if (isWealthfyCustomer) {
                LoggingUtils.debug('Step 34 upadte user status with wealthfy customer ', methodName);
                let updatedUserStatus = await this.appUserRepository.updateAll(
                  {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.wealthfyDomesticUser.value},
                  {id: appUserId, isActive: true}
                );

                if (!updatedUserStatus) {
                  //@todo add it to error logs
                  await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
                  return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
                }
                LoggingUtils.debug('Step 35  flow end with wealthfy customer ', methodName);
                await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: true});
                return {success: true, message: 'Wealthfy customer', isWealthfyCustomer};
              }

              // Device Binding
              LoggingUtils.debug('Step 36 All 3 check passed proceding with device binding ', methodName);
              let deviceBind = await this.deviceBind(idcomData!.appUserId, idcomData!.deviceId);
              LoggingUtils.debug(`Step 37 device bind data `, methodName);
              if (!deviceBind) {
                LoggingUtils.debug('Step 37 device bind failed ', methodName);
                await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
                return {success: false, message: 'Fail to bind user device'};
              }
              LoggingUtils.debug('Step 38 Update app user as idcom verified ', methodName);
              let updateUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.IDCOMVerified.value, userCode: decryptIdToken.customerID},
                {id: appUserId, isActive: true}
              );
              if (!updateUserStatus) {
                //@todo add it to error logs
                await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }
              //Recreating Appaccess token data
              LoggingUtils.debug('Step 39 refresh token data ', methodName);
              let tokenUpdated: Array<any> = [];
              if (
                userProfile.resolvedRoles &&
                Array.isArray(userProfile.resolvedRoles) &&
                userProfile.resolvedRoles.indexOf('CLIENT') > -1
              ) {
                tokenUpdated = await this.appAccessTokenFacade.recreateTokenData(appUserId);
                if (!tokenUpdated || !Array.isArray(tokenUpdated)) tokenUpdated = [];
                LoggingUtils.debug(`Step 40 tokendata  `, methodName);
              }
              //Fetching and storing demat account and dpid
              LoggingUtils.debug('Step 41 fetching demat account details ', methodName);
              await this.getDematAcc(appUserId, decryptIdToken.customerID, transactionId);
              //Need to check with pranav what do after calling this api
              // await this.getDematAcc(appUserId,decryptIdToken.customerID)
              LoggingUtils.debug('Step 42 flow end for multiple customer ', methodName);
              await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: true});
              return {success: true, message: 'Proceed with mPin setup', tokenUpdated: tokenUpdated.length > 0 ? true : false};
            }
          } else if (!etbDetails!.success && etbDetails!.bankErrorCode) {
            LoggingUtils.debug(etbDetails, methodName);
            LoggingUtils.error('Step 43 ETB received error from bank ', methodName);
            await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
            return Promise.reject(new RestError(465, `Please try after some time.`, {systemcode: 1201}));
          } else {
            LoggingUtils.error('Step 44 Error occured in when syncing ETB ', methodName);
            throw new Error('Something went wrong with ETB Sync');
          }
        } else {
          LoggingUtils.debug(
            'Step 45 Restart Onboarding process as app user status doesnot match with single / multiple customer flow',
            methodName
          );
          await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
          return {success: false, message: 'Restart Onboarding process'};
        }
      } else {
        LoggingUtils.debug('Step 46 Failed to fetch id token ', methodName);
        await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
        return {success: false, message: 'Failed to fetch id token'};
      }
    } catch (error) {
      LoggingUtils.debug('Step 47 catch block ', methodName);
      await this.idcomDetailsRepository.updateById(idcomDataId, {handleCallbackStatus: false});
      LoggingUtils.error(error, methodName);
      //return new RestError(400, error.message);
      throw error;
    }
  }

  /**
   * Device binding method
   * @param userId
   * @param deviceId
   * @param options
   * @returns
   */
  async deviceBind(userId: number, deviceId: number, options?: Options): Promise<any> {
    try {
      if (!deviceId) {
        return new RestError(400, 'Device id is required', {systemcode: 1212});
      }
      const device: any = await this.deviceRepository
        .findOne({
          where: {and: [{id: deviceId}, {appUserId: userId}]}
        })
        .catch(err => {
          throw new Error(err);
        });
      if (isEmpty(device)) {
        return new RestError(400, 'device not found', {systemcode: 1033});
      }
      const concatString = `${device.uniqueId}-${device.osName}-${device.versionCode}-${device.osSDKVersion}`;
      const bindingIdentifier = await CryptoUtils.encrypt(concatString);
      await this.deviceRepository.updateById(device.id, {bindingData: bindingIdentifier});
      return {...device, bindingData: bindingIdentifier, success: true};
    } catch (error) {
      LoggingUtils.error(error);
      return new RestError(400, 'Error occured while binding your device!', {systemcode: 1036});
    }
  }

  async handleEkycCallback(data: {
    errDescription: string;
    sessId: string;
    ekycCompleted: string;
    ekycMessage: string | null;
  }): Promise<any> {
    try {
      await new Promise((resolve, reject) => {
        fs.appendFile(
          path.resolve(__dirname, EKYCCALLBACKPATH),
          `${data.errDescription} | ${data.sessId} | ${data.ekycCompleted} | ${data.ekycMessage} \n`,
          err => {
            if (err) reject(err);
          }
        );
        resolve(true);
      });
      return Promise.resolve({status: data.ekycCompleted});
    } catch (error) {
      return Promise.resolve({status: false});
    }
  }
  /**
   * AppUserStatus Polling Endpoint
   * @param id
   * @param options
   * @returns
   */
  async getCallBackStatus(id: number, authCode: string, options?: Options): Promise<any> {
    try {
      if (!id) {
        return new RestError(400, 'User id cannot be empty', {systemcode: 1029});
      }
      const idcomDetails = await this.idcomDetailsRepository
        .findOne(
          {
            where: {
              authCode: Buffer.from(authCode, 'utf8').toString('base64'),
              appUserId: id,
              isActive: true
            },
            fields: {
              id: true,
              appUserId: true,
              handleCallbackStatus: true,
            }
          },
          options
        )
        .catch(error => {
          throw new Error(error);
        });

      if (!idcomDetails) {
        return {success: false, message: 'No records found for this id'};
      }

      const user = await this.appUserRepository.findOne(
        {
          where: {
            id: id
          },
          fields: ['appUserStatus', 'remarks']
        },
        options
      );

      return {success: true, ...idcomDetails, ...user};
    } catch (error) {
      LoggingUtils.error(error);
      return new RestError(400, 'Error while fetching callback status', {systemcode: 1213});
    }
  }

  /**
   *This function updates used contact details and also perform device binding
   * @param id
   * @param userDeviceId
   * @param emailId
   * @param panNo
   * @returns
   */
  async updateContactDetails(id: number, userDeviceId: number, emailId: string, panNo?: string): Promise<any> {
    let deviceId = userDeviceId; //@todo fetch it form token
    let appUserId = id; //@todo to fetch user id form token
    try {
      const appUser = await this.appUserRepository.findById(appUserId);
      if (appUser.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.NTBUser.value) {
        if (panNo) {
          // Check if Panno available
          let isValidPan = await this.validatePAN(panNo);
          if (!isValidPan) {
            throw new Error(`Invalid Pan card number`);
          }

          let investorDetailsObj: any = {
            panCardNumber: panNo,
            appUserId: appUserId,
            isActive: true
          };
          let existingInvestorDetails = await this.investorDetailsRepository.findOne({
            where: {
              appUserId: appUserId,
              isActive: true
            }
          });
          if (existingInvestorDetails) {
            await this.investorDetailsRepository.updateById(existingInvestorDetails.id, investorDetailsObj);
          } else {
            const insertValues = await this.investorDetailsRepository.create(investorDetailsObj);
            if (!insertValues) {
              throw new Error(`Error while inserting into the investorDetailsRepository`);
            }
          }
        }

        if (!emailId) {
          return new RestError(400, 'Email id cannot be empty', {systemcode: 1214});
        }
        let userObject = {
          email: emailId
        };

        let updatedAppUserData = await this.appUserRepository.updateAll(userObject, {id: appUserId, isActive: true});
        if (!updatedAppUserData) {
          return new RestError(400, 'Unable to update user details', {systemcode: 1215});
        }

        let deviceBind = await this.deviceBind(appUserId, deviceId);
        if (!deviceBind) {
          return {success: false, message: 'Fail to bind user device'};
        }

        return {success: true, message: 'Proceed with mPin setup'};
      } else {
        return {message: 'Not an NTB user', isNTB: false, success: false};
      }
    } catch (error) {
      LoggingUtils.error(error);
      return new RestError(400, 'Error occured while updating contact details.', {systemcode: 1216});
    }
  }

  async doPublishOTP(contactNumber: string, otp: OtpMessages, transactionId: string, msgType : string) {
    let env = process.env.MOCK_OTP ?? '';
    if (env.toLowerCase() === 'true') {
      return true
    }
    const response = await this.coreBankingFacade.doPublishOTP(contactNumber, otp, transactionId, msgType);
    let activityObj = {
      executionDate: new Date(),
      apiName: 'Publish OTP',
      errorCode: JSON.stringify(response),
      details: '',
      status: ''
    };
    // applicationLog(activityObj);

    return response;
  }

  //This function is only for testing
  async doPublishOTPMock(contactNumber: string, otp: OtpMessages, transactionId: string) {
    return true
  }

  async processEmail(id: number) {
    try {
      let message = new CommunicationQueueMessage();
      message.eventType = CommunicationQueueMessageEventType.PROCESS_CAS_FROM_EMAIL;
      message.userId = id;
      await QueueProducer.sendMessageInCommunicationQueue(message);
      return {success: true};
    } catch (err: any) {
      LoggingUtils.error(err);
      throw err;
    }
  }

  async validateMfRtaFields(userId: number, options?: Options): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let errorFields: any[] = [];
      await this.investorDetailsRepository
        .find({where: {appUserId: userId}}, options)
        .then(async (userInvestorDetails: any) => {
          /*
           const userFromBlockedCountries = this.blockedCountries(userInvestorDetails, options);
             if (await userFromBlockedCountries) {
             resolve({sucess: false, remarks: 'USER FROM BLOCKED COUNTRIES'});
            }
          */
          return this.reviewUserDetails(userId, true, options);
        })
        .then((userDetails: any) => {
          LoggingUtils.debug(`User details `, 'validateMfRtaFields');
          if (!userDetails) {
            return Promise.reject(new RestError(404, 'User Details not found', {systemcode: 1217}));
          }
          // address checks
          if (Object.keys(userDetails.userAddress['metaData'])) {
            Object.keys(userDetails.userAddress['metaData']).forEach(key => {
              if (userDetails.userAddress['metaData'][key].mfRTA) {
                Object.keys(userDetails.userAddress['metaData'][key].mfRTA).forEach(akey => {
                  if (
                    !userDetails.userAddress['metaData'][key]['mfRTA'][akey] ||
                    userDetails.userAddress['metaData'][key]['mfRTA'][akey] === '' ||
                    !userDetails.userAddress['metaData'][key]['mfRTA'][akey] === null
                  ) {
                    errorFields.push(akey);
                  }
                });
              } else {
                resolve({sucess: false, remarks: 'MF_RTA_NOT_FOUND'});
              }
            });
          } else {
            // update user status to blocked
            resolve({sucess: false, remarks: 'META_DATA_NOT_FOUND'});
          }
          // Personal details checks
          if (userDetails.userPersonalDetails.metaData.mfRTA) {
            Object.keys(userDetails.userPersonalDetails.metaData.mfRTA).forEach(key => {
              if (
                !userDetails.userPersonalDetails.metaData['mfRTA'][key] ||
                userDetails.userPersonalDetails.metaData['mfRTA'][key] === '' ||
                !userDetails.userPersonalDetails.metaData['mfRTA'][key] === null
              ) {
                errorFields.push(key);
              }
            });
          } else {
            resolve({sucess: false, remarks: 'MF_RTA_NOT_FOUND'});
          }

          // User Professional Details checks
          // if (userDetails.userProfessionalDetails.metaData.mfRTA) {
          //   Object.keys(userDetails.userProfessionalDetails.metaData.mfRTA).forEach(key => {
          //     if (
          //       !userDetails.userProfessionalDetails.metaData['mfRTA'][key] ||
          //       userDetails.userProfessionalDetails.metaData['mfRTA'][key] === '' ||
          //       !userDetails.userProfessionalDetails.metaData['mfRTA'][key] === null
          //     ) {
          //       errorFields.push(key);
          //     }
          //   });
          // } else {
          //   resolve({sucess: false, remarks: 'MF_RTA_NOT_FOUND'});
          // }

          // User bank Details checks
          if (userDetails.userBankAccountsDetails.metaData.mfRTA.length > 0) {
            for (let bankDetail of userDetails.userBankAccountsDetails.metaData.mfRTA) {
              Object.keys(bankDetail).forEach(key => {
                if (!bankDetail[key] || bankDetail[key] === '' || !bankDetail[key] === null) {
                  errorFields.push(key);
                }
              });
            }
          } else {
            resolve({sucess: false, remarks: 'MF_RTA_NOT_FOUND'});
          }

          if (errorFields.length) {
            resolve({success: false, remarks: JSON.stringify(errorFields)});
          }
          resolve({
            success: true,
            remarks: 'success'
          });
        })
        .catch(err => {
          LoggingUtils.error(err, 'validateMfRtaFields');
          reject(err);
        });
    });
  }

  async getDematLandingReqXML(customerId: string | number = 50000010): Promise<string> {
    // @todo Remove default value once we know the Field mapping  for acctno, dpid
    const refId = OrderUtils.getRandomNumber(14);
    return `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:inq="http://inquiry.service.demat.appx.cz.fc.ofss.com/" xmlns:con="http://context.app.fc.ofss.com" xmlns:exc="http://exception.infra.fc.ofss.com" xmlns:dat="http://datatype.fc.ofss.com" xmlns:dto="http://dto.common.domain.framework.fc.ofss.com" xmlns:dom="http://domain.framework.fc.ofss.com">
    <soapenv:Header/>
    <soapenv:Body>
        <inq:doDematLandingPage>
            <!--Optional:-->
            <arg0>
                <con:bankCode>08</con:bankCode>
                <con:channel>${process.env.COMMON_API_CHANNEL}</con:channel>
                <con:transactingPartyCode>50000011</con:transactingPartyCode>
                <con:transactionBranch>089999</con:transactionBranch>
                <con:userId>${process.env.COMMON_API_CHANNEL_USER_ID}</con:userId>
                <con:externalReferenceNo>${refId}</con:externalReferenceNo>
            </arg0>
            <!--Optional:-->
            <arg1>
                <msghdr>
                    <msgtp>DBACTLSTRQ</msgtp>
                    <reqapp>BACKBASE</reqapp>
                    <reqtmstmp>${moment().format('yyyyMMDDhhmmss')}</reqtmstmp>
                </msghdr>
                <reqdtls>
                    <custid>${customerId}</custid>
                    <inclplgbal>N</inclplgbal>
                    <inclpval>N</inclpval>
                    <inclpvanal>N</inclpvanal>
                    <reqrefno>${refId}</reqrefno>
                </reqdtls>
            </arg1>
        </inq:doDematLandingPage>
    </soapenv:Body>
</soapenv:Envelope>
    `;
  }

  async getDematAcc(id: number, customerId: number, transactionId: string): Promise<any> {
    try {
      const ENDPOINT = process.env.USR_MGMT_FCD_DEMAT_LANDING_PAGE_URL as string;
      const reqXML = await this.getDematLandingReqXML(customerId);
      // console.log(reqXML);
      // const axiosResponse = {status: 200};
      const axiosResponse = await axios
        .post(ENDPOINT, reqXML, {
          headers: {
            'Content-Type': 'text/xml'
          },
          httpsAgent: new https.Agent({
            cert: sslCrt,
            key: sslCrtKey,
            ca: sslCa,
            ciphers: 'DEFAULT:@SECLEVEL=1',
            rejectUnauthorized: false
          })
        })
        .catch(error => {
          LogApiCallUtils.sendMessageOutgoingApiCall({
            url: ENDPOINT,
            request: reqXML,
            response: error.code,
            success: false,
            transactionId: transactionId,
            extraInfo: {
              channel: process.env.COMMON_API_CHANNEL,
              user_id: process.env.COMMON_API_CHANNEL_USER_ID
            },
            externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.DBOS
          });
          throw new Error(error);
        });

      if (axiosResponse.status !== 200) {
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: ENDPOINT,
          request: reqXML,
          response: axiosResponse.data,
          success: false,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.DBOS
        });
        return new RestError(400, 'Some error occured getting response from external service', {systemcode: 1161});
      } else {
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: ENDPOINT,
          request: reqXML,
          response: axiosResponse.data,
          success: true,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.DBOS
        });
        // local testing
        // const repXMlFile = path.resolve(__dirname, '../../', 'sampleResponseXML', 'resp.xml');
        // const response = fs.readFileSync(repXMlFile, {encoding: 'utf8'});
        // const responseJson: any = await xml2js(response, {compact: true, sanitize: true});
        const responseJson: any = await xml2js(axiosResponse.data, {compact: true, sanitize: true});
        const status =
          responseJson['S:Envelope']['S:Body']['ns11:doDematLandingPageResponse']['return']['responseservice:status'][
          'responseservice:errorCode'
          ]['_text'];

        const responseMessage =
          responseJson['S:Envelope']['S:Body']['ns11:doDematLandingPageResponse']['return']['responseservice:status'][
          'responseservice:replyText'
          ]['_text'];

        if (status != 0) {
          return new RestError(400, responseMessage);
        }

        const respData: any =
          responseJson['S:Envelope']['S:Body']['ns11:doDematLandingPageResponse']['return']['debosdata']['acctlist']['acctdtl'];

        const resp: any = {};
        resp['accNum'] = Array.isArray(respData) ? respData[0]['acctno']['_text'] : respData['acctno']['_text'];
        resp['dpid'] = Array.isArray(respData) ? respData[0]['dpid']['_text'] : respData['dpid']['_text'];

        const appuserUpdate = await this.appUserRepository.updateAll({dematAccNumber: resp['accNum'], dematDpId: resp['dpid']}, {id: id});
        if (appuserUpdate) {
          return new RestError(400, 'Unable to update appUser', {systemcode: 1219});
        }
        return {success: true, data: resp};
      }
    } catch (error) {
      // Throw Error if any error occure.
      LoggingUtils.error(error);
      //return new RestError(400, 'Some error occured fetching holding statement');
      throw error;
    }
  }

  async mockGetDematAcc(id: number, customerId: number, transactionId: string): Promise<any> {
    try {
      const ENDPOINT = process.env.USR_MGMT_FCD_DEMAT_LANDING_PAGE_URL as string;
      const reqXML = await this.getDematLandingReqXML(customerId);
      // console.log(reqXML);
      // const axiosResponse = {status: 200};
      const axiosResponse = await axios
        .post(ENDPOINT, reqXML, {
          headers: {
            'Content-Type': 'text/xml'
          },
          httpsAgent: new https.Agent({
            cert: sslCrt,
            key: sslCrtKey,
            ca: sslCa,
            ciphers: 'DEFAULT:@SECLEVEL=1',
            rejectUnauthorized: false
          })
        })
        .catch(error => {
          let activityObj = {
            executionDate: new Date(),
            apiName: 'user-management -> getDematAcc',
            errorCode: error.code,
            details: error.stack,
            status: 'failed'
          };
          applicationLog(activityObj);
          LogApiCallUtils.sendMessageOutgoingApiCall({
            url: ENDPOINT,
            request: reqXML,
            response: error.code,
            success: false,
            transactionId: transactionId,
            extraInfo: {
              channel: process.env.COMMON_API_CHANNEL,
              user_id: process.env.COMMON_API_CHANNEL_USER_ID
            },
            externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.DBOS
          });
          throw new Error(error);
        });

      if (axiosResponse.status !== 200) {
        let activityObj = {
          executionDate: new Date(),
          apiName: 'user-management -> getDematAcc',
          errorCode: axiosResponse.status,
          details: JSON.stringify(axiosResponse),
          status: 'failed'
        };
        applicationLog(activityObj);
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: ENDPOINT,
          request: reqXML,
          response: axiosResponse.data,
          success: false,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.DBOS
        });
        return new RestError(400, 'Some error occured getting response from external service', {systemcode: 1161});
      } else {
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: ENDPOINT,
          request: reqXML,
          response: axiosResponse.data,
          success: true,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.DBOS
        });
        // local testing
        // const repXMlFile = path.resolve(__dirname, '../../', 'sampleResponseXML', 'resp.xml');
        // const response = fs.readFileSync(repXMlFile, {encoding: 'utf8'});
        // const responseJson: any = await xml2js(response, {compact: true, sanitize: true});
        // fs.writeFileSync('land.json', JSON.stringify(responseJson),{encoding:'utf8'});
        const responseJson: any = await xml2js(axiosResponse.data, {compact: true, sanitize: true});
        const status =
          responseJson['S:Envelope']['S:Body']['ns11:doDematLandingPageResponse']['return']['responseservice:status'][
          'responseservice:errorCode'
          ]['_text'];

        const responseMessage =
          responseJson['S:Envelope']['S:Body']['ns11:doDematLandingPageResponse']['return']['responseservice:status'][
          'responseservice:replyText'
          ]['_text'];

        if (status != 0) {
          return new RestError(400, responseMessage);
        }

        const respData: any =
          responseJson['S:Envelope']['S:Body']['ns11:doDematLandingPageResponse']['return']['debosdata']['acctlist']['acctdtl'];

        const resp: any = {};
        resp['accNum'] = Array.isArray(respData) ? respData[0]['acctno']['_text'] : respData['acctno']['_text'];
        resp['dpid'] = Array.isArray(respData) ? respData[0]['dpid']['_text'] : respData['dpid']['_text'];

        const appuserUpdate = await this.appUserRepository.updateAll({dematAccNumber: resp['accNum'], dematDpId: resp['dpid']}, {id: id});
        if (appuserUpdate) {
          return new RestError(400, 'Unable to update appUser', {systemcode: 1219});
        }
        return {success: true, data: resp};
      }
    } catch (error) {
      // Throw Error if any error occure.
      LoggingUtils.error(error);
      //return new RestError(400, 'Some error occured fetching holding statement');
      throw error;
    }
  }

  async getSignatureReqXML(customerId: string | number = 50000010): Promise<string> {
    // @todo Remove default value once we know the Field mapping  for acctno, dpid
    const refId = OrderUtils.getRandomNumber(14);
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:inq="http://inquiry.service.party.appx.cz.fc.ofss.com/" xmlns:con="http://context.app.fc.ofss.com" xmlns:exc="http://exception.infra.fc.ofss.com" xmlns:dto="http://dto.common.domain.framework.fc.ofss.com" xmlns:dom="http://domain.framework.fc.ofss.com">
    <soapenv:Header/>
    <soapenv:Body>
       <inq:doCustomerSignatureInq>
          <!--Optional:-->
          <arg0>
             <con:bankCode>08</con:bankCode>
             <con:channel>${process.env.COMMON_API_CHANNEL}</con:channel>
             <con:externalReferenceNo>${refId}</con:externalReferenceNo>
             <con:transactingPartyCode>50000010</con:transactingPartyCode>
             <con:transactionBranch>089999</con:transactionBranch>
             <con:userId>${process.env.COMMON_API_CHANNEL_USER_ID}</con:userId>
          </arg0>
          <!--Optional:-->
          <arg1>
             <!--Zero or more repetitions:-->
             <customerId>${customerId}</customerId>
          </arg1>
       </inq:doCustomerSignatureInq>
    </soapenv:Body>
 </soapenv:Envelope>
    `;
  }

  async getSignature(id: number, transactionId: string): Promise<any> {
    let file_paths: Array<string> = [];
    try {
      const ENDPOINT = process.env.USR_MGMT_FCD_SIGNATURE_URL as string;
      const user = await this.appUserRepository.findOne({
        where: {
          id: id
        },
        include: ['investorDetails']
      });
      if (!user) {
        return Promise.reject(new RestError(404, `No User found!`, {systemcode: 1030}));
      }
      if (user?.investorDetails?.signatureImageFileId) {
        return {success: true, message: 'Signature already Exits!'};
      }
      let customerId = user.bosCode;
      const reqXML = await this.getSignatureReqXML(customerId);
      //const axiosResponse = {status: 200};
      const axiosResponse = await axios
        .post(ENDPOINT, reqXML, {
          headers: {
            'Content-Type': 'text/xml'
          },
          httpsAgent: new https.Agent({
            cert: sslCrt,
            key: sslCrtKey,
            ca: sslCa,
            ciphers: 'DEFAULT:@SECLEVEL=1',
            rejectUnauthorized: false
          })
        })
        .catch((error: any) => {
          LogApiCallUtils.sendMessageOutgoingApiCall({
            url: ENDPOINT,
            request: reqXML,
            response: error.code,
            success: false,
            transactionId: transactionId,
            extraInfo: {
              channel: process.env.COMMON_API_CHANNEL,
              user_id: process.env.COMMON_API_CHANNEL_USER_ID
            },
            externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.SIGNATURE
          });
          throw new Error(error);
        });
      if (axiosResponse.status !== 200) {
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: ENDPOINT,
          request: reqXML,
          response: axiosResponse.data,
          success: false,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.SIGNATURE
        });
        return new RestError(400, 'Some error occured getting response from external service', {systemcode: 1161});
      } else {
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: ENDPOINT,
          request: reqXML,
          response: axiosResponse.data,
          success: true,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.SIGNATURE
        });
        // local testing
        // const repXMlFile = path.resolve(__dirname, '../../', 'sampleResponseXML', 'signatureResp.xml');
        // const response = fs.readFileSync(repXMlFile, {encoding: 'utf8'});
        // const responseJson: any = await xml2js(response, {compact: true, sanitize: true});
        const responseJson: any = await xml2js(axiosResponse.data, {compact: true, sanitize: true});
        const status =
          responseJson['S:Envelope']['S:Body']['ns11:doCustomerSignatureInqResponse']['return']['responseservice:status'][
          'responseservice:errorCode'
          ]['_text'];

        const responseMessage =
          responseJson['S:Envelope']['S:Body']['ns11:doCustomerSignatureInqResponse']['return']['responseservice:status'][
          'responseservice:replyText'
          ]['_text'];

        if (status != 0) {
          return new RestError(400, responseMessage);
        }

        const base64Data: any =
          responseJson['S:Envelope']['S:Body']['ns11:doCustomerSignatureInqResponse']['return']['custSignature']['_text'];
        // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...

        const resolvedPath = path.resolve(`${__dirname}/../../.tmp`)
        const base64DataBufferJpg = await ContainerUtils.convertBitmapToJpg(base64Data, resolvedPath)
        // const buffer = Buffer.from(base64DataBufferJpg, 'base64');
        let fileName = 'image-' + moment().format('YYYYMMDD') + '-' + customerId + '.png';
        const inputFilePath = path.resolve(__dirname, `../../.tmp/${fileName}`);
        fs.writeFileSync(inputFilePath, base64DataBufferJpg);

        file_paths.push(inputFilePath);

        const uploadFile = await ContainerUtils.uploadFileFromServer(
          this.fileStorageService,
          FileStorageContainerConfig.getGcpContainerName('signatures'),
          fileName,
          inputFilePath
        );
        await fs.promises.unlink(inputFilePath);
        this.fileStorageService.getFile(FileStorageContainerConfig.getGcpContainerName('signatures'), fileName, async (err, file) => {
          if (err) {
            Promise.reject(err);
          }
          if (!file) {
            return Promise.reject(new RestError(404, `No file found!`, {systemcode: 1027}));
          } else {
            const appFile = await this.userManagementAppFileRepository.create({
              containerName: FileStorageContainerConfig.getGcpContainerName('signatures'),
              path: file.name,
              originalFileName: file.name,
              name: file.name,
              size: file.size,
              extension: file.name.split('.')[file.name.split('.').length - 1],
              mimeType: 'image/png',
              checksum: uploadFile.checksum
            });
            const investorDetailsUpdate = await this.investorDetailsRepository.updateAll(
              {signatureImageFileId: appFile?.id},
              {appUserId: id}
            );
            if (investorDetailsUpdate.count) {
              return new RestError(400, 'Unable to update appUser', {systemcode: 1219});
            }
            return {success: true, data: investorDetailsUpdate};
          }
        });
        return {success: true};
      }
    } catch (error) {
      // Throw Error if any error occure.
      LoggingUtils.error(error);
      for (let item of file_paths) {
        // we are using existSync as exist is deprecated and this is the only function exist to check the Existing of the File
        let val = fs.existsSync(item);
        if (val) await fs.promises.unlink(item);
      }
      //return new RestError(400, 'Some error occured fetching holding statement');
      throw error;
    }
  }
  async uploadRtaFile(userId: number, rtaId: number, request?: Request, response?: Response, options?: Options): Promise<object> {
    try {
      LoggingUtils.info(`Entered to uploadRtaFile :: ${rtaId}--rtaId`, 'RTA UPLOAD');
      const uploadPromise = promisify(this.fileStorageService.upload);

      //upload Reverse feed files
      const uploadResponse: any = await uploadPromise(
        FileStorageContainerConfig.getGcpContainerName('folioaudittrail'),
        request,
        response,
        {}
      );

      if (!uploadResponse) {
        return Promise.reject(new RestError(400, 'File not uploaded', {systemcode: 1026}));
      }
      LoggingUtils.info('File uploaded to server', 'RTA UPLOAD');
      let mimeType = MimeTypesConfig.MimeTypes.dbf.name;
      //check mime type and throw the error if not valid mime type
      await ContainerUtils.checkMimeType(this.fileStorageService, uploadResponse, mimeType);

      let file = uploadResponse.files.files[0];

      var downloadFile = await ContainerUtils.downloadFileToServer(
        this.fileStorageService,
        FileStorageContainerConfig.getGcpContainerName('folioaudittrail'),
        file.name,
        path.resolve(__dirname, '../../.tmp/', file.name)
      );

      LoggingUtils.info('File downloaded to server', 'RTA UPLOAD');


      const content = await fs.promises.readFile(downloadFile);
      const fileChecksum = await CryptoUtils.generateFileChecksum(content);

      const possibleExtensions = MimeTypesConfig.MimeTypes.dbf.possibleExtensions;

      const isValidFileType = await ContainerUtils.validateFileType(path.resolve(downloadFile), possibleExtensions, content);
      LoggingUtils.info('File validation check done', 'RTA UPLOAD');
      if (fs.existsSync(downloadFile)) {
        await fs.promises.unlink(downloadFile);
      }

      if (!isValidFileType) {
        return Promise.reject(
          new RestError(465, 'The file format is invalid. Please upload the file in correct format.', {systemcode: 1218})
        );
      }


      const userManagementAppFileData: UserManagementAppFile = await this.userManagementAppFileRepository.create(
        {
          containerName: FileStorageContainerConfig.getGcpContainerName('folioaudittrail'),
          path: file.name,
          originalFileName: file.originalFilename,
          name: file.name,
          size: file.size,
          extension: file.type,
          mimeType: file.type,
          checksum: fileChecksum
        },
        options
      );

      if (!userManagementAppFileData) {
        return Promise.reject(new RestError(400, 'Failed to create uploaded file info', {systemcode: 1026}));
      }

      let AuditTrailFileDetails: Partial<AuditTrailFile> = await this.auditTrailFileRepository.create({
        uploadedFileId: userManagementAppFileData?.id,
        status: Option.GLOBALOPTIONS['AUDITTRAILSTATUS']['pending'].value,
        rtaId: rtaId,
        transactionAppFileId: file?.id,
        uploadedByAppUserId: userId,
        name: file?.name
      }, options);

      if (!AuditTrailFileDetails) {
        return Promise.reject(new RestError(400, 'Failed to update Audit trail details', {systemcode: 1026}));
      }

      LoggingUtils.info('File validation check done', 'RTA UPLOAD');

      let message = new OrderProcessingQueueMessage();
      message.eventType = OrderProcessingQueueMessageEventType.AUDIT_TRAIL_PROCESSING;
      message.rtaId = rtaId;
      message.fileName = file.name;
      message.auditTrailFileId = AuditTrailFileDetails?.id;

      await QueueProducer.sendMessageInOrderProcessingQueue(message);
      LoggingUtils.info(`Send to Queue successfully - RTA_HOLDING_RECONCILIATION`, 'RTA UPLOAD')
      return {status: 'success', message: 'File uploaded sucessfully, Please wait until its processed'}
    } catch (error) {
      if (fs.existsSync(downloadFile)) {
        await fs.promises.unlink(downloadFile);
      }

      throw error;
    }
  }

  async auditTrail(data: any, userManagementAppFileData: any, options?: Options) {
    //if any of this data is missing dont update
    // if(!data.folioNumber || !data.email || !data.mobileNumber) return
    //find the service provider base on faolio
    LoggingUtils.info('Entered to AuditTrail Method', 'auditTrail');
    const emailCheck = ValidationUtils.checkIfEmpty(data.email) ? true : ValidationUtils.validateEmail(data.email) ? true : false;
    const mobileCheck = ValidationUtils.checkIfEmpty(data.mobileNumber)
      ? true
      : ValidationUtils.validateMobileNumber(data.mobileNumber)
        ? true
        : false;
    let folioNumberCheck;
    let foliolengthCheck;
    // await this.serviceProviderAccountRepository.updateAll({registeredMobile: String(data.mobileNumber), registeredEmail: data.email, ContactDetailsUpdatedOn: new Date()},{where:{accountNumber: String(data.folioNumber)}},options)
    let serviceProviderAccount: ServiceProviderAccount[] = await this.serviceProviderAccountRepository.find(
      {
        where: {accountNumber: String(data.folioNumber)},
        include: [
          {
            relation: 'serviceProvider'
          }
        ]
      },
      options
    );

    LoggingUtils.info('ServiceProviderAccount data fetched', 'auditTrail');
    if (serviceProviderAccount && serviceProviderAccount.length == 0) {
      folioNumberCheck = false;
      foliolengthCheck = false;
      await this.auditTrailRepository
        .create({
          accountAppFileMappingId: userManagementAppFileData.id,
          oldRegisteredEmail: '',
          newRegisteredEmail: emailCheck ? data.email : '',
          newRegisteredMobileNo: mobileCheck ? data.mobileNumber : '',
          remark: `Invalid Folio for ${String(data.folioNumber)}`
        })
        .catch(err => {
          LoggingUtils.error(err);
        });
      return;
    }
    for (let i = 0; i < serviceProviderAccount.length; i++) {
      if (serviceProviderAccount[i].serviceProvider) {
        if (serviceProviderAccount[i].serviceProvider.rtaId == 2) {
          folioNumberCheck =
            ValidationUtils.checkIfEmpty(data.folioNumber) === true &&
            serviceProviderAccount[i].accountNumber == data.folioNumber &&
            (serviceProviderAccount[i].serviceProvider.primaryAMCCode == data.amc_code ||
              serviceProviderAccount[i].serviceProvider.secondaryAMCCode == data.amc_code);
          // foliolengthCheck = data.folioNumber ? ((typeof data.folioNumber) == 'string' && String(data.folioNumber).length <= 20) : false
        } else {
          folioNumberCheck =
            ValidationUtils.checkIfEmpty(data.folioNumber) === true &&
            serviceProviderAccount[i].accountNumber == data.folioNumber &&
            (serviceProviderAccount[i].serviceProvider.primaryAMCCode == data.fund ||
              serviceProviderAccount[i].serviceProvider.secondaryAMCCode == data.fund);
          // foliolengthCheck = data.folioNumber ? ((typeof data.folioNumber) == 'number' && String(data.folioNumber).length <= 15) : false
        }
      }
      //update the serviceProvideAccountRespository
      if (emailCheck && mobileCheck && folioNumberCheck) {
        await this.serviceProviderAccountRepository.updateById(
          serviceProviderAccount[i]?.id,
          {
            registeredMobile: data.mobileNumber ? String(data.mobileNumber) : '',
            registeredEmail: data.email ? data.email : '',
            ContactDetailsUpdatedOn: new Date()
          },
          options
        );
      }

      LoggingUtils.info('Updated in serviceProviderAccountRepository', 'auditTrail');

      await this.auditTrailRepository.create({
        serviceProviderAccountId: serviceProviderAccount[i]?.id,
        accountAppFileMappingId: userManagementAppFileData.id,
        oldRegisteredEmail: serviceProviderAccount[i]?.registeredEmail,
        newRegisteredEmail: emailCheck ? data.email : '',
        newRegisteredMobileNo: mobileCheck ? data.mobileNumber : '',
        oldRegisteredMobileNo: Number(serviceProviderAccount[i]?.registeredMobile),
        remark: !emailCheck
          ? 'Invalid Email'
          : !mobileCheck
            ? 'Invalid Mobile Number'
            : !folioNumberCheck
              ? 'Folio is not avialiable'
              : 'Success'
      });

      LoggingUtils.info('Crated in auditTrailRepository', 'auditTrail');
      let message = new TransactionalDataRefreshingQueueMessage();
      message.eventType = TransactionalDataRefreshingQueueMessageEventType.DATA_REFRESH_BY_SERVICEPROVIDERACCOUNT_ID;
      message.serviceProividerAccountId = serviceProviderAccount[i]?.id;
      await QueueProducer.sendMessageInTransactionalDataRefreshingQueue(message);
    }
    LoggingUtils.info('serviceProviderAccount Iteration done', 'auditTrail');
    return;
  }
  async exportAuditTrail(res: Response, auditTrailFileId: number, options?: Options): Promise<any> {
    let downloadFile: string;
    try {
      if (!auditTrailFileId) throw 'fileId Parameter Missing ';

      let xlsHeaders: any[] = [
        {header: 'FolioNumber', key: 'ServiceProviderAccountNumber', width: 32},
        {header: 'Name', key: 'ServiceProviderName', width: 32},
        {header: 'OldRegisteredEmail', key: 'OldRegisteredEmail', width: 32},
        {header: 'NewRegisteredEmail', key: 'NewRegisteredEmail', width: 32},
        {header: 'NewRegisteredMobile', key: 'NewRegisteredMobile', width: 32},
        {header: 'OldRegisteredMobile', key: 'OldRegisteredMobile', width: 32},
        // {header: 'CreatedDate', key: 'CreatedDate', width: 32},
        // {header: 'LastModifiedDate', key: 'LastModifiedDate', width: 32},
        {header: 'Remark', key: 'Remark', width: 32}
      ];

      const auditTrailFileData = await this.auditTrailFileRepository.findById(auditTrailFileId);

      if (!auditTrailFileData) {
        return new RestError(400, 'No Audit trail file data', {systemcode: 1219});
      }
      if (!(auditTrailFileData?.status === Option.GLOBALOPTIONS['AUDITTRAILSTATUS']['successful'].value)) {

        return new RestError(400, `You can\t download this file since this is in ${auditTrailFileData?.statusLabel} status`, {systemcode: 1219});
      }


      if (auditTrailFileData?.exportedFileId) {

        LoggingUtils.info("Downloading Existing file...", 'exportAuditTrail');
        const appFile = await this.userManagementAppFileRepository.findById(auditTrailFileData?.exportedFileId, options);
        const dlFileName = `${CryptoUtils.generateRandomSecretKey()}${new Date()}${appFile.name}`;
        downloadFile = await ContainerUtils.downloadFileToServer(
          this.fileStorageService,
          appFile.containerName,
          appFile.name,
          path.resolve(__dirname, '../../.tmp/', dlFileName)
        );
        res!.setHeader('Content-disposition', 'attachment; filename=' + appFile.name);
        res!.setHeader('x-rta-file', 'Y');
        const stream = fs.createReadStream(downloadFile);
        stream.pipe(res as any);
        stream.on('close', async () => {
          let val = fs.existsSync(downloadFile);
          if (val) await fs.promises.unlink(downloadFile);
        });
      } else {

        LoggingUtils.info("Generating the file....", 'exportAuditTrail');

        const rawdata = await this.auditTrailRepository.find(
          {
            where: {auditTrailFileId: auditTrailFileData.id},
            include: [
              {
                relation: 'serviceProviderAccount',
                scope: {
                  include: ['serviceProvider']
                }
              }
            ]
          },
          options
        );

        let xls = map(rawdata, (data: any) => {
          let xlsFormat: any = {};
          const serviceProviderAccountNumber = data.serviceProviderAccount ? data.serviceProviderAccount?.accountNumber : '';
          const serviceProviderName = data.serviceProviderAccount ? data.serviceProviderAccount?.serviceProvider?.name : '';
          const newRegisteredMobileNo = data.newRegisteredMobileNo ? data.newRegisteredMobileNo : null;
          const oldRegisteredMobileNo = data.oldRegisteredMobileNo ? data.oldRegisteredMobileNo : null;
          const oldRegisteredEmail = data.oldRegisteredEmail ? data.oldRegisteredEmail : null;
          const newRegisteredEmail = data.newRegisteredEmail ? data.newRegisteredEmail : null;
          // const createdDate = moment(data.createdDate).format('DD-MM-YY');
          // const lastModifiedDate = moment(data.lastModifiedDate).format('DD-MM-YYYY');
          const remark = data.remark ? data.remark : null;

          xlsFormat['ServiceProviderAccountNumber'] = serviceProviderAccountNumber;
          xlsFormat['ServiceProviderName'] = serviceProviderName;
          xlsFormat['OldRegisteredEmail'] = oldRegisteredEmail ? oldRegisteredEmail : '';
          xlsFormat['NewRegisteredEmail'] = newRegisteredEmail ? newRegisteredEmail : '';
          xlsFormat['NewRegisteredMobile'] = newRegisteredMobileNo ? newRegisteredMobileNo : '';
          xlsFormat['OldRegisteredMobile'] = oldRegisteredMobileNo ? oldRegisteredMobileNo : '';
          // xlsFormat['CreatedDate'] = createdDate ? createdDate : '';
          // xlsFormat['LastModifiedDate'] = lastModifiedDate ? lastModifiedDate : '';
          xlsFormat['Remark'] = remark ? remark : '';

          return xlsFormat;
        });
        res.append('fileName', 'HoldingsReport.xlsx');
        xlsHeaders = [...xlsHeaders];
        xlsHeaders = uniqBy(xlsHeaders, 'header');
        let fileName = 'Audit Trail.xlsx';
        let excelSheet = ExcelUtils.createExcel(null, 'Audit Trail', xlsHeaders, xls, null);
        const tmpPath = path.resolve(__dirname, `../../.tmp/${fileName}`);
        // const result = await excelSheet.xlsx.writeBuffer();
        await excelSheet.xlsx.writeFile(tmpPath);
        res!.setHeader('Content-disposition', 'attachment; filename=' + fileName);
        res!.setHeader('x-rta-file', 'Y');
        const stream = fs.createReadStream(tmpPath);
        stream.pipe(res as any);
        stream.on('close', async () => {
          let val = fs.existsSync(tmpPath);
          let uploadedFileInfo: UserManagementAppFile = await this.uploadFileToGcpAndStoreDetails('folioaudittrail', fileName, tmpPath);
          await this.auditTrailFileRepository.updateById(auditTrailFileId, {exportedFileId: uploadedFileInfo?.id});
          LoggingUtils.info(`${uploadedFileInfo}--Updated exportedFilId in AuditTrailFile`, 'HoldingReconcFileGeneration');
          if (val) await fs.promises.unlink(tmpPath);
        });
      }

    } catch (error) {
      throw error;
    }
  }


  async uploadFileToGcpAndStoreDetails(containerName: string, fileName: string, inputFilePath: string): Promise<any> {
    try {
      const rtaReconUploadRes = await ContainerUtils.uploadFileFromServer(
        this.fileStorageService,
        FileStorageContainerConfig.getGcpContainerName(containerName),
        fileName,
        inputFilePath
      );

      let fileData: any = await new Promise((resolve, reject) => {
        this.fileStorageService.getFile(
          FileStorageContainerConfig.getGcpContainerName(containerName),
          fileName,
          function (err: any, data: any) {
            if (err) {
              return reject(err);
            }
            return resolve(data);
          }
        );
      });

      let fileObj: DataObject<UserManagementAppFile> = {
        containerName: fileData.containerName! ?? FileStorageContainerConfig.getGcpContainerName('rta'),
        path: fileData.name ?? fileName,
        originalFileName: fileData.name ?? fileName,
        name: fileData.name ?? fileName,
        size: fileData.size ?? 0,
        extension: 'xlsx',
        mimeType: 'application/vnd.ms-excel',
        checksum: rtaReconUploadRes.checksum
      };

      const uploadedFileInfo: UserManagementAppFile = await this.userManagementAppFileRepository.create(fileObj);
      LoggingUtils.info(`${uploadedFileInfo}--Created file details in appUserApp app file`, 'HoldingReconcFileGeneration');

      return uploadedFileInfo;

    } catch (error) {
      throw error;
    }

  }
  async exportSampleFile(rtaId: number, options?: Options): Promise<any> {
    try {
      if (!rtaId) throw 'fileId Parameter Missing ';
      let result: any;
      if (rtaId == AppConstant.RTA_CAMS) {
        result = fs.readFileSync(path.resolve(__dirname, '../../documents/2FA_Format_CAMS.dbf'));
      } else {
        result = fs.readFileSync(path.resolve(__dirname, '../../documents/2FA_Format_KFintech.dbf'));
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  //Karvy API for fetching Mobile & Email

  async kavyCamsFetchingMobileEmail(
    serviceProviderAccountID: Number,
    accountId: Number,
    refreshFlag: boolean = false,
    transactionId: string,
    Options?: Options
  ) {
    try {
      const serviceProviderData = await this.serviceProviderAccountRepository.findOne(
        {
          where: {
            accountId: accountId,
            id: serviceProviderAccountID,
            isActive: true
          },
          include: [
            {
              relation: 'serviceProvider',
              scope: {
                include: [
                  {
                    relation: 'rta'
                  }
                ]
              }
            },
            {
              relation: 'account',
              scope: {
                include: [
                  {
                    relation: 'primaryHolder',
                    scope: {
                      include: [
                        {
                          relation: 'investorDetails'
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        },
        Options
      );
      // console.log(serviceProviderData);
      if (!serviceProviderData) throw new ValidationError('No Data found for ServiceProviderData');
      //if refreshFlag is false
      if (!refreshFlag) {
        if (serviceProviderData?.registeredEmail || serviceProviderData?.registeredMobile) {
          return {email: serviceProviderData?.registeredEmail, mobile: serviceProviderData?.registeredMobile};
        } else {
          return Promise.reject(
            new RestError(
              400,
              `Your contact details(email & mobile number) for OTP authentication were not found. Please update the same with AMC`,
              {systemcode: 1222}
            )
          );
        }
      }
      //cams
      if (serviceProviderData?.serviceProvider.rta?.id == 2) {
        // if(!serviceProviderData || !serviceProviderData?.accountNumber || !serviceProviderData?.serviceProvider.primaryAMCCode || !serviceProviderData?.account?.primaryHolder?.investorDetails?.panCardNumber) throw new Error('Missing Required Data')
        if (!serviceProviderData) throw new ValidationError('No Data found for ServiceProviderData');
        if (!serviceProviderData?.accountNumber) throw new ValidationError('ServiceProvider AccountNumber Missing');
        if (!serviceProviderData?.serviceProvider?.primaryAMCCode) throw new ValidationError('ServiceProvider AmcCode Missing');
        if (!serviceProviderData?.account?.primaryHolder?.investorDetails?.panCardNumber)
          throw new ValidationError('ServiceProvider Primary Holder pancard Missing');
        const AMCCode = serviceProviderData.serviceProvider.primaryAMCCode ?? '';
        const ApplicationID = process.env.USR_MGMT_DS_CAMS_FETCH_MOBILE_EMAIL_APP_ID ?? '';
        const Password = process.env.USR_MGMT_DS_CAMS_FETCH_MOBILE_EMAIL_APP_PWD ?? '';
        const FolioNo = serviceProviderData.accountNumber ?? '';
        const PAN = serviceProviderData?.account?.primaryHolder?.investorDetails?.panCardNumber ?? '';
        const response: any = await this.kravyRepository
          .CamsGetMobileAndEmailBasedOnFolio(AMCCode, ApplicationID, Password, FolioNo, PAN, transactionId)
          .catch(err => {
            LoggingUtils.error(err);
            return;
          });
        // console.log(response);
        if (
          response?.Services &&
          response?.Services?.Details &&
          (response?.Services?.Details?.Investor_Details[0]?.mobileno ||
            response?.Services?.Details?.Investor_Details[0]?.email) &&
          (response?.Services?.Details?.Investor_Details[0]?.mobileno == '' ||
            response?.Services?.Details?.Investor_Details[0]?.email == '')
        ) {
          await this.serviceProviderAccountRepository.updateAll(
            {
              registeredMobile: response?.Services?.Details?.Investor_Details[0]?.mobileno,
              registeredEmail: response?.Services?.Details?.Investor_Details[0]?.email,
              ContactDetailsUpdatedOn: new Date()
            },
            {id: serviceProviderAccountID},
            Options
          );
          return {email: response?.Services?.Details?.Investor_Details[0]?.email, mobile: response?.Services?.Details?.Investor_Details[0]?.mobileno};
        } else {
          if (serviceProviderData?.registeredEmail || serviceProviderData?.registeredMobile) {
            return {email: serviceProviderData?.registeredEmail, mobile: serviceProviderData?.registeredMobile};
          } else {
            return Promise.reject(new RestError(400, `Your contact details(email & mobile number) for OTP authentication were not found. Please update the same with AMC`, {systemcode: 1223}));
          }
        }
      } else {
        if (!serviceProviderData) throw new ValidationError('No Data found for ServiceProviderData');
        if (!serviceProviderData?.accountNumber) throw new ValidationError('ServiceProvider AccountNumber Missing');
        if (!serviceProviderData?.serviceProvider?.primaryAMCCode) throw new ValidationError('ServiceProvider AmcCode Missing');
        const Appid = process.env.USR_MGMT_DS_KRA_FETCH_MOBILE_EMAIL_APP_ID ?? '';
        const Apppwd = process.env.USR_MGMT_DS_KRA_FETCH_MOBILE_EMAIL_APP_PWD ?? '';
        const AppIden = process.env.USR_MGMT_DS_KRA_FETCH_MOBILE_EMAIL_APP_IDEN ?? '';
        const AgentCode = process.env.USR_MGMT_DS_KRA_FETCH_MOBILE_EMAIL_AGENT_CODE ?? '';
        const BranchCode = process.env.USR_MGMT_DS_KRA_FETCH_MOBILE_EMAIL_BRANCH_CODE ?? '';
        const AMC_Code = serviceProviderData.serviceProvider.primaryAMCCode ?? '';
        const Folio = serviceProviderData.accountNumber ?? '';
        let response: any = await this.kravyRepository
          .KarvyGetMobileAndEmailBasedOnFolio(Appid, Apppwd, AppIden, AgentCode, BranchCode, AMC_Code, Folio, transactionId)
          .catch(err => {
            LoggingUtils.error(err);
            return;
          });
        if (response) response = JSON.parse(response);
        // console.log(response);
        //Here checking the API success response
        if (response?.Return_Code == "0" && response?.Return_Msg.toLowerCase() == "success") {
          if (response?.Email || response?.Mobile || response?.Email == '' || response?.Mobile == '') {
            await this.serviceProviderAccountRepository.updateAll(
              {registeredMobile: response.Mobile, registeredEmail: response.Email, ContactDetailsUpdatedOn: new Date()},
              {id: serviceProviderAccountID},
              Options
            );
            return {email: response.Email, mobile: response.Mobile};
          }
        } else {
          if (serviceProviderData?.registeredEmail || serviceProviderData?.registeredMobile) {
            return {email: serviceProviderData?.registeredEmail, mobile: serviceProviderData?.registeredMobile};
          } else {
            return Promise.reject(new RestError(400, `Your contact details(email & mobile number) for OTP authentication were not found. Please update the same with AMC`, {systemcode: 1223}));
          }
        }
      }
    } catch (error) {
      // console.log(error);
      LoggingUtils.error(error);
      //catch validation error
      if (error instanceof ValidationError) {
        return Promise.reject(new RestError(400, error.message));
        //catch rest error
      } else if (error instanceof RestError) {
        return Promise.reject(new RestError(error.status, error.message));
      }
      throw error;
    }
  }

  async fetchRta(
    data: {serviceProviderAccountID: number; refreshFlag: boolean},
    accountId: number,
    transactionId: string,
    Options?: Options
  ): Promise<object | undefined> {
    try {
      return this.kavyCamsFetchingMobileEmail(data.serviceProviderAccountID, accountId, data.refreshFlag, transactionId, Options);
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async uploadSignature(id: number, request?: Request, response?: Response): Promise<object> {
    return new Promise((resolve, reject) => {
      let userDetails: AppUser | null;

      const container = FileStorageContainerConfig.getGcpContainerName('signatures');

      return this.appUserRepository
        .findOne({
          where: {
            id: id
          },
          include: [
            {
              relation: 'investorDetails'
            }
          ]
        })
        .then(result => {
          userDetails = result;
          if (!userDetails) {
            return Promise.reject(new RestError(404, `User not found !`, {systemcode: 1030}));
          }
          const uploadPromise = promisify(this.fileStorageService.upload);
          // file upload.
          return uploadPromise(container, request, response, {}).then((data: any) => {
            if (!data) {
              return Promise.reject(new RestError(400, 'File not uploaded', {systemcode: 1026}));
            }
            return data;
          });
        })
        .then((data: any) => ContainerUtils.checkMimeType(this.fileStorageService, data, MimeTypesConfig.MimeTypes.png.name))
        .then(async (filesData: any) => {
          if (!filesData?.files || Object.keys(filesData.files).length == 0) {
            return Promise.reject(new RestError(404, `No files found!`, {systemcode: 1027}));
          } else {
            const file = filesData.files.file[0];
            const downloadFile = await ContainerUtils.downloadFileToServer(
              this.fileStorageService,
              container,
              file.name,
              path.resolve(__dirname, '../../.tmp/', file.name)
            );
            const content = fs.readFileSync(downloadFile)
            const fileChecksum = await CryptoUtils.generateFileChecksum(content);
            const isValidFileType = await ContainerUtils.validateFileType(
              path.resolve(downloadFile),
              MimeTypesConfig.MimeTypes.png.possibleExtensions,
              content
            );
            if (fs.existsSync(downloadFile)) {
              await fs.promises.unlink(downloadFile);
            }

            if (!isValidFileType) {
              return Promise.reject(
                new RestError(465, 'The file format is invalid. Please upload the file in correct format.', {systemcode: 1218})
              );
            }

            return this.userManagementAppFileRepository.create({
              containerName: container,
              path: file.name,
              originalFileName: file.originalFilename,
              name: file.name,
              size: file.size,
              extension: file.name.split('.')[file.name.split('.').length - 1],
              mimeType: file.type,
              checksum: fileChecksum
            });
          }
        })
        .then(async appFile => {
          if (appFile) {
            const investorDetails = userDetails?.investorDetails;
            await this.investorDetailsRepository.updateById(investorDetails?.id!, {
              signatureImageFileId: appFile.id
            });
            return resolve({status: true});
          }
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  //check the login attemps
  async checkLoginAttemps(appUserId: number, loginWithAD: boolean = false, isInternalUser: boolean = false) {
    /*
    1. If the user has exceeded the maximum allowed login attempts, then the user will be locked otherwise if active, the user will be allowed to login
    2. for every wrong attempt the login retrycount should be increased by 1
    3. for the correct attempt, reset the count to 0


  */
    if (isInternalUser || loginWithAD) {
      try {
        const appUser = await this.appUserRepository.findById(appUserId, {
          include: [
            {
              relation: 'operationDetails'
            }
          ]
        });
        if (!appUser) return Promise.reject(new RestError(404, 'Could not find user details', {systemcode: 1226}));

        const maxAllowedLoginAttempts = await this.uamLoginAttemptsConfigRepository.findById(1);

        let currentLoginCount = appUser.loginRetryCount ?? 0;
        //check the las login and the login attemps
        if (currentLoginCount < maxAllowedLoginAttempts.maxLoginAttempts) {
          currentLoginCount += 1;
          await this.appUserRepository.updateAll({loginRetryCount: currentLoginCount}, {id: appUser.id});
        } else if (currentLoginCount >= maxAllowedLoginAttempts.maxLoginAttempts) {
          //if the user attempts to login more than the maxallowed attempts, the user will be locked forcefully
          if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value) {
            await this.appUserRepository.updateAll(
              {loginRetryCount: currentLoginCount, appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].value, isActive: false},
              {id: appUser.id}
            );
            const userLogs: AppUserLogsFields = {
              id: appUser.id,
              userCode: appUser.userCode,
              appUserStatus: appUser.appUserStatus,
              lastLoginDate: appUser.lastLoginDate
            };
            LoggingUtils.info(userLogs, 'User locked');
            // if(loginWithAD){
            const latestUAMData = await this.uamIntegrationRepository.findOne({
              where: {
                appUserId: appUser.id,
                isLatest: true
              }
            });
            if (!latestUAMData) {
              return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked', {systemcode: 1139}));
            }

            const currentLatestRecord = latestUAMData.id;

            const newUamIntegrationRecord = this.markUserAsLocked(latestUAMData.toJSON(), appUser);

            latestUAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].label;
            await this.uamIntegrationRepository.updateAll({isLatest: false}, {id: currentLatestRecord});
            await this.uamIntegrationRepository.create(newUamIntegrationRecord);
            return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked', {systemcode: 1139}));
            // }
          }
        }
      } catch (error) {
        throw error;
      }
    } else {
      try {
        //get the appuser by id
        const appUser = await this.appUserRepository.findById(appUserId);

        if (!appUser) {
          return Promise.reject(new RestError(400, 'User not found!', {systemcode: 1030}));
        }
        //check the las login and the login attemps
        if (appUser.lastLoginDate && appUser.loginRetryCount) {
          const hours = moment().diff(moment(appUser.lastLoginDate), 'hours');
          //login in with in 24 hours
          if (hours <= LoginAttempsConfig?.loginAttemps?.hours!) {
            //check the no of attemps in 24 hours
            if (appUser.loginRetryCount >= LoginAttempsConfig?.loginAttemps?.attemps!) {
              return Promise.reject(new RestError(465, 'Login attempts exceeded for a day. Please reset your PIN.', {systemcode: 1230}));
            } else {
              //incremnet the attemps
              this.appUserRepository.updateById(appUserId, {loginRetryCount: appUser.loginRetryCount + 1});
            }
          } else {
            //login after 24 hours
            this.appUserRepository.updateById(appUserId, {lastLoginDate: new Date(), loginRetryCount: 0});
          }
        } else {
          //login for the first time
          this.appUserRepository.updateById(appUserId, {lastLoginDate: new Date(), loginRetryCount: 1});
        }
        return true;
      } catch (error) {
        return Promise.reject(new RestError(404, error));
      }
    }
  }

  async checkLoginAttempsMock(appUserId: number, loginWithAD: boolean = false, isInternalUser: boolean = false) {
    /*
    1. If the user has exceeded the maximum allowed login attempts, then the user will be locked otherwise if active, the user will be allowed to login
    2. for every wrong attempt the login retrycount should be increased by 1
    3. for the correct attempt, reset the count to 0
  */
    if (isInternalUser || loginWithAD) {
      try {
        const appUser = await this.appUserRepository.findById(appUserId, {
          include: [
            {
              relation: 'operationDetails'
            }
          ]
        });
        if (!appUser) return Promise.reject(new RestError(404, 'Could not find user details', {systemcode: 1226}));

        const maxAllowedLoginAttempts = await this.uamLoginAttemptsConfigRepository.findById(1);

        let currentLoginCount = appUser.loginRetryCount ?? 0;
        //check the las login and the login attemps
        if (currentLoginCount < maxAllowedLoginAttempts.maxLoginAttempts) {
          currentLoginCount += 1;
          await this.appUserRepository.updateAll({loginRetryCount: currentLoginCount}, {id: appUser.id});
        } else if (currentLoginCount > maxAllowedLoginAttempts.maxLoginAttempts) {
          //if the user attempts to login more than the maxallowed attempts, the user will be locked forcefully
          if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value) {
            await this.appUserRepository.updateAll(
              {loginRetryCount: currentLoginCount, appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].value, isActive: false},
              {id: appUser.id}
            );

            // if(loginWithAD){
            const latestUAMData = await this.uamIntegrationRepository.findOne({
              where: {
                appUserId: appUser.id,
                isLatest: true
              }
            });
            if (!latestUAMData) {
              return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked', {systemcode: 1139}));
            }

            const currentLatestRecord = latestUAMData.id;
            delete latestUAMData.id;

            latestUAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].label;
            await this.uamIntegrationRepository.updateAll({isLatest: false}, {id: currentLatestRecord});
            await this.uamIntegrationRepository.create(latestUAMData);
            return Promise.reject(new RestError(465, 'Login attempts exceeded. User is now locked', {systemcode: 1139}));
            // }
          }
        }
      } catch (error) {
        throw error;
      }
    } else {
      try {
        //get the appuser by id
        const appUser = await this.appUserRepository.findById(appUserId);

        if (!appUser) {
          return Promise.reject(new RestError(400, 'User not found!', {systemcode: 1030}));
        }
        //check the las login and the login attemps
        if (appUser.lastLoginDate && appUser.loginRetryCount) {
          const hours = moment().diff(moment(appUser.lastLoginDate), 'hours');
          //login in with in 24 hours
          if (hours <= LoginAttempsConfig?.loginAttemps?.hours!) {
            //check the no of attemps in 24 hours
            if (appUser.loginRetryCount >= LoginAttempsConfig?.loginAttemps?.attemps!) {
              return Promise.reject(new RestError(465, 'Login attempts exceeded for a day. Please reset your PIN.', {systemcode: 1230}));
            } else {
              //incremnet the attemps
              this.appUserRepository.updateById(appUserId, {loginRetryCount: appUser.loginRetryCount + 1});
            }
          } else {
            //login after 24 hours
            this.appUserRepository.updateById(appUserId, {lastLoginDate: new Date(), loginRetryCount: 0});
          }
        } else {
          //login for the first time
          this.appUserRepository.updateById(appUserId, {lastLoginDate: new Date(), loginRetryCount: 1});
        }
        return true;
      } catch (error) {
        return Promise.reject(new RestError(404, error));
      }
    }
  }
  //check the last login
  async checkLastMpinReset(appUser: AppUser) {
    try {
      if (!appUser) {
        return Promise.reject(new RestError(404, 'User not found!', {systemcode: 1030}));
      }
      //check the last login and the login attemps
      if (appUser?.mpinResetDate) {
        const days = moment().diff(moment(appUser.mpinResetDate), 'days');
        //reset pin after 90 days
        if (days >= LoginAttempsConfig?.mpinResetDate!) {
          const userLogs: AppUserLogsFields = {
            id: appUser.id,
            userCode: appUser.userCode,
            appUserStatus: appUser.appUserStatus,
            lastLoginDate: appUser.lastLoginDate
          };
          LoggingUtils.info(userLogs, 'Mpin expired');
          return Promise.reject(
            new RestError(471, `your mpin hasn't changed in a while. Please change your mpin to continue.`, {systemcode: 1073})
          );
        }
      } else {
        return Promise.reject(new RestError(471, 'Last Mpin Reset Date Not Found', {systemcode: 1073}));
      }
      return true;
    } catch (error) {
      return Promise.reject(new RestError(404, error));
    }
  }

  async helperOnboarding(
    id: number,
    panAndDOBDetails: PANAndDOBDetails,
    existingUser: InvestorDetailsWithRelations,
    transactionId: string,
    userProfile: any,
    options: Options
  ): Promise<any> {
    let isAdvisoryCustomer: Boolean, isWealthfyCustomer: Boolean, isNTB: Boolean;
    const methodName = 'helperOnboarding';
    const appUser: AppUser = existingUser.appUser;
    const appUserId = id;
    const mobileNumber = appUser.contactNumber;
    try {
      switch (appUser.appUserStatus) {
        // Rerun onbording for NTB usere once they open bank account via webview
        case Option.GLOBALOPTIONS.APPUSERSTATUS.NTBUser.value:
        case Option.GLOBALOPTIONS.APPUSERSTATUS.registrationInitiated.value:
          LoggingUtils.debug(`Appuser Status : ${appUser.appUserStatus}`, methodName);
          // to fetch customer Details from ETB
          LoggingUtils.debug('Step 1 Invoking ETB call ', methodName);
          let etbDetails = await this.coreBankingFacade.fetchCustomerAccountAmlFatcaDetails(
            panAndDOBDetails.PAN,
            panAndDOBDetails.DOB,
            mobileNumber,
            '',
            transactionId,
            appUserId,
            options
          );
          LoggingUtils.debug(`Step 2 ETB response  `, methodName);
          if (etbDetails!.success) {
            LoggingUtils.debug('Step 3 ETB sync success Single User flow ', methodName);
            LoggingUtils.debug('Step 4 Validating MFRTA CHECKS ', methodName);
            const mfaChecks = await this.validateMfRtaFields(id, options);
            // fetching updated  user Details
            if (!mfaChecks.success) {
              LoggingUtils.debug('Step 5 update appuser for mftra ', methodName);
              let updatedUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value, remarks: mfaChecks.remarks},
                {id: id}
              );
              //throw new Error('MFA RTA Checks failed');
              if (!updatedUserStatus) {
                //@todo add it to error logs
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }
              LoggingUtils.debug('Step 6 MFRTA VALIDATION FAILED ', methodName);
              return {
                success: false,
                message: 'mfRTA check failed',
                mfaChecks,
                isMFRTAcheckpass: false,
                appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value,
                remarks: mfaChecks.remarks
              };
            }
            LoggingUtils.debug('Step 7 Fetching Synced investor details ', methodName);
            const investorUser = await this.investorDetailsRepository.findOne({
              where: {
                appUserId: id
              },
              include: [
                {
                  relation: 'appUser'
                }
              ]
            });
            LoggingUtils.debug(`Step 8 updated investor details  `, methodName);
            if (investorUser && investorUser.appUser && investorUser.appUser.bosCode) {
              // need to check if advisory customer
              LoggingUtils.debug('Step 9 Check for advisory customer ', methodName);
              isAdvisoryCustomer = await this.checkIfAdvisoryCustomer(investorUser.appUser.bosCode);

              // updating the user Status
              if (isAdvisoryCustomer) {
                LoggingUtils.debug('Step 10 update app user status advisory ', methodName);
                let updatedUserStatus = await this.appUserRepository.updateAll(
                  {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.advisoryUser.value},
                  {id: appUserId, isActive: true}
                );
                if (!updatedUserStatus) {
                  //@todo add it to error logs
                  return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
                }

                LoggingUtils.debug('Step 11 Advisory customer ', methodName);
                return {success: true, message: 'Advisory customer', isAdvisoryCustomer};
              }

              // need to check if exists in wealthfy domestic
              LoggingUtils.debug('Step 12 Wealthfy customer check ', methodName);
              isWealthfyCustomer = await this.checkIfExistingWealthfyCustomer(investorUser.appUser.bosCode, transactionId); // @TODO need to revert this after lz testing
              // isWealthfyCustomer = false;

              if (isWealthfyCustomer) {
                LoggingUtils.debug('Step 13 update app user status wealthfy ', methodName);
                let updatedUserStatus = await this.appUserRepository.updateAll(
                  {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.wealthfyDomesticUser.value},
                  {id: appUserId, isActive: true}
                );

                if (!updatedUserStatus) {
                  //@todo add it to error logs
                  return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
                }
                LoggingUtils.debug('Step 14 wealthfy customer ', methodName);
                return {success: true, message: 'Wealthfy customer', isWealthfyCustomer};
              }

              LoggingUtils.debug('Step 15 update app user status to single user ', methodName);
              let updateUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value},
                {id: appUserId, isActive: true}
              );
              if (!updateUserStatus) {
                //@todo add it to error logs
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }
              LoggingUtils.debug('Step 16 Invoking idcom to get redirection url for authentication ', methodName);

              //IF ETB generate authentication redirection Link
              LoggingUtils.debug('Step 17 genearting idcom link for single customer flow as all above check pass ', methodName);
              const response = await this.idComIntegrationFacade.getAuthCode(id, panAndDOBDetails.deviceId, transactionId);
              if (!response.success) {
                return Promise.reject(
                  new RestError(
                    465,
                    'Oops!! Our system is temporarily down. We apologize for the inconvenience, please try after some time.',
                    {systemcode: 1197}
                  )
                );
              }
              //Recreating Appaccess token data
              LoggingUtils.debug(`Step 18 Response recived form idcom  `, methodName);
              let tokenUpdated: Array<any> = [];
              if (
                userProfile.resolvedRoles &&
                Array.isArray(userProfile.resolvedRoles) &&
                userProfile.resolvedRoles.indexOf('CLIENT') > -1
              ) {
                tokenUpdated = await this.appAccessTokenFacade.recreateTokenData(appUserId);
                if (!tokenUpdated || !Array.isArray(tokenUpdated)) tokenUpdated = [];
                LoggingUtils.debug(`Step 19 refreshing token `, methodName);
              }
              LoggingUtils.debug('Step 20 returning response single customer flow ends for update pan or dob', methodName);
              return {
                success: true,
                redirectUrl: response.redirectURL,
                authCode: response.authCode,
                successUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_SUCCESS as string,
                failureUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_FAILURE as string,
                isMultipleCustomerId: false,
                tokenUpdated: tokenUpdated.length > 0 ? true : false
              };
            } else {
              Promise.reject(new RestError(400, 'BosCode not found', {systemcode: 1199}));
            }
          } else if (!etbDetails!.success && etbDetails!.code == 'MULTIPLE_CUSTOMER_DATA') {
            //IF ETB with multiple custId generate authentication redirection Link
            LoggingUtils.debug('Step 21 ETB success , multiple customer flow start ', methodName);
            LoggingUtils.debug('Step 22 update app user status to multiple user ', methodName);
            let updateUserStatus = await this.appUserRepository.updateAll(
              {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.multipleCustomerID.value},
              {id: appUserId, isActive: true}
            );
            if (!updateUserStatus) {
              //@todo add it to error logs
              return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
            }
            LoggingUtils.debug('Step 23 Invoking idcom to get redirection url for authentication ', methodName);
            const response = await this.idComIntegrationFacade.getAuthCode(id, panAndDOBDetails.deviceId, transactionId);
            if (!response.success) {
              return Promise.reject(
                new RestError(
                  465,
                  'Oops!! Our system is temporarily down. We apologize for the inconvenience, please try after some time.',
                  {systemcode: 1197}
                )
              );
            }
            LoggingUtils.debug(`Step 24 Response recived Multiple customer update pan or dob flow ends  `, methodName); //@todo remove object after testing
            return {
              success: true,
              redirectUrl: response.redirectURL,
              authCode: response.authCode,
              successUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_SUCCESS as string,
              failureUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_FAILURE as string,
              isMultipleCustomerId: true
            };
          } else if (!etbDetails!.success && etbDetails!.code == 'NO_DATA') {
            LoggingUtils.debug('Step 25 no data found from etb new user/NTB flow ', methodName);
            isNTB = true;
            LoggingUtils.debug('Step 26 updating app user status as NTB ', methodName);
            let updateUserStatus = await this.appUserRepository.updateAll(
              {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.NTBUser.value},
              {id: appUserId, isActive: true}
            );
            if (!updateUserStatus) {
              //@todo add it to error logs
              return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
            }
            LoggingUtils.debug('Step 27 NTB flow end for update pan or dob ', methodName);
            return {success: true, message: 'NTB customer', isNTB};
          } else if (!etbDetails!.success && etbDetails!.code == 'USER_EXIST') {
            LoggingUtils.error('Step 28 User exist error form etb ', methodName);
            throw new Error('User already completed the steps');
          } else if (!etbDetails!.success && etbDetails!.bankErrorCode) {
            LoggingUtils.debug(etbDetails, methodName);
            LoggingUtils.error('Step 29 ETB received error from bank ', methodName);
            return Promise.reject(new RestError(465, `We couldn't connect with your bank account, please try again.`, {systemcode: 1201}));
          } else {
            LoggingUtils.error('Step 30 Error occured in when syncing ETB ', methodName);
            throw new Error('Something went wrong with ETB Sync');
          }
          break;

        case Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value:
        case Option.GLOBALOPTIONS.APPUSERSTATUS.multipleCustomerID.value:
          LoggingUtils.debug(`Appuser Status : ${appUser.appUserStatus}`, methodName);
          LoggingUtils.debug('Step 1 ETB success , Single/multiple customer flow start ', methodName);
          if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value) {
            LoggingUtils.debug('Step 4 Validating MFRTA CHECKS ', methodName);
            const mfaChecks = await this.validateMfRtaFields(id, options);
            // fetching updated  user Details
            if (!mfaChecks.success) {
              LoggingUtils.debug('Step 5 update appuser for mftra ', methodName);
              let updatedUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value, remarks: mfaChecks.remarks},
                {id: id}
              );
              //throw new Error('MFA RTA Checks failed');
              if (!updatedUserStatus) {
                //@todo add it to error logs
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }
              LoggingUtils.debug('Step 6 MFRTA VALIDATION FAILED ', methodName);
              return {
                success: false,
                message: 'mfRTA check failed',
                mfaChecks,
                isMFRTAcheckpass: false,
                appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value,
                remarks: mfaChecks.remarks
              };
            }
            LoggingUtils.debug('Step 7 Fetching Synced investor details ', methodName);
            const investorUser = await this.investorDetailsRepository.findOne({
              where: {
                appUserId: id
              },
              include: [
                {
                  relation: 'appUser'
                }
              ]
            });
            LoggingUtils.debug(`Step 8 updated investor details  `, methodName);
            if (investorUser && investorUser.appUser && investorUser.appUser.bosCode) {
              // need to check if advisory customer
              LoggingUtils.debug('Step 9 Check for advisory customer ', methodName);
              isAdvisoryCustomer = await this.checkIfAdvisoryCustomer(investorUser.appUser.bosCode);

              // updating the user Status
              if (isAdvisoryCustomer) {
                LoggingUtils.debug('Step 10 update app user status advisory ', methodName);
                let updatedUserStatus = await this.appUserRepository.updateAll(
                  {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.advisoryUser.value},
                  {id: appUserId, isActive: true}
                );
                if (!updatedUserStatus) {
                  //@todo add it to error logs
                  return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
                }

                LoggingUtils.debug('Step 11 Advisory customer ', methodName);
                return {success: true, message: 'Advisory customer', isAdvisoryCustomer};
              }

              // need to check if exists in wealthfy domestic
              LoggingUtils.debug('Step 12 Wealthfy customer check ', methodName);
              isWealthfyCustomer = await this.checkIfExistingWealthfyCustomer(investorUser.appUser.bosCode, transactionId); // @TODO need to revert this after lz testing
              // isWealthfyCustomer = false;

              if (isWealthfyCustomer) {
                LoggingUtils.debug('Step 13 update app user status wealthfy ', methodName);
                let updatedUserStatus = await this.appUserRepository.updateAll(
                  {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.wealthfyDomesticUser.value},
                  {id: appUserId, isActive: true}
                );

                if (!updatedUserStatus) {
                  //@todo add it to error logs
                  return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
                }
                LoggingUtils.debug('Step 14 wealthfy customer ', methodName);
                return {success: true, message: 'Wealthfy customer', isWealthfyCustomer};
              }

              LoggingUtils.debug('Step 15 update app user status to single user ', methodName);
              let updateUserStatus = await this.appUserRepository.updateAll(
                {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value},
                {id: appUserId, isActive: true}
              );
              if (!updateUserStatus) {
                //@todo add it to error logs
                return Promise.reject(new RestError(400, 'Not able to update User Status', {systemcode: 1021}));
              }
              LoggingUtils.debug('Step 16 Invoking idcom to get redirection url for authentication ', methodName);
            }
          }

          LoggingUtils.debug('Step 3 Invoking idcom to get redirection url for authentication ', methodName);
          const response = await this.idComIntegrationFacade.getAuthCode(id, panAndDOBDetails.deviceId, transactionId);
          if (!response.success) {
            return Promise.reject(
              new RestError(465, 'Oops!! Our system is temporarily down. We apologize for the inconvenience, please try after some time.', {
                systemcode: 1197
              })
            );
          }
          LoggingUtils.debug(`Step 4 Response recived Multiple customer update pan or dob flow ends  `, methodName); //@todo remove object after testing
          let tokenUpdated: Array<any> = [];
          if (userProfile.resolvedRoles && Array.isArray(userProfile.resolvedRoles) && userProfile.resolvedRoles.indexOf('CLIENT') > -1) {
            tokenUpdated = await this.appAccessTokenFacade.recreateTokenData(appUserId);
            if (!tokenUpdated || !Array.isArray(tokenUpdated)) tokenUpdated = [];
            LoggingUtils.debug(`Step 19 refreshing token `, methodName);
          }
          return {
            success: true,
            redirectUrl: response.redirectURL,
            authCode: response.authCode,
            successUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_SUCCESS as string,
            failureUrl: process.env.USR_MGMT_IDCOM_FCD_CALLBACK_FAILURE as string,
            isMultipleCustomerId: appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value ? false : true,
            tokenUpdated: tokenUpdated.length > 0 ? true : false
          };

        default:
          LoggingUtils.debug(`Appuser Status : ${appUser.appUserStatus}`, methodName);
          break;
      }
    } catch (error: any) {
      LoggingUtils.error(error, methodName);
      //return Promise.reject(new RestError(400, error.message));
      throw error;
    }
  }

  async investmentAccountCreated(id: number) {
    try {
      let appUser = this.appUserRepository.findById(id).catch(err => {
        throw new Error(err);
      });

      if (!appUser) {
        return Promise.reject(new RestError(400, 'User not found', {systemcode: 1030}));
      }

      return this.appUserRepository
        .updateAll({appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['investmentAccountReady'].value}, {id: id, isActive: true})
        .catch(err => {
          throw new Error(err);
        });
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async fetchExistingNominee(appUserId: number, transactionId: string, options?: Options): Promise<any> {
    try {
      const account = await this.accountRepository.findOne(
        {
          where: {
            primaryHolderId: appUserId,
            isActive: true
          },
          fields: ['id', 'name', 'bosCode'],
        },
        options
      );

      if (!account) {
        return Promise.reject(new RestError(404, 'Account Not found', {systemcode: 1086}));
      }

      const bankAccount = await this.bankAccountRepository.findOne(
        {
          where: {
            accountId: account!.id,
            isActive: true,
            isDefault: true
          },
          fields: ['id', 'accountNumber']
        },
        options
      );


      if (!bankAccount) {
        return Promise.reject(new RestError(404, 'Bank Account Not found', {systemcode: 1242}));
      }

      const existingNominee = await this.investorNomineeRepository.findOne(
        {
          where: {
            isActive: true,
            accountId: account.id,
            bankAccountId: bankAccount.id,
            isSyncedViaBank: true
          }
        },
        options
      )

      if (existingNominee) {
        return {success: true, message: 'Nominee details already synced'};
      }

      const url = process.env.USR_MGMT_FCD_FETCH_NOMINEE!;
      const xmlString = await this.getExistingNomineeReqXml(account.bosCode!, bankAccount!.accountNumber);

      const axiosResponse = await axios
        .post(url, xmlString, {
          headers: {
            'Content-Type': 'text/xml'
          },
          httpsAgent: new https.Agent({
            cert: sslCrt,
            key: sslCrtKey,
            ca: sslCa,
            ciphers: 'DEFAULT:@SECLEVEL=1',
            rejectUnauthorized: false
          })
        })
        .catch(error => {
          LogApiCallUtils.sendMessageOutgoingApiCall({
            url: url,
            request: xmlString,
            response: error.code,
            success: false,
            transactionId: transactionId,
            extraInfo: {
              channel: process.env.COMMON_API_CHANNEL,
              user_id: process.env.COMMON_API_CHANNEL_USER_ID
            },
            externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.NOMINEE
          });
          throw new Error(error);
        })

      if (axiosResponse.status !== 200) {
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: url,
          request: xmlString,
          response: axiosResponse.data,
          success: false,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.NOMINEE
        });
        return {success: true, message: 'Unable to fetch nominee details'}
      }
      else {
        LogApiCallUtils.sendMessageOutgoingApiCall({
          url: url,
          request: xmlString,
          response: axiosResponse.data,
          success: true,
          transactionId: transactionId,
          extraInfo: {
            channel: process.env.COMMON_API_CHANNEL,
            user_id: process.env.COMMON_API_CHANNEL_USER_ID
          },
          externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.NOMINEE
        });
        const responseJson: any = await xml2js(axiosResponse.data, {compact: true, sanitize: false});
        const status = responseJson['S:Envelope']['S:Body']['ns85:fetchAssociatedPartyDetailsAssociatedPartyResponse']['ns85:return']['responseservice:status']['responseservice:errorCode']['_text'];
        const responseMessage = responseJson['S:Envelope']['S:Body']['ns85:fetchAssociatedPartyDetailsAssociatedPartyResponse']['ns85:return']['responseservice:status']['responseservice:replyText']['_text'];
        if (status != 0) {
          return {success: true, message: 'Unable to fetch nominee details'};
        }

        const responseData: any = responseJson['S:Envelope']['S:Body']['ns85:fetchAssociatedPartyDetailsAssociatedPartyResponse']['ns85:return']['associatedtoaccountapp:associatedPartyDTO']
        const resNomineeObj: any = {};

        if (responseData) {
          resNomineeObj['nomineeName'] = responseData['associatedtoaccountapp:associatedPartyName'] ? responseData['associatedtoaccountapp:associatedPartyName']['_text'] : '';
          resNomineeObj['nomineeDob'] = responseData['associatedtoaccountapp:dateOfBirth']
            ? responseData['associatedtoaccountapp:dateOfBirth']['datatype:dateString']
              ? new Date(responseData['associatedtoaccountapp:dateOfBirth']['datatype:dateString']['_text'].slice(0, 4) + '-' + responseData['associatedtoaccountapp:dateOfBirth']['datatype:dateString']['_text'].slice(4, 6) + '-' + responseData['associatedtoaccountapp:dateOfBirth']['datatype:dateString']['_text'].slice(6, 8))
              : null
            : null;
          resNomineeObj['nomineeRel'] = responseData['associatedtoaccountapp:partyAccountAssociateDTO']
            ? responseData['associatedtoaccountapp:partyAccountAssociateDTO']['associatedtoaccountapp:relationWithAccountHolder']
              ? Number(responseData['associatedtoaccountapp:partyAccountAssociateDTO']['associatedtoaccountapp:relationWithAccountHolder']['_text'])
              : null
            : null;
          resNomineeObj['nomineeGuardianName'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:guardianName']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:guardianName']['_text']
              : ''
            : '';
          resNomineeObj['nomineeGuardianAddLine1'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:lineNo1'
              ]
                ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:lineNo1'
                ]['_text']
                : ''
              : ''
            : '';
          resNomineeObj['nomineeGuardianAddLine2'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:lineNo2'
              ]
                ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:lineNo2'
                ]['_text']
                : ''
              : ''
            : '';
          resNomineeObj['nomineeGuardianAddLine3'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:lineNo3'
              ]
                ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:lineNo3'
                ]['_text']
                : ''
              : ''
            : '';
          resNomineeObj['nomineeGuardianCity'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']['contactdtopartyapp:city']
                ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:city'
                ]['_text']
                : ''
              : ''
            : '';
          resNomineeObj['nomineeGuardianState'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:state'
              ]
                ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:state'
                ]['_text']
                : ''
              : ''
            : '';
          resNomineeObj['nomineeGuardianCountry'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:country'
              ]
                ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:country'
                ]['_text']
                : ''
              : ''
            : '';
          resNomineeObj['nomineeGuardianPincode'] = responseData['associatedtoaccountapp:guardianDetailsDTO']
            ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress']
              ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:postalCode'
              ]
                ? responseData['associatedtoaccountapp:guardianDetailsDTO']['associatedtoaccountapp:postalAddress'][
                'contactdtopartyapp:postalCode'
                ]['_text']
                : ''
              : ''
            : '';
          resNomineeObj['nomineeAddressLine1'] = responseData['associatedtoaccountapp:postalAddress']
            ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:lineNo1']
              ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:lineNo1']['_text']
              : ''
            : '';
          resNomineeObj['nomineeAddressLine2'] = responseData['associatedtoaccountapp:postalAddress']
            ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:lineNo2']
              ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:lineNo2']['_text']
              : ''
            : '';
          resNomineeObj['nomineeAddressLine3'] = responseData['associatedtoaccountapp:postalAddress']
            ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:lineNo3']
              ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:lineNo3']['_text']
              : ''
            : '';
          resNomineeObj['nomineeCity'] = responseData['associatedtoaccountapp:postalAddress']
            ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:city']
              ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:city']['_text']
              : ''
            : '';
          resNomineeObj['nomineeState'] = responseData['associatedtoaccountapp:postalAddress']
            ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:state']
              ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:state']['_text']
              : ''
            : '';
          resNomineeObj['nomineeCountry'] = responseData['associatedtoaccountapp:postalAddress']
            ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:country']
              ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:country']['_text']
              : ''
            : '';
          resNomineeObj['nomineePincode'] = responseData['associatedtoaccountapp:postalAddress']
            ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:postalCode']
              ? responseData['associatedtoaccountapp:postalAddress']['contactdtopartyapp:postalCode']['_text']
              : ''
            : '';
        } else {
          return {success: true, message: 'No nominee data present'};
        }

        let nomineeData!: InvestorNominee;
        let nomineeObj: Partial<InvestorNominee> = {};
        let nomAddress: Address = new Address();
        const nomState = this.convertToCamelCase(resNomineeObj['nomineeState']);

        const nomStateData = await this.stateRepository.findOne(
          {
            where: {
              name: nomState,
              isActive: true
            }
          },
          options
        );
        nomAddress.addressLine1 = resNomineeObj['nomineeAddressLine1'];
        nomAddress.addressLine2 = resNomineeObj['nomineeAddressLine2'];
        nomAddress.addressLine3 = resNomineeObj['nomineeAddressLine3'];
        nomAddress.city = resNomineeObj['nomineeCity'];
        //nomAddress.state = resNomineeObj['nomineeState'];
        //nomAddress.country = resNomineeObj['nomineeCountry'];
        nomAddress.pincode = resNomineeObj['nomineePincode'];


        if (nomStateData) nomAddress.stateId = nomStateData.id;
        const nomineeAddress = await this.addressRepository.create(nomAddress, options);
        LoggingUtils.debug(`Adding address : ${JSON.stringify(nomineeAddress)}`, 'fetchExistingNominee');


        nomineeObj.relationshipId = resNomineeObj['nomineeRel'];
        nomineeObj.bankAccountId = bankAccount!.id;
        nomineeObj.accountId = account!.id;
        nomineeObj.isSyncedViaBank = true;
        nomineeObj.isMfNominee = false;

        if (resNomineeObj['nomineeGuardianName'] && (resNomineeObj['nomineeGuardianName'] !== '' || resNomineeObj['nomineeGuardianName'] !== null || resNomineeObj['nomineeGuardianName'])) {
          let nomGuardianAddress: Address = new Address();
          const nomGuardianState = this.convertToCamelCase(resNomineeObj['nomineeState']);

          const nomGuardianStateData = await this.stateRepository.findOne(
            {
              where: {
                name: nomGuardianState,
                isActive: true
              }
            },
            options
          );

          nomGuardianAddress.addressLine1 = resNomineeObj['nomineeGuardianAddLine1'];
          nomGuardianAddress.addressLine2 = resNomineeObj['nomineeGuardianAddLine2'];
          nomGuardianAddress.addressLine3 = resNomineeObj['nomineeGuardianAddLine3'];
          nomGuardianAddress.city = resNomineeObj['nomineeGuardianCity'];
          nomGuardianAddress.state = resNomineeObj['nomineeGuardianState'];
          nomGuardianAddress.country = resNomineeObj['nomineeGuardianCountry'];
          nomGuardianAddress.pincode = resNomineeObj['nomineeGuardianPincode'];
          // nomGuardianAddress.addressTypeId = 2;

          if (nomGuardianStateData) nomGuardianAddress.stateId = nomGuardianStateData.id;
          const nomineeGuardianAddress = await this.addressRepository.create(nomGuardianAddress, options);
          LoggingUtils.debug(`Adding address : ${JSON.stringify(nomineeGuardianAddress)}`, 'fetchExistingNominee');

          nomineeObj.guardianName = resNomineeObj['nomineeGuardianName'];
          // nomineeObj.guardianRelationship = 15; // revisit once if nominee guardian relationship present
          if (nomineeGuardianAddress) nomineeObj.guardianAddressId = nomineeGuardianAddress.id

        }

        if (nomineeAddress) nomineeObj.addressId = nomineeAddress.id;
        LoggingUtils.debug(`Nominee object :${JSON.stringify(nomineeObj)}`, 'fetchExistingNominee');
        const nomineeName = resNomineeObj['nomineeName'] ?? undefined;
        if (!nomineeName) {
          return Promise.reject(new RestError(400, 'Nominee details required', {systemcode: 1090}));
        }
        const user = await this.appUserRepository
          .create(
            {
              name: nomineeName,
              appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['nomineeUserStatus'].value,
              updatedDetailsFlag: false,
              forcePasswordChange: false,
              loginRetryCount: 0,
              contactNumberCountryCode: '+91'
            },
            options
          )
          .catch(err => {
            throw new Error(err)
          });

        if (user) {
          LoggingUtils.debug(`user created ${JSON.stringify(user)}`, 'fetchExistingNominee');
          nomineeObj.appUserId = user.id;
          await this.investorDetailsRepository.create({appUserId: user.id, birthDate: resNomineeObj['nomineeDob']}, options).catch(err => {
            throw new Error(err);
          });
          nomineeData = await this.investorNomineeRepository.create(nomineeObj, options).catch(err => {
            throw new Error(err);
          });
          LoggingUtils.debug(`investor nominee created :${JSON.stringify(nomineeData)}`, 'fetchExistingNominee');
        }

        return {success: true, message: 'nominee data present', data: nomineeData};
      }



    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async getExistingNomineeReqXml(customerId: String, accountNumber: String): Promise<string> {
    const refId = OrderUtils.getRandomNumber(14);
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ass="http://associate.service.account.appx.fc.ofss.com/AssociatedPartyApplicationServiceSpi" xmlns:con="http://context.app.fc.ofss.com" xmlns:exc="http://exception.infra.fc.ofss.com" xmlns:dat="http://datatype.fc.ofss.com" xmlns:dto="http://dto.common.domain.framework.fc.ofss.com" xmlns:ass1="http://associate.dto.account.app.fc.ofss.com" xmlns:con1="http://contact.dto.party.app.fc.ofss.com" xmlns:dom="http://domain.framework.fc.ofss.com">
    <soapenv:Header/>
    <soapenv:Body>
       <ass:fetchAssociatedPartyDetailsAssociatedParty>
          <ass:sessionContext>
             <con:bankCode>08</con:bankCode>
             <con:channel>${process.env.COMMON_API_CHANNEL}</con:channel>
             <con:transactionBranch>089999</con:transactionBranch>
             <con:externalReferenceNo>${refId}</con:externalReferenceNo>
             <con:userId>${process.env.COMMON_API_CHANNEL_USER_ID}</con:userId>
             <con:transactingPartyCode>${customerId}</con:transactingPartyCode>
          </ass:sessionContext>
          <ass:associatedPartyDTO>
                  <ass1:partyAccountAssociateDTO>
                  <ass1:accountNo>${accountNumber}</ass1:accountNo>
             </ass1:partyAccountAssociateDTO>

          </ass:associatedPartyDTO>

       </ass:fetchAssociatedPartyDetailsAssociatedParty>
    </soapenv:Body>
 </soapenv:Envelope>`
  }

  async fetchCorrespondenceAddressDetails(appUserid: number, options?: Options): Promise<any> {
    try {
      let correspondenceAddress: any = {};
      const data = await this.investorDetailsRepository.findOne(
        {
          where: {
            appUserId: appUserid,
            isActive: true
          },
          include: [
            {
              relation: 'correspondenceAddress',
              scope: {
                include: [
                  {
                    relation: 'addressType'
                  },
                  {
                    relation: 'state',
                    scope: {
                      include: [
                        {
                          relation: 'country'
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        },
        options
      )

      if (!data) {
        return Promise.reject(new RestError(404, 'User not found', {systemcode: 1030}));
      }

      correspondenceAddress.addressLine1 =
        data.correspondenceAddress && data.correspondenceAddress.addressLine1 ? data.correspondenceAddress.addressLine1 : '';
      correspondenceAddress.addressLine2 =
        data.correspondenceAddress && data.correspondenceAddress.addressLine2 ? data.correspondenceAddress.addressLine2 : '';
      correspondenceAddress.addressLine3 =
        data.correspondenceAddress && data.correspondenceAddress.addressLine3 ? data.correspondenceAddress.addressLine3 : '';
      correspondenceAddress.city =
        data.correspondenceAddress && data.correspondenceAddress.city ? data.correspondenceAddress.city : '';
      correspondenceAddress.pincode =
        data.correspondenceAddress && data.correspondenceAddress.pincode ? data.correspondenceAddress.pincode : '';
      correspondenceAddress.landmark =
        data.correspondenceAddress && data.correspondenceAddress.landmark ? data.correspondenceAddress.landmark : '';
      correspondenceAddress.state =
        data.correspondenceAddress && data.correspondenceAddress.state && data.correspondenceAddress.state.name
          ? data.correspondenceAddress.state.name
          : '';
      correspondenceAddress.stateId =
        data.correspondenceAddress && data.correspondenceAddress.state && data.correspondenceAddress.state.id
          ? data.correspondenceAddress.state.id
          : null;
      correspondenceAddress.addressType =
        data.correspondenceAddress && data.correspondenceAddress.addressType && data.correspondenceAddress.addressType.name
          ? data.correspondenceAddress.addressType.name
          : '';
      correspondenceAddress.addressTypeId =
        data.correspondenceAddress && data.correspondenceAddress.addressType && data.correspondenceAddress.addressType.id
          ? data.correspondenceAddress.addressType.id
          : null;
      correspondenceAddress.country =
        data.correspondenceAddress &&
          data.correspondenceAddress.state &&
          data.correspondenceAddress.state.country &&
          data.correspondenceAddress.state.country.name
          ? data.correspondenceAddress.state.country.name
          : '';
      correspondenceAddress.countryId =
        data.correspondenceAddress &&
          data.correspondenceAddress.state &&
          data.correspondenceAddress.state.country &&
          data.correspondenceAddress.state.country.id
          ? data.correspondenceAddress.state.country.id
          : null;

      return correspondenceAddress;
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async blockedCountries(userDetails: InvestorDetails, options?: Options) {
    try {
      //Currently only 3 countries are blocked(CA, US)
      const blockerCountriesIDs = [39, 234];
      if (userDetails && userDetails.taxResidentCountryId) {
        return blockerCountriesIDs.includes(userDetails.taxResidentCountryId);
      }
      return false;
    } catch (error) {
      LoggingUtils.error(error, 'blockedCountries');
      throw error;
    }
  }

  async createUamLoginLogs(input: DataObject<UamLoginLogs> | null, type: string, token: string | null) {
    if (type == 'login') {
      if (!input) return Promise.reject(new RestError(465, 'There was an issue with the request'));
      await this.uamLoginLogsRepository.create(input);
    }
    if (type == 'logout') {
      const currentDate = new Date();
      const uamUamLoginLogsRecord = await this.uamLoginLogsRepository.findOne({
        where: {
          token: token
        }
      });
      if (uamUamLoginLogsRecord && uamUamLoginLogsRecord.id)
        await this.uamLoginLogsRepository.updateById(uamUamLoginLogsRecord?.id, {logoutTime: currentDate.toLocaleTimeString()});
    }
  }
  markUserAsLocked(uamIntegrationInstance: any, appUser: AppUser) {
    delete uamIntegrationInstance.id;

    uamIntegrationInstance.isLatest = true;
    uamIntegrationInstance.oldProfileName = null;
    uamIntegrationInstance.oldEmployeeName = null;
    uamIntegrationInstance.oldEmail = null;
    uamIntegrationInstance.oldProfileName = null;
    uamIntegrationInstance.oldBranchName = null;
    uamIntegrationInstance.oldDepartmentName = null;
    uamIntegrationInstance.oldDob = null;
    uamIntegrationInstance.oldSalutation = null;
    uamIntegrationInstance.oldCategory = null;
    uamIntegrationInstance.oldUserType = null;
    uamIntegrationInstance.oldContactNumber = null;
    uamIntegrationInstance.oldDepartmentCode = null;
    uamIntegrationInstance.oldBranchCode = null;
    uamIntegrationInstance.oldReportingManagerCode = null;
    uamIntegrationInstance.oldGender = null;
    uamIntegrationInstance.newProfileName = null;
    uamIntegrationInstance.newEmployeeName = null;
    uamIntegrationInstance.newEmail = null;
    uamIntegrationInstance.newProfileName = null;
    uamIntegrationInstance.newBranchName = null;
    uamIntegrationInstance.newDepartmentName = null;
    uamIntegrationInstance.newDob = null;
    uamIntegrationInstance.newSalutation = null;
    uamIntegrationInstance.newCategory = null;
    uamIntegrationInstance.newUserType = null;
    uamIntegrationInstance.newContactNumber = null;
    uamIntegrationInstance.newDepartmentCode = null;
    uamIntegrationInstance.newBranchCode = null;
    uamIntegrationInstance.newReportingManagerCode = null;
    uamIntegrationInstance.newGender = null;
    uamIntegrationInstance.status = Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].label;
    uamIntegrationInstance.lastLoginDate = appUser.lastLoginDate;
    uamIntegrationInstance.activity = 'LOCK';
    uamIntegrationInstance.disableDateTime = null;
    uamIntegrationInstance.dormantDateTime = null;
    uamIntegrationInstance.isActive = false;

    return uamIntegrationInstance;
  }

  /**
   * OTP generation form Transaction
   * @param appUserId
   * @param cartItemId
   * @param options
   * @returns
   */
  async generateOTPForTransaction(appUserId: number, cartItemId: number, options: Options): Promise<any> {
    try {
      const logParams = options!.logParams;
      const cartItem = await this.cartItemRepository.findOne(
        {
          where: {
            id: cartItemId,
            isActive: true
          },
          include: [
            {
              relation: 'cart',
              scope: {
                where: {isActive: true},
                fields: ['id', 'createdByAppUserId', 'accountId']
              }
            },
            {
              relation: 'serviceProviderAccount',
              scope: {
                where: {isActive: true},
                fields: ['id', 'accountNumber', 'registeredEmail', 'registeredMobile', 'accountId']
              }
            }
          ]
        },
        options
      );

      const user = await this.appUserRepository.findOne(
        {
          where: {
            id: appUserId,
            isActive: true
          },
          fields: ['id', 'txnOTPGeneration', 'txnOTPRetryCount', 'name']
        },
        options
      );
      const cart = cartItem && cartItem.cart;
      const serviceProviderAccount = cartItem && cartItem.serviceProviderAccount;
      if (cart.createdByAppUserId != user!.id) {
        return Promise.reject(new RestError(465, 'Invalid User'));
      }
      if (
        ['', null, undefined, NaN].includes(serviceProviderAccount.registeredEmail) &&
        ['', null, undefined, NaN].includes(serviceProviderAccount.registeredMobile)
      ) {
        return Promise.reject(new RestError(465, 'Contact details not registered with service provider'));
      }
      //generate otp
      let currentTime = new Date();
      const generationTime = user!.txnOTPGeneration!;
      let otpCount = (user && user!.txnOTPRetryCount && user!.txnOTPRetryCount) || 0;
      let otpGenerationMaxTime = new Date(generationTime?.getTime() + 43200000);
      if (otpCount >= MAX_TXN_OTP_RETRY_COUNT) {
        if (currentTime < otpGenerationMaxTime) {
          return Promise.reject(
            new RestError(400, 'Max retry limit for OTP generation execced!. Kindly try generating a new OTP!', {systemcode: 1016})
          );
        } else {
          await this.appUserRepository.updateById(user!.id, {
            txnOTPRetryCount: 1
          });
        }
      }
      let resendTime = new Date(generationTime?.getTime() + 1 * 60000);
      if (currentTime.getTime() < resendTime.getTime()) {
        return Promise.reject(new RestError(400, 'Please retry after 1 minute!', {systemcode: 1017}));
      }
      await this.appUserRepository.updateById(user!.id, {
        txnOTPRetryCount: user!.txnOTPRetryCount! + 1
      });

      //get transaction type from cartItem for flag
      let transactionFlagFromCart: string = "SELL";
      //systematic type
      if (cartItem?.transactionSubType == Option.GLOBALOPTIONS['TRANSACTIONSUBTYPE'].systematic.value) {
        if ((cartItem?.transactionTypeId == 11) || (cartItem?.transactionTypeId == 10)) {
          transactionFlagFromCart = "STP";
        } else {
          //for type 3 or 4
          transactionFlagFromCart = "SWP";
        }
      } else {
        //lumpsum type
        //default is Sell so let's check for Switch
        if ((cartItem?.transactionTypeId == 11) || (cartItem?.transactionTypeId == 10)) {
          transactionFlagFromCart = "Switch";
        }
      }

      const linkData = CryptoUtils.encodePseudonym(`${user!.id}0000000000000000000`.slice(0, 19))
      const otpResponse = await this.getOTP(logParams.transactionId, linkData);
      if (otpResponse && otpResponse.passwordValue && otpResponse.hasOwnProperty('errorDetail') && otpResponse.errorDetail === null) {
        await this.appUserRepository.updateById(user!.id, {
          txnOTPGeneration: new Date(otpResponse?.datatimeGen),
          txnOTPExpiry: new Date(otpResponse?.datetimeExpire),
          txnOTPVerificationCount: 0
        });
        let publishOTPCount = 0;
        let publishPromise = [];
        if (serviceProviderAccount.registeredEmail) {
          let publishOTPResponse = false;
          const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.transactionOTP.emailTemplate)
          const otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue, transactionFlag: transactionFlagFromCart}
          const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: '', emailSubject: NotificationTopics.OTP_MESSAGES.transactionOTP.emailSubject}
          publishPromise.push(this.coreBankingFacade
            .doPublishOTP(serviceProviderAccount.registeredEmail, otpMessage, logParams.transactionId, 'E')
            .catch(err => {
              let activityObj = {
                executionDate: new Date(),
                apiName: 'Publish OTP',
                errorCode: JSON.stringify(publishOTPResponse),
                details: JSON.stringify(err),
                status: 'failed'
              };
              LoggingUtils.error(activityObj, 'Generate OTP/ Publish OTP');
              return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
            }))
          // publishOTPResponse = await this.coreBankingFacade
          //   .doPublishOTP(serviceProviderAccount.registeredEmail, otpResponse.passwordValue, logParams.transactionId, 'E')
          //   .catch(err => {
          //     let activityObj = {
          //       executionDate: new Date(),
          //       apiName: 'Publish OTP',
          //       errorCode: JSON.stringify(publishOTPResponse),
          //       details: JSON.stringify(err),
          //       status: 'failed'
          //     };
          //     LoggingUtils.error(activityObj, 'Generate OTP/ Publish OTP');
          //     return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
          //   });
          // if (publishOTPResponse) {
          //   publishOTPCount++;
          // }
        }

        if (serviceProviderAccount.registeredMobile) {
          let publishOTPResponse = false;
          const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.transactionOTP.smsTemplate)
          const otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue, transactionFlag: transactionFlagFromCart}
          const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: NotificationTopics.OTP_MESSAGES.transactionOTP.tempId}
          publishPromise.push(this.coreBankingFacade
            .doPublishOTP(serviceProviderAccount.registeredMobile, otpMessage, logParams.transactionId, 'S')
            .catch(err => {
              let activityObj = {
                executionDate: new Date(),
                apiName: 'Publish OTP',
                errorCode: JSON.stringify(publishOTPResponse),
                details: JSON.stringify(err),
                status: 'failed'
              };
              LoggingUtils.error(activityObj, 'Generate OTP/ Publish OTP');
              return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
            }))
          // publishOTPResponse = await this.coreBankingFacade
          //   .doPublishOTP(serviceProviderAccount.registeredMobile, otpResponse.passwordValue, logParams.transactionId, 'S')
          //   .catch(err => {
          //     let activityObj = {
          //       executionDate: new Date(),
          //       apiName: 'Publish OTP',
          //       errorCode: JSON.stringify(publishOTPResponse),
          //       details: JSON.stringify(err),
          //       status: 'failed'
          //     };
          //     LoggingUtils.error(activityObj, 'Generate OTP/ Publish OTP');
          //     return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
          //   });
          // if (publishOTPResponse) {
          //   publishOTPCount++;
          // }
        }

        let result = await Promise.allSettled(publishPromise);

        if (result.length > 0 && ((result[0] && result[0].status == 'fulfilled') || (result[1] && result[1].status == 'fulfilled'))) {
          //updating with ref number
          await this.appUserRepository.updateById(user!.id, {
            txnOTPRefNo: otpResponse.refNo
          });
          return Promise.resolve({success: true, message: 'OTP sent to user!'});
        } else {
          return Promise.reject(new RestError(400, 'Failed to publish OTP', {systemcode: 1018}));
        }
      } else {
        await this.appUserRepository.updateById(user!.id, {
          txnOTPRetryCount: user!.txnOTPRetryCount! - 1
        });
        return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
      }
    } catch (error) {
      if (error instanceof RestError) {
        return Promise.reject(error);
      }
      throw error;
    }
  }

  /**
   * OTP Verification for Transaction
   * @param appUserId
   * @param contactDetails
   * @param request
   * @param options
   * @returns
   */
  async verifyOTPForTransaction(appUserId: number, contactDetails: VerifyOtpContactDetails, request: Request, options: Options): Promise<any> {
    try {
      const logParams = options!.logParams;
      if (!(contactDetails && contactDetails.otp && contactDetails.cartItemId && appUserId)) {
        return Promise.reject(new RestError(400, 'Please provide valid info!', {systemcode: 1020}));
      }
      const user = await this.appUserRepository.findOne({
        where: {
          id: appUserId,
          isActive: true
        }
      });
      const account = await this.accountRepository.findOne(
        {
          where: {
            primaryHolderId: appUserId,
            isActive: true
          },
          fields: ['id', 'name']
        },
        options
      );

      if (!user) {
        return Promise.reject(new RestError(404, 'User not found!', {systemcode: 1030}));
      }
      if (user.txnOTPVerificationCount == null) {
        await this.appUserRepository.updateById(user.id, {
          txnOTPVerificationCount: 1
        });
      } else if (user.txnOTPVerificationCount + 1 > 3) {
        return Promise.reject(
          new RestError(472, 'You have reached the maximum number of attempts to verify the otp. Please try generating a new one', {
            systemcode: 1016
          })
        );
      } else {
        await this.appUserRepository.updateById(user.id, {
          txnOTPVerificationCount: user.txnOTPVerificationCount + 1
        });
      }

      let txnOTPExpiry = user.txnOTPExpiry!;
      let txnOTPExpiryTime = new Date(txnOTPExpiry.getTime());
      const currentTime = new Date();
      if (currentTime.getTime() > txnOTPExpiryTime.getTime()) {
        return Promise.reject(new RestError(400, 'OTP is expired!', {systemcode: 1022}));
      }

      const linkData = CryptoUtils.encodePseudonym(`${user!.id}0000000000000000000`.slice(0, 19))
      const response = await this.doVerifyOTP(contactDetails.otp, user!.txnOTPRefNo!, logParams.transactionId, linkData);
      if (response && response.statusCode == '00' && response.hasOwnProperty('errorDetail') && response.errorDetail === null) {
        await this.cartItemRepository.updateById(contactDetails.cartItemId, {verifiedOtpDate: new Date()}, options);
        return Promise.resolve({
          success: true
        });
      } else if (response && response.statusCode === '02' && response.errorDetail == 'Bad password value.') {
        await NotificationUtils.sendNotificationEvent({
          accountId: account!.id!,
          topicId: NotificationTopics.TOPICS.transcationFailed.incorrectOTP.value,
          notificationType: NotificationTopics.TOPICS.transcationFailed.incorrectOTP.topic,
          templateKeys: {
            rejectReason: response.errorDetail,
            transactionFlag: 'SELL'
          }
        });
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      } else {
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      }
    } catch (error) {
      if (error instanceof RestError) {
        return Promise.reject(error);
      } else {
        LoggingUtils.error(error);
        throw error;
      }
    }
  }

  async generateOTPForTransactionMock(appUserId: number, cartItemId: number, options: Options): Promise<any> {
    try {
      const logParams = options!.logParams;
      const cartItem = await this.cartItemRepository.findOne(
        {
          where: {
            id: cartItemId,
            isActive: true
          },
          include: [
            {
              relation: 'cart',
              scope: {
                where: {isActive: true},
                fields: ['id', 'createdByAppUserId', 'accountId']
              }
            },
            {
              relation: 'serviceProviderAccount',
              scope: {
                where: {isActive: true},
                fields: ['id', 'accountNumber', 'registeredEmail', 'registeredMobile', 'accountId']
              }
            }
          ]
        },
        options
      );

      const user = await this.appUserRepository.findOne(
        {
          where: {
            id: appUserId,
            isActive: true
          },
          fields: ['id', 'txnOTPGeneration', 'txnOTPRetryCount', 'name']
        },
        options
      );
      const cart = cartItem && cartItem.cart;
      const serviceProviderAccount = cartItem && cartItem.serviceProviderAccount;
      if (cart.createdByAppUserId != user!.id) {
        return Promise.reject(new RestError(465, 'Invalid User'));
      }
      if (
        ['', null, undefined, NaN].includes(serviceProviderAccount.registeredEmail) &&
        ['', null, undefined, NaN].includes(serviceProviderAccount.registeredMobile)
      ) {
        return Promise.reject(new RestError(465, 'Contact details not registered with service provider'));
      }
      //generate otp
      //let currentTime = new Date();
      // const generationTime = user!.txnOTPGeneration!;
      //let otpCount = (user && user!.txnOTPRetryCount && user!.txnOTPRetryCount) || 0;
      //let otpGenerationMaxTime = new Date(generationTime?.getTime() + 43200000);
      // if (otpCount >= MAX_TXN_OTP_RETRY_COUNT) {
      //   if (currentTime < otpGenerationMaxTime) {
      //     return Promise.reject(
      //       new RestError(400, 'Max retry limit for OTP generation execced!. Kindly try generating a new OTP!', {systemcode: 1016})
      //     );
      //   } else {
      //     await this.appUserRepository.updateById(user!.id, {
      //       txnOTPRetryCount: 1
      //     });
      //   }
      // }
      // let resendTime = new Date(generationTime?.getTime() + 1 * 60000);
      // if (currentTime.getTime() < resendTime.getTime()) {
      //   return Promise.reject(new RestError(400, 'Please retry after 1 minute!', {systemcode: 1017}));
      // }
      // await this.appUserRepository.updateById(user!.id, {
      //   txnOTPRetryCount: user!.txnOTPRetryCount! + 1
      // });

      //get transaction type from cartItem for flag
      let transactionFlagFromCart: string = "SELL";
      //systematic type
      if (cartItem?.transactionSubType == Option.GLOBALOPTIONS['TRANSACTIONSUBTYPE'].systematic.value) {
        if ((cartItem?.transactionTypeId == 11) || (cartItem?.transactionTypeId == 10)) {
          transactionFlagFromCart = "STP";
        } else {
          //for type 3 or 4
          transactionFlagFromCart = "SWP";
        }
      } else {
        //lumpsum type
        //default is Sell so let's check for Switch
        if ((cartItem?.transactionTypeId == 11) || (cartItem?.transactionTypeId == 10)) {
          transactionFlagFromCart = "Switch";
        }
      }

      // const linkData = CryptoUtils.encodePseudonym(`${user!.id}0000000000000000000`.slice(0, 19))
      const currentDate = new Date()
      const otpResponse = {passwordValue: "123456", errorDetail: 'success', refNo: "123456789", datetimeExpire: new Date(currentDate.getTime() + 120000), datatimeGen: currentDate}
      if (otpResponse && otpResponse.passwordValue && otpResponse.errorDetail && otpResponse.errorDetail === 'success') {
        await this.appUserRepository.updateById(user!.id, {
          txnOTPGeneration: new Date(otpResponse?.datatimeGen),
          txnOTPExpiry: new Date(otpResponse?.datetimeExpire),
          txnOTPVerificationCount: 0
        });
        // let publishOTPCount = 0;
        // let publishPromise = [];
        // if (serviceProviderAccount.registeredEmail) {
        //   let publishOTPResponse = false;
        //   const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.transactionOTP.emailTemplate)
        //   const otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue, transactionFlag: transactionFlagFromCart}
        //   const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: '', emailSubject: NotificationTopics.OTP_MESSAGES.transactionOTP.emailSubject}
        //   publishPromise.push(this.coreBankingFacade
        //     .doPublishOTP(serviceProviderAccount.registeredEmail, otpMessage, logParams.transactionId, 'E')
        //     .catch(err => {
        //       let activityObj = {
        //         executionDate: new Date(),
        //         apiName: 'Publish OTP',
        //         errorCode: JSON.stringify(publishOTPResponse),
        //         details: JSON.stringify(err),
        //         status: 'failed'
        //       };
        //       LoggingUtils.error(activityObj, 'Generate OTP/ Publish OTP');
        //       return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
        //     }))

        // }

        // if (serviceProviderAccount.registeredMobile) {
        //   let publishOTPResponse = false;
        //   const otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.transactionOTP.smsTemplate)
        //   const otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue, transactionFlag: transactionFlagFromCart}
        //   const otpMessage: OtpMessages = {message: otpTemplate(otpKeys), tempId: NotificationTopics.OTP_MESSAGES.transactionOTP.tempId}
        //   publishPromise.push(this.coreBankingFacade
        //     .doPublishOTP(serviceProviderAccount.registeredMobile, otpMessage, logParams.transactionId, 'S')
        //     .catch(err => {
        //       let activityObj = {
        //         executionDate: new Date(),
        //         apiName: 'Publish OTP',
        //         errorCode: JSON.stringify(publishOTPResponse),
        //         details: JSON.stringify(err),
        //         status: 'failed'
        //       };
        //       LoggingUtils.error(activityObj, 'Generate OTP/ Publish OTP');
        //       return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
        //     }))

        // }

        //let result = await Promise.allSettled(publishPromise);

        if (true) {
          //updating with ref number
          await this.appUserRepository.updateById(user!.id, {
            txnOTPRefNo: otpResponse.refNo
          });
          return Promise.resolve({success: true, message: 'OTP sent to user!'});
        } else {
          // return Promise.reject(new RestError(400, 'Failed to publish OTP', {systemcode: 1018}));
        }
      } else {
        // await this.appUserRepository.updateById(user!.id, {
        //   txnOTPRetryCount: user!.txnOTPRetryCount! - 1
        // });
        return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
      }
    } catch (error) {
      if (error instanceof RestError) {
        return Promise.reject(error);
      }
      throw error;
    }
  }

  async verifyOTPForTransactionMock(appUserId: number, contactDetails: VerifyOtpContactDetails, request: Request, options: Options): Promise<any> {
    try {
      const logParams = options!.logParams;
      if (!(contactDetails && contactDetails.otp && contactDetails.cartItemId && appUserId)) {
        return Promise.reject(new RestError(400, 'Please provide valid info!', {systemcode: 1020}));
      }
      const user = await this.appUserRepository.findOne({
        where: {
          id: appUserId,
          isActive: true
        }
      });
      const account = await this.accountRepository.findOne(
        {
          where: {
            primaryHolderId: appUserId,
            isActive: true
          },
          fields: ['id', 'name']
        },
        options
      );

      if (!user) {
        return Promise.reject(new RestError(404, 'User not found!', {systemcode: 1030}));
      }
      if (user.txnOTPVerificationCount == null) {
        await this.appUserRepository.updateById(user.id, {
          txnOTPVerificationCount: 1
        });
      } else if (user.txnOTPVerificationCount + 1 > 3) {
        return Promise.reject(
          new RestError(472, 'You have reached the maximum number of attempts to verify the otp. Please try generating a new one', {
            systemcode: 1016
          })
        );
      } else {
        await this.appUserRepository.updateById(user.id, {
          txnOTPVerificationCount: user.txnOTPVerificationCount + 1
        });
      }

      let txnOTPExpiry = user.txnOTPExpiry!;
      let txnOTPExpiryTime = new Date(txnOTPExpiry.getTime());
      const currentTime = new Date();
      if (currentTime.getTime() > txnOTPExpiryTime.getTime()) {
        return Promise.reject(new RestError(400, 'OTP is expired!', {systemcode: 1022}));
      }

      const linkData = CryptoUtils.encodePseudonym(`${user!.id}0000000000000000000`.slice(0, 19))
      // const response = await this.doVerifyOTP(contactDetails.otp, user!.txnOTPRefNo!, logParams.transactionId, linkData);
      const response = {statusCode: "00", errorDetail: null}
      if (response && response.statusCode == '00' && response.hasOwnProperty('errorDetail') && response.errorDetail === null) {
        await this.cartItemRepository.updateById(contactDetails.cartItemId, {verifiedOtpDate: new Date()}, options);
        return Promise.resolve({
          success: true
        });
      } else if (response && response.statusCode === '02' && response.errorDetail == 'Bad password value.') {
        await NotificationUtils.sendNotificationEvent({
          accountId: account!.id!,
          topicId: NotificationTopics.TOPICS.transcationFailed.incorrectOTP.value,
          notificationType: NotificationTopics.TOPICS.transcationFailed.incorrectOTP.topic,
          templateKeys: {
            rejectReason: response.errorDetail,
            transactionFlag: 'SELL'
          }
        });
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      } else {
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      }
    } catch (error) {
      if (error instanceof RestError) {
        return Promise.reject(error);
      } else {
        LoggingUtils.error(error);
        throw error;
      }
    }
  }


  async generateOTPFor2FATransaction(appUserId: number, txnReferenceNumber: string ,userProfile : any, options: Options): Promise<any> {


    try {
      //generateOTP
      var txnOTPRetryCount : number|null = null
      var countIncreased : boolean = false
      let emailIdorMobileNumberForOTP : string | null = ''
      let notificationType : string = ''
      var otpTemplate : _.CompiledTemplate| undefined
      let otpKeys : any = ''
      let otpMessage : OtpMessages
      const logParams = options!.logParams;
      const linkData = txnReferenceNumber // The linkData and reference number will be same because a user may be able to generate otp
      const user = await this.appUserRepository.findById(appUserId, {
        fields: ['id','name']});

      const accountIds = userProfile.hasOwnProperty('primaryAccountIds') && Array.isArray(userProfile.primaryAccountIds) ? userProfile.primaryAccountIds : []
      if(accountIds.length === 0) throw `Couldn't find accounts linked to the TXN OTP ref number ${txnReferenceNumber}`

      const transaction2FARecord = await this.transactionTwoFaRepository.findOne({where : {txnRefNo : txnReferenceNumber, accountId : {inq : accountIds}}}, options)
      if(!transaction2FARecord || !transaction2FARecord.id ) throw `couldn't find reference number ${txnReferenceNumber} in database`

      if(transaction2FARecord.otpVerified) throw `otp has already been verified for ref no : ${txnReferenceNumber}`

      txnOTPRetryCount = transaction2FARecord.txnOTPRetryCount == null ? 0 : transaction2FARecord.txnOTPRetryCount
      if(txnOTPRetryCount >= 3){
        return Promise.reject(new RestError(465,'Max retry limit for OTP generation exceeded!'))
      }
      await this.transactionTwoFaRepository.updateById(transaction2FARecord.id, {txnOTPRetryCount : txnOTPRetryCount + 1},options)
      txnOTPRetryCount +=1
      countIncreased = true
      const otpResponse = await this.getOTP(logParams.transactionId, linkData, txnReferenceNumber).catch(err => {
        LoggingUtils.error(`Couldn't generate OTP : ${JSON.stringify(err)}`)
        return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
      }); //In this case
      if (otpResponse && otpResponse.passwordValue && otpResponse.hasOwnProperty('errorDetail') && otpResponse.errorDetail === null) {
        // sms template for sms type notifications
        if(transaction2FARecord.twoFactorAuthTypeLabel == Option.GLOBALOPTIONS.TWOFACTORAUTH.sms.label){
          emailIdorMobileNumberForOTP = (transaction2FARecord.registeredMobile ?? null)
          notificationType = 'S'
          otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.transaction2FAOTP.smsTemplate)
          otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue}
          otpMessage = {message: otpTemplate(otpKeys), tempId: NotificationTopics.OTP_MESSAGES.transaction2FAOTP.tempId, emailSubject: NotificationTopics.OTP_MESSAGES.transaction2FAOTP.emailSubject}
        }
        // email template for sms type notifications
        else if(transaction2FARecord.twoFactorAuthTypeLabel == Option.GLOBALOPTIONS.TWOFACTORAUTH.email.label){

          const instrumentIDs = await this.cartItemRepository.find({where : {transactionTwoFaEmailId : transaction2FARecord.id}, fields : ['instrumentId']},options)
          const instruments = await this.instrumentRepository.find({where : {id : { inq : _.pluck(instrumentIDs, 'instrumentId') }}},options)
          if(instruments.length == 0) {
            await this.transactionTwoFaRepository.updateById(transaction2FARecord.id, {txnOTPRetryCount : txnOTPRetryCount! - 1},options)
            throw "Instruments couldn't be found"
          }
          let schemeNames : string = ""
          instruments.forEach(instrument=>{
            if(instrument.fullName && instrument.fullName.length > 0){
              schemeNames += `~${instrument.fullName}`
            }
            else if(instrument.name && instrument.name.length > 0){
              schemeNames += `~${instrument.name}`
            }
            else{
              schemeNames += `~`
            }
          })
          emailIdorMobileNumberForOTP = (transaction2FARecord.registeredEmail ?? null)
          notificationType = 'E'
          otpTemplate = _.template(NotificationTopics.OTP_MESSAGES.transaction2FAOTP.emailTemplate)
          otpKeys = {customerName: user!.name, otp: otpResponse.passwordValue, date: moment().format('DD/MM/YY') , time : moment().format('HH:mm'), schemeNames : schemeNames}
          otpMessage = {message: otpTemplate(otpKeys), tempId: '', emailSubject: NotificationTopics.OTP_MESSAGES.transaction2FAOTP.emailSubject}
        }

        if(!emailIdorMobileNumberForOTP || emailIdorMobileNumberForOTP == '') throw `Email or mobile is not available`

          let publishOTPResponse = false;
          await this.doPublishOTP(emailIdorMobileNumberForOTP, otpMessage!, logParams.transactionId, notificationType).catch(async (err) => {
            let activityObj = {
              executionDate: new Date(),
              apiName: 'Publish OTP',
              errorCode: JSON.stringify(publishOTPResponse),
              details: JSON.stringify(err),
              status: 'failed'
            };
            LoggingUtils.error(activityObj, 'generateOTPFor2FATransaction');
            await this.transactionTwoFaRepository.updateById(transaction2FARecord.id, {txnOTPRetryCount : txnOTPRetryCount! - 1},options)
            countIncreased = false
            return Promise.reject(new RestError(465, 'There was a problem with delivering OTP, please try again after a few minutes.'));
          })
          await this.transactionTwoFaRepository.updateById(transaction2FARecord.id,{
            txnOTPGeneration: new Date(otpResponse?.datatimeGen),
            txnOTPExpiry: new Date(otpResponse?.datetimeExpire),
            txnOTPVerificationCount: 0
          },options);
          return Promise.resolve({success: true, message: 'OTP sent to user!'});
    }
    else {
      if(countIncreased === true){
        await this.transactionTwoFaRepository.updateById(transaction2FARecord.id, {txnOTPRetryCount : txnOTPRetryCount - 1},options)
      }
      return Promise.reject(new RestError(400, 'OTP generation failed!. Kindly contact support !', {systemcode: 1019}));
      //Need to reduce the otpcount here
    }
  } catch (error) {
      if (error instanceof RestError) {
        return Promise.reject(error);
      }
      throw error;
    }
  }

  async verifyOTPFor2FATransaction(appUserId: number, txnReferenceNumber: string ,txnOTP : string, userProfile : any, transactionFlag : string , options: Options): Promise<any> {
    /*

    1. Find the database row by txnReferenceNumber. also check for the accountId while searching and ensure otp was generated
    //increase the verification count by 1
    //check the database if the user has already attempted for more than 3 times
    //In catch block might need to reduce the number of verification count in case there is a error from E2FA
    2. Make call to E2FA to verify the otp
    3. If OTP verified, return {success : true , txnReferenceNumber : txnReferenceNumber} // might need to update some other columns in this block as well
    4. if otp verification failed, return {success : false , txnReferenceNumber : txnReferenceNumber} // might need to update some other columns in this block as well

    */


    try{

      const logParams = options!.logParams;

      //Find the database row by txnReferenceNumber. also check for the accountId while searching and ensure otp was generated
      const accountIds = userProfile.hasOwnProperty('primaryAccountIds') && Array.isArray(userProfile.primaryAccountIds) ? userProfile.primaryAccountIds : []
      if(accountIds.length === 0) throw `Couldn't find accounts linked to the TXN OTP ref number ${txnReferenceNumber}`
      const transaction2FARecord = await this.transactionTwoFaRepository.findOne({where : {txnRefNo : txnReferenceNumber, accountId : {inq : accountIds}}},options)
      if(!transaction2FARecord) throw `Couldn't find the OTP reference number ${txnReferenceNumber} in the database`
      if(transaction2FARecord.otpVerified) throw `otp has already been verified for ref no : ${txnReferenceNumber}`
      if(transaction2FARecord?.txnOTPVerificationCount && transaction2FARecord?.txnOTPVerificationCount >= 3){
        return new RestError(465, 'You have reached the maximum number of attempts to verify the otp. Please try adding the item to cart again')
      }
      else{
        let txnOTPVerificationCount = transaction2FARecord.txnOTPVerificationCount == null ? 0 : transaction2FARecord.txnOTPVerificationCount
        await this.transactionTwoFaRepository.updateById(transaction2FARecord.id, {txnOTPVerificationCount : txnOTPVerificationCount + 1},options)
      }

      //Attempt to verify transaction otp

      let txnOTPExpiry = transaction2FARecord.txnOTPExpiry!;
      let txnOTPExpiryTime = new Date(txnOTPExpiry.getTime());
      const currentTime = new Date();
      if (currentTime.getTime() > txnOTPExpiryTime.getTime()) {
        return Promise.reject(new RestError(400, 'OTP is expired!', {systemcode: 1022}));
      }

      const linkData = txnReferenceNumber
      const response = await this.doVerifyOTP(txnOTP, txnReferenceNumber, logParams.transactionId, linkData);
      if (response && response.statusCode == '00' && response.hasOwnProperty('errorDetail') && response.errorDetail === null) {
        await this.transactionTwoFaRepository.updateById(transaction2FARecord.id, {otpVerified : true},options)
        // @todo check what needs to be changed in cartItems table for this
        let filter = {}
        if(transaction2FARecord.twoFactorAuthType == Option.GLOBALOPTIONS.TWOFACTORAUTH.sms.value){
          filter = {transactionTwoFaSmsId : transaction2FARecord.id}
        }
        else if(transaction2FARecord.twoFactorAuthType == Option.GLOBALOPTIONS.TWOFACTORAUTH.email.value){
          filter = {transactionTwoFaEmailId : transaction2FARecord.id}
        }
        let currentDate = new Date()
        await this.cartItemRepository.updateAll({verifiedOtpDate : currentDate}, filter, options)
        let cartItemsInstance = await this.cartItemRepository.findOne({where : filter, fields :['cartId','id']}, options)
        let cartInstance = await this.cartRepository.findOne({where : {id : cartItemsInstance?.cartId}},options)
        return {
          success: true,
          txnReferenceNumber : txnReferenceNumber,
          cartUniqueId : cartInstance?.uniqueId
        }
      }else if (response && response.statusCode === '02' && response.errorDetail == 'Bad password value.') {
        await NotificationUtils.sendNotificationEvent({
          accountId: transaction2FARecord.accountId,
          topicId: NotificationTopics.TOPICS.transcationFailed.incorrectOTP.value,
          notificationType: NotificationTopics.TOPICS.transcationFailed.incorrectOTP.topic,
          templateKeys: {
            rejectReason: response.errorDetail,
            transactionFlag: transactionFlag
          }
        });
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      } else {
        return Promise.reject(new RestError(400, 'Invalid OTP!', {systemcode: 1022}));
      }

    }
    catch(error){
      if (error instanceof RestError) {
        return Promise.reject(error);
      } else {
        LoggingUtils.error(error);
        throw error;
      }
    }
 }

  /**
   * Update the decleration of mobile and email
   *
   */
  async updateDecleration(appUserId: number, data: any, options: Options) {
    try {

      await this.appUserRepository.updateById(appUserId, {
        emailBelongsTo: data.emailBelongsTo,
        contactNumberBelongsTo: data.contactNumberBelongsTo,
        appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['declarationCompleted'].value
      }, options)
      return {success: true}
    } catch (error) {
      LoggingUtils.error(error.message, 'updateDecleration')
      throw error;
    }
  }
}
