var requireSubvert = require('require-subvert')(__dirname),
    Q = require('q');

describe('Querist', function () {
  var Querist,
      stub,
      deferred;

  beforeEach(function () {
    deferred = Q.defer();
    stub = sinon.stub().returns(deferred.promise);
    requireSubvert.subvert('../lib/request-promise', stub);
    Querist = requireSubvert.require('../lib/querist');
  });

  describe('config', function () {
    it('should accept options to extend original config', function () {

      var client = new Querist({
        'baseUrl': 'google.com',
        'lols': 10000
      });

      client.config.should.be.an.instanceOf(Object);
      client.config.baseUrl.should.equal('google.com');
      client.config.lols.should.equal(10000);

    });
  });

  describe('GET', function () {
    describe('query for data-set status', function () {
      it('should return a list of data-sets', function () {
        var client = new Querist({
          baseUrl: 'https://www.performance.service.gov.uk/'
        });
        var responseObj = {
          data_sets: [{},{}]
        };

        deferred.resolve(responseObj);

        return client.get('_status/data-sets/').then(function (response) {
          response.should.be.an.instanceOf(Object);
          response.should.have.property('data_sets').
            and.be.instanceOf(Array);
        });

      });
    });

    describe('with options', function () {
      it('should add options to the request', function () {
        var client = new Querist();
        client.get('test', {json: false, foo: 'bar'});

        var options = stub.getCall(0).args[1];

        options.should.eql({
          json: false,
          foo: 'bar'
        });
      });

      it('should add a bearer token to the auth header', function () {
        var client = new Querist(),
          options = {
            auth: {
              bearer: 'cybersecurem8'
            },
            foo: 'bar'
          };

        client.get('test', options);

        var calledOptions = stub.getCall(0).args[1];

        calledOptions.should.eql({
          foo: 'bar',
          auth: {
            bearer: 'cybersecurem8'
          }
        });
      });
    });
  });

  describe('POST', function () {
    describe('with options', function () {
      it('should add options to the request with a POST method', function () {
        var client = new Querist();
        client.post('test', {foo: 'bar'});

        var options = stub.getCall(0).args[1];

        options.should.eql({
          foo: 'bar',
          method: 'POST'
        });
      });

      it('should add a bearer token to the auth header', function () {
        var client = new Querist(),
          options = {
            auth: {
              bearer: 'cybersecurem8'
            },
            foo: 'bar'
          };

        client.post('test', options);

        var calledOptions = stub.getCall(0).args[1];

        calledOptions.should.eql({
          foo: 'bar',
          method: 'POST',
          auth: {
            bearer: 'cybersecurem8'
          }
        });
      });
    });
  });
});
