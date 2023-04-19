import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {OrderUtils, RandomizationUtils} from 'common';
import {CoreBankingDataSource} from '../datasources';
import {CoreBanking, CoreBankingRelations} from '../models';
import fs from 'fs';
import {LogApiCallUtils} from 'common';
import {Option} from 'common';
import * as crypto from 'crypto'


export type OtpMessages = {
  message: string;
  tempId: string;
  emailSubject?: string;
}


export class CoreBankingRepository
  extends DefaultCrudRepository<CoreBanking, typeof CoreBanking.prototype.id, CoreBankingRelations>
  implements CoreBankingRepository {
  constructor(@inject('datasources.core_banking') dataSource: CoreBankingDataSource) {
    super(CoreBanking, dataSource);
  }

  // async doDemographicDetailsInquiry(customerId: string): Promise<object> {
  //   const urls = this.dataSource.settings.operations.filter(
  //     (temp: any) => Object.keys(temp.functions)[0] == 'doDemographicDetailsInquiry'
  //   )[0];
  //   const externalReferenceNo = OrderUtils.getRandomNumber(14);
  //   try {
  //     const response = await this.dataSource.DataAccessObject.doDemographicDetailsInquiry(customerId, externalReferenceNo);
  //     LogApiCallUtils.sendMessageOutgoingApiCall({
  //       url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
  //       request: {
  //         customerID: customerId,
  //         externalReferenceNumber: externalReferenceNo
  //       },
  //       response: response,
  //       success: true, //need to check response value
  //       extraInfo: {
  //         channel: process.env.COMMON_API_CHANNEL,
  //         user_id: process.env.COMMON_API_CHANNEL_USER_ID
  //       },
  //       externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FATCA
  //     });
  //     return response;
  //   } catch (err: any) {
  //     LogApiCallUtils.sendMessageOutgoingApiCall({
  //       url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
  //       request: {
  //         customerID: customerId,
  //         externalReferenceNumber: externalReferenceNo
  //       },
  //       response: err.message,
  //       success: false,
  //       extraInfo: {
  //         channel: process.env.COMMON_API_CHANNEL,
  //         user_id: process.env.COMMON_API_CHANNEL_USER_ID
  //       },
  //       externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FATCA
  //     });
  //     throw err;
  //   }
  // }

  async fetchCustomerAccountAmlFatcaDetails(
    mobileNumber: string,
    pan: string,
    dob: string,
    customerID: string,
    transactionId: string
  ): Promise<object> {
    // let returnString: any = fs.readFileSync(
    //   '/Users/divyanshu/Desktop/Delta/Backend/services/user-management/src/repositories/sample-response.json'
    // );
    // return JSON.parse(returnString as string);
    let response: any;
    const urls = this.dataSource.settings.operations.filter(
      (temp: any) => Object.keys(temp.functions)[0] == 'fetchCustomerAccountAmlFatcaDetails'
    )[0];
    let externalReferenceNumber = OrderUtils.getRandomNumber(14);
    try {
      response = await this.dataSource.DataAccessObject.fetchCustomerAccountAmlFatcaDetails(
        mobileNumber,
        pan,
        customerID,
        dob,
        externalReferenceNumber
      );
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {
          mobileNumber: mobileNumber,
          pan: pan,
          customerID: customerID,
          dob: dob,
          externalReferenceNumber: externalReferenceNumber
        },
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FATCA
      });
      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {
          mobileNumber: mobileNumber,
          pan: pan,
          customerID: customerID,
          dob: dob,
          externalReferenceNumber: externalReferenceNumber
        },
        response: error.message,
        success: false,
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FATCA
      });
      throw error;
    }
  }

  async fetchCASADetailBalanceInquiry(accountNo: string, transactionId: string): Promise<object> {
    let response: any;
    const randomNumber = OrderUtils.getRandomNumber(14);
    const urls = this.dataSource.settings.operations.filter(
      (temp: any) => Object.keys(temp.functions)[0] == 'fetchCASADetailBalanceInquiry'
    )[0];
    try {
      response = await this.dataSource.DataAccessObject.fetchCASADetailBalanceInquiry(accountNo, randomNumber);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {
          accountNo: accountNo,
          randomNumber: randomNumber
        },
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.CASA
      });
      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {
          accountNo: accountNo,
          randomNumber: randomNumber
        },
        response: error.message,
        success: false,
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.CASA
      });
      throw error;
    }
  }

  sha1HashGenerator(key: string) {
    const sha1MessageHash = crypto.createHash('sha1')
    sha1MessageHash.update(key)
    return sha1MessageHash.digest('base64')
  }

  async doGenerateOTP(transactionId: string, linkData: string, refNo : string| null = null): Promise<object> {
    let response: any;
    const randomNumber = OrderUtils.getRandomNumber(14);
    const urls = this.dataSource.settings.operations.filter((temp: any) => Object.keys(temp.functions)[0] == 'doGenerateOTPRest')[0];
    const instanceId = process.env.GENERATE_OTP_INSTANCE_ID
    const apiUser = process.env.GENERATE_OTP_API_USER
    const forceNew = process.env.GENERATE_OTP_FORCE_NEW
    refNo = refNo == null ? Date.now() + RandomizationUtils.generateUniqueId(16) : refNo;
    const callerId = process.env.GENERATE_OTP_CALLER_ID
    const hashKey = process.env.GENERATE_OTP_HASH_KEY
    if (!instanceId || !callerId || !linkData || !refNo || !forceNew || !hashKey) {
      throw 'One of the config parameters is not correctly set for generate otp'
    }
    const messageHash = this.sha1HashGenerator(`${instanceId}|${callerId}|${linkData}|${refNo}|${forceNew}|${hashKey}`)


    try {
      response = await this.dataSource.DataAccessObject.doGenerateOTPRest(randomNumber, refNo, messageHash, linkData);

      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {randomNumber: randomNumber, refNo: refNo, messageHash: messageHash, linkData: linkData},
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.COREBANKING
      });

      const responseString = response.responseString
      if (responseString.statusCode && responseString.refNo && responseString.passwordValue && responseString.datatimeGen && responseString.datetimeExpire && responseString.errorDetail && hashKey) {
        const messageHash = "static:genpwdres:07:" + this.sha1HashGenerator(`${responseString.statusCode}|${responseString.refNo}|${responseString.passwordValue}|${responseString.datatimeGen}|${responseString.datetimeExpire}|${responseString.errorDetail}|${hashKey}`)
        if (messageHash != responseString.messageHash) {
          throw 'The response message hash from generateOTP did not match.'
        }
      }

      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {randomNumber: randomNumber, refNo: refNo, messageHash: messageHash, linkData: linkData},
        response: error.message,
        success: false,
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.COREBANKING
      });
      throw error;
    }
  }

  async doVerifyOTP(otp: string, refNo: string, transactionId: string, linkData: string): Promise<object> {
    let response: any;
    const randomNumber = OrderUtils.getRandomNumber(14);
    const urls = this.dataSource.settings.operations.filter((temp: any) => Object.keys(temp.functions)[0] == 'doVerifyOTPRest')[0];
    const instanceId = process.env.GENERATE_OTP_INSTANCE_ID
    const callerId = process.env.GENERATE_OTP_CALLER_ID
    const hashKey = process.env.GENERATE_OTP_HASH_KEY

    if (!instanceId || !callerId || !linkData || !refNo || !otp || !hashKey) {
      throw 'One of the config parameters is not correctly set for verify otp'
    }
    const messageHash = this.sha1HashGenerator(`${instanceId}|${callerId}|${linkData}|${refNo}|${otp}|${hashKey}`)
    try {
      response = await this.dataSource.DataAccessObject.doVerifyOTPRest(otp, randomNumber, refNo, messageHash, linkData);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {randomNumber: randomNumber, otp: otp, refNo: refNo, messageHash: messageHash, linkData: linkData},
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.COREBANKING
      });

      const responseString = response.responseString
      if (responseString.statusCode && responseString.refNo && responseString.passwordValue && responseString.datatimeGen && responseString.datetimeExpire && responseString.errorDetail && hashKey) {
        const messageHash = "static:verpwdres:04:Base64" + this.sha1HashGenerator(`${responseString.statusCode}|${responseString.refNo}|${responseString.errorDetail}|${hashKey}`)
        if (messageHash != responseString.messageHash) {
          throw 'The response message hash from verifyOTP did not match.'
        }
      }
      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {randomNumber: randomNumber, otp: otp, refNo: refNo, messageHash: messageHash, linkData: linkData},
        response: error.message,
        success: false,
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.COREBANKING
      });
      throw error;
    }
  }

  async doPublishOTP(contactNumber: string, otp: OtpMessages, transactionId: string, msgType?: string): Promise<object> {
    let response: any, contact: string = contactNumber;
    let emailSubject: string = ''
    if (msgType != 'E') {
      msgType = 'S';
      contact = contactNumber.length > 10 ? `${contactNumber}` : `91${contactNumber}`;
      emailSubject = ''
    }
    else {
      emailSubject = (otp.emailSubject ?? '')
    }
    const refNumber = OrderUtils.getRandomNumber(14);
    const urls = this.dataSource.settings.operations.filter((temp: any) => Object.keys(temp.functions)[0] == 'doPublishExternalAlertV2')[0];
    try {
      const msgId = Date.now() + RandomizationUtils.generateUniqueId(5);
      response = await this.dataSource.DataAccessObject.doPublishExternalAlertV2(contact, refNumber, otp.message, msgType, msgId, otp.tempId, emailSubject);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {pno: contactNumber, otp: otp.message, externalReferenceNo: refNumber, msgType: msgType, msgId: msgId, tempId: otp.tempId, subject: emailSubject},
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.OTP_NOTIFICATION
      });
      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_CRBNK_DS_BASE_URL}${urls.template.url}`,
        request: {pno: contactNumber, otp: otp.message, externalReferenceNo: refNumber, msgType: msgType, tempId: otp.tempId, subject: emailSubject},
        response: error.message,
        success: false,
        transactionId: transactionId,
        extraInfo: {
          channel: process.env.COMMON_API_CHANNEL,
          user_id: process.env.COMMON_API_CHANNEL_USER_ID
        },
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.NOTIFICATION
      });
      throw error;
    }
  }
}
