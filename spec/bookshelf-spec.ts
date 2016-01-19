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

});

