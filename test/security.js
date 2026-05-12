/* global describe, it */

"use strict";

var assert = require("assert");
var Parser = require("../dist/bundle").Parser;

describe("Security", function () {
  describe("GHSA-jc85-fpwf-qm7x: code injection via context functions", function () {
    it("blocks direct function call passed via context", function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate("dangerous()", {
          dangerous: function () {
            return "pwned";
          },
        });
      }, /unregistered functions/);
    });

    it('blocks exec("whoami") style call', function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate('exec("whoami")', {
          exec: function () {
            return "pwned";
          },
        });
      }, /unregistered functions/);
    });

    it("allows functions registered in parser.functions", function () {
      var parser = new Parser();
      parser.functions.safe = function (x) {
        return x * 2;
      };
      assert.strictEqual(parser.evaluate("safe(5)"), 10);
    });

    it("allows built-in math functions", function () {
      assert.strictEqual(Parser.evaluate("sin(0)"), 0);
      assert.strictEqual(Parser.evaluate("abs(-5)"), 5);
      assert.strictEqual(Parser.evaluate("min(2, 3)"), 2);
      assert.strictEqual(Parser.evaluate("max(2, 3)"), 3);
    });
  });

  describe("GHSA-8gw3-rxh4-v6jx: prototype pollution and member-call bypass", function () {
    it("blocks member call on object passed via context", function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate("obj.method()", {
          obj: {
            method: function () {
              return "pwned";
            },
          },
        });
      }, /unregistered functions/);
    });

    it("blocks deeply nested member function call", function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate("a.b.exec()", {
          a: {
            b: {
              exec: function () {
                return "pwned";
              },
            },
          },
        });
      }, /unregistered functions/);
    });

    it("blocks __proto__ member access", function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate("x.__proto__", { x: {} });
      }, /prototype access/);
    });

    it("blocks constructor member access", function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate("x.constructor", { x: {} });
      });
    });

    it("blocks prototype member access", function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate("x.prototype", { x: {} });
      }, /prototype access/);
    });

    it("blocks __proto__ as a top-level variable", function () {
      var parser = new Parser();
      assert.throws(function () {
        parser.evaluate("__proto__");
      }, /prototype access/);
    });

    it("still allows safe member access on context objects", function () {
      var parser = new Parser();
      assert.strictEqual(
        parser.evaluate("user.name", { user: { name: "John" } }),
        "John",
      );
      assert.strictEqual(
        parser.evaluate("data.info.value", { data: { info: { value: 42 } } }),
        42,
      );
    });
  });
});
