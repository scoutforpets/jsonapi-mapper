'use strict';

import * as Serializer from 'jsonapi-serializer';
import * as _ from 'lodash';
import * as Omja from '../index';
import * as bs from 'bookshelf';
import * as knex from 'knex';

type Model = bs.Model<any>;


describe('Bookshelf Adapter', () => {
  let bookshelf: bs;
  let serializer: Omja.Translator;
  let domain: string = 'https://domain.com';

  beforeAll(() => {
    bookshelf = bs(knex((<knex.Config> {})));
    serializer = new Omja.Translator('bookshelf', domain);
  });

  afterAll((done: Function) => {
    bookshelf.knex.destroy(done);
  });

  it('should serialize a basic model', () => {
    let model: Model = bookshelf.Model.forge<any>({
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
    let model: Model = bookshelf.Model.forge<any>({id: '5'});
    let result: any = serializer.toJSONAPI(model, 'models');

    expect(_.has(result, 'data.attributes.id')).toBe(false);
  });

  it('should ignore any *_id attribute on the attributes', () => {
    let model: Model = bookshelf.Model.forge<any>({
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
    expect(_.isEqual(result.data.attributes, expected.data.attributes)).toBe(true);
  });

  it('should ignore any *_type attribute on the attributes', () => {
    let model: Model = bookshelf.Model.forge<any>({
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
    expect(_.isEqual(result.data.attributes, expected.data.attributes)).toBe(true);
  });
});

describe('Bookshelf links', () => {
  let bookshelf: bs;
  let serializer: Omja.Translator;
  let domain: string = 'https://domain.com';

  beforeAll(() => {
    bookshelf = bs(knex((<knex.Config> {})));
    serializer = new Omja.Translator('bookshelf', domain);
  });

  afterAll((done: Function) => {
    bookshelf.knex.destroy(done);
  });

  it('should add top level links', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '10'});

    let result: any = serializer.toJSONAPI(model, 'models');

    let expected: any = {
      data: {
        id: '10',
        type: 'models'
      },
      links: {
        self: domain + '/models'
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should add primary data links', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5'});

    let result: any = serializer.toJSONAPI(model, 'models');

    let expected: any = {
      data: {
        id: '5',
        type: 'models',
        links: {
          self: domain + '/models' + '/5'
        }
      }
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should add related links', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5'});
    (<any> model).relations['related-model'] = bookshelf.Model.forge<any>({id: '10'});

    let result: any = serializer.toJSONAPI(model, 'models');

    let expected: any = {
      data: {
        relationships: {
          'related-model': {
            data: {
              id: '10',
              type: 'related-models' // TODO check correct casing
            },
            links: {
              self: domain + '/models/' + '5' + '/relationships/' + 'related-model',
              related: domain + '/models/' + '5' + '/related-model'
            }
          }
        }
      }
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should add pagination links', () => {
    pending('not critical');
  });

});

describe('Bookshelf relations', () => {
  pending('not yet worked on');

  let bookshelf: bs;
  let serializer: Omja.Translator;
  let domain: string = 'https://domain.com';

  beforeAll(() => {
    bookshelf = bs(knex((<knex.Config> {})));
    serializer = new Omja.Translator('bookshelf', domain);
  });

  afterAll((done: Function) => {
    bookshelf.knex.destroy(done);
  });

  it('should add relationships object');
  it('should put the related data in the included key');

  it('should give an API to ignore relations');
  it('should give an API to merge relations attributes');

});
