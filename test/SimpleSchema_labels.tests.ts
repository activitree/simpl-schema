/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'expect'

import { SimpleSchema } from '../src/SimpleSchema.js'

describe('SimpleSchema - label', function () {
  it('inflection', function () {
    const schema = new SimpleSchema({
      minMaxNumber: { type: SimpleSchema.Integer },
      obj: { type: Object },
      'obj.someString': { type: String }
    })

    expect(schema.label('minMaxNumber')).toBe('Min max number')
    expect(schema.label('obj.someString')).toBe('Some string')
  })

  it('dynamic', function () {
    const schema = new SimpleSchema({
      minMaxNumber: { type: SimpleSchema.Integer },
      obj: { type: Object },
      'obj.someString': { type: String }
    })

    expect(schema.label('obj.someString')).toBe('Some string')

    schema.labels({
      'obj.someString': 'A different label'
    })

    expect(schema.label('obj.someString')).toBe('A different label')
  })

  it('callback', function () {
    const schema = new SimpleSchema({
      minMaxNumber: { type: SimpleSchema.Integer },
      obj: { type: Object },
      'obj.someString': { type: String }
    })

    expect(schema.label('obj.someString')).toBe('Some string')

    schema.labels({
      'obj.someString': () => 'A callback label'
    })

    expect(schema.label('obj.someString')).toBe('A callback label')
  })

  it('should allow apostrophes ("\'") in labels', () => {
    const schema = new SimpleSchema({
      foo: {
        type: String,
        label: 'Manager/supervisor\'s name'
      }
    })
    expect(schema.label('foo')).toBe('Manager/supervisor\'s name')
  })

  it('can set label of field in nested schema', function () {
    const objSchema = new SimpleSchema({
      someString: String
    })

    const schema = new SimpleSchema({
      obj: objSchema
    })

    expect(schema.label('obj.someString')).toBe('Some string')

    schema.labels({
      'obj.someString': 'New label'
    })

    expect(schema.label('obj.someString')).toBe('New label')
  })
})
