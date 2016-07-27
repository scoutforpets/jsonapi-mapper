'use strict';

import * as _ from 'lodash';
import { Serializer, ILinkObj, ISerializerOptions } from 'jsonapi-serializer';
import * as tc from 'type-check';

import {Data, Model, isModel, Collection, isCollection} from './extras';
import * as I from '../interfaces.d';
import * as links from './links';
import * as utils from './utils';

type Checker = (typeDescription: string, inst: any, options?: TypeCheck.Options) => boolean;
let typeCheck: Checker = tc.typeCheck;

export default class Bookshelf implements I.Mapper {

  private baseUrl: string;
  private serializerOptions: ISerializerOptions;

  /**
   * Default constructor
   * @param baseUrl
   * @param serializerOptions
   */
  constructor(baseUrl: string, serializerOptions?: ISerializerOptions) {
    this.baseUrl = baseUrl;
    this.serializerOptions = serializerOptions;
  }

  /**
   * Recursively add all the (nested) relations to the template
   * @param data
   * @param type
   * @param bookshelfOptions
   * @param template
   */
  mapRelations(model: Model, type: string, bookshelfOptions: I.BookshelfOptions = {relations: true}, template?: ISerializerOptions): void {

    let self: this = this;

    _.forOwn(model.relations, function (relModel: Model, relName: string): void {

        // Skip if the relation is not permitted
        if (bookshelfOptions.relations === false ||
          (typeCheck('[String]', bookshelfOptions.relations) &&
          (<string[]> bookshelfOptions.relations).indexOf(relName) < 0)) {

          return;
        }

        // Avoid duplicates
        if (!_.includes(template.attributes, relName)) {
          // Add relation to attribute list
          template.attributes.push(relName);
        }

        // Apply relation attributes
        if (template[relName] === undefined || _.isEmpty(template[relName].attributes)) {

          // Add relation serialization
          template[relName] = utils.buildRelation(self.baseUrl, type, relName, utils.getDataAttributesList(relModel), true, bookshelfOptions.disableLinks);
        }

        // recurse to add nested relations
        if(relModel.models){
          for(let model of relModel.models){
            self.mapRelations(model, relName, bookshelfOptions, template[relName], excludeIdAndTypeColumns);
          }
        } else {           
          self.mapRelations(relModel, relName, bookshelfOptions, template[relName], excludeIdAndTypeColumns);
        }
    });
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
    let template: ISerializerOptions = {};

    // Build links objects
    if (!bookshelfOptions.disableLinks) {
        template.topLevelLinks = links.buildTop(self.baseUrl, type, bookshelfOptions.pagination, bookshelfOptions.query);
        template.dataLinks = links.buildSelf(self.baseUrl, type, null, bookshelfOptions.query);
    }

    // Serializer process for a Model
    if (isModel(data)) {
      // Add list of valid attributes
      template.attributes = utils.getDataAttributesList(data);

      // Provide support for withRelated option TODO WARNING DEPRECATED. To be deleted on next major version
      if (bookshelfOptions.includeRelations) bookshelfOptions.relations = bookshelfOptions.includeRelations;

      // Add relations (only if permitted)
      if (bookshelfOptions.relations) {
        self.mapRelations(data, type, bookshelfOptions, template);
      }

      // Serializer process for a Collection
    } else if (isCollection(data)) {

      let model: Model = data.first();

      if (!_.isUndefined(model)) {

        // Add list of valid attributes
        template.attributes = utils.getDataAttributesList(model);

        // Provide support for withRelated option TODO WARNING DEPRECATED. To be deleted on next major version
        if (bookshelfOptions.includeRelations) bookshelfOptions.relations = bookshelfOptions.includeRelations;

        data.forEach((model) => {
          self.mapRelations(model, type, bookshelfOptions, template);
        });

      }
    }

    // Override the template with the provided serializer options
    _.assign(template, this.serializerOptions);

    // Return the data in JSON API format
    let json : any = utils.toJSON(data);
    return new Serializer(type, template).serialize(json);
  }
}
