import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {InvestorDetails, InvestorDetailsRelations, InvestorDetailsRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class InvestorDetailsFacade {
  constructor(@repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository) {}

  async create(entity: DataObject<InvestorDetails>, options?: Options): Promise<InvestorDetails> {
    return this.investorDetailsRepository.create(entity, options);
  }

  async createAll(entities: DataObject<InvestorDetails>[], options?: Options): Promise<InvestorDetails[]> {
    return this.investorDetailsRepository.createAll(entities, options);
  }

  async save(entity: InvestorDetails, options?: Options): Promise<InvestorDetails> {
    return this.investorDetailsRepository.save(entity, options);
  }

  async find(filter?: Filter<InvestorDetails>, options?: Options): Promise<(InvestorDetails & InvestorDetailsRelations)[]> {
    return this.investorDetailsRepository.find(filter, options);
  }

  async findOne(filter?: Filter<InvestorDetails>, options?: Options): Promise<(InvestorDetails & InvestorDetailsRelations) | null> {
    return this.investorDetailsRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<InvestorDetails>,
    options?: Options
  ): Promise<InvestorDetails & InvestorDetailsRelations> {
    return this.investorDetailsRepository.findById(id,filter, options);
  }

  async update(entity: InvestorDetails, options?: Options): Promise<void> {
    return this.investorDetailsRepository.update(entity, options);
  }

  async delete(entity: InvestorDetails, options?: Options): Promise<void> {
    return this.investorDetailsRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<InvestorDetails>, where?: Where<InvestorDetails>, options?: Options): Promise<Count> {
    return this.investorDetailsRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<InvestorDetails>, options?: Options): Promise<void> {
    return this.investorDetailsRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<InvestorDetails>, options?: Options): Promise<void> {
    return this.investorDetailsRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<InvestorDetails>, options?: Options): Promise<Count> {
    return this.investorDetailsRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.investorDetailsRepository.deleteById(id, options);
  }

  async count(where?: Where<InvestorDetails>, options?: Options): Promise<Count> {
    return this.investorDetailsRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.investorDetailsRepository.exists(id, options);
  }
}
