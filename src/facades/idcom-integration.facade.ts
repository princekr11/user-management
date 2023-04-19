import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {LoggingUtils, RestError, OrderUtils, AppUserRepository, IdcomDetailsRepository, CryptoUtils, applicationLog} from 'common';
import {isEmpty} from 'underscore';
import {IdcomInternalRepository, IdcomRepository} from '../repositories';
import {repository} from '@loopback/repository';
import moment from 'moment-timezone';
import {URL} from 'url';

const SCOPE = process.env.USR_MGMT_IDCOM_FCD_SCOPE as string; //@todo need to replace with actual value

//reading public key of hdfc bank sll certificate
const publicHDFCKey = Buffer.from(process.env.USR_MGMT_IDCOM_FCD_HDFC_PUB_KEY as string, 'base64');

//reding private key of valuefy ssl certificate.
const privateValuefyKey = Buffer.from(process.env.USR_MGMT_IDCOM_DS_PRIVATE_KEY as string, 'base64');
@injectable({scope: BindingScope.APPLICATION})
export class IdcomIntegrationFacade {
  constructor(
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(IdcomRepository) private idcomRepository: IdcomRepository,
    @repository(IdcomInternalRepository) private idcomInternalRepository: IdcomInternalRepository,
    @repository(IdcomDetailsRepository) private idcomDetailsRepository: IdcomDetailsRepository
  ) {}
  /**
   *
   * @param userId
   * @param idcomProps
   * @returns
   */
  async getAuthCodeExternal(userId: number, deviceId: number, transactionId: string): Promise<any> {
    const methodName = 'getAuthCode';
    try {
      LoggingUtils.debug('Step 1 Idcom getAuth method ', methodName);
      if (isEmpty(process.env.USR_MGMT_FCD_IDCOM_CLIENT_KEY) || isEmpty(process.env.USR_MGMT_FCD_IDCOM_CLIENT_SECRET)) {
        throw new Error('Environment Variable not set');
      }
      const key = String(process.env.USR_MGMT_FCD_IDCOM_CLIENT_KEY);
      const secret = String(process.env.USR_MGMT_FCD_IDCOM_CLIENT_SECRET);
      //generating iv and AES key
      const iv = CryptoUtils.generateSymmetricKeyOrIV(16);
      const AESkey = CryptoUtils.generateSymmetricKeyOrIV(32);
      const appUser = await this.appUserRepository
        .findOne({
          where: {
            id: userId
          },
          include: [{relation: 'investorDetails'}]
        })
        .catch(err => {
          throw new Error(err);
        });

      if (isEmpty(appUser)) {
        throw new Error('User not found');
      }

      //appending country code
      let mobileNumber = appUser!.contactNumber;
      const countryCodeSplit = appUser?.contactNumberCountryCode ? appUser?.contactNumberCountryCode?.split('+') : [];
      switch (countryCodeSplit?.length) {
        case 2:
          mobileNumber = `${countryCodeSplit[1]}${mobileNumber}`;
          break;

        case 1:
          mobileNumber = `${countryCodeSplit[0]}${mobileNumber}`;
          break;

        default:
          break;
      }

      // Setting identifier
      const identifiers: any[] = [
        {
          TypeName: 'MobileNo',
          TypeValue: mobileNumber
        }
      ];

      if (appUser!.investorDetails!.birthDate) {
        identifiers.push({
          TypeName: 'DOB',
          TypeValue: moment(appUser!.investorDetails!.birthDate).format('YYYY-MM-DD')
        });
      } else if (appUser!.investorDetails!.panCardNumber) {
        identifiers.push({
          TypeName: 'PANNo',
          TypeValue: appUser!.investorDetails!.panCardNumber
        });
      }

      //Actual Payload
      const requestBody = {
        FintechID: process.env.USR_MGMT_IDCOM_FCD_FINTECH_ID as string,
        Identifiers: identifiers,
        ProductCode: process.env.USR_MGMT_IDCOM_FCD_PRODUCT_CODE as string,
        ClientSecret: secret,
        ClientID: key
      };

      LoggingUtils.debug(`Step 2 get auth req body ---> `, methodName);
      //Create Encrypt request payload
      const ivPayload = iv + JSON.stringify(requestBody); //concating IV with RequestBody
      const RequestEncryptedValue = await CryptoUtils.encrypt(ivPayload, 'aes-256-cbc', AESkey, iv); // Encrypt request payload
      const SymmetricKeyEncryptedValue = await CryptoUtils.encryptRSA(AESkey, publicHDFCKey); //Encrypt Encryption KEY
      const Scope = process.env.USR_MGMT_IDCOM_FCD_SCOPE as string;
      const TransactionId = await OrderUtils.getRandomNumber(14);

      LoggingUtils.debug(
        `Step 3 get auth req body encrypted --> ${JSON.stringify({
          RequestEncryptedValue: RequestEncryptedValue,
          SymmetricKeyEncryptedValue: SymmetricKeyEncryptedValue,
          Scope: Scope,
          TransactionId: TransactionId,
          OAuthTokenValue: ''
        })}`,
        methodName
      ); // @todo need to remove this after testing
      LoggingUtils.debug('Step 4 Invoking fetchAuthCodeWithRedirectUrl ', methodName);
      //Sending encrypted request to idcom
      const response = await this.idcomRepository
        .fetchAuthCodeWithRedirectUrl(RequestEncryptedValue, SymmetricKeyEncryptedValue, Scope, TransactionId, transactionId)
        .catch(error => {
          let errorObj = JSON.parse(error.message);
          let errorMessage = 'Something went wrong';
          if (errorObj.Status) {
            errorMessage = errorObj.Status;
          }
          let activityObj = {
            executionDate: new Date(),
            apiName: 'IDCOM/getAuthCode',
            errorCode: JSON.stringify(error),
            details: JSON.stringify(error),
            status: 'failed'
          };
          applicationLog(activityObj);
          throw new Error(errorMessage);
        });

      // handling gateway error
      if (response && response.Status && response.Status !== 'SUCCESS') {
        let activityObj = {
          executionDate: new Date(),
          apiName: 'IDCOM/getAuthCode',
          errorCode: JSON.stringify(response),
          details: JSON.stringify(response),
          status: response.Status
        };
        applicationLog(activityObj);
        LoggingUtils.error(response, methodName);
        LoggingUtils.debug('Step 5 get auth response failure', methodName);
        return new RestError(400, response.Status, {});
      }

      //Perform decryption of response

      const decryptionSymmetricKey = await CryptoUtils.decryptRSA(response.GWSymmetricKeyEncryptedValue, privateValuefyKey); //decrypting decryption key
      const decryptResponse = await CryptoUtils.decrypt(response.ResponseEncryptedValue, 'aes-256-cbc', decryptionSymmetricKey, iv); //decrypting response
      const resp = JSON.parse(decryptResponse.substring(16)); //fetching actual response
      LoggingUtils.debug(`Step 6 get auth response decryption --> `, methodName);
      if (resp.errorCode != null) {
        LoggingUtils.error({errorCode: response.errorCode, errorMessage: response.errorMessage}, methodName);
        return new RestError(400, response.errorMessage, {});
      } else {
        LoggingUtils.debug('Step 7 get auth non error response ', methodName);
        const url = new URL(resp.redirectUrl);
        const idcomObject = {
          redirectUrl: url.pathname,
          authCode: Buffer.from(resp.authCode, 'utf8').toString('base64'),
          appUserId: userId,
          deviceId: deviceId
        };
        LoggingUtils.debug('Step 8 creating record for idcom detail table', methodName);
        const idcomResult = await this.idcomDetailsRepository.create(idcomObject).catch(error => {
          throw new Error(error);
        });
        if (!idcomResult) {
          return {success: false, message: 'Error occurred unable to store idcom data'};
        }
        LoggingUtils.debug('Step 9 returning get auth success response', methodName);
        return {redirectURL: `${resp.redirectUrl}`, authCode: resp.authCode, success: true};
      }
    } catch (error) {
      LoggingUtils.error(error, methodName);
      //return new RestError(400, error.message);
      throw error;
    }
  }

  /**
   *
   * @param idcomProps
   * @returns
   */
  async getIdTokenExternal(idcomProps: any, transactionId: string): Promise<any> {
    const methodName = 'getIdToken';
    try {
      LoggingUtils.debug('Step 1 Idcom getIdToken menthod', methodName);
      //generating iv and AES key
      const iv = CryptoUtils.generateSymmetricKeyOrIV(16);
      const AESkey = CryptoUtils.generateSymmetricKeyOrIV(32);

      //Actual Payload
      const requestBody = {
        authCode: idcomProps.authCode
      };

      LoggingUtils.debug('Step 2 req body for get Id token ', methodName);
      //Create Encrypt request payload
      const ivPayload = iv + JSON.stringify(requestBody); //concating IV with RequestBody
      const RequestEncryptedValue = await CryptoUtils.encrypt(ivPayload, 'aes-256-cbc', AESkey, iv); // Encrypt request payload
      const SymmetricKeyEncryptedValue = await CryptoUtils.encryptRSA(AESkey, publicHDFCKey); //Encrypt Encryption KEY
      const Scope = SCOPE;
      const TransactionId = await OrderUtils.getRandomNumber(14);

      LoggingUtils.debug(
        `Step 3 req body encrypted for get Id token ${JSON.stringify({
          RequestEncryptedValue: RequestEncryptedValue,
          SymmetricKeyEncryptedValue: SymmetricKeyEncryptedValue,
          Scope: Scope,
          TransactionId: TransactionId,
          OAuthTokenValue: ''
        })}`,
        methodName
      ); // @todo need to remove this after testing
      LoggingUtils.debug('Step 4 invoking fetchIdToken repo method', methodName);
      const response = await this.idcomRepository
        .fetchIdToken(RequestEncryptedValue, SymmetricKeyEncryptedValue, Scope, TransactionId, transactionId)
        .catch(error => {
          let activityObj = {
            executionDate: new Date(),
            apiName: 'IDCOM/getIdToken',
            errorCode: JSON.stringify(error),
            details: JSON.stringify(error),
            status: 'failed'
          };
          applicationLog(activityObj);
          throw new Error(error);
        });

      // handling gateway error
      if (response && response.Status && response.Status !== 'SUCCESS') {
        let activityObj = {
          executionDate: new Date(),
          apiName: 'IDCOM/getIdToken',
          errorCode: JSON.stringify(response),
          details: JSON.stringify(response),
          status: response.Status
        };
        applicationLog(activityObj);

        LoggingUtils.debug('Step 5 error response from get Id token', methodName);
        return new RestError(400, response.Status, {});
      }

      //Perform decryption of response
      const decryptIV = await CryptoUtils.generateSymmetricKeyOrIV(16); //Decryption IV
      const decryptionAesKey = await CryptoUtils.decryptRSA(response.GWSymmetricKeyEncryptedValue, privateValuefyKey); //decrypting decryption key
      const decryptResponse = await CryptoUtils.decrypt(response.ResponseEncryptedValue, 'aes-256-cbc', decryptionAesKey, decryptIV); //decrypting response
      const resp = JSON.parse(decryptResponse.substring(16)); //fetching actual response
      LoggingUtils.debug(`Step 6 decrypting Id token response --> `, methodName);
      if (resp.authStatus !== 'Y') {
        LoggingUtils.error({authStatus: resp.authStatus}, methodName);
        return new RestError(400, 'Authentication Failed', {systemcode: 1028});
      } else {
        LoggingUtils.debug('Step 7 Id token success response', methodName);
        return {...resp, success: true};
      }
    } catch (error) {
      LoggingUtils.error(error, methodName);
      //return new RestError(400, 'Error while fetching Id Token');
      throw error;
    }
  }
  async decryptIdTokenExternal(idcomProps: any, transactionId: string): Promise<any> {
    const methodName = 'decryptIdToken';
    try {
      //Actual Payload
      LoggingUtils.debug('Step 1 decrypt Id token method', methodName);
      const requestBody = {
        RequestEncryptedValue: '',
        SymmetricKeyEncryptedValue: '',
        OAuthTokenValue: '',
        idToken: idcomProps.idToken,
        scope: idcomProps.scope,
        transcationId: OrderUtils.getRandomNumber(14)
      };

      LoggingUtils.debug(`Step 2 req body of decrypt Id token --> `, methodName);
      LoggingUtils.debug('Step 3 invoking decryptIdToken repo method', methodName);
      const response = await this.idcomRepository
        .decryptIdToken(
          requestBody.RequestEncryptedValue,
          requestBody.SymmetricKeyEncryptedValue,
          requestBody.scope,
          requestBody.transcationId,
          requestBody.idToken,
          transactionId
        )
        .catch(error => {
          let activityObj = {
            executionDate: new Date(),
            apiName: 'IDCOM/decryptIdToken',
            errorCode: JSON.stringify(error),
            details: JSON.stringify(error),
            status: 'failed'
          };
          applicationLog(activityObj);
          throw new Error(error);
        });

      // handling gateway error
      if (response && response.Status && response.Status !== 'SUCCESS') {
        let activityObj = {
          executionDate: new Date(),
          apiName: 'IDCOM/decryptIdToken',
          errorCode: JSON.stringify(response),
          details: JSON.stringify(response),
          status: response.Status
        };
        applicationLog(activityObj);
        LoggingUtils.error(response, methodName);
        LoggingUtils.debug('Step 4 error response in decryptIdToken', methodName);
        return new RestError(400, response.Status, {response});
      }

      const result = {
        customerID: response.custID,
        fintechID: response.aud,
        mobileNo: response.sub || response.mobileNo,
        panNo: response.pan
      };
      LoggingUtils.debug(`Step 5 flow end with success response  `, methodName);
      return {...result, success: true};
    } catch (error) {
      LoggingUtils.error(error, methodName);
      //return new RestError(400, 'Error while fetching Id Token');
      throw error;
    }
  }

  /**
   *
   * @param userId
   * @param idcomProps
   * @returns
   */
  async getAuthCodeInternal(userId: number, deviceId: number, transactionId: string): Promise<any> {
    const methodName = 'getAuthCodeInternal';
    try {
      LoggingUtils.debug('Step 1 Idcom getAuth method ', methodName);
      if (isEmpty(process.env.USR_MGMT_FCD_IDCOM_CLIENT_KEY) || isEmpty(process.env.USR_MGMT_FCD_IDCOM_CLIENT_SECRET)) {
        throw new Error('Environment Variable not set');
      }
      const key = String(process.env.USR_MGMT_FCD_IDCOM_CLIENT_KEY);
      const secret = String(process.env.USR_MGMT_FCD_IDCOM_CLIENT_SECRET);
      const appUser = await this.appUserRepository
        .findOne({
          where: {
            id: userId
          },
          include: [{relation: 'investorDetails'}]
        })
        .catch(err => {
          throw new Error(err);
        });

      if (isEmpty(appUser)) {
        throw new Error('User not found');
      }

      //appending country code
      let mobileNumber = appUser!.contactNumber;
      const countryCodeSplit = appUser?.contactNumberCountryCode ? appUser?.contactNumberCountryCode?.split('+') : [];
      switch (countryCodeSplit?.length) {
        case 2:
          mobileNumber = `${countryCodeSplit[1]}${mobileNumber}`;
          break;

        case 1:
          mobileNumber = `${countryCodeSplit[0]}${mobileNumber}`;
          break;

        default:
          break;
      }

      // Setting identifier
      const identifiers: any[] = [
        {
          TypeName: 'MobileNo',
          TypeValue: mobileNumber
        }
      ];

      if (appUser!.investorDetails!.birthDate) {
        identifiers.push({
          TypeName: 'DOB',
          TypeValue: moment(appUser!.investorDetails!.birthDate).format('YYYY-MM-DD')
        });
      } else if (appUser!.investorDetails!.panCardNumber) {
        identifiers.push({
          TypeName: 'PANNo',
          TypeValue: appUser!.investorDetails!.panCardNumber
        });
      }

      //Actual Payload
      const requestBody = {
        FintechID: process.env.USR_MGMT_IDCOM_FCD_FINTECH_ID as string,
        Identifiers: identifiers,
        ProductCode: process.env.USR_MGMT_IDCOM_FCD_PRODUCT_CODE as string,
        ClientSecret: secret,
        ClientID: key
      };

      LoggingUtils.debug(`Step 2 get auth req body ---> `, methodName);
      const response = await this.idcomInternalRepository
        .fetchAuthCodeWithRedirectUrl(
          requestBody.FintechID,
          requestBody.Identifiers,
          requestBody.ProductCode,
          requestBody.ClientSecret,
          requestBody.ClientID,
          transactionId
        )
        .catch(error => {
          throw new Error(error.message);
        });

      LoggingUtils.debug(`Step 3 get auth response  --> `, methodName);
      if (response.errorCode != null) {
        LoggingUtils.error({errorCode: response.errorCode, errorMessage: response.errorMessage}, methodName);
        return new RestError(400, response.errorMessage, {});
      } else {
        LoggingUtils.debug('Step 4 get auth non error response ', methodName);
        const url = new URL(response.redirectUrl);
        const idcomObject = {
          redirectUrl: url.pathname,
          authCode: Buffer.from(response.authCode, 'utf8').toString('base64'),
          appUserId: userId,
          deviceId: deviceId
        };
        LoggingUtils.debug('Step 5 creating record for idcom detail table', methodName);
        const idcomResult = await this.idcomDetailsRepository.create(idcomObject).catch(error => {
          throw new Error(error);
        });
        if (!idcomResult) {
          return {success: false, message: 'Error occurred unable to store idcom data'};
        }
        LoggingUtils.debug('Step 6 returning get auth success response', methodName);
        return {redirectURL: `${response.redirectUrl}`, authCode: response.authCode, success: true};
      }
    } catch (error) {
      LoggingUtils.error(error, methodName);
      throw error;
    }
  }

  /**
   *
   * @param idcomProps
   * @returns
   */
  async getIdTokenInternal(idcomProps: any, transactionId: string): Promise<any> {
    const methodName = 'getIdToken';
    try {
      LoggingUtils.debug('Step 1 Idcom getIdToken menthod', methodName);
      //Actual Payload
      const requestBody = {
        authCode: idcomProps.authCode
      };
      LoggingUtils.debug('Step 2 req body for get Id token ', methodName);
      LoggingUtils.debug('Step 3 invoking fetchIdToken repo method', methodName);
      const response = await this.idcomInternalRepository.fetchIdToken(requestBody.authCode, transactionId).catch(error => {
        throw new Error(error);
      });
      LoggingUtils.debug(`Step 4  Id token response --> `, methodName);
      if (response.authStatus !== 'Y') {
        LoggingUtils.error({authStatus: response.authStatus}, methodName);
        return new RestError(400, 'Authentication Failed', {systemcode: 1028});
      } else {
        LoggingUtils.debug('Step 5 Id token success response', methodName);
        return {...response, success: true};
      }
    } catch (error) {
      LoggingUtils.error(error, methodName);
      throw error;
    }
  }

  async decryptIdTokenInternal(idcomProps: any, transactionId: string): Promise<any> {
    const methodName = 'decryptIdToken';
    try {
      //Actual Payload
      LoggingUtils.debug('Step 1 decrypt Id token method', methodName);
      const requestBody = {
        idToken: idcomProps.idToken
      };

      LoggingUtils.debug(`Step 2 req body of decrypt Id token --> `, methodName);
      LoggingUtils.debug('Step 3 invoking decryptIdToken repo method', methodName);
      const response = await this.idcomInternalRepository.decryptIdToken(requestBody.idToken, transactionId).catch(error => {
        throw new Error(error);
      });

      // handling gateway error
      if (response && response.Status && response.Status !== 'SUCCESS') {
        LoggingUtils.error(response, methodName);
        LoggingUtils.debug('Step 4 error response in decryptIdToken', methodName);
        return new RestError(400, response.Status, {response});
      }
      const result = {
        customerID: response.custID,
        fintechID: response.aud,
        mobileNo: response.sub || response.mobileNo,
        panNo: response.pan
      };
      LoggingUtils.debug(`Step 5 flow end with success response  `, methodName);
      return {...result, success: true};
    } catch (error) {
      LoggingUtils.error(error, methodName);
      throw error;
    }
  }

  async getAuthCode(userId: number, deviceId: number, transactionId: string): Promise<any> {
    if (process.env.IDCOM_ENV && process.env.IDCOM_ENV == 'HDFC') {
      return this.getAuthCodeInternal(userId, deviceId, transactionId);
    } else {
      return this.getAuthCodeExternal(userId, deviceId, transactionId);
    }
  }

  async getIdToken(idcomProps: any, transactionId: string): Promise<any> {
    if (process.env.IDCOM_ENV && process.env.IDCOM_ENV == 'HDFC') {
      return this.getIdTokenInternal(idcomProps, transactionId);
    } else {
      return this.getIdTokenExternal(idcomProps, transactionId);
    }
  }

  async decryptIdToken(idcomProps: any, transactionId: string): Promise<any> {
    if (process.env.IDCOM_ENV && process.env.IDCOM_ENV == 'HDFC') {
      return this.decryptIdTokenInternal(idcomProps, transactionId);
    } else {
      return this.decryptIdTokenExternal(idcomProps, transactionId);
    }
  }
}
