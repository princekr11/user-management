import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {RestError} from 'common';
import {LogApiCallUtils, Option} from 'common';
import {object} from 'underscore';
import {IdcomDataSource} from '../datasources';
import {Idcom, IdcomRelations} from '../models';
export class IdcomRepository extends DefaultCrudRepository<Idcom, typeof Idcom.prototype.id, IdcomRelations> implements IdcomRepository {
  constructor(@inject('datasources.idcom') dataSource: IdcomDataSource) {
    super(Idcom, dataSource);
  }

  async fetchAuthCodeWithRedirectUrl(
    RequestEncryptedValue: string,
    SymmetricKeyEncryptedValue: string,
    Scope: string,
    TransactionId: string,
    transactionId: string
  ): Promise<any> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter(
      (temp: any) => Object.keys(temp.functions)[0] == 'fetchAuthCodeWithRedirectUrl'
    )[0];
    try {
      response = await this.dataSource.DataAccessObject.fetchAuthCodeWithRedirectUrl(
        RequestEncryptedValue,
        SymmetricKeyEncryptedValue,
        Scope,
        TransactionId
      );
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        request: {
          RequestEncryptedValue: RequestEncryptedValue,
          SymmetricKeyEncryptedValue: SymmetricKeyEncryptedValue,
          Scope: Scope,
          TransactionId: TransactionId
        },
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        request: {
          RequestEncryptedValue: RequestEncryptedValue,
          SymmetricKeyEncryptedValue: SymmetricKeyEncryptedValue,
          Scope: Scope,
          TransactionId: TransactionId
        },
        response: error.message,
        success: false,
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      throw error;
    }
  }

  async fetchIdToken(
    RequestEncryptedValue: string,
    SymmetricKeyEncryptedValue: string,
    Scope: string,
    TransactionId: string,
    transactionId: string
  ): Promise<any> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) => Object.keys(temp.functions)[0] == 'fetchIdToken')[0];
    try {
      response = await this.dataSource.DataAccessObject.fetchIdToken(
        RequestEncryptedValue,
        SymmetricKeyEncryptedValue,
        Scope,
        TransactionId
      );
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        request: {
          RequestEncryptedValue: RequestEncryptedValue,
          SymmetricKeyEncryptedValue: SymmetricKeyEncryptedValue,
          Scope: Scope,
          TransactionId: TransactionId
        },
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        request: {
          RequestEncryptedValue: RequestEncryptedValue,
          SymmetricKeyEncryptedValue: SymmetricKeyEncryptedValue,
          Scope: Scope,
          TransactionId: TransactionId
        },
        response: error.message,
        success: false,
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      throw error;
    }
  }

  async decryptIdToken(
    RequestEncryptedValue: string,
    SymmetricKeyEncryptedValue: string,
    Scope: string,
    TransactionId: string,
    IDCOM_Token: string,
    transactionId: string
  ): Promise<any> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) => Object.keys(temp.functions)[0] == 'decryptIdToken')[0];
    try {
      //
      //  response = await this.dataSource.DataAccessObject.decryptIdToken(
      //   RequestEncryptedValue,
      //   SymmetricKeyEncryptedValue,
      //   Scope,
      //   TransactionId,
      //   IDCOM_Token
      // );

      response = await this.dataSource.DataAccessObject.decryptIdToken(IDCOM_Token);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        // request: { RequestEncryptedValue : RequestEncryptedValue,
        //   SymmetricKeyEncryptedValue : SymmetricKeyEncryptedValue,
        //   Scope : Scope,
        //   TransactionId : TransactionId,
        //   IDCOM_Token : IDCOM_Token},
        request: {
          IDCOM_Token: IDCOM_Token
        },
        response: response,
        success: true, //need to check response value
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      return response;
    } catch (error) {
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        request: {
          // RequestEncryptedValue: RequestEncryptedValue,
          // SymmetricKeyEncryptedValue: SymmetricKeyEncryptedValue,
          // Scope: Scope,
          // TransactionId: TransactionId,
          IDCOM_Token: IDCOM_Token
        },
        response: error.message,
        success: false,
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      throw error;
    }
  }
}
