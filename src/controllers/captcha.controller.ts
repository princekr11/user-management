import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Captcha} from 'common';
import {CaptchaFacade} from '../facades';
const API_PREFIX = Captcha.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class CaptchaController {
  constructor(@service(CaptchaFacade) public captchaFacade: CaptchaFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Captcha model instance',
    content: {'application/json': {schema: getModelSchemaRef(Captcha)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Captcha, {
            title: 'New Captcha',
            exclude: ['id']
          })
        }
      }
    })
    captcha: Omit<Captcha, 'id'>
  ): Promise<Captcha> {
    return this.captchaFacade.create(captcha);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Captcha model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Captcha) where?: Where<Captcha>): Promise<Count> {
    return this.captchaFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Captcha model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Captcha, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Captcha) filter?: Filter<Captcha>): Promise<Captcha[]> {
    return this.captchaFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Captcha PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Captcha, {partial: true})
        }
      }
    })
    captcha: Captcha,
    @param.where(Captcha) where?: Where<Captcha>
  ): Promise<Count> {
    return this.captchaFacade.updateAll(captcha, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Captcha model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Captcha, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Captcha, {exclude: 'where'}) filter?: FilterExcludingWhere<Captcha>
  ): Promise<Captcha> {
    return this.captchaFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Captcha PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Captcha, {partial: true})
        }
      }
    })
    captcha: Captcha
  ): Promise<void> {
    await this.captchaFacade.updateById(id, captcha);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Captcha PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() captcha: Captcha): Promise<void> {
    await this.captchaFacade.replaceById(id, captcha);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Captcha DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.captchaFacade.deleteById(id);
  }
}
