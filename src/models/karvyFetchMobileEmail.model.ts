import { Entity, Model, model, property } from '@loopback/repository';

@model({ settings: { strict: false } })
export class Karvy extends Entity {
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

  constructor(data?: Partial<Karvy>) {
    super(data);
  }
}

export interface KarvyRelations {
  // describe navigational properties here
}

export type KarvyWithRelations = Karvy & KarvyRelations;
