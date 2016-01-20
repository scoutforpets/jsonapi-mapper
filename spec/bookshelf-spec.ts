'use strict';

import * as Serializer from 'jsonapi-serializer';
import * as _ from 'lodash';
import * as Omja from '../index';
import * as bs from 'bookshelf';
import * as knex from 'knex';

const bookshelf: bs = bs(knex((<knex.Config> {})));

describe('Bookshelf Adapter', () => {
  let serializer: Omja.Translator;

  beforeAll(() => {
    serializer = new Omja.Translator('bookshelf', 'https://domain.com');
  });

  it('should serialize a basic model', () => {
    let model: bs.Model<any> = bookshelf.Model.forge<any>({
      id: '5',
      name: 'A test model',
      description: 'something to use as a test'
    });

    let result: any = serializer.toJSONAPI(model, 'models');

    let expected: any = {
      data: {
        id: '5',
        type: 'models',
        attributes: {
          name: 'A test model',
          description: 'something to use as a test'
        }
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should not add the id to the attributes', () => {
    let model: bs.Model<any> = bookshelf.Model.forge<any>({id: '5'});
    let result: any = serializer.toJSONAPI(model, 'models');

    expect(_.has(result, 'data.attributes.id')).toBe(false);
  });

  it('should ignore any *_id attribute on the attributes', () => {
    let model: bs.Model<any> = bookshelf.Model.forge<any>({
      id: '4',
      attr: 'value',
      'related_id': 123,
      'another_id': '456'
    });

    let result: any = serializer.toJSONAPI(model, 'models');

    let expected: any = {
      data: {
        id: '4',
        type: 'models',
        attributes: {
          attr: 'value'
        }
      }
    };

    expect(_.matches(expected)(result)).toBe(true);

    expect(_.has(result, 'data.attributes.related_id')).toBe(false);
    expect(_.has(result, 'data.attributes.another_id')).toBe(false);
  });

  it('should ignore any *_type attribute on the attributes', () => {
    let model: bs.Model<any> = bookshelf.Model.forge<any>({
      id: '4',
      attr: 'value',
      'related_type': 'normal'
    });

    let result: any = serializer.toJSONAPI(model, 'models');

    let expected: any = {
      data: {
        id: '4',
        type: 'models',
        attributes: {
          attr: 'value'
        }
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
    expect(_.has(result, 'data.attributes.related_type')).toBe(false);
    expect(_.has(result, 'data.attributes.related-type')).toBe(false);
  });
});

