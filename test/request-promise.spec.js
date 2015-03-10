var requireSubvert = require('require-subvert')(__dirname),
    Q = require('q');

describe('Request-Promise', function () {
  var requestPromise,
      stub;

  beforeEach(function () {
    stub = sinon.stub();
    requireSubvert.subvert('request', stub);
    requestPromise = requireSubvert.require('../lib/request-promise');
  });

  it('should error if there’s no url provided', function () {
    var responsePromise = requestPromise(undefined);

    stub.should.not.have.been.called;

    return responsePromise.
      should.be.rejectedWith(Error, 'Please provide a url to query');
  });

  it('should make a request if a url is provided', function () {
    requestPromise({url: 'http://baseurl.com/path'});

    stub.should.have.been.called;
  });

  it('should error if theres an error on the request', function () {
    var responsePromise = requestPromise({url: 'http://baseurl.com/'});
    var requestCallback = stub.getCall(0).args[1];

    requestCallback(new Error('Error in the request'));

    return responsePromise.should.be.rejectedWith(Error, 'Error in the request');
  });

  it('should error if the response is not 200', function () {
    var responsePromise = requestPromise({url: 'http://baseurl.com/'});
    var requestCallback = stub.getCall(0).args[1];
    var requestRes = { statusCode: 500 };

    requestCallback(null, requestRes);

    return responsePromise.should.be.rejectedWith(Error, 'Unexpected status code: 500');
  });

  it('should return json if everything went OK', function () {
    var responsePromise = requestPromise({url: 'http://baseurl.com/path', json: true});
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
    requestPromise({url: 'http://baseurl.com/path', foo: 'bar', json: true});
    var requestOptions = stub.getCall(0).args[0];

    requestOptions.should.eql({
      foo: 'bar',
      headers: {
        'user-agent': require('../package.json')['name'] + '/' +
          require('../package.json')['version']
      },
      json: true,
      url: 'http://baseurl.com/path'
    });
  });

  it('should respect a user-agent override in the request', function () {
    requestPromise({url: 'http://baseurl.com/path', foo: 'bar', json: true,
      headers:{ 'user-agent':'Something else'}});
    var requestOptions = stub.getCall(0).args[0];

    requestOptions.should.eql({
      foo: 'bar',
      headers: {
        'user-agent': 'Something else'
      },
      json: true,
      url: 'http://baseurl.com/path'
    });
  });
});
