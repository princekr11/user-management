import { Entity, Model, model, property } from '@loopback/repository';

@model({ settings: { strict: false } })
export class Ekyc extends Entity {
  // Define well-known properties here
  @property({
    type: 'number',
    id: true,
    generated: true
  })
  id?: number;

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Ekyc>) {
    super(data);
  }
}

export interface EkycRelations {
  // describe navigational properties here
}

export type EkycWithRelations = Ekyc & EkycRelations;
