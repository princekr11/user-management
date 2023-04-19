import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import { any, resolve } from 'bluebird';
import {LoggingUtils, Option, RestError, TransactionFeedLogRepository} from 'common';
import {ConsolidatedDocument, ConsolidatedDocumentRelations, ConsolidatedDocumentRepository} from 'common';
import AppConstant from 'common/dist/constants/app-constant';
import moment from 'moment';
import _ = require('underscore');

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class ConsolidatedDocumentFacade {
  constructor(@repository(ConsolidatedDocumentRepository) private ConsolidatedDocumentRepository: ConsolidatedDocumentRepository,
  @repository(TransactionFeedLogRepository) private transactionFeedLogRepository: TransactionFeedLogRepository) {}

  async create(entity: DataObject<ConsolidatedDocument>, options?: Options): Promise<ConsolidatedDocument> {
    return this.ConsolidatedDocumentRepository.create(entity, options);
  }

  async createAll(entities: DataObject<ConsolidatedDocument>[], options?: Options): Promise<ConsolidatedDocument[]> {
    return this.ConsolidatedDocumentRepository.createAll(entities, options);
  }

  async save(entity: ConsolidatedDocument, options?: Options): Promise<ConsolidatedDocument> {
    return this.ConsolidatedDocumentRepository.save(entity, options);
  }

  async find(filter?: Filter<ConsolidatedDocument>, options?: Options): Promise<(ConsolidatedDocument & ConsolidatedDocumentRelations)[]> {
    return this.ConsolidatedDocumentRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<ConsolidatedDocument>,
    options?: Options
  ): Promise<(ConsolidatedDocument & ConsolidatedDocumentRelations) | null> {
    return this.ConsolidatedDocumentRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<ConsolidatedDocument>,
    options?: Options
  ): Promise<ConsolidatedDocument & ConsolidatedDocumentRelations> {
    return this.ConsolidatedDocumentRepository.findById(id,filter, options);
  }

  async update(entity: ConsolidatedDocument, options?: Options): Promise<void> {
    return this.ConsolidatedDocumentRepository.update(entity, options);
  }

  async delete(entity: ConsolidatedDocument, options?: Options): Promise<void> {
    return this.ConsolidatedDocumentRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<ConsolidatedDocument>, where?: Where<ConsolidatedDocument>, options?: Options): Promise<Count> {
    return this.ConsolidatedDocumentRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<ConsolidatedDocument>, options?: Options): Promise<void> {
    return this.ConsolidatedDocumentRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<ConsolidatedDocument>, options?: Options): Promise<void> {
    return this.ConsolidatedDocumentRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<ConsolidatedDocument>, options?: Options): Promise<Count> {
    return this.ConsolidatedDocumentRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.ConsolidatedDocumentRepository.deleteById(id, options);
  }

  async count(where?: Where<ConsolidatedDocument>, options?: Options): Promise<Count> {
    return this.ConsolidatedDocumentRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.ConsolidatedDocumentRepository.exists(id, options);
  }

  async ConsolidatedDocumentMapping(
    ConsolidatedDocument: Array<{ConsolidatedDocumentId: number; ConsolidatedDocumentweight: number}>,
    options?: Options
  ): Promise<object> {
    try {
      //get the ConsolidatedDocument by ids
      const ConsolidatedDocumentIds = ConsolidatedDocument.map(element => element.ConsolidatedDocumentId);
      const asset: Array<any> = [];
      const product: Array<any> = [];
      const ConsolidatedDocumentCategory: Array<any> = [];
      const ConsolidatedDocumentCategoryGroup: Array<any> = [];
      let ConsolidatedDocumentData = await this.ConsolidatedDocumentRepository.find(
        {
          where: {
            id: {inq: ConsolidatedDocumentIds}
          },
          include: [
            {relation: 'asset'},
            {relation: 'product'},
            {relation: 'ConsolidatedDocumentCategory'},
            {relation: 'ConsolidatedDocumentCategoryGroup'}
          ]
        },
        options
      );
      //loop over the ConsolidatedDocument and add the weight from the request to the object
      for (let i = 0; i < ConsolidatedDocumentData.length; i++) {
        for (let j = 0; j < ConsolidatedDocument.length; j++) {
          if (ConsolidatedDocumentData[i].id == ConsolidatedDocument[j].ConsolidatedDocumentId) {
            //check if assets exist
            if (ConsolidatedDocumentData[i].asset) {
              asset.push({
                ...ConsolidatedDocumentData[i].asset,
                ConsolidatedDocumentweight: ConsolidatedDocument[j].ConsolidatedDocumentweight
              });
            }
            //check if product exist
            if (ConsolidatedDocumentData[i].product) {
              product.push({
                ...ConsolidatedDocumentData[i].product,
                ConsolidatedDocumentweight: ConsolidatedDocument[j].ConsolidatedDocumentweight
              });
            }
            //check if ConsolidatedDocumentCategory exist
            if (ConsolidatedDocumentData[i].ConsolidatedDocumentCategory) {
              ConsolidatedDocumentCategory.push({
                ...ConsolidatedDocumentData[i].ConsolidatedDocumentCategory,
                ConsolidatedDocumentweight: ConsolidatedDocument[j].ConsolidatedDocumentweight
              });
            }
            //check if ConsolidatedDocumentCategory exist
            if (ConsolidatedDocumentData[i].ConsolidatedDocumentCategoryGroup) {
              ConsolidatedDocumentCategoryGroup.push({
                ...ConsolidatedDocumentData[i].ConsolidatedDocumentCategoryGroup,
                ConsolidatedDocumentweight: ConsolidatedDocument[j].ConsolidatedDocumentweight
              });
            }
          }
        }
      }

      let asssetGrouping: any = _.groupBy(asset, ele => `asset-${ele.id}`);
      let productGrouping: any = _.groupBy(product, ele => `product-${ele.id}`);
      let ConsolidatedDocumentCategoryGrouping: any = _.groupBy(
        ConsolidatedDocumentCategory,
        ele => `ConsolidatedDocumentCategory-${ele.id}`
      );
      let ConsolidatedDocumentCategoryGroupGrouping: any = _.groupBy(
        ConsolidatedDocumentCategoryGroup,
        ele => `ConsolidatedDocumentCategoryGroupGrouping-${ele.id}`
      );

      let assestFinal: Array<any> = [];
      let productFinal: Array<any> = [];
      let ConsolidatedDocumentCategoryFinal: Array<any> = [];
      let ConsolidatedDocumentCategoryGroupFinal: Array<any> = [];

      //lopp over the grouping to add the weight for asset
      const assetsKeys = Object.keys(asssetGrouping);
      for (let key of assetsKeys) {
        let weight = 0;
        _.each(asssetGrouping[key], data => (weight = weight + data.ConsolidatedDocumentweight));
        assestFinal.push({
          assetId: asssetGrouping[key][0].id,
          assetName: asssetGrouping[key][0].name,
          weightage: weight
        });
      }
      //lopp over the grouping to add the weight for product
      const productKeys = Object.keys(productGrouping);
      for (let key of productKeys) {
        let weight = 0;
        _.each(productGrouping[key], data => (weight = weight + data.ConsolidatedDocumentweight));
        productFinal.push({
          productId: productGrouping[key][0].id,
          productName: productGrouping[key][0].name,
          weightage: weight
        });
      }
      //  //lopp over the grouping to add the weight for ConsolidatedDocumentCategoryFinal
      const ConsolidatedDocumentCategoryKeys = Object.keys(ConsolidatedDocumentCategoryGrouping);
      for (let key of ConsolidatedDocumentCategoryKeys) {
        let weight = 0;
        _.each(ConsolidatedDocumentCategoryGrouping[key], data => (weight = weight + data.ConsolidatedDocumentweight));
        ConsolidatedDocumentCategoryFinal.push({
          ConsolidatedDocumentCategoryId: ConsolidatedDocumentCategoryGrouping[key][0].id,
          ConsolidatedDocumentCategoryName: ConsolidatedDocumentCategoryGrouping[key][0].name,
          weightage: weight
        });
      }
      // //lopp over the grouping to add the weight for ConsolidatedDocumentCategoryGroupGrouping
      const ConsolidatedDocumentCategoryGroupKeys = Object.keys(ConsolidatedDocumentCategoryGroupGrouping);
      for (let key of ConsolidatedDocumentCategoryGroupKeys) {
        let weight = 0;
        _.each(ConsolidatedDocumentCategoryGrouping[key], data => (weight = weight + data.ConsolidatedDocumentweight));
        ConsolidatedDocumentCategoryGroupFinal.push({
          ConsolidatedDocumentCategoryGroupId: ConsolidatedDocumentCategoryGroupGrouping[key][0].id,
          ConsolidatedDocumentCategoryGroupName: ConsolidatedDocumentCategoryGroupGrouping[key][0].name,
          weightage: weight
        });
      }
      return {
        asset: assestFinal,
        product: productFinal,
        category: ConsolidatedDocumentCategoryFinal,
        categoryGrouping: ConsolidatedDocumentCategoryGroupFinal
      };
    } catch (error) {
      return Promise.reject(new RestError(400, 'Request Failes', {systemcode: 1098}));
    }
  }

  async createConsolidatedDocumentEntry(appUserId: number, accountId: number, options?: Options): Promise<any> {
    const methodName = 'createConsolidatedDocumentEntry';
    try {
      const constExistingConsolidatedDoc = await this.ConsolidatedDocumentRepository.find(
        {
          where: {appUserId: appUserId, isActive: true}
        },
        options
      );

      if (constExistingConsolidatedDoc && constExistingConsolidatedDoc.length === 0) {
        const constConsolidatedDocCams = {
          accountId: accountId,
          status: Option.GLOBALOPTIONS.CONSOLIDATEDDOCUMENTSTATUS.pending.value,
          rtaId: AppConstant.RTA_CAMS,
          appUserId: appUserId,
        };
        const constConsolidatedDocKarvy = {
          accountId: accountId,
          status: Option.GLOBALOPTIONS.CONSOLIDATEDDOCUMENTSTATUS.pending.value,
          rtaId: AppConstant.RTA_KARVY,
          appUserId: appUserId,
        };

        const createConsolidatedDoc = await this.ConsolidatedDocumentRepository.createAll([
          constConsolidatedDocCams,
          constConsolidatedDocKarvy
        ],options);

        if (!createConsolidatedDoc) {
          throw new Error('Error while creating Consolidated Document records');
        }
      } else if (constExistingConsolidatedDoc.length === 1) {
        let consolidatedDoc = {};
        if (constExistingConsolidatedDoc[0].rtaId == AppConstant.RTA_KARVY) {
          consolidatedDoc = {
            accountId: accountId,
            status: Option.GLOBALOPTIONS.CONSOLIDATEDDOCUMENTSTATUS.pending.value,
            rtaId: AppConstant.RTA_KARVY,
            appUserId: appUserId,
            generatedDate: new Date()
          };
        } else {
          consolidatedDoc = {
            accountId: accountId,
            status: Option.GLOBALOPTIONS.CONSOLIDATEDDOCUMENTSTATUS.pending.value,
            rtaId: AppConstant.RTA_CAMS,
            appUserId: appUserId,
            generatedDate: new Date()
          };
        }

        const createConsolidatedDoc = await this.ConsolidatedDocumentRepository.createAll([consolidatedDoc],options);

        if (!createConsolidatedDoc) {
          throw new Error('Error while creating Consolidated Document records');
        }
      }
    } catch (error) {
      LoggingUtils.error(error, methodName);
      throw error;
    }
  }

  async consolidateStatusUpdate(rtaId : number, accountId: Array<number>,status : number,options? : Options){
    return this.ConsolidatedDocumentRepository.updateAll({
      status : status
    },
    {
      rtaId : rtaId,
      accountId : {inq : accountId}
    },
    options)
  }

  async fetchRtaPendingConsolidatedDocuments(rtaNumber: number, filterObject: any, options: Options) {
    const methodName = 'fetchRtaPendingConsolidatedDocuments';
    try {
      let customerAccountIds: Array<number> = [];
      let finalCustomerAccountIds: Array<number> = [];
      let data: any = [];
      let consolidatedDocuments: Array<ConsolidatedDocument> = await this.ConsolidatedDocumentRepository.find({
          order: filterObject.order,        
          where: {
            isActive: true,
            rtaId: rtaNumber,
            status: Option.GLOBALOPTIONS.CONSOLIDATEDDOCUMENTSTATUS.pending.value
          },
          include: [
            {
              relation: "appUser"
            },
            {
              relation: "appFile"
            },
            {
              relation: "account",
              scope: {
                include: [
                  {
                    relation: "accountAppFileMapping",
                    scope: {
                      where: {
                        isActive: true
                      },
                      include: [
                        {
                          relation: "userManagementAppFile"
                        }
                      ]
                    }
                  },
                  {
                    relation: "primaryHolder",
                    scope: {
                      include: [
                        {
                          relation: "investorDetails",
                          scope: {
                            include: [
                              {
                                relation: "panImageFile"
                              },
                              {
                                relation: "kycImageFile"
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              relation: "rta"
            },
            {
              relation: "bankAccount",
              scope: {
                include: [
                  {
                    relation: "chequeImageFile"
                  }
                ]
              }
            }
          ]
        }, options)

          if (!consolidatedDocuments || consolidatedDocuments.length === 0) {
            return data;
          }
          customerAccountIds = _.uniq(_.pluck(consolidatedDocuments, 'accountId'));
          let transactionFeedLogs: any = await this.transactionFeedLogRepository.find({
            where: {
              rtaId: rtaNumber,
              and: [
                {
                  generatedDate: {
                    gte: moment().startOf('day')
                  }
                },
                {
                  generatedDate: {
                    lte: moment().endOf('day')
                  }
                }
              ]
            },
            include: [
              {
                relation: 'orderItems',
                scope: {
                  include: [
                    {
                      relation: 'order',
                      scope: {
                        where: {
                          accountId: {
                            inq: customerAccountIds
                          }
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }, options)

            if (!transactionFeedLogs) {
              return data;
            } else {
              transactionFeedLogs.forEach((item: any) => {
                if(item && item.orderItems){
                  item.orderItems.forEach((orderItems: any) =>{
                    if(orderItems && orderItems.order && orderItems.order.accountId){
                      finalCustomerAccountIds.push(orderItems.order.accountId);
                    }
                  })
                }
              })
              finalCustomerAccountIds = _.uniq(finalCustomerAccountIds)
              consolidatedDocuments.filter((value: any) => {
                finalCustomerAccountIds.forEach((item: number) => {
                  if(value.accountId === item){
                    data.push(value);
                  }
                })
              })
              data = _.uniq(data)
              return data;
            }
    }
    catch (error) {
      LoggingUtils.error(error, methodName);
      return Promise.reject(new RestError(400, 'Error occured while fetching Consolidated Documents!', {systemcode: 1372}));
    }
  }


  async rtaGeneratedConsolidatedDocuments(filterObject: any, options: Options): Promise<any> {
    const methodName = 'rtaGeneratedConsolidatedDocuments';
    let rtaGeneratedConsolidatedDocuments: any = [];
    let response: Object = {};
    try {
      if (filterObject.status === Option.GLOBALOPTIONS.CONSOLIDATEDDOCUMENTSTATUS.pending.value) {
        rtaGeneratedConsolidatedDocuments = await this.fetchRtaPendingConsolidatedDocuments(filterObject.rtaId, filterObject, options);
      } else {
        let filter: any = {
          where: {
            isActive: true,
            rtaId: filterObject.rtaId,
            status: filterObject.status
          },
          include: [
            {
              relation: 'appUser'
            },
            {
              relation: 'appFile'
            },
            {
              relation: 'account',
              scope: {
                include: [
                  {
                    relation: 'accountAppFileMapping',
                    scope: {
                      where: {
                        isActive: true
                      },
                      include: [
                        {
                          relation: 'userManagementAppFile'
                        }
                      ]
                    }
                  },
                  {
                    relation: 'primaryHolder',
                    scope: {
                      include: [
                        {
                          relation: 'investorDetails',
                          scope: {
                            include: [
                              {
                                relation: 'panImageFile'
                              },
                              {
                                relation: 'kycImageFile'
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              relation: 'rta'
            },
            {
              relation: 'bankAccount',
              scope: {
                include: [
                  {
                    relation: 'chequeImageFile'
                  }
                ]
              }
            }
          ]
        };

        if (filterObject.order) {
          filter.order = [filterObject.order];
        }
        rtaGeneratedConsolidatedDocuments = await this.ConsolidatedDocumentRepository.find({...filter}, options);
      }

      if(rtaGeneratedConsolidatedDocuments && rtaGeneratedConsolidatedDocuments.length !== 0){
        rtaGeneratedConsolidatedDocuments.forEach((consolidatedDocument: any) => {
          if (consolidatedDocument.appUser && consolidatedDocument.appUser.name) {
            consolidatedDocument.appUserName = consolidatedDocument.appUser.name;
          } else {
            consolidatedDocument.appUserName = null;
          }
          if (
            consolidatedDocument.account &&
            consolidatedDocument.account.primaryHolder &&
            consolidatedDocument.account.primaryHolder.investorDetails &&
            consolidatedDocument.account.primaryHolder.investorDetails.panCardNumber
          ) {
            consolidatedDocument.panCardNumber = consolidatedDocument.account.primaryHolder.investorDetails.panCardNumber;
          } else {
            consolidatedDocument.panCardNumber = null;
          }
          if (consolidatedDocument.account && consolidatedDocument.account.uniqueId) {
            consolidatedDocument.accountId = consolidatedDocument.account.uniqueId;
          } else {
            consolidatedDocument.accountId = null;
          }
  
          if (
            consolidatedDocument.account &&
            consolidatedDocument.account.accountAppFileMapping &&
            consolidatedDocument.account.accountAppFileMapping[0] &&
            consolidatedDocument.account.accountAppFileMapping[0].userManagementAppFile &&
            consolidatedDocument.account.accountAppFileMapping[0].userManagementAppFile.name
          ) {
            consolidatedDocument.aof = consolidatedDocument.account.accountAppFileMapping[0].userManagementAppFile.name;
          } else {
            consolidatedDocument.aof = null;
          }
        });
      }else{
        return resolve(response = {
          data: rtaGeneratedConsolidatedDocuments,
          count: rtaGeneratedConsolidatedDocuments.length
        });
      }
      
      let searchCriteria = new Map();
      let valueToSearch: string;
      filterObject.where.find((data: Object) => {
        searchCriteria.set(Object.keys(data)[0], Object.values(data)[0]);
      });

      let updatedArray = rtaGeneratedConsolidatedDocuments.filter((data: any) => {
        if (searchCriteria.has('appUserName')) {
          if (data.appUserName) {
            valueToSearch = searchCriteria.get('appUserName').toLowerCase();
            if (!data.appUserName.toLowerCase().includes(valueToSearch)) {
              return false;
            }
          } else return false;
        }
        if (searchCriteria.has('panCardNumber')) {
          if (data.panCardNumber) {
            valueToSearch = searchCriteria.get('panCardNumber').toLowerCase();
            if (!data.panCardNumber.toLowerCase().includes(valueToSearch)) {
              return false;
            }
          } else return false;
        }
        if (searchCriteria.has('accountId')) {
          if (data.accountId) {
            valueToSearch = searchCriteria.get('accountId').toLowerCase();
            if (!data.accountId.toLowerCase().includes(valueToSearch)) {
              return false;
            }
          } else return false;
        }
        if (searchCriteria.has('aof')) {
          if (data.aof) {
            valueToSearch = searchCriteria.get('aof').toLowerCase();
            if (!data.aof.toLowerCase().includes(valueToSearch)) {
              return false;
            }
          } else return false;
        }
        if (searchCriteria.has('generatedDate')){
          if (data.generatedDate){
            if (!(moment(data.generatedDate).format('YYYY-MM-DD') ===
              moment(searchCriteria.get('generatedDate')).format('YYYY-MM-DD'))){
              return false;
            }
          } else return false;
        }
        return true;
      });

      const data = updatedArray.slice(filterObject.offset, filterObject.limit + filterObject.offset);
      response = {
        data: data,
        count: updatedArray.length
      };

      return resolve(response);
    } catch (error) {
      LoggingUtils.error(error, methodName);
      return Promise.reject(new RestError(400, 'Error occured while fetching Consolidated Documents!', {systemcode: 1372}));
    }
  }

}
