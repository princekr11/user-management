import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { LogApiCallUtils, Option } from 'common';
import { EkycDataSource } from '../datasources';
import { Ekyc, EkycRelations } from '../models';

export class EkycRepository
  extends DefaultCrudRepository<
  Ekyc,
  typeof Ekyc.prototype.id,
  EkycRelations
  >
  implements EkycRepository {
  constructor(@inject('datasources.ekyc') dataSource: EkycDataSource) {
    super(Ekyc, dataSource);
  }
  //fetch kra kyc
  async fetchKRAKYC(request: string, checksum: number, token: string,transactionId: string): Promise<object> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) =>
    Object.keys(temp.functions)[0] == 'verifyKycFunction')[0]
    try {
      response = await this.dataSource.DataAccessObject.verifyKycFunction(request, checksum, token);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_DS_KRA_KCY_BASE_URL}${urls.template.url}`,
        request: {request : request, checksum : checksum, token : token},
        response: response ,
        success: true, //need to check response value
        transactionId : transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.EKYC,
      })
      return response;
    }
    catch (error){
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_DS_KRA_KCY_BASE_URL}${urls.template.url}`,
        request: {request : request, checksum : checksum, token : token},
        response: error.message,
        success: false,
        transactionId : transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.EKYC,
      })
      throw error;
    }
  }
  //update kra ekyc
  async updateKRAKYC(request: string, checksum: number, token: string,transactionId: string): Promise<object> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) =>
    Object.keys(temp.functions)[0] == 'getPanEkycFunction')[0]
    try {
      response = await this.dataSource.DataAccessObject.getPanEkycFunction(request, checksum, token);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_DS_KRA_KCY_BASE_URL}${urls.template.url}`,
        request: {request : request, checksum : checksum, token : token},
        response: response ,
        success: false, //need to check response value
        transactionId : transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.EKYC,
      })
      return response;
    }
    catch (error){
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_DS_KRA_KCY_BASE_URL}${urls.template.url}`,
        request: {request : request, checksum : checksum, token : token},
        response: error.message,
        success: false,
        transactionId : transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.EKYC,
      })
      throw error;
    }
  }

}
