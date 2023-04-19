import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Feedback, FeedbackRelations, FeedbackRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class FeedbackFacade {
  constructor(@repository(FeedbackRepository) private feedbackRepository: FeedbackRepository) {}

  async create(entity: DataObject<Feedback>, options?: Options): Promise<Feedback> {
    return this.feedbackRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Feedback>[], options?: Options): Promise<Feedback[]> {
    return this.feedbackRepository.createAll(entities, options);
  }

  async save(entity: Feedback, options?: Options): Promise<Feedback> {
    return this.feedbackRepository.save(entity, options);
  }

  async find(filter?: Filter<Feedback>, options?: Options): Promise<(Feedback & FeedbackRelations)[]> {
    return this.feedbackRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Feedback>, options?: Options): Promise<(Feedback & FeedbackRelations) | null> {
    return this.feedbackRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Feedback>, options?: Options): Promise<Feedback & FeedbackRelations> {
    return this.feedbackRepository.findById(id,filter, options);
  }

  async update(entity: Feedback, options?: Options): Promise<void> {
    return this.feedbackRepository.update(entity, options);
  }

  async delete(entity: Feedback, options?: Options): Promise<void> {
    return this.feedbackRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Feedback>, where?: Where<Feedback>, options?: Options): Promise<Count> {
    return this.feedbackRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Feedback>, options?: Options): Promise<void> {
    return this.feedbackRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Feedback>, options?: Options): Promise<void> {
    return this.feedbackRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Feedback>, options?: Options): Promise<Count> {
    return this.feedbackRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.feedbackRepository.deleteById(id, options);
  }

  async count(where?: Where<Feedback>, options?: Options): Promise<Count> {
    return this.feedbackRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.feedbackRepository.exists(id, options);
  }
}
