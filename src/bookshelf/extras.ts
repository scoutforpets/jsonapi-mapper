'use strict';

import {Model as BModel, Collection as BCollection} from 'bookshelf';

export interface RelationsObject {
  [relations: string]: Data;
}

// Using internally defined properties
export interface Model extends BModel<any> {
  id: any; // TODO IMPROVE REAL TYPE
  attributes: any;
  relations:  RelationsObject;
}

/**
 * Determine whether a Bookshelf object is a Model.
 * @param data
 * @returns {boolean}
 */
export function isModel(data: Data): data is Model {
  if (!data) {
    return false;
  } else {
    return ! isCollection(data);
  }
}

// Using internally defined properties
export interface Collection extends BCollection<any> {
  models: Model[];
  length: number;
}

/**
 * Determine whether a Bookshelf object is a Collection.
 * @param data
 * @returns {boolean}
 */
export function isCollection(data: Data): data is Collection {
  if (!data) {
    return false;
  } else {
    // Duck-typing
    return (<Collection> data).models !== undefined;
  }
}


export type Data = Model | Collection;
