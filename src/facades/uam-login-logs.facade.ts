import {injectable, /* inject, */ BindingScope, service} from '@loopback/core';
import {AnyObject, Count, DataObject, DeepPartial, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {UamLoginLogs, UamLoginLogsRepository,UamLoginLogsRelations, RestError, ExcelUtils, LoggingUtils} from 'common';
import moment from 'moment-timezone';
// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class UamLoginLogsFacade {
  constructor(@repository(UamLoginLogsRepository) private uamLoginLogsRepository: UamLoginLogsRepository,
  ) {}

  async create(entity: DataObject<UamLoginLogs>, options?: Options): Promise<UamLoginLogs> {
    return this.uamLoginLogsRepository.create(entity, options);
  }

  async createAll(entities: DataObject<UamLoginLogs>[], options?: Options): Promise<UamLoginLogs[]> {
    return this.uamLoginLogsRepository.createAll(entities, options);
  }

  async save(entity: UamLoginLogs, options?: Options): Promise<UamLoginLogs> {
    return this.uamLoginLogsRepository.save(entity, options);
  }

  async find(filter?: any, options?: Options): Promise<(UamLoginLogs & UamLoginLogsRelations)[]> {
    if (
      filter &&
      filter.where &&
      filter.where.and &&
      filter.where.and.length === 2 &&
      filter.where.and[1].loginDate &&
      filter.where.and[1].loginDate.lte
    ) {
      let lteDate = new Date(filter.where.and[1].loginDate.lte);
      let gteDate = new Date(filter.where.and[0].loginDate.gte);
      gteDate.setHours(gteDate.getHours() - 5)
      gteDate.setMinutes(gteDate.getMinutes() - 30)
      lteDate.setDate(lteDate.getDate() + 1);
      lteDate.setHours(lteDate.getHours() - 5)
      lteDate.setMinutes(lteDate.getMinutes() - 30)
      filter.where.and[1].loginDate.lte = lteDate
      filter.where.and[0].loginDate.gte = gteDate
    }
    return this.uamLoginLogsRepository.find(filter, options);
  }

  async findOne(filter?: Filter<UamLoginLogs>, options?: Options): Promise<(UamLoginLogs & UamLoginLogsRelations) | null> {
    return this.uamLoginLogsRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<UamLoginLogs>, options?: Options): Promise<UamLoginLogs & UamLoginLogsRelations> {
    return this.uamLoginLogsRepository.findById(id,filter, options);
  }

  async update(entity: UamLoginLogs, options?: Options): Promise<void> {
    return this.uamLoginLogsRepository.update(entity, options);
  }

  async delete(entity: UamLoginLogs, options?: Options): Promise<void> {
    return this.uamLoginLogsRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<UamLoginLogs>, where?: Where<UamLoginLogs>, options?: Options): Promise<Count> {
    return this.uamLoginLogsRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<UamLoginLogs>, options?: Options): Promise<void> {
    return this.uamLoginLogsRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<UamLoginLogs>, options?: Options): Promise<void> {
    return this.uamLoginLogsRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<UamLoginLogs>, options?: Options): Promise<Count> {
    return this.uamLoginLogsRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.uamLoginLogsRepository.deleteById(id, options);
  }

  async count(where?: Where<UamLoginLogs>, options?: Options): Promise<Count> {
    return this.uamLoginLogsRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.uamLoginLogsRepository.exists(id, options);
  }

  async fetchLoginLogs(filter?: Filter<UamLoginLogs>, options?: Options): Promise<AnyObject[]> {
    const results =  await this.find(filter, options);
    return results
  }

  async createUamLoginLogs(input : DataObject<UamLoginLogs> | null, type: string, token : string|null){
    if(type == "login"){
      if(!input) return Promise.reject(new RestError(465,"There was an issue with the request"))
      await this.uamLoginLogsRepository.create(input)
    }
    if(type == "logout"){
      const currentDate = new Date()
      const uamUamLoginLogsRecord = await this.uamLoginLogsRepository.findOne({
        where : {
          token : token
        }
      })
      if(uamUamLoginLogsRecord && uamUamLoginLogsRecord.id)
      await this.uamLoginLogsRepository.updateById(uamUamLoginLogsRecord?.id,{logoutTime : currentDate.toLocaleTimeString() })
    }
  }

  async downloadLoginLogsReport(res: any, filter?: any, options?: Options): Promise<any> {
    let headers = [
      {header: 'User Id', key: 'userId', width: 32},
      {header: 'Employee Code', key: 'employeeCode', width: 32},
      {header: 'Employee Name', key: 'employeeName', width: 32},
      {header: 'Login Date', key: 'loginDate', width: 32},
      {header: 'Login Time', key: 'loginTime', width: 32},
      {header: 'Logout Time', key: 'logoutTime', width: 32},
      {header: 'Application Name', key: 'applicationName', width: 32},
      {header: 'IP Address', key: 'ipAddress', width: 32},
      {header: 'Asset Details', key: 'assetDetails', width: 32},
    ];
    try {
      const data = await this.find(filter, options);

      //   // Create a new Intl.DateTimeFormat object
      // const formatter = new Intl.DateTimeFormat("en-US", {
      //   day: "2-digit",
      //   month: "short",
      //   year: "numeric"
      // });
      data.forEach((record: any) =>{
        if(record && record.loginDate && record.loginDate != undefined){
          record.loginDate = moment(record.loginDate, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY')
        }

      } )
      let excelSheet = ExcelUtils.createExcel(null, 'Login Logs Report', headers, data, null);
      const result = await excelSheet.xlsx.writeBuffer();
      return result;
    } catch (error: any) {
      LoggingUtils.error('Some Error Occured');
      return new RestError(400, 'Error occured while exporting Login Logs Report');
    }
  }



}
