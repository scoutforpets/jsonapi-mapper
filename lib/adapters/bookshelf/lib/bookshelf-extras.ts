import {Model as BModel, Collection as BCollection} from 'bookshelf';

// Using internally defined properties
export class Model extends BModel<any> {
  attributes: any;
}

// Using internally defined properties
export class Collection extends BCollection<any> {
  models: Model[];
  length: number;
}
