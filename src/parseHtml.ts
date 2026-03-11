import type { HtmlNode } from './HtmlNode.js';
import { HtmlParser, type HtmlParserOptions } from './HtmlParser.js';

export function parseHtml(html: string, options?: HtmlParserOptions): HtmlNode {
	return new HtmlParser(html, options).parse();
}
