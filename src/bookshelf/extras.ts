/**
 * The purpose of this module is to extend the initially defined properties,
 * behaviors and characteristics of the bookshelf API
 */

'use strict';

import { Model as BModel, Collection as BCollection } from 'bookshelf';
import { MapOpts } from '../interfaces';

// Bookshelf Options
export interface BookOpts extends MapOpts {}

/**
 * Internal form of the relations property of bookshelf objects
 */
export interface RelationsObject {
  [relationName: string]: Data;
}

export interface Attributes {
  [attrName: string]: any;
}

/**
 * Bookshelf Model including some private properties
 */
export interface Model extends BModel<any> {
  id: any;
  attributes: Attributes;
  relations: RelationsObject;
}

/**
 * Bookshelf Collection including some private properties
 */
export interface Collection extends BCollection<any> {
  models: Model[];
  length: number;
}

export type Data = Model | Collection;

/**
 * Bookshelf Model Type Guard
 * https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
 */
export function isModel(data: Data): data is Model {
  return data ? !isCollection(data) : false;
}

/**
 * Bookshelf Collection Type Guard
 * https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
 */
export function isCollection(data: Data): data is Collection {
  // Type recognition based on duck-typing
  return data ? (data as Collection).models !== undefined : false;
}
