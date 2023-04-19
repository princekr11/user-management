import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import { LogApiCallUtils, Option ,LoggingUtils} from 'common';
import {WealthfyDomesticFCPBDataSource} from '../datasources';
import {WealthfyDomesticFCPB, WealthfyDomesticFCPBRelations} from '../models';
export class WealthfyDomesticFCPRepository
  extends DefaultCrudRepository<WealthfyDomesticFCPB, typeof WealthfyDomesticFCPB.prototype.id, WealthfyDomesticFCPBRelations>
  implements WealthfyDomesticFCPRepository {
  constructor(@inject('datasources.wealthfy_domestic_FCPB') dataSource: WealthfyDomesticFCPBDataSource) {
    super(WealthfyDomesticFCPB, dataSource);
  }

  async fetchUserSegmentDetailsFCPB(customerId: string,transactionId:string): Promise<any> {
    let response: any;
    const urls =  this.dataSource.settings.operations.filter((temp: any) =>
    Object.keys(temp.functions)[0] == 'fetchUserSegmentDetailsFCPB')[0]
    try {
      response = await this.dataSource.DataAccessObject.fetchUserSegmentDetailsFCPB(customerId);
      LoggingUtils.debug(`response from FCPB ${response}`,'fetchUserSegmentDetailsFCPB')
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_DS_WDF_URL}${urls.template.url}`,
        request: {customerId : customerId},
        response: response ,
        success: true, //need to check response value
        transactionId:transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FCPB
      })
      return response;
    }
    catch(error){
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url:`${process.env.USR_MGMT_DS_WDF_URL}${urls.template.url}`,
        request: {customerId : customerId},
        response: error.message,
        success: false,
        transactionId:transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FCPB,
      })
      throw error;
    }
  }

}
