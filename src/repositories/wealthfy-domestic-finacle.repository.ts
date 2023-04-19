import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import { LogApiCallUtils, Option, LoggingUtils } from 'common';
import {WealthfyDomesticFinacleDataSource} from '../datasources';
import {WealthfyDomesticFinacle, WealthfyDomesticFinacleRelations} from '../models';

export class WealthfyDomesticFinacleRepository
  extends DefaultCrudRepository<WealthfyDomesticFinacle, typeof WealthfyDomesticFinacle.prototype.id, WealthfyDomesticFinacleRelations>
  implements WealthfyDomesticFinacleRepository
{
  constructor(@inject('datasources.wealthfy_domestic_finacle') dataSource: WealthfyDomesticFinacleDataSource) {
    super(WealthfyDomesticFinacle, dataSource);
  }

  async fetchUserSegmentDetailsFinacle(customerId: string,transactionId: string): Promise<any> {
    let response: any;
    const urls = this.dataSource.settings.operations.filter((temp: any) =>
    Object.keys(temp.functions)[0] == 'fetchUserSegmentDetailsFinacle')[0]
    try {
      response = await this.dataSource.DataAccessObject.fetchUserSegmentDetailsFinacle(customerId);
      LoggingUtils.debug(`response from FINACLE ${response}`,'fetchUserSegmentDetailsFinacle')
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_DS_WDF_URL}${urls.template.url}`,
        request: {customerId : customerId},
        response: response ,
        success: true, //need to check response value,
        transactionId: transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FINACLE
      })
      return response;
    }
    catch (error){
      LogApiCallUtils.sendMessageOutgoingApiCall({
        url: `${process.env.USR_MGMT_DS_WDF_URL}${urls.template.url}`,
        request: {customerId : customerId},
        response: error.message,
        success: false,
        transactionId:transactionId,
        externalSystemName: Option.GLOBALOPTIONS.EXTERNALAPISYSTEMNAME.FINACLE,
      })
      throw error;
    }
  }

}
