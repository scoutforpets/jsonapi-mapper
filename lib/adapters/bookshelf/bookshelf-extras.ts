import {Model as BModel, Collection as BCollection} from 'bookshelf';

// Using internally defined properties
export interface Model extends BModel<any> {
  id: any; // TODO IMPROVE REAL TYPE
  attributes: any;
}

// Using internally defined properties
export interface Collection extends BCollection<any> {
  models: Model[];
  length: number;
}

export type Data = Model | Collection;
