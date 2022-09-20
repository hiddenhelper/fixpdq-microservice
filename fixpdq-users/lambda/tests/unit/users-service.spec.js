'use strict';

const app = require('../../users-service/app');
let event = {}, context = {};

describe('Tests index', function () {
  it('verifies successful response', async () => {
    const result = await app.handler(event, context)

    console.log(result);
    expect(typeof result).toBe('object');
    expect(result.statusCode).toEqual(200);
    expect(typeof result.body).toBe('string');

  });
});
