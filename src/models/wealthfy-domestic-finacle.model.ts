import {Entity, Model, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class WealthfyDomesticFinacle extends Entity {
  // Define well-known properties here
  @property({
    type: 'number',
    id: 1,
    generated: true
  })
  id?: number;
  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<WealthfyDomesticFinacle>) {
    super(data);
  }
}

export interface WealthfyDomesticFinacleRelations {
  // describe navigational properties here
}

export type WealthfyDomesticFinacleWithRelations = WealthfyDomesticFinacle & WealthfyDomesticFinacleRelations;
