var expect = require('chai').expect,
  OhMyJSONAPI = require('../index');

describe('OhMyJSONAPI', function() {

  it("should return a new instance when called with a valid adapter", function(done) {
    var jsonApi = new OhMyJSONAPI('bookshelf');
    expect(jsonApi).to.be.a('object');
    done();
  });

  it("should throw an error when called with an invalid adapter", function(done) {
    expect(function() {
      return new OhMyJSONAPI('fakeAdapter');
    }).to.throw(Error);
    done();
  });

  it("should throw an error when called without", function(done) {
    expect(function() {
      return new OhMyJSONAPI();
    }).to.throw(Error);
    done();
  });

});

describe("OhMyJSONAPI#toJSONAPI", function() {

  it("should return a valid JSON API payload", function(done) {
    var payload = new OhMyJSONAPI('bookshelf').toJSONAPI({}, 'fakeType');
    expect(payload).to.be.a('object');
    done();
  });

  // it("should throw an error when a `type` isn't defined", function(done) {
  //   expect(function() {
  //     return new OhMyJSONAPI('bookshelf').toJSONAPI();
  //   }).to.throw(Error);
  //   done();
  // });

  it("should throw an error when a `data` isn't defined", function(done) {
    expect(function() {
      return new OhMyJSONAPI('bookshelf').toJSONAPI();
    }).to.throw(Error);
    done();
  });

});
