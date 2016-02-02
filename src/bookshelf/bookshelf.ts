'use strict';

import * as _ from 'lodash';
import * as serializer from 'jsonapi-serializer';
import * as tc from 'type-check';

import {Data, Model, Collection} from './extras';
import * as inters from '../interfaces.d';
import * as links from './links';
import * as utils from './utils';

type Checker = (typeDescription: string , inst: any, options?: TypeCheck.Options) => boolean;
let typeCheck: Checker = tc.typeCheck;

let adapter: inters.IAdapter = function(
    data: Data,
    type: string,
    baseUrl: string,
    serializerOptions: Serializer.ISerializerOptions,
    adapterOptions: inters.IBookshelfOptions): any {

  // TODO ADD meta property of serializerOptions TO template

  let template: Serializer.ISerializerOptions = {};

  // Build links objects
  template.topLevelLinks = links.buildTop(baseUrl, type, adapterOptions.query, adapterOptions.pagination);
  template.dataLinks = links.buildSelf(baseUrl, type, adapterOptions.query);

  // Serializer process for a Model
  if (utils.isModel(data)) {
    let model: Model = <Model> data;

    // Add list of valid attributes
    template.attributes = utils.getDataAttributesList(model);

    // Add relations (only if permitted)
    if (adapterOptions.relations) {
      _.forOwn(model.relations, function(relModel: Model, relName: string): void {

        // Skip if the relation is not permitted
        if (adapterOptions.relations === false ||
          (typeCheck('[String]', adapterOptions.relations) &&
            (<string[]> adapterOptions.relations).indexOf(relName) < 0)) {

          return;
        }

        // Add relation to attribute list
        template.attributes.push(relName);

        // Add relation serialization
        template[relName] = utils.buildRelation(baseUrl, type, relName, utils.getDataAttributesList(relModel), true);

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
  _.assign(template, serializerOptions);

  // Return the data in JSON API format
  let json: any = data.toJSON();
  return new Serializer(type, json, template);
};

export default adapter;
