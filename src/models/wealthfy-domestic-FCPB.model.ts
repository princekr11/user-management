import {Entity, Model, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class WealthfyDomesticFCPB extends Entity {
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

  constructor(data?: Partial<WealthfyDomesticFCPB>) {
    super(data);
  }
}

export interface WealthfyDomesticFCPBRelations {
  // describe navigational properties here
}

export type WealthfyDomesticFCPBWithRelations = WealthfyDomesticFCPB & WealthfyDomesticFCPBRelations;
