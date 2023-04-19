import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody, response} from '@loopback/rest';
import {InvestorDetails} from 'common';
import {InvestorDetailsFacade} from '../facades';
const API_PREFIX = InvestorDetails.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class InvestorDetailsController {
  constructor(@service(InvestorDetailsFacade) public investorDetailsFacade: InvestorDetailsFacade) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'InvestorDetails model instance',
    content: {'application/json': {schema: getModelSchemaRef(InvestorDetails)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorDetails, {
            title: 'New InvestorDetails',
            exclude: ['id']
          })
        }
      }
    })
    investorDetails: Omit<InvestorDetails, 'id'>
  ): Promise<InvestorDetails> {
    return this.investorDetailsFacade.create(investorDetails);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'InvestorDetails model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(InvestorDetails) where?: Where<InvestorDetails>): Promise<Count> {
    return this.investorDetailsFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of InvestorDetails model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InvestorDetails, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(InvestorDetails) filter?: Filter<InvestorDetails>): Promise<InvestorDetails[]> {
    return this.investorDetailsFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'InvestorDetails PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorDetails, {partial: true})
        }
      }
    })
    investorDetails: InvestorDetails,
    @param.where(InvestorDetails) where?: Where<InvestorDetails>
  ): Promise<Count> {
    return this.investorDetailsFacade.updateAll(investorDetails, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'InvestorDetails model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InvestorDetails, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(InvestorDetails, {exclude: 'where'}) filter?: FilterExcludingWhere<InvestorDetails>
  ): Promise<InvestorDetails> {
    return this.investorDetailsFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'InvestorDetails PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorDetails, {partial: true})
        }
      }
    })
    investorDetails: InvestorDetails
  ): Promise<void> {
    await this.investorDetailsFacade.updateById(id, investorDetails);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'InvestorDetails PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() investorDetails: InvestorDetails): Promise<void> {
    await this.investorDetailsFacade.replaceById(id, investorDetails);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'InvestorDetails DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.investorDetailsFacade.deleteById(id);
  }
}
