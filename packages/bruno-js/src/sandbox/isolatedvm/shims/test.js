const addTestShimToContext = async (context, __brunoTestResults) => {
  context.global.setSync('addResult', function (v) {
    __brunoTestResults.addResult(v);
  });

  context.global.setSync('getResults', function () {
    return __brunoTestResults.getResults();
  });

  context.evalSync(`
    const isNumber = require('is-number');
    const { expect, assert } = require('chai');

    let __brunoTestResults = {
        addResult: global.addResult,
        getResults: global.getResults,
    }

    class DummyChaiAssertionError extends Error {
      constructor(message, props, ssf) {
        super(message);
        this.name = "AssertionError";
        Object.assign(this, props);
      }
    }

    const Test = (__brunoTestResults) => async (description, callback) => {
      try {
        await callback();
        __brunoTestResults.addResult({ description, status: "pass" });
      } catch (error) {
        if (error instanceof DummyChaiAssertionError) {
          const { message, actual, expected } = error;
          __brunoTestResults.addResult({
            description,
            status: "fail",
            error: message,
            actual,
            expected,
          });
        } else {
          __brunoTestResults.addResult({
            description,
            status: "fail",
            error: error.message || "An unexpected error occurred.",
          });
        }
        console.log(error);
      }
    };
    
    const test = Test(__brunoTestResults);
  `);
};

module.exports = addTestShimToContext;
