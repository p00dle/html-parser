import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { parseHtml } from './parseHtml.js';

describe('e2e', () => {
	test('fransat', async () => {
		const html = await readFile('./samples/fransat.html', { encoding: 'utf8' });
		const node = parseHtml(html);
		expect(node.toHTML().length).toBeGreaterThan(10000);
	});
	test('google', async () => {
		const html = await readFile('./samples/google.html', { encoding: 'utf8' });
		const node = parseHtml(html);
		expect(node.toHTML().length).toBeGreaterThan(10000);
	});
	test('habra1', async () => {
		const html = await readFile('./samples/habra1.html', { encoding: 'utf8' });
		const node = parseHtml(html);
		expect(node.toHTML().length).toBeGreaterThan(10000);
	});
	test('habra2', async () => {
		const html = await readFile('./samples/habra2.html', { encoding: 'utf8' });
		const node = parseHtml(html);
		expect(node.toHTML().length).toBeGreaterThan(10000);
	});
	test('wikipedia', async () => {
		const html = await readFile('./samples/wikipedia.html', {
			encoding: 'utf8',
		});
		const node = parseHtml(html);
		expect(node.toHTML().length).toBeGreaterThan(10000);
	});
});
