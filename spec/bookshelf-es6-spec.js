const _ = require('lodash')
const Bookshelf = require('bookshelf')
const knex = require('knex')
const Mapper = require('../src')

describe('Issues', () => {
  let bookshelf;
  let mapper;
  const domain = 'https://domain.com'

  beforeAll(() => {
    bookshelf = Bookshelf(knex(({ client: 'sqlite3', useNullAsDefault: true })))
    mapper = new Mapper.Bookshelf(domain)
  })

  afterAll(done => {
    bookshelf.knex.destroy(done)
  })

  describe('ES6 virtuals', () => {
    beforeAll(() => {
      bookshelf.plugin('virtuals');
      mapper = new Mapper.Bookshelf(domain);
    })

    it('should return virtuals', () => {
      class UserModel extends bookshelf.Model {
        get virtuals() {
          return {
            full_name: function() {
              return `${this.get('first_name')} ${this.get('last_name')}`
            }
          }
        }
      }

      const user = new UserModel({
        id: 1,
        first_name: 'Al',
        last_name: 'Bundy'
      })

      const result = mapper.map(user, 'user')
      const expected = {
        links: {
          self: 'https://domain.com/users'
        },
        data: {
          type: 'users',
          id: '1',
          links: {
            self: 'https://domain.com/users/1'
          },
          attributes: {
            first_name: 'Al',
            last_name: 'Bundy',
            full_name: 'Al Bundy'
          }
        }
      }

      expect(_.isMatch(result, expected)).toBe(true)
    })

    it('shouldn\'t return virtuals if outputVirtuals is set to false', () => {
      class UserModel extends bookshelf.Model {
        get virtuals() {
          return {
            full_name: function() {
              return `${this.get('first_name')} ${this.get('last_name')}`
            }
          }
        }
        get outputVirtuals() {
          return false
        }
      }

      const user = new UserModel({
        id: 1,
        first_name: 'Al',
        last_name: 'Bundy'
      });

      const result = mapper.map(user, 'user')
      const expected = {
        links: {
          self: 'https://domain.com/users'
        },
        data: {
          type: 'users',
          id: '1',
          links: {
            self: 'https://domain.com/users/1'
          },
          attributes: {
            first_name: 'Al',
            last_name: 'Bundy'
          }
        }
      }

      expect(_.isMatch(result, expected)).toBe(true)
    })

    it('outputVirtuals as mapper option should override the default outputVirtuals', () => {
      class UserModel extends bookshelf.Model {
        get virtuals() {
          return {
            full_name: function() {
              return `${this.get('first_name')} ${this.get('last_name')}`
            }
          }
        }
        get outputVirtuals() {
          return false
        }
      }

      class UserModel1 extends bookshelf.Model {
        get virtuals() {
          return {
            full_name: function() {
              return `${this.get('first_name')} ${this.get('last_name')}`
            }
          }
        }
        get outputVirtuals() {
          return true
        }
      }

      const user1 = new UserModel({
        id: 1,
        first_name: 'Al',
        last_name: 'Bundy'
      });

      const user2 = new UserModel1({
        id: 1,
        first_name: 'Al',
        last_name: 'Bundy'
      });

      const result1_with = mapper.map(user1, 'user', {outputVirtuals: true})
      const result1_without = mapper.map(user1, 'user', {outputVirtuals: false})
      const result2_with = mapper.map(user2, 'user', {outputVirtuals: true})
      const result2_without = mapper.map(user2, 'user', {outputVirtuals: false})

      const expected_with = {
        links: {
          self: 'https://domain.com/users'
        },
        data: {
          type: 'users',
          id: '1',
          links: {
            self: 'https://domain.com/users/1'
          },
          attributes: {
            first_name: 'Al',
            last_name: 'Bundy'
          }
        }
      }

      const expected_without = {
        links: {
          self: 'https://domain.com/users'
        },
        data: {
          type: 'users',
          id: '1',
          links: {
            self: 'https://domain.com/users/1'
          },
          attributes: {
            first_name: 'Al',
            last_name: 'Bundy'
          }
        }
      }

      expect(_.isMatch(result1_with, expected_with)).toBe(true)
      expect(_.isMatch(result2_with, expected_with)).toBe(true)
      expect(_.isMatch(result1_without, expected_without)).toBe(true)
      expect(_.isMatch(result2_without, expected_without)).toBe(true)
    })

  });
});
