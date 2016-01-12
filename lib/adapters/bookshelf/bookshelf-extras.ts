import {Model as BModel, Collection as BCollection} from 'bookshelf';

//
export interface RelationsObject {
  [relations: string]: Data;
}

// Using internally defined properties
export interface Model extends BModel<any> {
  id: any; // TODO IMPROVE REAL TYPE
  attributes: any;
  relations:  RelationsObject;
}

// Using internally defined properties
export interface Collection extends BCollection<any> {
  models: Model[];
  length: number;
}

export type Data = Model | Collection;
