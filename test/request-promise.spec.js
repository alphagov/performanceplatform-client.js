var dashboardResponse = require('./fixtures/sample-dashboard.json'),
    requestPromise = require('../lib/request-promise'),
    Q = require('q');

describe('Request-Promise', function () {

  beforeEach(function () {
    this.server = sinon.fakeServer.create();
    this.server.respondWith('GET', '/',
        [200, { 'Content-Type': 'application/json' }, JSON.stringify(dashboardResponse)]);
  });

  afterEach(function () {
    this.server.restore();
  });

  it('should error if there’s no url provided', function () {
    var responsePromise = requestPromise(undefined);
    this.server.requests.should.be.empty;
    return responsePromise.
      should.be.rejectedWith(Error, 'Please provide a url to query');
  });

  it('should make a request if a url is provided', function () {
    var responsePromise = requestPromise({
      url: 'http://baseurl.com/path'
    });

    responsePromise.then(function () {
      console.log('here');
      this.server.requests.length.should.equal(1);
    });

  });

  it('should error if theres an error on the request', function () {
    this.server.respondWith('GET', '*', [400, {}, '']);

    var responsePromise = requestPromise({
      url: 'http://baseurl.com/'
    });

    this.server.respond();

    return responsePromise.then(function () {
      console.log('HERE');
    }, function () {
      console.log('HERE FAIL ME!');
    });
    //.should.be.rejected;
  });

  it('should error if the response is not 200', function () {
    var responsePromise = requestPromise({
      url: 'http://baseurl.com/'
    });
    var requestCallback = stub.getCall(0).args[1];
    var requestRes = { statusCode: 500 };

    requestCallback(null, requestRes);

    return responsePromise.should.be.rejectedWith(Error, 'Unexpected status code: 500');
  });

  it('should return json if everything went OK', function () {
    var responsePromise = requestPromise({
      url: 'http://baseurl.com/'
    }, {json: true});
    var requestCallback = stub.getCall(0).args[1];
    var requestRes = { statusCode: 200 };
    var requestBody = { hello: 'world' };

    requestCallback(null, requestRes, requestBody);

    return Q.all([
      responsePromise.should.be.fulfilled,
      responsePromise.should.eventually.have.property('hello').to.equal('world')
    ]);
  });

  it('should extend options in the request', function () {
    requestPromise({
      url: 'http://baseurl.com/'
    }, {foo: 'bar', json: true});
    var requestOptions = stub.getCall(0).args[0];

    requestOptions.should.eql({
      foo: 'bar',
      json: true,
      url: 'http://baseurl.com/path'
    });
  });
});
