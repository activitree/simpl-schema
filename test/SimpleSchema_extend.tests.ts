import { expect } from 'expect'

import { SimpleSchema } from '../src/SimpleSchema.js'
import expectErrorOfTypeLength from './helpers/expectErrorOfTypeLength.js'

describe('SimpleSchema - Extend Schema', function () {
  it('supports extending with no type', function () {
    const schema = new SimpleSchema({
      name: {
        type: String,
        min: 5
      }
    })
    schema.extend({
      name: {
        max: 15
      }
    })
    expect(schema.get('name', 'max')).toBe(15)
  })

  it('updates blackbox keys after extending', function () {
    const schema = new SimpleSchema({
      apple: {
        type: Object,
        blackbox: true
      },
      pear: new SimpleSchema({
        info: {
          type: Object,
          blackbox: true
        }
      })
    })

    schema.extend({
      pear: String
    })

    expect(schema.blackboxKeys()).toEqual(['apple'])
  })

  it('works for plain objects', function () {
    const schema = new SimpleSchema({
      firstName: {
        type: String,
        label: 'First name',
        optional: false
      },
      lastName: {
        type: String,
        label: 'Last name',
        optional: false
      }
    })

    schema.extend({
      firstName: {
        optional: true
      }
    })

    expect(schema.schema()).toEqual({
      firstName: {
        type: SimpleSchema.oneOf(String),
        label: 'First name',
        optional: true
      },
      lastName: {
        type: SimpleSchema.oneOf(String),
        label: 'Last name',
        optional: false
      }
    })
  })

  it('works for another SimpleSchema instance and copies validators', function () {
    const schema1 = new SimpleSchema({
      firstName: {
        type: String,
        label: 'First name',
        optional: false
      },
      lastName: {
        type: String,
        label: 'Last name',
        optional: false
      }
    })

    const schema2 = new SimpleSchema({
      age: {
        type: Number,
        label: 'Age'
      }
    })
    schema2.addValidator(() => {})
    schema2.addDocValidator(() => [])

    expect(schema1.schema()).toEqual({
      firstName: {
        type: SimpleSchema.oneOf(String),
        label: 'First name',
        optional: false
      },
      lastName: {
        type: SimpleSchema.oneOf(String),
        label: 'Last name',
        optional: false
      }
    })
    // @ts-expect-error
    expect(schema1._validators.length).toBe(0)
    // @ts-expect-error
    expect(schema1._docValidators.length).toBe(0)

    schema1.extend(schema2)

    expect(schema1.schema()).toEqual({
      firstName: {
        type: SimpleSchema.oneOf(String),
        label: 'First name',
        optional: false
      },
      lastName: {
        type: SimpleSchema.oneOf(String),
        label: 'Last name',
        optional: false
      },
      age: {
        type: SimpleSchema.oneOf(Number),
        label: 'Age',
        optional: false
      }
    })
    // @ts-expect-error
    expect(schema1._validators.length).toBe(1)
    // @ts-expect-error
    expect(schema1._docValidators.length).toBe(1)
  })

  it('keeps both min and max', function () {
    const schema = new SimpleSchema({
      name: {
        type: String,
        min: 5
      }
    })
    schema.extend({
      name: {
        type: String,
        max: 15
      }
    })

    // @ts-expect-error
    expect(schema._schema.name.type.definitions[0].min).toBe(5)
    // @ts-expect-error
    expect(schema._schema.name.type.definitions[0].max).toBe(15)
  })

  it('does not mutate a schema that is passed to extend', function () {
    const itemSchema = new SimpleSchema({
      _id: String
    })
    const mainSchema = new SimpleSchema({
      items: Array,
      'items.$': itemSchema
    })

    const item2Schema = new SimpleSchema({
      blah: String
    })
    const main2Schema = new SimpleSchema({
      items: Array,
      'items.$': item2Schema
    })

    new SimpleSchema({}).extend(mainSchema).extend(main2Schema)

    // @ts-expect-error
    expect(mainSchema._schema['items.$'].type.definitions[0].type._schemaKeys).toEqual(['_id'])
  })

  it('can extend array definition only, without array item definition', function () {
    const schema = new SimpleSchema({
      myArray: {
        type: Array
      },
      'myArray.$': {
        type: String,
        allowedValues: ['foo', 'bar']
      }
    })

    // @ts-expect-error
    expect(schema._schema.myArray.type.definitions[0].minCount).toBe(undefined)

    schema.extend({
      myArray: {
        minCount: 1
      }
    })

    // @ts-expect-error
    expect(schema._schema.myArray.type.definitions[0].minCount).toBe(1)
  })

  it('tests requiredness on fields added through extension', function () {
    const subitemSchema = new SimpleSchema({
      name: String
    })

    const itemSchema = new SimpleSchema({
      name: String,
      subitems: {
        type: Array,
        optional: true
      },
      'subitems.$': {
        type: subitemSchema
      }
    })

    const schema = new SimpleSchema({
      name: String,
      items: {
        type: Array,
        optional: true
      },
      'items.$': {
        type: itemSchema
      }
    })

    subitemSchema.extend({
      other: String
    })

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.REQUIRED, schema, {
      name: 'foo',
      items: [{
        name: 'foo',
        subitems: [{
          name: 'foo'
        }]
      }]
    }).toBe(1)
  })

  it('gets correct objectKeys from extended subschemas', function () {
    const itemSchema = new SimpleSchema({
      name: String
    })

    const schema = new SimpleSchema({
      name: String,
      item: itemSchema
    })

    itemSchema.extend({
      other: String
    })

    expect(schema.objectKeys()).toEqual(['name', 'item'])
    expect(schema.objectKeys('item')).toEqual(['name', 'other'])
  })

  it('supports extending allowedValues', function () {
    const ObjSchema = new SimpleSchema({
      loveType: {
        type: String,
        allowedValues: ['platonic']
      }
    })

    const ListItemSchema = new SimpleSchema({
      name: {
        type: String,
        allowedValues: ['a']
      },
      params: {
        type: Object,
        blackbox: true
      }
    })

    const schema = new SimpleSchema({
      list: {
        type: Array
      },
      'list.$': {
        type: ListItemSchema
      },
      primary: ObjSchema,
      method: {
        type: String,
        allowedValues: ['none', 'some']
      }
    })

    // Top-level field extension
    schema.extend({
      method: {
        allowedValues: [...schema.getAllowedValuesForKey('method') ?? [], 'all']
      }
    })

    expect(schema.getAllowedValuesForKey('method')).toEqual(['none', 'some', 'all'])

    // Subschema field extension
    ObjSchema.extend({
      loveType: {
        allowedValues: [...ObjSchema.getAllowedValuesForKey('loveType') ?? [], 'romantic']
      }
    })

    expect(schema.getAllowedValuesForKey('primary.loveType')).toEqual(['platonic', 'romantic'])

    // Subschema field in array field extension
    ListItemSchema.extend({
      name: {
        allowedValues: [...ListItemSchema.getAllowedValuesForKey('name') ?? [], 'b', 'c']
      }
    })

    expect(schema.getAllowedValuesForKey('list.$.name')).toEqual(['a', 'b', 'c'])
  })
})
