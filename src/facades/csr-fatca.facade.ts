import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {resolve} from 'bluebird';
import {
  CsrFatca,
  CsrFatcaRepository,
  CsrFatcaWithRelations,
  FileStorageContainerConfig,
  LoggingUtils,
  Option,
  QueueProducer,
  RestError,
  TransactionalDataRefreshingQueueMessage,
  TransactionalDataRefreshingQueueMessageEventType,
  UserManagementAppFile,
  UserManagementAppFileRepository
} from 'common';
import _ from 'underscore';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class CsrFatcaFacade {
  constructor(
    @repository(CsrFatcaRepository) private csrFatcaRepository: CsrFatcaRepository,
    @repository(UserManagementAppFileRepository) private userManagementAppFileRepository: UserManagementAppFileRepository
  ) {}

  async create(entity: DataObject<CsrFatca>, options?: Options): Promise<CsrFatca> {
    return this.csrFatcaRepository.create(entity, options);
  }

  async createAll(entities: DataObject<CsrFatca>[], options?: Options): Promise<CsrFatca[]> {
    return this.csrFatcaRepository.createAll(entities, options);
  }

  async save(entity: CsrFatca, options?: Options): Promise<CsrFatca> {
    return this.csrFatcaRepository.save(entity, options);
  }

  async find(filter?: Filter<CsrFatca>, options?: Options): Promise<(CsrFatca & CsrFatcaWithRelations)[]> {
    return this.csrFatcaRepository.find(filter, options);
  }

  async findOne(filter?: Filter<CsrFatca>, options?: Options): Promise<(CsrFatca & CsrFatcaWithRelations) | null> {
    return this.csrFatcaRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<CsrFatca>, options?: Options): Promise<CsrFatca & CsrFatcaWithRelations> {
    return this.csrFatcaRepository.findById(id, filter, options);
  }

  async update(entity: CsrFatca, options?: Options): Promise<void> {
    return this.csrFatcaRepository.update(entity, options);
  }

  async delete(entity: CsrFatca, options?: Options): Promise<void> {
    return this.csrFatcaRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<CsrFatca>, where?: Where<CsrFatca>, options?: Options): Promise<Count> {
    return this.csrFatcaRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<CsrFatca>, options?: Options): Promise<void> {
    return this.csrFatcaRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<CsrFatca>, options?: Options): Promise<void> {
    return this.csrFatcaRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<CsrFatca>, options?: Options): Promise<Count> {
    return this.csrFatcaRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.csrFatcaRepository.deleteById(id, options);
  }

  async count(where?: Where<CsrFatca>, options?: Options): Promise<Count> {
    return this.csrFatcaRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.csrFatcaRepository.exists(id, options);
  }

  async updatecsrFatcaStatus(data: DataObject<CsrFatca>, options?: Options): Promise<Count> {
    try {
      const count = await this.csrFatcaRepository.updateAll(
        {
          status: Option.GLOBALOPTIONS.FATCAGENERATIONSTATUS.success.value,
          uploadedDate: new Date()
        },
        {
          and: [
            {
              rtaId: data.rtaId
            },
            {
              accountId: {inq: data.accountIds}
            }
          ]
        }
      );
      return count;
    } catch (err) {
      throw err;
    }
  }

  async generateFatca(options?: Options): Promise<any> {
    try {
      let message = new TransactionalDataRefreshingQueueMessage();
      message.eventType = TransactionalDataRefreshingQueueMessageEventType.FATCA_FILE_GENERATION_CRON;
      await QueueProducer.sendMessageInTransactionalDataRefreshingQueue(message).catch(err => {
        throw new Error(err);
      });
      return {success: true, message: 'FATCA document will be generated shortly, please refresh the page and check'};
    } catch (error) {
      LoggingUtils.error('Some Error Occurred');
      throw error;
    }
  }

  async fetchFatca(paginator: any, options?: Options): Promise<any> {
    try {
      const result = [];
      const filter = _.isEmpty(paginator.where) ? null : paginator.where;
      let countRes: any, groupdata: any;
      // Query without filter
      const countQuery = `
      select count(distinct fk_id_fatca_doc_file)
      from csr_fatca
      where fk_id_fatca_doc_file is not null and is_active=$1
      `;
      // Query with rta filter
      const countQueryRta = `
      select count(distinct fk_id_fatca_doc_file)
      from csr_fatca
      where fk_id_fatca_doc_file is not null and is_active=$1
      and fk_id_rta = $2
      `;
      // Query with date filter
      const countQuerygGenDate = `
      select count(distinct fk_id_fatca_doc_file)
      from csr_fatca
      where fk_id_fatca_doc_file is not null and is_active=$1
      and generated_date::text ilike $2
      `;
      // Query with filter
      const countQueryFilter = `
      select count(distinct fk_id_fatca_doc_file)
      from csr_fatca
      where fk_id_fatca_doc_file is not null and is_active=$1
      and fk_id_rta = $2
      and generated_date::text ilike $3
      `;

      const query = `
        select * from (
        select count(*) noofrecords, fk_id_fatca_doc_file usermanagementappfileid FROM csr_fatca
        where is_active = $1
        and fk_id_fatca_doc_file is not null
        group by fk_id_fatca_doc_file
        ) as grp order by  userManagementAppFileId DESC
        offset $2 limit $3
      `;

      const queryRta = `
        select * from (
        select count(*) noofrecords, fk_id_fatca_doc_file usermanagementappfileid FROM csr_fatca
        where is_active = $1
        and fk_id_fatca_doc_file is not null
        and fk_id_rta = $4
        group by fk_id_fatca_doc_file
        ) as grp order by  userManagementAppFileId DESC
        offset $2 limit $3
    `;

      const queryGenDate = `
       select * from (
       select count(*) noofrecords, fk_id_fatca_doc_file usermanagementappfileid FROM csr_fatca
       where is_active = $1
       and fk_id_fatca_doc_file is not null
       and generated_date::text ilike $4
       group by fk_id_fatca_doc_file
       ) as grp order by  userManagementAppFileId DESC
       offset $2 limit $3
     `;

      const queryfilter = `
       select * from (
       select count(*) noofrecords, fk_id_fatca_doc_file usermanagementappfileid FROM csr_fatca
       where is_active = $1
       and fk_id_fatca_doc_file is not null
       and fk_id_rta = $4
       and generated_date::text ilike $5
       group by fk_id_fatca_doc_file
       ) as grp order by  userManagementAppFileId DESC
       offset $2 limit $3
     `;
      //  Fetching count
      if (_.isEmpty(filter)) {
        countRes = await this.csrFatcaRepository.execute(countQuery, [true], options);
      } else {
        if (filter.rtaId && filter.generatedDate) {
          countRes = await this.csrFatcaRepository.execute(countQueryFilter, [true, filter.rtaId, filter.generatedDate], options);
        } else if (filter.generatedDate && filter.generatedDate !== null && filter.generatedDate !== undefined) {
          countRes = await this.csrFatcaRepository.execute(countQuerygGenDate, [true, filter.generatedDate], options);
        } else if (filter.rtaId && filter.rtaId !== null && filter.rtaId !== undefined) {
          countRes = await this.csrFatcaRepository.execute(countQueryRta, [true, filter.rtaId], options);
        }
      }
      if (_.isEmpty(countRes)) {
        return {count: 0, data: []};
      }

      //  Fetching data with pagination
      if (_.isEmpty(filter)) {
        groupdata = await this.csrFatcaRepository.execute(query, [true, paginator.offset, paginator.limit], options);
      } else {
        if (filter.rtaId && filter.generatedDate) {
          groupdata = await this.csrFatcaRepository.execute(
            queryfilter,
            [true, paginator.offset, paginator.limit, filter.rtaId, filter.generatedDate],
            options
          );
        } else if (filter.generatedDate && filter.generatedDate !== null && filter.generatedDate !== undefined) {
          groupdata = await this.csrFatcaRepository.execute(
            queryGenDate,
            [true, paginator.offset, paginator.limit, filter.generatedDate],
            options
          );
        } else if (filter.rtaId && filter.rtaId !== null && filter.rtaId !== undefined) {
          groupdata = await this.csrFatcaRepository.execute(queryRta, [true, paginator.offset, paginator.limit, filter.rtaId], options);
        }
      }

      if (_.isEmpty(groupdata)) {
        return {count: 0, data: []};
      }
      const ids = groupdata!.map((ele: any) => ele.usermanagementappfileid);
      const appFiles = await this.userManagementAppFileRepository.find(
        {
          where: {
            isActive: true,
            containerName: FileStorageContainerConfig.getGcpContainerName('fatca'),
            id: {
              inq: ids
            }
          },
          include: ['csrFatca']
        },
        options
      );

      for (let files of appFiles) {
        const csrFile = groupdata.filter((ele: any) => ele.usermanagementappfileid == files.id)[0];
        result.push({
          status: files.csrFatca?.status,
          noOfRecords: csrFile.noofrecords,
          dateGenerated: files.csrFatca?.generatedDate,
          rtaId: files.csrFatca?.rtaId,
          userManagementAppFile: files
        });
      }

      return {count: countRes[0].count, data: result};
    } catch (error) {
      throw error;
    }
  }
}
