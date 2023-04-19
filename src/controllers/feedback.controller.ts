import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {Feedback} from 'common';
import {FeedbackFacade} from '../facades';
const API_PREFIX = Feedback.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class FeedbackController {
  constructor(@service(FeedbackFacade) public feedbackFacade: FeedbackFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Feedback model instance',
    content: {'application/json': {schema: getModelSchemaRef(Feedback)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Feedback, {
            title: 'New Feedback',
            exclude: ['id']
          })
        }
      }
    })
    feedback: Omit<Feedback, 'id'>
  ): Promise<Feedback> {
    return this.feedbackFacade.create(feedback);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Feedback model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Feedback) where?: Where<Feedback>): Promise<Count> {
    return this.feedbackFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Feedback model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Feedback, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Feedback) filter?: Filter<Feedback>): Promise<Feedback[]> {
    return this.feedbackFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Feedback PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Feedback, {partial: true})
        }
      }
    })
    feedback: Feedback,
    @param.where(Feedback) where?: Where<Feedback>
  ): Promise<Count> {
    return this.feedbackFacade.updateAll(feedback, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Feedback model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Feedback, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Feedback, {exclude: 'where'}) filter?: FilterExcludingWhere<Feedback>
  ): Promise<Feedback> {
    return this.feedbackFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Feedback PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Feedback, {partial: true})
        }
      }
    })
    feedback: Feedback
  ): Promise<void> {
    await this.feedbackFacade.updateById(id, feedback);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Feedback PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() feedback: Feedback): Promise<void> {
    await this.feedbackFacade.replaceById(id, feedback);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Feedback DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.feedbackFacade.deleteById(id);
  }
}
