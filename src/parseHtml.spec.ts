import { describe, expect, test } from 'vitest';
import { HtmlNode, stubError } from './HtmlNode.js';
import { parseHtml } from './parseHtml.js';

describe('parseHtml', () => {
	test('parses valid html', () => {
		const node = parseHtml(validHtml);
		expect(node).toBeInstanceOf(HtmlNode);
		expect(node.error).toBe(stubError);
	});
	test('gets all node properties', () => {
		const node = parseHtml(validHtml);
		expect(node.id).toBe('html');
		expect(node.classes).toEqual(['html']);
		expect(node.attrs.lang).toBe('en');
	});
	test('node can select itself', () => {
		const node = parseHtml(validHtml);
		expect(node.select('html')).toBe(node);
	});
	test('can select deeply nested node by node name', () => {
		const node = parseHtml(validHtml);
		const match = node.select('span');
		expect(match).toBeInstanceOf(HtmlNode);
		expect(match?.tag).toBe('span');
	});
	test('can select based on class', () => {
		const node = parseHtml(validHtml);
		const match = node.select('.a2');
		expect(match).toBeInstanceOf(HtmlNode);
		expect(match?.tag).toBe('div');
	});
	test('can select based on attribute', () => {
		const node = parseHtml(validHtml);
		const match = node.select('script[type=defer]');
		expect(match).toBeInstanceOf(HtmlNode);
		expect(match?.attrs.type).toBe('defer');
		expect(match?.tag).toBe('script');
	});
	test('can skip tags', () => {
		const node = parseHtml(validHtml, { skipNodeTypes: ['script', 'style'] });
		expect(node.select('script')).toBe(null);
		expect(node.select('style')).toBe(null);
	});
	test('can skip attributes', () => {
		const node = parseHtml(validHtml, { ignoreAttributes: ['class'] });
		expect(node.select('#bob')?.classes).toEqual([]);
	});
	test('can generate html out of a node', () => {
		const html =
			'<div id="foo" class="bar">text a <a href="#">link</a> text b</div>';
		const node = parseHtml(html);
		expect(node.toHTML()).toBe(html);
	});
});

const validHtml = `
<!DOCTYPE html>
<html lang="en" id="html" class="html">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
    <!--
    multiline comment
    -->
  <body>
    <div id="bob" class="a1 a2 a3">
      <span class="span-class">hello</span>
    </div>
    <script></script>
    <script type=defer>
      const foo = true;
      function bar() {
        return !foo;
      }
    </script>
    <style>
      .body {
        background-color: green;
      }
    </style>
  </body>
</html>

`;
