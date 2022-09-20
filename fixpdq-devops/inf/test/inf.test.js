const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const Inf = require('../lib/inf-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Inf.InfStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});