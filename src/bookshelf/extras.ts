/**
 * The purpose of this module is to extend the initially defined properties,
 * behaviors and characteristics of the bookshelf API
 */

'use strict';

import { Model as BModel, Collection as BCollection } from 'bookshelf';

/**
 * Internal form of the relations property of bookshelf objects
 */
export interface RelationsObject {
  [relations: string]: Data;
}

/**
 * Bookshelf Model including some private properties
 */
export interface Model extends BModel<any> {
  id: any;
  attributes: any;
  relations: RelationsObject;
}

/**
 * Bookshelf Model Type Guard
 * https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
 */
export function isModel(data: Data): data is Model {
  return data ? !isCollection(data) : false;
}

/**
 * Bookshelf Collection including some private properties
 */
export interface Collection extends BCollection<any> {
  models: Model[];
  length: number;
}

/**
 * Bookshelf Collection Type Guard
 * https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
 */
export function isCollection(data: Data): data is Collection {
  // Type recognition based on duck-typing
  return data ? (data as Collection).models !== undefined : false;
}

export type Data = Model | Collection;
