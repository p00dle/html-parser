import { describe, expect, test } from 'vitest';
import { parseSelector } from './parseSelector.js';

describe('parseSelector', () => {
	test('single id', () => {
		expect(parseSelector('#foo')).toEqual([[{ type: 'id', value: 'foo' }]]);
	});
	test('single class', () => {
		expect(parseSelector('.foo')).toEqual([[{ type: 'class', value: 'foo' }]]);
	});
	test('single tag', () => {
		expect(parseSelector('div')).toEqual([[{ type: 'tag', value: 'div' }]]);
	});
	test('single attribute', () => {
		expect(parseSelector('[href=google.com]')).toEqual([
			[{ type: 'attr', key: 'href', value: 'google.com' }],
		]);
	});
	test('single quoted attribute', () => {
		expect(parseSelector('[href="google.com"]')).toEqual([
			[{ type: 'attr', key: 'href', value: 'google.com' }],
		]);
	});
	test('single quoted attribute with spaces', () => {
		expect(parseSelector('[ href = "google.com" ]')).toEqual([
			[{ type: 'attr', key: 'href', value: 'google.com' }],
		]);
	});
	test('tag, class', () => {
		expect(parseSelector('div.foo')).toEqual([
			[
				{ type: 'tag', value: 'div' },
				{ type: 'class', value: 'foo' },
			],
		]);
	});
	test('tag, class, attr', () => {
		expect(parseSelector('div.foo[key="value with spaces ..."]')).toEqual([
			[
				{ type: 'tag', value: 'div' },
				{ type: 'class', value: 'foo' },
				{ type: 'attr', key: 'key', value: 'value with spaces ...' },
			],
		]);
	});
	test('two levels', () => {
		expect(parseSelector('div .foo')).toEqual([
			[{ type: 'tag', value: 'div' }],
			[{ type: 'class', value: 'foo' }],
		]);
	});
	test('three levels', () => {
		expect(parseSelector('div .foo span')).toEqual([
			[{ type: 'tag', value: 'div' }],
			[{ type: 'class', value: 'foo' }],
			[{ type: 'tag', value: 'span' }],
		]);
	});
	test('throws on invalid character after # or .', () => {
		expect(() => parseSelector('#.')).toThrow();
		expect(() => parseSelector('# foo')).toThrow();
		expect(() => parseSelector('.[]')).toThrow();
		expect(() => parseSelector('. foo')).toThrow();
	});
	test('throws on unterminated quote', () => {
		expect(() => parseSelector('[key="value]')).toThrow();
	});
	test('throws on empty attribute', () => {
		expect(() => parseSelector('[=value]')).toThrow();
	});
	// TODO: add more test on edge cases with errors
});
