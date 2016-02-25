'use strict';

import * as _ from 'lodash';
import * as Serializer from 'jsonapi-serializer';
import * as tc from 'type-check';

import {Data, Model, Collection} from './extras';
import * as I from '../interfaces.d';
import * as links from './links';
import * as utils from './utils';

type Checker = (typeDescription: string, inst: any, options?: TypeCheck.Options) => boolean;
let typeCheck: Checker = tc.typeCheck;

export default class Bookshelf implements I.Mapper {

  private baseUrl: string;
  private serializerOptions: Serializer.ISerializerOptions;

  /**
   * Default constructor
   * @param baseUrl
   * @param serializerOptions
   */
  constructor(baseUrl: string, serializerOptions?: Serializer.ISerializerOptions) {
    this.baseUrl = baseUrl;
    this.serializerOptions = serializerOptions;
  }

  /**
   * Maps bookshelf data to a JSON-API 1.0 compliant object
   * @param data
   * @param type
   * @param bookshelfOptions
   * @returns {"jsonapi-serializer".Serializer}
   */
  map(data: any, type: string, bookshelfOptions: I.BookshelfOptions = {relations: true}): any {

    // TODO ADD meta property of serializerOptions TO template

    let self: this = this;
    let template: Serializer.ISerializerOptions = {};

    // Build links objects
    template.topLevelLinks = links.buildTop(self.baseUrl, type, bookshelfOptions.pagination, bookshelfOptions.query);
    template.dataLinks = links.buildSelf(self.baseUrl, type, bookshelfOptions.query);

    // Serializer process for a Model
    if (utils.isModel(data)) {
      let model: Model = <Model> data;

      // Add list of valid attributes
      template.attributes = utils.getDataAttributesList(model);

      // Provide support for withRelated option TODO WARNING DEPRECATED. To be deleted on next major version
      if (bookshelfOptions.includeRelations) bookshelfOptions.relations = bookshelfOptions.includeRelations;

      // Add relations (only if permitted)
      if (bookshelfOptions.relations) {
        _.forOwn(model.relations, function (relModel: Model, relName: string): void {

          // Skip if the relation is not permitted
          if (bookshelfOptions.relations === false ||
            (typeCheck('[String]', bookshelfOptions.relations) &&
            (<string[]> bookshelfOptions.relations).indexOf(relName) < 0)) {

            return;
          }

          // Add relation to attribute list
          template.attributes.push(relName);

          // Add relation serialization
          template[relName] = utils.buildRelation(self.baseUrl, type, relName, utils.getDataAttributesList(relModel), true);

        });
      }

      // Serializer process for a Collection
    } else if (utils.isCollection(data)) {
      let model: Model = (<Collection> data).first();

      // Add list of valid attributes
      template.attributes = utils.getDataAttributesList(model);

      // Add relations TODO (HOW MANY TO MANY?)
    }

    // Override the template with the provided serializer options
    _.assign(template, this.serializerOptions);

    // Return the data in JSON API format
    let json: any = (data && data.toJSON()) || null;
    return new Serializer(type, json, template);
  }
}
