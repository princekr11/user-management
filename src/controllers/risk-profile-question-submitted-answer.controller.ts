import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {RiskProfileQuestionSubmittedAnswer} from 'common';
import {RiskProfileQuestionSubmittedAnswerFacade} from '../facades';
const API_PREFIX = RiskProfileQuestionSubmittedAnswer.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class RiskProfileQuestionSubmittedAnswerController {
  constructor(
    @service(RiskProfileQuestionSubmittedAnswerFacade)
    public riskProfileQuestionSubmittedAnswerFacade: RiskProfileQuestionSubmittedAnswerFacade,
    @inject('additionalHeaders') private additionalHeaders: any) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'RiskProfileQuestionSubmittedAnswer model instance',
    content: {'application/json': {schema: getModelSchemaRef(RiskProfileQuestionSubmittedAnswer)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RiskProfileQuestionSubmittedAnswer, {
            title: 'New RiskProfileQuestionSubmittedAnswer',
            exclude: ['id']
          })
        }
      }
    })
    riskProfileQuestionSubmittedAnswer: Omit<RiskProfileQuestionSubmittedAnswer, 'id'>
  ): Promise<RiskProfileQuestionSubmittedAnswer> {
    return this.riskProfileQuestionSubmittedAnswerFacade.create(riskProfileQuestionSubmittedAnswer, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'RiskProfileQuestionSubmittedAnswer model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(RiskProfileQuestionSubmittedAnswer) where?: Where<RiskProfileQuestionSubmittedAnswer>): Promise<Count> {
    return this.riskProfileQuestionSubmittedAnswerFacade.count(where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of RiskProfileQuestionSubmittedAnswer model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(RiskProfileQuestionSubmittedAnswer, {includeRelations: false})
        }
      }
    }
  })
  async find(
    @param.filter(RiskProfileQuestionSubmittedAnswer) filter?: Filter<RiskProfileQuestionSubmittedAnswer>
  ): Promise<RiskProfileQuestionSubmittedAnswer[]> {
    return this.riskProfileQuestionSubmittedAnswerFacade.find(filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'RiskProfileQuestionSubmittedAnswer PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RiskProfileQuestionSubmittedAnswer, {partial: true})
        }
      }
    })
    riskProfileQuestionSubmittedAnswer: RiskProfileQuestionSubmittedAnswer,
    @param.where(RiskProfileQuestionSubmittedAnswer) where?: Where<RiskProfileQuestionSubmittedAnswer>
  ): Promise<Count> {
    return this.riskProfileQuestionSubmittedAnswerFacade.updateAll(riskProfileQuestionSubmittedAnswer, where, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'RiskProfileQuestionSubmittedAnswer model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(RiskProfileQuestionSubmittedAnswer, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(RiskProfileQuestionSubmittedAnswer, {exclude: 'where'}) filter?: FilterExcludingWhere<RiskProfileQuestionSubmittedAnswer>
  ): Promise<RiskProfileQuestionSubmittedAnswer> {
    return this.riskProfileQuestionSubmittedAnswerFacade.findById(id, filter, this.additionalHeaders);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RiskProfileQuestionSubmittedAnswer PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RiskProfileQuestionSubmittedAnswer, {partial: true})
        }
      }
    })
    riskProfileQuestionSubmittedAnswer: RiskProfileQuestionSubmittedAnswer
  ): Promise<void> {
    await this.riskProfileQuestionSubmittedAnswerFacade.updateById(id, riskProfileQuestionSubmittedAnswer, this.additionalHeaders);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RiskProfileQuestionSubmittedAnswer PUT success'
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() riskProfileQuestionSubmittedAnswer: RiskProfileQuestionSubmittedAnswer
  ): Promise<void> {
    await this.riskProfileQuestionSubmittedAnswerFacade.replaceById(id, riskProfileQuestionSubmittedAnswer, this.additionalHeaders);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'RiskProfileQuestionSubmittedAnswer DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.riskProfileQuestionSubmittedAnswerFacade.deleteById(id, this.additionalHeaders);
  }
}
