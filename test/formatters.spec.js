var formatter = require('../lib/utils/formatter');
var moment = require('moment-timezone');

describe('Formatter', function () {

  it('exposes `format` as a function', function () {
    (typeof formatter.format).should.equal('function');
  });

  describe('format', function () {

    it('returns unformatted value if formatter does not exist', function () {
      formatter.format(10, 'notaformatter').should.equal(10);
    });
    it('returns undefined if passed value of undefined', function () {
      expect(formatter.format(undefined, 'number')).to.be.undefined;
    });
    it('returns null if passed value of null', function () {
      expect(formatter.format(null, 'number')).to.be.null;
    });

  });

  describe('time', function () {

    var dateStr;

    beforeEach(function () {
      dateStr = '2014-03-11T16:26:31.802Z';
    });

    it('outputs time formatted date object', function () {
      var input = new Date(dateStr);
      formatter.format(input, 'time').should.equal('4:26pm');
    });

    it('outputs time formatted date string', function () {
      formatter.format(dateStr, 'time').should.equal('4:26pm');
    });

    it('outputs time formatted moment object', function () {
      var input = moment(dateStr);
      formatter.format(input, 'time').should.equal('4:26pm');
    });

    it('uses format option if provided', function () {
      formatter.format(dateStr, {type: 'time', format: 'HH:mm'}).should.equal('16:26');
    });

  });

  describe('date', function () {

    var dateStr;

    beforeEach(function () {
      dateStr = '2014-03-11T16:26:31.802Z';
    });

    it('outputs date formatted date object', function () {
      var input = new Date(dateStr);
      formatter.format(input, 'date').should.equal('11 March 2014');
    });

    it('outputs date formatted date string', function () {
      formatter.format(dateStr, 'date').should.equal('11 March 2014');
    });

    it('outputs date formatted moment object', function () {
      var input = moment(dateStr);
      formatter.format(input, 'date').should.equal('11 March 2014');
    });

    it('uses format option if provided', function () {
      formatter.format(dateStr, {type: 'date', format: 'DD/MM/YY'}).should.equal('11/03/14');
    });

    it('uses calendar option if provided', function () {
      formatter.format(dateStr, {type: 'date', calendar: true}).should.equal('11 Mar 2014');
    });

    it('returns a date range if passed an array of values', function () {
      var input = [
        new Date('2014-01-01T00:00:00Z'),
        new Date('2014-01-08T00:00:00Z')
      ];
      formatter.format(input, 'date').should.equal('1 to 7 January 2014');
    });

    it('outputs a range with the default date formatting', function () {
      var range = [new Date('2014-03-11T00:00:00.000Z'),
        new Date('2014-03-18T00:00:00.000Z')];
      formatter.format(range, 'date').should.equal('11 to 17 March 2014');
    });

    it('outputs a range with the custom date formatting', function () {
      var range = [new Date('2014-03-11T00:00:00.000Z'),
        new Date('2014-03-18T00:00:00.000Z')];
      formatter.format(range, {type: 'date', format: 'DD/MM/YY'})
        .should.equal('11/03/14 to 17/03/14');
    });

  });

  describe('duration', function () {

    it('returns value in milliseconds by default', function () {
      formatter.format(567, 'duration').should.equal('567ms');
      formatter.format(1234, 'duration').should.equal('1,234ms');
    });

    it('returns values to 3 sigfigs by default', function () {
      formatter.format(567, {type: 'duration', unit: 's'}).should.equal('0.57s');
      formatter.format(1234, {type: 'duration', unit: 's'}).should.equal('1.23s');
      formatter.format(12345, {type: 'duration', unit: 's'}).should.equal('12.3s');
    });

    it('returns values rounded to correct number of decimal places', function () {
      formatter.format(567, {type: 'duration', unit: 's', dps: 2}).should.equal('0.57s');
      formatter.format(1234, {type: 'duration', unit: 's', dps: 2}).should.equal('1.23s');
      formatter.format(12345, {type: 'duration', unit: 's', dps: 2}).should.equal('12.35s');
    });

    it('returns value in minutes and seconds if required', function () {
      formatter.format(567, {type: 'duration', unit: 'm'}).should.equal('0m 1s');
      formatter.format(12345, {type: 'duration', unit: 'm'}).should.equal('0m 12s');
      formatter.format(1234500, {type: 'duration', unit: 'm'}).should.equal('20m 35s');
    });

  });

  describe('currency', function () {

    it('always returns £0 for zero input', function () {
      formatter.format(0, 'currency').should.equal('£0');
      formatter.format(0, {type: 'currency', pence: true}).should.equal('£0');
    });

    it('formats values less than 10 with pence', function () {
      formatter.format(0.567, 'currency').should.equal('£0.57');
      formatter.format(5.67, 'currency').should.equal('£5.67');
      formatter.format(15.67, 'currency').should.equal('£16');
    });

    it('returns formatted number with pound symbol', function () {
      formatter.format(567, 'currency').should.equal('£567');
      formatter.format(1234, 'currency').should.equal('£1,234');
      formatter.format(12345, 'currency').should.equal('£12,345');
    });

    it('returns formatted number with symbol option if provided', function () {
      formatter.format(0.567, {type: 'currency', symbol: '$'}).should.equal('$0.57');
      formatter.format(5.67, {type: 'currency', symbol: '$'}).should.equal('$5.67');
      formatter.format(567, {type: 'currency', symbol: '$'}).should.equal('$567');
      formatter.format(1234, {type: 'currency', symbol: '$'}).should.equal('$1,234');
      formatter.format(12345, {type: 'currency', symbol: '$'}).should.equal('$12,345');
    });

    it('returns formatted number with pound symbol and pence', function () {
      formatter.format(0.567, {type: 'currency', pence: true}).should.equal('£0.57');
      formatter.format(5.67, {type: 'currency', pence: true}).should.equal('£5.67');
      formatter.format(567, {type: 'currency', pence: true}).should.equal('£567.00');
      formatter.format(12345.67, {type: 'currency', pence: true}).should.equal('£12,345.67');
    });

  });

  describe('percent', function () {

    it('returns formatted number to 1d.p with percent symbol', function () {
      formatter.format(0.5678, 'percent').should.equal('56.8%');
    });

    it('returns 0% and 100% to 0dps', function () {
      formatter.format(0, 'percent').should.equal('0%');
      formatter.format(1, 'percent').should.equal('100%');
    });

    it('returns formatted number with percent symbol to dps specified', function () {
      formatter.format(0.5678, {type: 'percent', dps: 2}).should.equal('56.78%');
      formatter.format(1, {type: 'percent', dps: 2}).should.equal('100%');
    });

    it('returns formatted number normalised to the given value', function () {
      formatter.format(50, {type: 'percent', normalisation: 100}).should.equal('50%');
      formatter.format(100, {type: 'percent', normalisation: 100}).should.equal('100%');
    });

  });

  describe('integer', function () {

    it('returns number rounded to 0dps', function () {
      formatter.format(0.1, 'integer').should.equal('0');
      formatter.format(0.5, 'integer').should.equal('1');
      formatter.format(13.7, 'integer').should.equal('14');
      formatter.format(12345.67, 'integer').should.equal('12,346');
    });

    it('keeps decimal places on magnituded values', function () {
      formatter.format(1234567, {type: 'integer', magnitude: true}).should.equal('1.23m');
    });

  });

  describe('number', function () {

    it('always returns "0" for zero', function () {
      formatter.format(0, 'number').should.equal('0');
      formatter.format(0, {type: 'number', pad: true}).should.equal('0');
      formatter.format(0, {type: 'number', dps: 5, fixed: 5, pad: true}).should.equal('0');

    });
    it('returns "0" for numbers which round to zero', function () {
      formatter.format(0.00001, {type: 'number', dps: 2}).should.equal('0');
    });

    it('rounds numbers < 10 to 2 dp by default', function () {
      formatter.format(0.1234, 'number').should.equal('0.12');
      formatter.format(1.1234, 'number').should.equal('1.12');
      formatter.format(10.1234, 'number').should.equal('10.1');
    });

    it('rounds numbers > 10 && < 100 to 1 dp by default', function () {
      formatter.format(12.34, 'number').should.equal('12.3');
      formatter.format(23.45, 'number').should.equal('23.5');
      formatter.format(34.56, 'number').should.equal('34.6');
    });

    it('rounds > 100 to nearest integer by default', function () {
      formatter.format(123.34, 'number').should.equal('123');
      formatter.format(234.45, 'number').should.equal('234');
      formatter.format(345.56, 'number').should.equal('346');
    });

    it('returns number rounded to decimal places specified', function () {
      formatter.format(0.1234, {type: 'number', dps: 1}).should.equal('0.1');
      formatter.format(0.1234, {type: 'number', dps: 2}).should.equal('0.12');
      formatter.format(0.1234, {type: 'number', dps: 3}).should.equal('0.123');
      formatter.format(0.1234, {type: 'number', dps: 4}).should.equal('0.1234');
      formatter.format(0.1234, {type: 'number', dps: 5}).should.equal('0.1234');

      formatter.format(1234, {type: 'number', dps: -1}).should.equal('1,230');
      formatter.format(1234, {type: 'number', dps: -2}).should.equal('1,200');
    });

    it('inserts commas as a thousands separator', function () {
      formatter.format(1234567.1234, 'number').should.equal('1,234,567');
      formatter.format(123456.1234, {type: 'number', dps: 4}).should.equal('123,456.1234');
      formatter.format(12345.1234, {type: 'number', dps: 4}).should.equal('12,345.1234');
      formatter.format(1234.1234, {type: 'number', dps: 4}).should.equal('1,234.1234');
      formatter.format(123.1234, {type: 'number', dps: 4}).should.equal('123.1234');
    });

    it('does not inset commas if set to false', function () {
      formatter.format(1234567.1234, {type: 'number', commas: false}).should.equal('1234567');
      formatter.format(123456.1234, {type: 'number', dps: 1, commas: false})
        .should.equal('123456.1');
      formatter.format(12345.1234, {type: 'number', dps: 2, commas: false})
        .should.equal('12345.12');
      formatter.format(1234.1234, {type: 'number', dps: 3, commas: false}).should.equal('1234.123');
      formatter.format(123.1234, {type: 'number', dps: 4, commas: false}).should.equal('123.1234');
    });

    it('pads with zeroes if fixed options is passed', function () {
      formatter.format(0.1, {type: 'number', fixed: 4, dps: 4}).should.equal('0.1000');
      formatter.format(0.12, {type: 'number', fixed: 4, dps: 4}).should.equal('0.1200');
      formatter.format(0.123, {type: 'number', fixed: 4, dps: 4}).should.equal('0.1230');
      formatter.format(0.1234, {type: 'number', fixed: 4, dps: 4}).should.equal('0.1234');
      formatter.format(0.12345, {type: 'number', fixed: 4, dps: 4}).should.equal('0.1235');
    });

    it('rounds decimal values to specified number of significant figures', function () {
      formatter.format(1.234, {type: 'number', sigfigs: 4}).should.equal('1.234');
      formatter.format(1.234, {type: 'number', sigfigs: 3}).should.equal('1.23');
      formatter.format(1.234, {type: 'number', sigfigs: 2}).should.equal('1.2');
      formatter.format(1.234, {type: 'number', sigfigs: 1}).should.equal('1');
    });

    it('does not round integer values to significant figures', function () {
      formatter.format(1234, {type: 'number', sigfigs: 2}).should.equal('1,234');
    });

    it('ignores significant figures  if decimal places are also defined', function () {
      formatter.format(1.234, {type: 'number', dps: 3, sigfigs: 4}).should.equal('1.234');
      formatter.format(1.234, {type: 'number', dps: 3, sigfigs: 3}).should.equal('1.234');
      formatter.format(1.234, {type: 'number', dps: 3, sigfigs: 2}).should.equal('1.234');
      formatter.format(1.234, {type: 'number', dps: 3, sigfigs: 1}).should.equal('1.234');
    });

    describe('pad', function () {

      it('adds extra zeros', function () {

        formatter.format(1, {type: 'number', pad: true}).should.equal('1.00');
        formatter.format(1.2, {type: 'number', pad: true}).should.equal('1.20');
        formatter.format(1.2, {type: 'number', pad: true, sigfigs: 4}).should.equal('1.200');

      });

    });

    describe('magnitude', function () {

      describe('numbers < 1000', function () {

        it('does not pad with additional zeros', function () {
          formatter.format(11, {type: 'number', magnitude: true, pad: true}).should.equal('11');
        });

      });

      describe('thousands', function () {

        it('does not add add "k" to numbers of a thousand that are less than to 10,000',
          function () {
          formatter.format(1000, {type: 'number', magnitude: true}).should.equal('1,000');
          formatter.format(1001, {type: 'number', magnitude: true}).should.equal('1,001');
          formatter.format(1123.11, {type: 'number', magnitude: true}).should.equal('1,123');
          formatter.format(1123, {type: 'number', magnitude: true}).should.equal('1,123');
        });

        it('adds "k" to numbers of a thousand that are greater than or equal to 10,000',
          function () {
          formatter.format(10000, {type: 'number', magnitude: true}).should.equal('10k');
          formatter.format(10001, {type: 'number', magnitude: true}).should.equal('10k');
          formatter.format(11200, {type: 'number', magnitude: true, sigfigs: 2})
            .should.equal('11k');
          formatter.format(11200, {type: 'number', magnitude: true, sigfigs: 3})
            .should.equal('11.2k');
        });

        it('rounds to 3 significant figures by default', function () {
          formatter.format(11110, {type: 'number', magnitude: true}).should.equal('11.1k');
          formatter.format(111100, {type: 'number', magnitude: true}).should.equal('111k');
        });

        it('pads out decimals with zeros if required', function () {
          formatter.format(11000, {type: 'number', magnitude: true, pad: true})
            .should.equal('11.0k');
        });

      });

      describe('millions', function () {

        it('adds "m" to numbers of a million that are greater than or equal to 1000000',
          function () {
          formatter.format(1000000, {type: 'number', magnitude: true}).should.equal('1m');
          formatter.format(1000001, {type: 'number', magnitude: true}).should.equal('1m');
          formatter.format(1100000, {type: 'number', magnitude: true, sigfigs: 1})
            .should.equal('1m');
          formatter.format(1100000, {type: 'number', magnitude: true, sigfigs: 2})
            .should.equal('1.1m');
          formatter.format(1100000, {type: 'number', magnitude: true, sigfigs: 3})
            .should.equal('1.1m');
          formatter.format(1120000, {type: 'number', magnitude: true, sigfigs: 3})
            .should.equal('1.12m');
        });

        it('rounds to 3 significant figures by default', function () {
          formatter.format(1111000, {type: 'number', magnitude: true}).should.equal('1.11m');
          formatter.format(11110000, {type: 'number', magnitude: true}).should.equal('11.1m');
          formatter.format(111100000, {type: 'number', magnitude: true}).should.equal('111m');
        });

        it('pads out decimals with zeros if required', function () {
          formatter.format(1000000, {type: 'number', magnitude: true, pad: true})
            .should.equal('1.00m');
          formatter.format(10000000, {type: 'number', magnitude: true, pad: true})
            .should.equal('10.0m');
          formatter.format(100000000, {type: 'number', magnitude: true, pad: true})
            .should.equal('100m');
        });

      });

      describe('billions', function () {

        it('adds "bn" to numbers of a billion that are greater than 1000000000', function () {
          formatter.format(1000000000, {type: 'number', magnitude: true}).should.equal('1bn');
          formatter.format(1000000001, {type: 'number', magnitude: true}).should.equal('1bn');
          formatter.format(1100000000, {type: 'number', magnitude: true, sigfigs: 1})
            .should.equal('1bn');
          formatter.format(1100000000, {type: 'number', magnitude: true, sigfigs: 2})
            .should.equal('1.1bn');
          formatter.format(1100000000, {type: 'number', magnitude: true, sigfigs: 3})
            .should.equal('1.1bn');
          formatter.format(1120000000, {type: 'number', magnitude: true, sigfigs: 3})
            .should.equal('1.12bn');
        });

        it('rounds to 3 significant figures by default', function () {
          formatter.format(1111000000, {type: 'number', magnitude: true}).should.equal('1.11bn');
          formatter.format(11110000000, {type: 'number', magnitude: true}).should.equal('11.1bn');
          formatter.format(111100000000, {type: 'number', magnitude: true}).should.equal('111bn');
        });

        it('pads out decimals with zeros if required', function () {
          formatter.format(1000000000, {type: 'number', magnitude: true, pad: true})
            .should.equal('1.00bn');
          formatter.format(10000000000, {type: 'number', magnitude: true, pad: true})
            .should.equal('10.0bn');
          formatter.format(100000000000, {type: 'number', magnitude: true, pad: true})
            .should.equal('100bn');
        });

      });

      describe('with magnitude object provided', function () {

        it('uses option object to format', function () {
          formatter.format(5000, {type: 'number', magnitude: {value: 1000, suffix: 'k'}})
            .should.equal('5k');
          formatter.format(5000, {
            type: 'number',
            magnitude: {value: 1000, suffix: 'k'},
            pad: true
          }).should.equal('5.00k');
          formatter.format(100, {type: 'number', magnitude: {value: 1000, suffix: 'k'}})
            .should.equal('0.1k');
          formatter.format(100, {
            type: 'number',
            magnitude: {value: 1000, suffix: 'k'},
            pad: true
          }).should.equal('0.10k');
        });

      });

      describe('abbreviated figures', function () {

        it('wraps abbreviated values in an abbr tag', function () {
          formatter.format(12345678, {
            type: 'number',
            magnitude: true,
            pad: true,
            abbr: true
          }).should.equal('<abbr title="12,345,678">12.3m</abbr>');
        });

        it('includes currency symbols where appropriate', function () {
          formatter.format(12345678, {
            type: 'currency',
            magnitude: true,
            pad: true,
            abbr: true
          }).should.equal('<abbr title="£12,345,678">£12.3m</abbr>');
        });

        it('does not wrap unabbreviated values', function () {
          formatter.format(1234, {type: 'number', magnitude: true, pad: true, abbr: true})
            .should.equal('1,234');
        });

      });

    });

  });

  describe('sentence', function () {

    it('breaks hyphen separated string into words and capitalises first word', function () {
      formatter.format('one-two-three', 'sentence').should.equal('One two three');
    });

    it('converts `i` to uppercase', function () {
      formatter.format('one-two-i-three-fish', 'sentence').should.equal('One two I three fish');
      formatter.format('one-two-three-fish-i', 'sentence').should.equal('One two three fish I');
    });

    it('converts words in `uppercase` option array to uppercase', function () {
      formatter.format('one-two-i-three-fish', {
        type: 'sentence',
        uppercase: ['two']
      }).should.equal('One TWO I three fish');
      formatter.format('one-two-three-fish-i', {
        type: 'sentence',
        uppercase: ['fish']
      }).should.equal('One two three FISH I');
    });

    it('adds question marks to question-like sentences', function () {
      formatter.format('how-do-i-know', 'sentence').should.equal('How do I know?');
      //don't match words not at start of sentence
      formatter.format('i-know-how', 'sentence').should.equal('I know how');
      //don't match incomplete words
      formatter.format('howl-like-a-wolf', 'sentence').should.equal('Howl like a wolf');

      formatter.format('who-am-i', 'sentence').should.equal('Who am I?');
      formatter.format('doctor-who', 'sentence').should.equal('Doctor who');

      formatter.format('what-is-this', 'sentence').should.equal('What is this?');
      formatter.format('why-is-it', 'sentence').should.equal('Why is it?');
      formatter.format('when-is-it', 'sentence').should.equal('When is it?');
      formatter.format('why-is-it', 'sentence').should.equal('Why is it?');
      formatter.format('where-is-it', 'sentence').should.equal('Where is it?');
      formatter.format('is-it', 'sentence').should.equal('Is it?');
      formatter.format('can-i-come', 'sentence').should.equal('Can I come?');
    });

  });

  describe('plural', function () {

    it('throws if no singular option provided', function () {
      var fn = function () {
        return formatter.format(1, 'plural');
      };
      expect(fn).to.throw;
    });

    it('returns the singular term if the value is 1', function () {
      formatter.format(1, {type: 'plural', singular: 'cat'}).should.equal('cat');
    });

    it('returns the singular term with an "s" if the value is > 1', function () {
      formatter.format(2, {type: 'plural', singular: 'cat'}).should.equal('cats');
    });

    it('returns the plural term if defined and the value is > 1', function () {
      formatter.format(2, {type: 'plural', singular: 'formula', plural: 'formulae'})
        .should.equal('formulae');
    });

  });

  describe('url', function () {
    it('formats a URL as a link', function () {
      formatter.format('http://example.com/', 'url')
        .should.equal('<a href="http://example.com/">http://example.com/</a>');
    });

    it('handles undefined URLs gracefully', function () {
      expect(formatter.format(undefined, 'url')).to.be.undefined;
    });

    it('handles empty URLs gracefully', function () {
      formatter.format('', 'url').should.equal('');
    });

    it('formats a URL with query parameters', function () {
      formatter.format('http://example.com/?q=search&f=123', 'url')
        .should.equal('<a href="http://example.com/?q=search&f=123">' +
        'http://example.com/?q=search&amp;f=123</a>');
    });
  });

});
