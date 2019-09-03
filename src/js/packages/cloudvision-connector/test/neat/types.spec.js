/* eslint-env jest */

import JSBI from 'jsbi';

import { Bool, Float32, Float64, Int, Nil, Pointer, Str } from '../../src/neat/types';

describe('NEAT types', () => {
  const maxInt = Number.MAX_SAFE_INTEGER;
  const maxIntStr = Number.MAX_SAFE_INTEGER + '';
  const maxIntLastDigit = parseInt(maxIntStr[maxIntStr.length - 1], 10);
  const moreThanMaxInt = maxIntStr.substr(0, maxIntStr.length - 1) + (maxIntLastDigit + 1);

  test('Bool', () => {
    expect(new Bool(true).value).toEqual(true);
    expect(new Bool(false).value).toEqual(false);
    expect(new Bool(1).value).toEqual(true);
    expect(new Bool(0).value).toEqual(false);
    expect(new Bool('true').value).toEqual(true);
    expect(new Bool('').value).toEqual(false);

    expect(new Bool(true).toString()).toEqual('true');
    expect(new Bool(false).toString()).toEqual('false');
  });

  test('Float32', () => {
    expect(new Float32(1).value).toEqual(1.0);
    expect(new Float32(1.2).value).toEqual(1.2);
    expect(new Float32(0.3).value).toEqual(0.3);
    expect(new Float32(1.0).value).toEqual(1.0);
    expect(new Float32('1.2').value).toEqual(1.2);

    expect(new Float32(1).toString()).toEqual('1.0');
    expect(new Float32(1.2).toString()).toEqual('1.2');
    expect(new Float32(0.3).toString()).toEqual('0.3');
    expect(new Float32(1.0).toString()).toEqual('1.0');
  });

  test('Float64', () => {
    expect(new Float64(1).value).toEqual(1.0);
    expect(new Float64(1.2).value).toEqual(1.2);
    expect(new Float64(0.3).value).toEqual(0.3);
    expect(new Float64(1.0).value).toEqual(1.0);
    expect(new Float64('1.2').value).toEqual(1.2);

    expect(new Float64(1).toString()).toEqual('1.0');
    expect(new Float64(1.2).toString()).toEqual('1.2');
    expect(new Float64(0.3).toString()).toEqual('0.3');
    expect(new Float64(1.0).toString()).toEqual('1.0');
  });

  test('Int', () => {
    expect(new Int(1.2).value).toEqual(1);
    expect(new Int(1).value).toEqual(1);
    expect(new Int('1.2').value).toEqual(1);
    expect(new Int('1').value).toEqual(1);
    expect(new Int(maxInt).value).toEqual(maxInt);
    expect(new Int(moreThanMaxInt).value).toEqual(BigInt(moreThanMaxInt));
    expect(new Int(moreThanMaxInt, true).value).toEqual(JSBI.BigInt(moreThanMaxInt));
    expect(new Int(maxInt * -1).value).toEqual(maxInt * -1);
    expect(new Int('-' + moreThanMaxInt).value).toEqual(BigInt(moreThanMaxInt) * BigInt(-1));

    expect(new Int(1.2).toString()).toEqual('1');
    expect(new Int(1).toString()).toEqual('1');
    expect(new Int('1.2').toString()).toEqual('1');
    expect(new Int('1').toString()).toEqual('1');
    expect(new Int(maxInt).toString()).toEqual(maxInt.toString());
    expect(new Int(moreThanMaxInt).toString()).toEqual(moreThanMaxInt);
    expect(new Int(moreThanMaxInt, true).toString()).toEqual(moreThanMaxInt);
    expect(new Int(maxInt * -1).toString()).toEqual((maxInt * -1).toString());
    expect(new Int('-' + moreThanMaxInt).toString()).toEqual('-' + moreThanMaxInt);
  });

  test('Nil', () => {
    expect(new Nil(1).value).toEqual(null);
    expect(new Nil(true).value).toEqual(null);
    expect(new Nil([]).value).toEqual(null);
    expect(new Nil(false).value).toEqual(null);
    expect(new Nil({}).value).toEqual(null);

    expect(new Nil(1).toString()).toEqual('null');
    expect(new Nil(true).toString()).toEqual('null');
    expect(new Nil([]).toString()).toEqual('null');
    expect(new Nil(false).toString()).toEqual('null');
    expect(new Nil({}).toString()).toEqual('null');
  });

  test('Pointer', () => {
    const ptrArray = ['pointer', 'to', { some: 'stuff' }];
    const ptrString = 'pointer/to/' + JSON.stringify({ some: 'stuff' });

    expect(new Pointer(ptrArray).value).toEqual(ptrArray);
    expect(new Pointer(ptrString).value).toEqual(ptrArray);
    expect(new Pointer([]).value).toEqual([]);
    expect(new Pointer('').value).toEqual([]);
    expect(new Pointer('/').value).toEqual([]);

    expect(new Pointer(ptrArray).toString()).toEqual(ptrString);
    expect(new Pointer(ptrString).toString()).toEqual(ptrString);
    expect(new Pointer([]).toString()).toEqual('');
    expect(new Pointer('').toString()).toEqual('');
    expect(new Pointer('/').toString()).toEqual('');
  });

  test('Str', () => {
    expect(new Str('string').value).toEqual('string');
    expect(new Str(true).value).toEqual('true');
    expect(new Str(false).value).toEqual('false');
    expect(new Str(1).value).toEqual('1');
    expect(new Str(BigInt(moreThanMaxInt)).value).toEqual(moreThanMaxInt);
    expect(new Str(JSBI.BigInt(moreThanMaxInt)).value).toEqual(moreThanMaxInt);
    expect(new Str(null).value).toEqual('null');
    expect(new Str(undefined).value).toEqual('');
    expect(new Str({ hello: 'world' }).value).toEqual(JSON.stringify({ hello: 'world' }));
    expect(new Str([1, 2]).value).toEqual('[1,2]');

    expect(new Str('string').toString()).toEqual('string');
    expect(new Str(true).toString()).toEqual('true');
    expect(new Str(false).toString()).toEqual('false');
    expect(new Str(1).toString()).toEqual('1');
    expect(new Str(BigInt(moreThanMaxInt)).toString()).toEqual(moreThanMaxInt);
    expect(new Str(JSBI.BigInt(moreThanMaxInt)).toString()).toEqual(moreThanMaxInt);
    expect(new Str(null).toString()).toEqual('null');
    expect(new Str(undefined).toString()).toEqual('');
    expect(new Str({ hello: 'world' }).toString()).toEqual(JSON.stringify({ hello: 'world' }));
    expect(new Str([1, 2]).toString()).toEqual('[1,2]');
  });
});
