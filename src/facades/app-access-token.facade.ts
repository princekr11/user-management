import {/* inject, */ BindingScope, injectable, service} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, relation, repository, Where} from '@loopback/repository';
import {Request} from '@loopback/rest';
import {
  AppAccessToken,
  AppAccessTokenRelations,
  AppAccessTokenRepository,
  AppUser,
  AppUserRepository,
  Device,
  DeviceRepository,
  RestError,
  LoggingUtils,
  LogApiCallUtils,
  FormatUtils,
  UamLoginLogs,
  UamLoginLogsRepository
} from 'common';
import uid2 from 'uid2';
import _ from 'underscore';
import moment from 'moment-timezone';

const tokenLength = 64;

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AppAccessTokenFacade {
  constructor(
    @repository(AppAccessTokenRepository) private appAccessTokenRepository: AppAccessTokenRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(DeviceRepository) private deviceRepository: DeviceRepository,
    @repository(UamLoginLogsRepository) private uamLoginLogsRepository: UamLoginLogsRepository,

    // @service(UamLoginLogsFacade) private uamLoginLogsFacade: UamLoginLogsFacade,
  ) { }

  async create(entity: DataObject<AppAccessToken>, options?: Options): Promise<AppAccessToken> {
    return this.appAccessTokenRepository.create(entity, options);
  }

  async createAll(entities: DataObject<AppAccessToken>[], options?: Options): Promise<AppAccessToken[]> {
    return this.appAccessTokenRepository.createAll(entities, options);
  }

  async save(entity: AppAccessToken, options?: Options): Promise<AppAccessToken> {
    return this.appAccessTokenRepository.save(entity, options);
  }

  async find(filter?: Filter<AppAccessToken>, options?: Options): Promise<(AppAccessToken & AppAccessTokenRelations)[]> {
    return this.appAccessTokenRepository.find(filter, options);
  }

  async findOne(filter?: Filter<AppAccessToken>, options?: Options): Promise<(AppAccessToken & AppAccessTokenRelations) | null> {
    return this.appAccessTokenRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<AppAccessToken>,
    options?: Options
  ): Promise<AppAccessToken & AppAccessTokenRelations> {
    return this.appAccessTokenRepository.findById(id, filter, options);
  }

  async update(entity: AppAccessToken, options?: Options): Promise<void> {
    return this.appAccessTokenRepository.update(entity, options);
  }

  async delete(entity: AppAccessToken, options?: Options): Promise<void> {
    return this.appAccessTokenRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<AppAccessToken>, where?: Where<AppAccessToken>, options?: Options): Promise<Count> {
    return this.appAccessTokenRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<AppAccessToken>, options?: Options): Promise<void> {
    return this.appAccessTokenRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<AppAccessToken>, options?: Options): Promise<void> {
    return this.appAccessTokenRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<AppAccessToken>, options?: Options): Promise<Count> {
    return this.appAccessTokenRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.appAccessTokenRepository.deleteById(id, options);
  }

  async count(where?: Where<AppAccessToken>, options?: Options): Promise<Count> {
    return this.appAccessTokenRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.appAccessTokenRepository.exists(id, options);
  }

  async fetchUserDetailsByToken(token: string | undefined | null): Promise<AppUser | any> {
    return new Promise((resolve, reject) => {
      if (!token) {
        return reject(new RestError(401, 'Invalid access token!', {systemcode: 1023}));
      }
      this.appAccessTokenRepository
        .findOne({
          where: {
            token: token
          },
          include: [
            {
              relation: 'appUser',
              scope: {
                include: [
                  {
                    relation: 'appRoles'
                  },
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
                ],
                fields: {
                  id: true,
                  name: true,
                  email: true,
                  gender: true,
                  userCode: true,
                  contactNumberCountryCode: true,
                  mpinSetup: true,
                  contactNumber: true,
                  lastLoginDate: true,
                  appUserStatus: true,
                  familyId: true,
                  remarks: true,
                  appUserStatusLabel: true,
                  emailBelongsTo: true,
                  contactNumberBelongsTo: true
                }
              }
            }
          ]
        })
        .then((token: AppAccessToken | null) => {
          if (!token || !token.appUser) {
            return Promise.reject(new RestError(401, 'Invalid access token!', {systemcode: 1023}));
          }
          // let panCardNumber = token.investorDetails?.panCardNumber?token.investorDetails?.panCardNumber
          if (token && token.appUser && token.appUser.investorDetails && token.appUser.investorDetails.panCardNumber) {token.appUser.investorDetails.panCardNumber = FormatUtils.panMaskFormat(token.appUser.investorDetails.panCardNumber);}
          return Promise.resolve(token.appUser);
        })
        .then(async (data: AppUser) => {
          return resolve({...data});
        })
        .catch((error: Error) => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async logout(
    appUserId: number,
    deviceUniqueId: string | undefined | null,
    token: string | undefined | null,
    req: Request,
    options?: Options
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const logParams = options!.logParams;
      if (!token) {
        return reject(new RestError(401, 'Invalid access token!', {systemcode: 1023}));
      }
      this.appAccessTokenRepository
        .findOne({
          where: {
            token: token,
            appUserId: appUserId
          }
        })
        .then((appAccessToken: AppAccessToken | null) => {
          if (!appAccessToken) {
            return Promise.reject(new RestError(401, 'Invalid access token!', {systemcode: 1023}));
          }
          return this.appAccessTokenRepository.deleteById(appAccessToken?.id);
        })
        //   .then(() => {
        //     return this.deviceRepository.findOne({
        //       where: {
        //         uniqueId: deviceUniqueId,
        //         appUserId: appUserId
        //       }
        //     })
        //  })
        .then(() => {
          return this.deviceRepository.updateAll(
            {
              // mpinSetup: false,
              appUserId: undefined,
              biometricSetup: false
            },
            {uniqueId: deviceUniqueId, appUserId: appUserId}
          );
        })
        .then(() => {
          // @todo set actual value in ip, source, version
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {logout: true},
            transactionId: logParams.transactionId,
            appUserId: appUserId
          });
          return resolve({success: true});
        })
        .catch((error: Error) => {
          // @todo set actual value in ip, source, version
          LogApiCallUtils.sendMessageLoginApiCall({
            loginDate: new Date(),
            ipAddress: logParams.ipAddress,
            source: logParams.source,
            version: logParams.version,
            details: {logout: false, error},
            transactionId: logParams.transactionId,
            appUserId: appUserId
          });
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async logoutInternalUser(appUserId: number, token: string, options?: Options): Promise<any> {
    const logParams = options!.logParams;
    try {
      await this.appAccessTokenRepository.updateAll({isActive: false}, {appUserId: appUserId, isActive: true});
      await this.createUamLoginLogs(null, "logout", token)
      // @todo set actual value in ip, source, version
      LogApiCallUtils.sendMessageLoginApiCall({
        loginDate: new Date(),
        ipAddress: logParams.ipAddress,
        source: logParams.source,
        version: logParams.version,
        details: {logout: true},
        transactionId: logParams.transactionId,
        appUserId: appUserId
      });
      return {success: true};
    } catch (error) {
      // @todo set actual value in ip, source, version
      LogApiCallUtils.sendMessageLoginApiCall({
        loginDate: new Date(),
        ipAddress: logParams.ipAddress,
        source: logParams.source,
        version: logParams.version,
        details: {logout: false, error},
        transactionId: logParams.transactionId,
        appUserId: appUserId
      });
      throw error;
    }
  }

  async recreateTokenWithRereshToken(refreshToken: string | undefined | null, request: Request): Promise<any> {
    try {
      if (!refreshToken) {
        return Promise.reject(new RestError(401, 'Invalid access token!', {systemcode: 1023}));
      }
      const appAccessToken: AppAccessToken | null = await this.appAccessTokenRepository.findOne({
        where: {
          refreshToken: refreshToken,
          isActive: true
          // appUserId: appUserId
        }
      });
      // console.log(appAccessToken);
      if (!appAccessToken) {
        return Promise.reject(new RestError(401, 'Invalid refresh token!', {systemcode: 1023}));
      }
      //if check refresh token Expiry date
      if (!appAccessToken.refreshTokenExpiry) throw new Error('Invalid Refresh Token Expiry Date');
      //CHECK IF REFRESH TOKEN IS VALID
      const curreDate = new Date();
      const refreshTokenExpiryDate = new Date(appAccessToken.refreshTokenExpiry);
      //if current date is grater the the refreshtoken expiry date then the refresh token is expeired
      if (curreDate > refreshTokenExpiryDate) {
        return Promise.reject(new RestError(401, 'Refresh Token Expired', {systemcode: 1129}));
      }

      const tokenData: any = appAccessToken.tokenData
      if (tokenData.appRoles && Array.isArray(tokenData.appRoles) && tokenData.appRoles.length && tokenData.appRoles[0] == '$otpVerified') {
        return this.createToken(appAccessToken.appUserId, request, true);
      }
      //create new accesstoken access token and refresh token
      return this.createToken(appAccessToken.appUserId, request);
    } catch (error) {
      LoggingUtils.error(error);
      return Promise.reject(new RestError(401, 'Request Could Not Be Processed', {systemcode: 1011}));
    }
  }

  //added isVerifyOTPRequest in order to add the role $otpVerified for the token. this is necessary because we only want certain endpoints to be accessible using the token generated from verifyotp
  async createToken(appUserId: number, request: Request, isVerifyOTPRequest?: boolean): Promise<Partial<AppAccessToken>> {
    //@todo - use request object to capturte the ip address
    return new Promise((resolve, reject) => {
      let token: string = '';
      let refreshToken: string = '';
      let appAccessToken: AppAccessToken;
      Promise.resolve()
        .then(() => {
          token = uid2(tokenLength);
          refreshToken = uid2(tokenLength);
          return this.appUserRepository.findById(appUserId, {
            include: ['appRoles', 'primaryAccounts'] //add family data here when the framework is in place
          });
        })
        .then(appUser => {
          if (!appUser) {
            return Promise.reject(new RestError(404, 'User not found!', {systemcode: 1030}));
          }
          appAccessToken = new AppAccessToken();
          appAccessToken.appUserId = appUserId;
          appAccessToken.ipAddress = request.ip;
          appAccessToken.token = token;
          appAccessToken.refreshToken = refreshToken;
          appAccessToken.expiry = new Date(new Date().getTime() + parseInt(process.env.ACCESS_TOKEN_SESSION_TIMEOUT!));
          appAccessToken.refreshTokenExpiry = new Date(new Date().getTime() + parseInt(process.env.REFRESH_TOKEN_SESSION_TIMEOUT!));
          let tokenData: Record<string, any> = {};
          tokenData['appUserId'] = appUser.id;
          if (isVerifyOTPRequest) {
            tokenData['appRoleIds'] = [0];
            tokenData['appRoles'] = ['$otpVerified'];
            tokenData['primaryAccountIds'] = [];
          } else {
            tokenData['appRoleIds'] = _.pluck(appUser.appRoles, 'id');
            tokenData['appRoles'] = _.pluck(appUser.appRoles, 'name');
            tokenData['primaryAccountIds'] = _.pluck(appUser.primaryAccounts || [], 'id');
          }

          //@TODO- add family access objects here.
          appAccessToken.tokenData = tokenData;
        })
        .then(data => {
          return this.appUserRepository.updateById(appUserId, {loginRetryCount: 0, lastLoginDate: new Date()});
        })
        .then(data => {
          //set isActive to false where isActive is true for that partiular user id
          return this.appAccessTokenRepository.updateAll({isActive: false}, {appUserId: appUserId, isActive: true});
        })
        .then(data => {
          return this.appAccessTokenRepository.create(appAccessToken);
        })
        .then(data => {
          if (isVerifyOTPRequest) {
            return resolve({appAccessToken: token, appRefreshToken: refreshToken});
          }
          return resolve({appAccessToken: token, appRefreshToken: refreshToken});
        })
        .catch((error: Error) => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async createUamLoginLogs(input: DataObject<UamLoginLogs> | null, type: string, token: string | null) {
    if (type == "login") {
      if (!input) return Promise.reject(new RestError(465, "There was an issue with the request"))
      await this.uamLoginLogsRepository.create(input)
    }
    if (type == "logout") {
      const currentDate = new Date()
      const uamUamLoginLogsRecord = await this.uamLoginLogsRepository.findOne({
        where: {
          token: token
        }
      })
      if (uamUamLoginLogsRecord && uamUamLoginLogsRecord.id)
        await this.uamLoginLogsRepository.updateById(uamUamLoginLogsRecord?.id, {logoutTime: currentDate.toLocaleTimeString()})
    }
  }

  async recreateTokenData(appUserId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          return this.appUserRepository.find({
            where: {
              isActive: true,
              id: appUserId
            },
            include: [
              {
                relation: 'appRoles'
              },
              {
                relation: 'primaryAccounts'
              },
              {
                relation: 'accessTokens',
                scope: {
                  where: {
                    isActive: true
                  }
                }
              }
            ]
          });
        })
        .then((appUsers: any) => {
          const appUser = appUsers[0];
          if (!appUser) {
            return Promise.reject(new RestError(404, 'User not found!', {systemcode: 1030}));
          }
          let tokenData: Record<string, any> = {};
          tokenData['appUserId'] = appUser.id;
          tokenData['appRoleIds'] = _.pluck(appUser.appRoles, 'id');
          tokenData['appRoles'] = _.pluck(appUser.appRoles, 'name');
          tokenData['primaryAccountIds'] = _.pluck(appUser.primaryAccounts || [], 'id');
          //@TODO- add family access objects here.
          let promises: Array<Promise<any>> = [];
          _.each(appUser.accessTokens || [], (appAccessToken: any) => {
            if (
              !(appAccessToken.tokenData && appAccessToken.tokenData.appRoles && appAccessToken.tokenData.appRoles.includes('$otpVerified'))
            ) {
              appAccessToken.tokenData = tokenData;
              promises.push(this.appAccessTokenRepository.save(appAccessToken));
            }
          });
          return Promise.all(promises);
        })
        .then(data => {
          return resolve(data);
        })
        .catch((error: Error) => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }
}
