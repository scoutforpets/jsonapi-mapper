'use strict';

import * as _ from 'lodash';
import * as bs from 'bookshelf';
import * as knex from 'knex';

import * as Mapper from '../src/mapper';

type Model = bs.Model<any>;
type Collection = bs.Collection<any>;

describe('Bookshelf Adapter', () => {
  let bookshelf: bs;
  let mapper: Mapper.Bookshelf;
  let domain: string = 'https://domain.com';

  beforeAll(() => {
    bookshelf = bs(knex(({} as knex.Config)));
    mapper = new Mapper.Bookshelf(domain);
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

    let result: any = mapper.map(model, 'models');

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

  it('should serialize a basic model with custom id attribute', () => {
    let customModel: any = bookshelf.Model.extend<any>({
      idAttribute : 'email'
    });

    let model: any = customModel.forge({
      email : 'foo@example.com',
      name: 'A test model',
      description: 'something to use as a test'
    });

    let result: any = mapper.map(model, 'models');

    let expected: any = {
      data: {
        id : 'foo@example.com',
        type: 'models',
        attributes: {
          email : 'foo@example.com',
          name: 'A test model',
          description: 'something to use as a test'
        }
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should serialize related model with custom id attribute in relationships object', () => {

    let customModel: any = bookshelf.Model.extend<any>({
      idAttribute : 'email'
    });

    let model: any = bookshelf.Model.forge({
      id : 5,
      name: 'A test model',
      description: 'something to use as a test'
    });

    (model as any).relations['related-model'] = customModel.forge({
      email: 'foo@example.com',
      attr2: 'value2'
    });

    let result: any = mapper.map(model, 'models');

    let expected: any = {
      data: {
        relationships: {
          'related-model': {
            data: {
              id: 'foo@example.com',
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

  it('should inlcude a repeated model only once in the included array', () => {
    let model: any = bookshelf.Model.forge({
      id : 5,
      name: 'A test model',
      description: 'something to use as a test'
    });

    let related: any = bookshelf.Model.forge({
      id: 4,
      attr: 'first value'
    });

    (model as any).relations.relateds = bookshelf.Collection.forge<any>([related]);
    (model as any).relations.related = related;

    let result: any = mapper.map(model, 'models');

    let expected: any = {
      data: {
        relationships: {
          'related':  {
            data: {
                id: '4',
                type: 'relateds'
            }
          },
          'relateds':  {
            data: [
              {
                id: '4',
                type: 'relateds'
              }
            ]
          }
        }
      },
      included: [
        {
          id: '4',
          type: 'relateds',
          attributes: {
            attr: 'first value'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
    expect(result.included.length).toBe(1);
  });

  it('should serialize related model with custom id attribute in included array', () => {

    let customModel: any = bookshelf.Model.extend<any>({
      idAttribute : 'email'
    });

    let model: any = bookshelf.Model.forge({
      id : 5,
      name: 'A test model',
      description: 'something to use as a test'
    });

    (model as any).relations['related-model'] = customModel.forge({
      email: 'foo@example.com',
      attr2: 'value2'
    });

    let result: any = mapper.map(model, 'models');

    let expected: any = {
      included: [
        {
          id: 'foo@example.com',
          type: 'related-models',
          attributes: {
            email: 'foo@example.com',
            attr2: 'value2'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should serialize a collection with custom id attribute', () => {
    let customModel: any = bookshelf.Model.extend<any>({
      idAttribute : 'email'
    });

    let customCollection: any = bookshelf.Collection.extend<any>({
      model : customModel
    });

    let model1: any = customModel.forge({
      email : 'foo@example.com',
      name: 'A test model1',
      description: 'something to use as a test'
    });

    let collection: Collection = bookshelf.Collection.forge<any>([model1]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      data: [
        {
          id : 'foo@example.com',
          type: 'models',
          attributes: {
            email : 'foo@example.com',
            name: 'A test model1',
            description: 'something to use as a test'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should serialize a collection with custom id attribute within a related model on relationships object', () => {
    let customModel: any = bookshelf.Model.extend<any>({
      idAttribute : 'email'
    });

    let customCollection: any = bookshelf.Collection.extend<any>({
      model : customModel
    });

    let model: any = bookshelf.Model.forge({
      id : 5,
      name: 'A test model',
      description: 'something to use as a test'
    });

    (model as any).relations['related-model'] = customModel.forge({
      email: 'foo@example.com',
      attr2: 'value2'
    });

    let collection: Collection = bookshelf.Collection.forge<any>([model]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      data: [
        {
          type: 'models',
          id : '5',
          attributes: {
            name: 'A test model',
            description: 'something to use as a test'
          },
          links : { self : 'https://domain.com/models/5' },
          relationships : {
            'related-model' : {
              data: { id : 'foo@example.com', type : 'related-models' },
              links : {
                self : 'https://domain.com/models/5/relationships/related-model',
                related : 'https://domain.com/models/5/related-model'
              }
            }
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should serialize a collection with custom id attribute within a related model on included array', () => {
    let customModel: any = bookshelf.Model.extend<any>({
      idAttribute : 'email'
    });

    let customCollection: any = bookshelf.Collection.extend<any>({
      model : customModel
    });

    let model: any = bookshelf.Model.forge({
      id : 5,
      name: 'A test model',
      description: 'something to use as a test'
    });

    (model as any).relations['related-model'] = customModel.forge({
      email: 'foo@example.com',
      attr2: 'value2'
    });

    let collection: Collection = bookshelf.Collection.forge<any>([model]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      included: [
        {
          type: 'related-models',
          id : 'foo@example.com',
          attributes: {
            email: 'foo@example.com',
            attr2: 'value2'
          },
          links : { self : 'https://domain.com/related-models/foo@example.com' }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should serialize null or undefined data', () => {
    let result1: any = mapper.map(undefined, 'models');
    let result2: any = mapper.map(null, 'models');

    let expected: any = {
      data: null
    };

    expect(_.matches(expected)(result1)).toBe(true);
    expect(_.matches(expected)(result2)).toBe(true);
  });

  it('should not add the id to the attributes', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5'});
    let result: any = mapper.map(model, 'models');

    expect(_.has(result, 'data.attributes.id')).toBe(false);
  });

  it('should ignore any *_id attribute on the attributes', () => {
    let model: Model = bookshelf.Model.forge<any>({
      id: '4',
      attr: 'value',
      'related_id': 123,
      'another_id': '456'
    });

    let result: any = mapper.map(model, 'models');

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

    let result: any = mapper.map(model, 'models');

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

  it('should serialize an empty collection', () => {
    let collection: Collection = bookshelf.Collection.forge<any>();

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      data: []
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should serialize a collection', () => {
    let elements: Model[] = _.range(5).map((num: number) => {
      return bookshelf.Model.forge<any>({id: num, attr: 'value' + num});
    });

    let collection: Collection = bookshelf.Collection.forge<any>(elements);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      data: _.range(5).map((num: number) => {
        return {
          id: num.toString(),
          type: 'models',
          attributes: {
            attr: 'value' + num
          }
        };
      })
    };

    expect(_.matches(expected)(result)).toBe(true);
  });
});

describe('Bookshelf links', () => {
  let bookshelf: bs;
  let mapper: Mapper.Bookshelf;
  let domain: string = 'https://domain.com';

  beforeAll(() => {
    bookshelf = bs(knex(({} as knex.Config)));
    mapper = new Mapper.Bookshelf(domain);
  });

  afterAll((done: Function) => {
    bookshelf.knex.destroy(done);
  });

  it('should add top level links', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '10'});

    let result: any = mapper.map(model, 'models');

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

  it('should add top level links for a collection', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5'});
    let model2: Model = bookshelf.Model.forge<any>({id: '6'});
    let collection: Collection = bookshelf.Collection.forge<any>([model1, model2]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      data: [{
        id: '5',
        type: 'models'
      },
      {
        id: '6',
        type: 'models'
      }],
      links: {
        self: domain + '/models'
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should add primary data links', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5'});

    let result: any = mapper.map(model, 'models');

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

  it('should add primary data links for a collection', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5'});
    let model2: Model = bookshelf.Model.forge<any>({id: '6'});
    let collection: Collection = bookshelf.Collection.forge<any>([model1, model2]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      data: [{
        id: '5',
        type: 'models',
        links: {
          self: domain + '/models' + '/5'
        }
      },
      {
        id: '6',
        type: 'models',
        links: {
          self: domain + '/models' + '/6'
        }
      }]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should add related links', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5'});
    (model as any).relations['related-model'] = bookshelf.Model.forge<any>({id: '10'});

    let result: any = mapper.map(model, 'models');

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

  it('should add related links for nested relationships', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5', attr: 'value'});
    let model2: Model = bookshelf.Model.forge<any>({id: '6', attr: 'value'});
    let model3: Model = bookshelf.Model.forge<any>({id: '7', attr: 'value'});

    (model1 as any).relations['related-model'] = model2;
    (model2 as any).relations['nested-related-model'] = model3;

    let result: any = mapper.map(model1, 'models');

    let expected: any = {
      data: {
        relationships: {
          'related-model': {
            data: {
              type: 'related-models',
              id: '6'
            }
          }
        }
      },
      included: [
        {
          id: '6',
          type: 'related-models',
          attributes: {
            attr: 'value'
          },
          relationships: {
            'nested-related-model': {
              data: {
                type: 'nested-related-models',
                id: '7'
              },
              links: {
                self: `${domain}/related-models/6/relationships/nested-related-model`,
                related: `${domain}/related-models/6/nested-related-model`
              }
            }
          }
        },
        {
          id: '7',
          type: 'nested-related-models',
          attributes: {
            attr: 'value'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should add related links for nested relationships within a collection', () => {

      let model1: Model = bookshelf.Model.forge<any>({id: '5', attr: 'value'});
      let model2: Model = bookshelf.Model.forge<any>({id: '6', attr: 'value'});

      (model1 as any).relations['related-model'] = model2;
      (model2 as any).relations['nested-related-models'] = bookshelf.Collection.forge<any>([
          bookshelf.Model.forge<any>({id: '10', attr: 'value'}),
          bookshelf.Model.forge<any>({id: '11', attr: 'value'})
      ]);

      let collection: Collection = bookshelf.Collection.forge<any>([model1]);

      let result: any = mapper.map(collection, 'models');

      let expected: any = {
            included: [
                {
                    id: '6',
                    type: 'related-models',
                    attributes: {
                        attr: 'value'
                    },
                    relationships: {
                        'nested-related-models': {
                            data: [{
                                type: 'nested-related-models',
                                id: '10'
                            }, {
                                    type: 'nested-related-models',
                                    id: '11'
                                }],
                            links: {
                                self: `${domain}/related-models/6/relationships/nested-related-models`,
                                related: `${domain}/related-models/6/nested-related-models`
                            }
                        }
                    }
                },
                {
                    id: '10',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                },
                {
                    id: '11',
                    type: 'nested-related-models',
                    attributes: {
                        attr: 'value'
                    }
                }
            ],
            data: [{
                relationships: {
                    'related-model': {
                        data: {
                            type: 'related-models',
                            id: '6'
                        }
                    }
                }
            }]
        };

      expect(_.matches(expected)(result)).toBe(true);

  });

  it('should add pagination links', () => {
    let limit: number = 10;
    let offset: number = 40;
    let total: number = 100;

    let elements: Model[] = _.range(10).map((num: number) => {
      return bookshelf.Model.forge<any>({id: num, attr: 'value' + num});
    });

    let collection: Collection = bookshelf.Collection.forge<any>(elements);

    let result: any = mapper.map(collection, 'models', {
      pagination: { limit, offset, total }
    });

    let expected: any = {
      links: {
        first: domain + '/models?page[limit]=10&page[offset]=0',
        prev: domain + '/models?page[limit]=10&page[offset]=30',
        next: domain + '/models?page[limit]=10&page[offset]=50',
        last: domain + '/models?page[limit]=10&page[offset]=90'
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should not add pagination links if no pagination data is passed', () => {
    let limit: number = 10;
    let offset: number = 40;
    let total: number = 100;

    let elements: Model[] = _.range(10).map((num: number) => {
      return bookshelf.Model.forge<any>({id: num, attr: 'value' + num});
    });

    let collection: Collection = bookshelf.Collection.forge<any>(elements);

    let result: any = mapper.map(collection, 'models');

    expect(result.links).toBeDefined();
    expect(Object.keys(result.links)).not.toContain('prev');
    expect(Object.keys(result.links)).not.toContain('first');
    expect(Object.keys(result.links)).not.toContain('next');
    expect(Object.keys(result.links)).not.toContain('last');
  });

  it('should support bookshelf\'s new `rowCount` property passed by `Model#fetchPage`', () => {
    let limit: number = 10;
    let offset: number = 40;
    let total: number = 100;

    let elements: Model[] = _.range(10).map((num: number) => {
      return bookshelf.Model.forge<any>({id: num, attr: 'value' + num});
    });

    let collection: Collection = bookshelf.Collection.forge<any>(elements);

    let result: any = mapper.map(collection, 'models', {
      pagination: { limit, offset, rowCount: total }
    });

    let expected: any = {
      links: {
        first: domain + '/models?page[limit]=' + limit + '&page[offset]=' + 0,
        prev: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset - limit),
        next: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (offset + limit),
        last: domain + '/models?page[limit]=' + limit + '&page[offset]=' + (total - limit)
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should omit `first` and `prev` pagination links if offset = 0', () => {
    let limit: number = 5;
    let offset: number = 0;
    let total: number = 10;

    let collection: Collection = bookshelf.Collection.forge<any>([]);

    let result: any = mapper.map(collection, 'models', {
      pagination: { limit, offset, total }
    });

    expect(result.links).toBeDefined();
    expect(Object.keys(result.links)).not.toContain('first');
    expect(Object.keys(result.links)).not.toContain('prev');
    expect(Object.keys(result.links)).toContain('next');
    expect(Object.keys(result.links)).toContain('last');
  });

  it('should omit `next` and `last` pagination links if at last page', () => {
    let limit: number = 5;
    let offset: number = 5;
    let total: number = 10;

    let collection: Collection = bookshelf.Collection.forge<any>([]);

    let result: any = mapper.map(collection, 'models', {
      pagination: { limit, offset, total }
    });

    expect(result.links).toBeDefined();
    expect(Object.keys(result.links)).toContain('first');
    expect(Object.keys(result.links)).toContain('prev');
    expect(Object.keys(result.links)).not.toContain('next');
    expect(Object.keys(result.links)).not.toContain('last');
  });

  it('should not add pagination links if collection is empty', () => {
    let limit: number = 10;
    let offset: number = 40;
    let total: number = 0;

    let collection: Collection = bookshelf.Collection.forge<any>([]);

    let result: any = mapper.map(collection, 'models', {
      pagination: { limit, offset, total }
    });

    expect(result.links).toBeDefined();
    expect(Object.keys(result.links)).not.toContain('prev');
    expect(Object.keys(result.links)).not.toContain('first');
    expect(Object.keys(result.links)).not.toContain('next');
    expect(Object.keys(result.links)).not.toContain('last');
  });

  it('should not add pagination links if total <= limit', () => {
    let limit: number = 10;
    let offset: number = 0;
    let total: number = 5;

    let elements: Model[] = _.range(total).map((num: number) => {
      return bookshelf.Model.forge<any>({id: num, attr: 'value' + num});
    });

    let collection: Collection = bookshelf.Collection.forge<any>(elements);

    let result: any = mapper.map(collection, 'models', {
      pagination: { limit, offset, total }
    });

    expect(result.links).toBeDefined();
    expect(Object.keys(result.links)).not.toContain('prev');
    expect(Object.keys(result.links)).not.toContain('first');
    expect(Object.keys(result.links)).not.toContain('next');
    expect(Object.keys(result.links)).not.toContain('last');
  });

  it('should not overlap last page with the penultimate page', () => {
    let limit: number = 3;
    let offset: number = 3;
    let total: number = 10;

    let elements: Model[] = _.range(10).map((num: number) => {
      return bookshelf.Model.forge<any>({id: num, attr: 'value' + num});
    });

    let collection: Collection = bookshelf.Collection.forge<any>(elements);

    let result: any = mapper.map(collection, 'models', {
      pagination: { limit, offset, total }
    });

    let expected: any = {
      links: {
        next: domain + '/models?page[limit]=' + 3 + '&page[offset]=' + 6,
        last: domain + '/models?page[limit]=' + 1 + '&page[offset]=' + 9
      }
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should not serialize links when `enableLinks: false`', () => {

      let model1: Model = bookshelf.Model.forge<any>({id: '5', attr: 'value'});
      let model2: Model = bookshelf.Model.forge<any>({id: '6', attr: 'value'});

      (model1 as any).relations['related-model'] = model2;
      (model2 as any).relations['nested-related-models'] = bookshelf.Collection.forge<any>([
          bookshelf.Model.forge<any>({id: '10', attr: 'value'})
      ]);

      let collection: Collection = bookshelf.Collection.forge<any>([model1]);

      let result: any = mapper.map(collection, 'models', { enableLinks: false });

      expect(result.links).not.toBeDefined();
      expect(result.data[0].relationships['related-model'].links).not.toBeDefined();
      expect(result.included[0].links).not.toBeDefined();
      expect(result.included[1].links).not.toBeDefined();
  });

});

describe('Bookshelf relations', () => {

  let bookshelf: bs;
  let mapper: Mapper.Bookshelf;
  let domain: string = 'https://domain.com';

  beforeAll(() => {
    bookshelf = bs(knex(({} as knex.Config)));
    mapper = new Mapper.Bookshelf(domain);
  });

  afterAll((done: Function) => {
    bookshelf.knex.destroy(done);
  });

  it('should add relationships object', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5', attr: 'value'});
    (model as any).relations['related-model'] = bookshelf.Model.forge<any>({id: '10', attr2: 'value2'});
    (model as any).relations['related-model']
                 .relations['inner-related-model'] = bookshelf.Model.forge<any>({id: '20', attr3: 'value3'});

    let result: any = mapper.map(model, 'model');

    let expected: any = {
      data: {
        id: '5',
        type: 'models',
        attributes: {
          attr: 'value'
        },
        relationships: {
          'related-model': {
            data: {
              id: '10',
              type: 'related-models'
            }
          }
        }
      },
      included: [
        {
          type: 'related-models',
          id: '10',
          attributes: {
            attr2: 'value2'
          },
          relationships: {
            'inner-related-model': {
              data: {
                id: '20',
                type: 'inner-related-models'
              }
            }
          }
        },
        {
          type: 'inner-related-models',
          id: '20',
          attributes: {
            attr3: 'value3'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should put the single related object in the included array', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});
    (model as any).relations['related-model'] = bookshelf.Model.forge<any>({id: '10', attr2: 'value2'});

    let result: any = mapper.map(model, 'models');

    let expected: any = {
      included: [
        {
          id: '10',
          type: 'related-models',
          attributes: {
            attr2: 'value2'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should return empty array when collection is empty', () => {
    let collection: Collection = bookshelf.Collection.forge<any>([]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      data : []
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should put the array of related objects in the included array', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});

    (model1 as any).relations['related-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '10', attr2: 'value20'}),
      bookshelf.Model.forge<any>({id: '11', attr2: 'value21'})
    ]);

    let model2: Model = bookshelf.Model.forge<any>({id: '6', atrr: 'value'});

    (model2 as any).relations['related-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '12', attr2: 'value22'}),
      bookshelf.Model.forge<any>({id: '13', attr2: 'value23'})
    ]);

    let collection: Collection = bookshelf.Collection.forge<any>([model1, model2]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      included: [
        {
          id: '10',
          type: 'related-models',
          attributes: {
            attr2: 'value20'
          }
        },
        {
          id: '11',
          type: 'related-models',
          attributes: {
            attr2: 'value21'
          }
        },
        {
          id: '12',
          type: 'related-models',
          attributes: {
            attr2: 'value22'
          }
        },
        {
          id: '13',
          type: 'related-models',
          attributes: {
            attr2: 'value23'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should put the array of related objects in the included array with same related', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});

    (model1 as any).relations['related1-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '10', attr2: 'value20'}),
      bookshelf.Model.forge<any>({id: '11', attr2: 'value21'})
    ]);

    let model2: Model = bookshelf.Model.forge<any>({id: '6', atrr: 'value'});

    (model2 as any).relations['related1-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '11', attr2: 'value21'}),
      bookshelf.Model.forge<any>({id: '12', attr2: 'value22'})
    ]);

    let collection: Collection = bookshelf.Collection.forge<any>([model1, model2]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      included: [
        {
          id: '10',
          type: 'related1-models',
          attributes: {
            attr2: 'value20'
          }
        },
        {
          id: '11',
          type: 'related1-models',
          attributes: {
            attr2: 'value21'
          }
        },
        {
          id: '12',
          type: 'related1-models',
          attributes: {
            attr2: 'value22'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should put the array of related objects in the included array with different related', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});

    (model1 as any).relations['related1-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '10', attr2: 'value20'}),
      bookshelf.Model.forge<any>({id: '11', attr2: 'value21'})
    ]);

    let model2: Model = bookshelf.Model.forge<any>({id: '6', atrr: 'value'});

    (model2 as any).relations['related2-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '12', attr2: 'value22'}),
      bookshelf.Model.forge<any>({id: '13', attr2: 'value23'})
    ]);

    let model3: Model = bookshelf.Model.forge<any>({id: '7', atrr: 'value'});

    (model3 as any).relations['related2-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '13', attr2: 'value23'}),
      bookshelf.Model.forge<any>({id: '14', attr2: 'value24'})
    ]);

    let collection: Collection = bookshelf.Collection.forge<any>([model1, model2, model3]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      included: [
        {
          id: '10',
          type: 'related1-models',
          attributes: {
            attr2: 'value20'
          }
        },
        {
          id: '11',
          type: 'related1-models',
          attributes: {
            attr2: 'value21'
          }
        },
        {
          id: '12',
          type: 'related2-models',
          attributes: {
            attr2: 'value22'
          }
        },
        {
          id: '13',
          type: 'related2-models',
          attributes: {
            attr2: 'value23'
          }
        },
        {
          id: '14',
          type: 'related2-models',
          attributes: {
            attr2: 'value24'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should support including nested relationships', () => {

    let model1: Model = bookshelf.Model.forge<any>({id: '5', attr: 'value'});
    let model2: Model = bookshelf.Model.forge<any>({id: '6', attr: 'value'});
    let model3: Model = bookshelf.Model.forge<any>({id: '7', attr: 'value'});

    (model1 as any).relations['related-model'] = model2;
    (model2 as any).relations['nested-related-model'] = model3;

    let result: any = mapper.map(model1, 'models');

    let expected: any = {
      included: [
        {
          id: '6',
          type: 'related-models',
          attributes: {
            attr: 'value'
          },
          relationships: {
              'nested-related-model': {
                  data: {
                      type: 'nested-related-models',
                      id: '7'
                  }
              }
          }
        },
        {
          id: '7',
          type: 'nested-related-models',
          attributes: {
            attr: 'value'
          }
        }
        ],
        data: {
            relationships: {
                'related-model': {
                    data: {
                        type: 'related-models',
                        id: '6'
                    }
                }
            }
        }
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should support including nested has-many relationships', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5', attr: 'value'});
    let model2: Model = bookshelf.Model.forge<any>({id: '6', attr: 'value'});


    (<any> model1).relations['related-models'] = bookshelf.Collection.forge<any>([model2]);
    (<any> model2).relations['nested-related-models'] = bookshelf.Collection.forge<any>([
        bookshelf.Model.forge<any>({id: '10', attr: 'value'}),
        bookshelf.Model.forge<any>({id: '11', attr: 'value'})
    ]);

    let collection: Collection = bookshelf.Collection.forge<any>([model1]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
          included: [
              {
                  id: '6',
                  type: 'related-models',
                  attributes: {
                      attr: 'value'
                  },
                  relationships: {
                      'nested-related-models': {
                          data: [{
                              type: 'nested-related-models',
                              id: '10'
                          }, {
                                  type: 'nested-related-models',
                                  id: '11'
                              }],
                          links: {
                              self: `${domain}/related-models/6/relationships/nested-related-models`,
                              related: `${domain}/related-models/6/nested-related-models`
                          }
                      }
                  }
              },
              {
                  id: '10',
                  type: 'nested-related-models',
                  attributes: {
                      attr: 'value'
                  }
              },
              {
                  id: '11',
                  type: 'nested-related-models',
                  attributes: {
                      attr: 'value'
                  }
              }
          ],
          data: [{
              relationships: {
                  'related-models': {
                      data: [
                        {
                            type: 'related-models',
                            id: '6'
                        }
                      ]
                  }
              }
          }]
      };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should support including nested relationships when acting on a collection', () => {

    let model1: Model = bookshelf.Model.forge<any>({id: '5', attr: 'value'});
    let model2: Model = bookshelf.Model.forge<any>({id: '6', attr: 'value'});

    (model1 as any).relations['related-model'] = model2;
    (model2 as any).relations['nested-related-models'] = bookshelf.Collection.forge<any>([
        bookshelf.Model.forge<any>({id: '10', attr: 'value'}),
        bookshelf.Model.forge<any>({id: '11', attr: 'value'})
    ]);

    let collection: Collection = bookshelf.Collection.forge<any>([model1]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
        included: [
            {
                id: '6',
                type: 'related-models',
                attributes: {
                    attr: 'value'
                },
                relationships: {
                    'nested-related-models': {
                        data: [{
                            type: 'nested-related-models',
                            id: '10'
                        }, {
                                type: 'nested-related-models',
                                id: '11'
                            }]
                    }
                }
            },
            {
                id: '10',
                type: 'nested-related-models',
                attributes: {
                    attr: 'value'
                }
            },
            {
                id: '11',
                type: 'nested-related-models',
                attributes: {
                    attr: 'value'
                }
            }
        ],
        data: [{
            relationships: {
                'related-model': {
                    data: {
                        type: 'related-models',
                        id: '6'
                    }
                }
            }
        }]
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should put the array of related objects in the included array with proper attributes even if relation is empty', () => {
    let model1: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});

    (model1 as any).relations['related-models'] = bookshelf.Collection.forge<any>();

    let model2: Model = bookshelf.Model.forge<any>({id: '6', atrr: 'value'});

    (model2 as any).relations['related-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '12', attr2: 'value22'}),
      bookshelf.Model.forge<any>({id: '13', attr2: 'value23'})
    ]);

    let collection: Collection = bookshelf.Collection.forge<any>([model1, model2]);

    let result: any = mapper.map(collection, 'models');

    let expected: any = {
      included: [
        {
          id: '12',
          type: 'related-models',
          attributes: {
            attr2: 'value22'
          }
        },
        {
          id: '13',
          type: 'related-models',
          attributes: {
            attr2: 'value23'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);

  });

  it('should give an option to ignore relations', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});
    (model as any).relations['related-models'] = bookshelf.Collection.forge<any>([
      bookshelf.Model.forge<any>({id: '10', attr2: 'value20'}),
      bookshelf.Model.forge<any>({id: '11', attr2: 'value21'})
    ]);

    let result1: any = mapper.map(model, 'models', {relations: true});
    let result2: any = mapper.map(model, 'models', {relations: false});

    let expected1: any = {
      included: [
        {
          id: '10',
          type: 'related-models',
          attributes: {
            attr2: 'value20'
          }
        },
        {
          id: '11',
          type: 'related-models',
          attributes: {
            attr2: 'value21'
          }
        }
      ]
    };

    expect(_.matches(expected1)(result1)).toBe(true);
    expect(_.has(result2, 'data.relationships.related-models')).toBe(false);
    expect(_.has(result2, 'included')).toBe(false);

  });

  it('should give an option to choose which relations to add', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});
    (model as any).relations['related-one'] = bookshelf.Model.forge<any>({id: '10', attr1: 'value1'});
    (model as any).relations['related-two'] = bookshelf.Model.forge<any>({id: '20', attr2: 'value2'});

    let result: any = mapper.map(model, 'models', {relations: ['related-two']});

    let expected: any = {
      included: [
        {
          id: '20',
          type: 'related-twos',
          attributes: {
            attr2: 'value2'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should give an option to sepcify relation types with an object', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});
    (model as any).relations['related-one'] = bookshelf.Model.forge<any>({id: '10', attr1: 'value1'});
    (model as any).relations['related-two'] = bookshelf.Model.forge<any>({id: '20', attr2: 'value2'});

    let result: any = mapper.map(model, 'models', {relationTypes: {'related-one': 'inners', 'related-two': 'non-plural'}});

    let expected: any = {
      included: [
        {
          id: '10',
          type: 'inners',
          attributes: {
            attr1: 'value1'
          }
        },
        {
          id: '20',
          type: 'non-plural',
          attributes: {
            attr2: 'value2'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should give an option to sepcify relation types with a function', () => {
    let model: Model = bookshelf.Model.forge<any>({id: '5', atrr: 'value'});
    (model as any).relations['related-one'] = bookshelf.Model.forge<any>({id: '10', attr1: 'value1'});
    (model as any).relations['related-two'] = bookshelf.Model.forge<any>({id: '20', attr2: 'value2'});

    let result: any = mapper.map(model, 'models', {relationTypes: () => 'models'});

    let expected: any = {
      included: [
        {
          id: '10',
          type: 'models',
          attributes: {
            attr1: 'value1'
          }
        },
        {
          id: '20',
          type: 'models',
          attributes: {
            attr2: 'value2'
          }
        }
      ]
    };

    expect(_.matches(expected)(result)).toBe(true);
  });

  it('should give an API to merge relations attributes', () => {
    pending('Not targeted for release 1.x');
  });

});
