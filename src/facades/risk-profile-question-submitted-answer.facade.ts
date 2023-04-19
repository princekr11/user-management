import {/* inject, */ BindingScope, injectable} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {
  RiskProfileQuestionSubmittedAnswer,
  RiskProfileQuestionSubmittedAnswerRelations,
  RiskProfileQuestionSubmittedAnswerRepository
} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class RiskProfileQuestionSubmittedAnswerFacade {
  constructor(
    @repository(RiskProfileQuestionSubmittedAnswerRepository)
    private riskProfileQuestionSubmittedAnswerRepository: RiskProfileQuestionSubmittedAnswerRepository
  ) {}

  async create(entity: DataObject<RiskProfileQuestionSubmittedAnswer>, options?: Options): Promise<RiskProfileQuestionSubmittedAnswer> {
    return this.riskProfileQuestionSubmittedAnswerRepository.create(entity, options);
  }

  async createAll(
    entities: DataObject<RiskProfileQuestionSubmittedAnswer>[],
    options?: Options
  ): Promise<RiskProfileQuestionSubmittedAnswer[]> {
    return this.riskProfileQuestionSubmittedAnswerRepository.createAll(entities, options);
  }

  async save(entity: RiskProfileQuestionSubmittedAnswer, options?: Options): Promise<RiskProfileQuestionSubmittedAnswer> {
    return this.riskProfileQuestionSubmittedAnswerRepository.save(entity, options);
  }

  async find(
    filter?: Filter<RiskProfileQuestionSubmittedAnswer>,
    options?: Options
  ): Promise<(RiskProfileQuestionSubmittedAnswer & RiskProfileQuestionSubmittedAnswerRelations)[]> {
    return this.riskProfileQuestionSubmittedAnswerRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<RiskProfileQuestionSubmittedAnswer>,
    options?: Options
  ): Promise<(RiskProfileQuestionSubmittedAnswer & RiskProfileQuestionSubmittedAnswerRelations) | null> {
    return this.riskProfileQuestionSubmittedAnswerRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<RiskProfileQuestionSubmittedAnswer>,
    options?: Options
  ): Promise<RiskProfileQuestionSubmittedAnswer & RiskProfileQuestionSubmittedAnswerRelations> {
    return this.riskProfileQuestionSubmittedAnswerRepository.findById(id,filter, options);
  }

  async update(entity: RiskProfileQuestionSubmittedAnswer, options?: Options): Promise<void> {
    return this.riskProfileQuestionSubmittedAnswerRepository.update(entity, options);
  }

  async delete(entity: RiskProfileQuestionSubmittedAnswer, options?: Options): Promise<void> {
    return this.riskProfileQuestionSubmittedAnswerRepository.delete(entity, options);
  }

  async updateAll(
    data: DataObject<RiskProfileQuestionSubmittedAnswer>,
    where?: Where<RiskProfileQuestionSubmittedAnswer>,
    options?: Options
  ): Promise<Count> {
    return this.riskProfileQuestionSubmittedAnswerRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<RiskProfileQuestionSubmittedAnswer>, options?: Options): Promise<void> {
    return this.riskProfileQuestionSubmittedAnswerRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<RiskProfileQuestionSubmittedAnswer>, options?: Options): Promise<void> {
    return this.riskProfileQuestionSubmittedAnswerRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<RiskProfileQuestionSubmittedAnswer>, options?: Options): Promise<Count> {
    return this.riskProfileQuestionSubmittedAnswerRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.riskProfileQuestionSubmittedAnswerRepository.deleteById(id, options);
  }

  async count(where?: Where<RiskProfileQuestionSubmittedAnswer>, options?: Options): Promise<Count> {
    return this.riskProfileQuestionSubmittedAnswerRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.riskProfileQuestionSubmittedAnswerRepository.exists(id, options);
  }
}
