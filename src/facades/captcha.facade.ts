import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Captcha, CaptchaRelations, CaptchaRepository} from 'common';

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class CaptchaFacade {
  constructor(@repository(CaptchaRepository) private captchaRepository: CaptchaRepository) {}

  async create(entity: DataObject<Captcha>, options?: Options): Promise<Captcha> {
    return this.captchaRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Captcha>[], options?: Options): Promise<Captcha[]> {
    return this.captchaRepository.createAll(entities, options);
  }

  async save(entity: Captcha, options?: Options): Promise<Captcha> {
    return this.captchaRepository.save(entity, options);
  }

  async find(filter?: Filter<Captcha>, options?: Options): Promise<(Captcha & CaptchaRelations)[]> {
    return this.captchaRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Captcha>, options?: Options): Promise<(Captcha & CaptchaRelations) | null> {
    return this.captchaRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Captcha>, options?: Options): Promise<Captcha & CaptchaRelations> {
    return this.captchaRepository.findById(id,filter, options);
  }

  async update(entity: Captcha, options?: Options): Promise<void> {
    return this.captchaRepository.update(entity, options);
  }

  async delete(entity: Captcha, options?: Options): Promise<void> {
    return this.captchaRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Captcha>, where?: Where<Captcha>, options?: Options): Promise<Count> {
    return this.captchaRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Captcha>, options?: Options): Promise<void> {
    return this.captchaRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Captcha>, options?: Options): Promise<void> {
    return this.captchaRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Captcha>, options?: Options): Promise<Count> {
    return this.captchaRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.captchaRepository.deleteById(id, options);
  }

  async count(where?: Where<Captcha>, options?: Options): Promise<Count> {
    return this.captchaRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.captchaRepository.exists(id, options);
  }
}
