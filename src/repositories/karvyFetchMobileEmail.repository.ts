import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { LogApiCallUtils, Option } from 'common';
import { KarvyDataSource } from '../datasources';
import { Karvy, KarvyRelations } from '../models';

export class KravyRepository
  extends DefaultCrudRepository<
  Karvy,
  typeof Karvy.prototype.id,
  KarvyRelations
  >
  implements KravyRepository {
  constructor(@inject('datasources.karvy') dataSource: KarvyDataSource) {
    super(Karvy, dataSource);
  }
  //fetch kra kyc
  async KarvyGetMobileAndEmailBasedOnFolio(Appid: string, Apppwd: string, AppIden: string,AgentCode: string,BranchCode: string,AMC_Code: string,Folio_No: string,transactionId: string): Promise<object> {
    // console.log(Appid, Apppwd, AppIden,AgentCode,BranchCode,AMC_Code,Folio_No);
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) =>
    Object.keys(temp.functions)[0] == 'KarvyGetMobileAndEmailBasedOnFolio')[0]
    try {
      response = await this.dataSource.DataAccessObject.KarvyGetMobileAndEmailBasedOnFolio(Appid, Apppwd, AppIden,AgentCode,BranchCode,AMC_Code,Folio_No);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: urls.template.url,
        request:{
          Appid : Appid,
          Apppwd : Apppwd,
          AppIden : AppIden,
          AgentCode : AgentCode,
          BranchCode : BranchCode,
          AMC_Code : AMC_Code,
          Folio_No : Folio_No
        },
        response: response ,
        success: true, //need to check response value
        transactionId:transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.KARVY
      })
      return response;
    }
    catch (error){
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: urls.template.url,
        request: {
          Appid : Appid,
          Apppwd : Apppwd,
          AppIden : AppIden,
          AgentCode : AgentCode,
          BranchCode : BranchCode,
          AMC_Code : AMC_Code,
          Folio_No : Folio_No
        },
        response: error.message,
        success: false,
        transactionId:transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.KARVY,
      })
      throw error;
    }
  }

  async CamsGetMobileAndEmailBasedOnFolio(AMCCode: string, ApplicationID: string, Password: string,FolioNo: string,PAN: string,transactionId:string): Promise<object> {
    // console.log(AMCCode, ApplicationID, Password,FolioNo,PAN);
    let response: any;
    AMCCode  = process.env.NODE_ENV != 'production' ? `T${AMCCode}` : AMCCode
    const urls = this.dataSource.settings.operations.filter((temp: any) =>
    Object.keys(temp.functions)[0] == 'CamsGetMobileAndEmailBasedOnFolio')[0]
    try {
      response = await this.dataSource.DataAccessObject.CamsGetMobileAndEmailBasedOnFolio(AMCCode, ApplicationID, Password,FolioNo,PAN);
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: urls.template.url,
        request: {
          AMCCode : AMCCode,
          ApplicationID : ApplicationID,
          Password : Password,
          FolioNo : FolioNo,
          PAN : PAN
        },
        response: response ,
        success: true, //need to check response value
        transactionId:transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.KARVY
      })
      return response;
    }
    catch (error){
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: urls.template.url,
        request: {
          AMCCode : AMCCode,
          ApplicationID : ApplicationID,
          Password : Password,
          FolioNo : FolioNo,
          PAN : PAN
        },
        response: error.message,
        success: false,
        transactionId:transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.KARVY,
      })
      throw error;
    }
  }

}
