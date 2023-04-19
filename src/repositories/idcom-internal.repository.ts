import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {LogApiCallUtils, Option} from 'common';
import {IdcomInternalDataSource} from '../datasources';
import {Idcom, IdcomRelations} from '../models';
export class IdcomInternalRepository
  extends DefaultCrudRepository<Idcom, typeof Idcom.prototype.id, IdcomRelations>
  implements IdcomInternalRepository
{
  constructor(@inject('datasources.idcom_internal') dataSource: IdcomInternalDataSource) {
    super(Idcom, dataSource);
  }

  async fetchAuthCodeWithRedirectUrl(
    FintechID: string,
    Identifiers: any,
    ProductCode: string,
    ClientSecret: string,
    ClientID: string,
    transactionId: string
  ): Promise<any> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter(
      (temp: any) => Object.keys(temp.functions)[0] == 'fetchAuthCodeWithRedirectUrl'
    )[0];
    try {
      response = await this.dataSource.DataAccessObject.fetchAuthCodeWithRedirectUrl(
        FintechID,
        Identifiers,
        ProductCode,
        ClientSecret,
        ClientID
      );
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        request: {
          FintechID,
          Identifiers,
          ProductCode,
          ClientSecret,
          ClientID
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
          FintechID,
          Identifiers,
          ProductCode,
          ClientSecret,
          ClientID
        },
        response: error.message,
        success: false,
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      throw error;
    }
  }

  async fetchIdToken(authCode: string, transactionId: string): Promise<any> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) => Object.keys(temp.functions)[0] == 'fetchIdToken')[0];
    try {
      response = await this.dataSource.DataAccessObject.fetchIdToken(authCode);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
        request: {
          authCode
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
          authCode
        },
        response: error.message,
        success: false,
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.IDCOM
      });
      throw error;
    }
  }

  async decryptIdToken(IDCOM_Token: string, transactionId: string): Promise<any> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) => Object.keys(temp.functions)[0] == 'decryptIdToken')[0];
    try {
      response = await this.dataSource.DataAccessObject.decryptIdToken(IDCOM_Token);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_IDCOM_DS_BASE_URL}${urls.template.url}`,
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
