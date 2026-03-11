import { HtmlNode, makeErrorHtmlNode } from './HtmlNode.js';
import { isVoidNode } from './isVoidNode.js';
import { getLast, hasElements, unquote } from './lib.js';
import { ParserNode, stubParserNode } from './ParserNode.js';
import { getTagRegex } from './tagRegex.js';

export interface HtmlParserOptions {
	skipNodeTypes?: string[];
	ignoreAttributes?: string[];
}

const tagRegex = /<\/?[a-z][a-z0-9_-]*/g;
const attrRegex = /[a-z][a-z0-9_-]*/g;
const equalSignRegex = /\s*=\s*/g;
const quotedAttrValueRegex = /"[^"]*"/g;
const attrValueRegex = /[^ >"]+/g;

const defaultHtmlParserOptions: HtmlParserOptions = {};
export class HtmlParser {
	private nodes: ParserNode[] = [];
	private htmlNodes: HtmlNode[] = [];
	private parents: number[] = [];
	private currentNode: ParserNode | null = null;
	private currentTag: string = '';
	private currentTagIsClosed: boolean = true;
	private currentNodeIndex: number = 0;
	private index: number = 0;
	private skipTags: string[] = [];
	private ignoreAttributes: Record<string, boolean> = {};

	constructor(
		private html: string,
		options: HtmlParserOptions = defaultHtmlParserOptions,
	) {
		if (
			options &&
			'skipNodeTypes' in options &&
			Array.isArray(options.skipNodeTypes)
		) {
			this.skipTags = options.skipNodeTypes;
		}
		if (
			options &&
			'ignoreAttributes' in options &&
			Array.isArray(options.ignoreAttributes)
		) {
			for (const attr of options.ignoreAttributes) {
				this.ignoreAttributes[attr] = true;
			}
		}
	}

	public parse(): HtmlNode {
		while (this.nextNode()) {}
		const nodeCount = this.nodes.length;
		if (nodeCount > 0) {
			const nodes: HtmlNode[] = new Array(nodeCount);
			for (let i = 0; i < nodeCount; i++)
				nodes[i] = new HtmlNode(this.nodes[i], nodes);
			this.htmlNodes = nodes;
		}
		if (this.htmlNodes.length > 0) {
			return this.htmlNodes[0];
		}
		return makeErrorHtmlNode('Unknown error');
	}

	private nextNode(): boolean {
		if (!this.moveCursorToNextTag()) return false;
		if (!this.setTag()) return false;
		if (this.currentTagIsClosed) {
			if (!this.moveCursorAfterCloseBracket())
				return this.setError('Cannot find closing bracket');
			this.exitNode();
			return true;
		}
		if (this.shouldSkipNode()) return this.skipNode();

		this.enterNode();

		if (!this.setAttrs()) return false;

		if (this.isStyleOrScript()) {
			const result = this.parseStyleOrScript();
			this.exitNode();
			return result;
		}

		if (this.isVoidNode()) this.exitNode();

		return true;
	}

	private parseStyleOrScript(): boolean {
		const endTag = this.currentTag === 'style' ? '</style>' : '</script>';
		const textStartIndex = this.index;
		const textEndIndex = this.html.indexOf(endTag, textStartIndex);
		if (textEndIndex < 0) return false;
		if (this.currentNode) {
			const tmpIndex = this.index;
			this.index = textStartIndex;
			this.index = textEndIndex;
			this.index = tmpIndex;
			this.currentNode.addTextContent(
				this.html.slice(textStartIndex, textEndIndex),
			);
		}
		this.index = textEndIndex + endTag.length;
		return true;
	}

	private moveCursorToNextTag(): boolean {
		let startIndex = this.index;
		let success = true;

		do {
			this.index = this.html.indexOf('<', this.index);
			if (this.index < 0) {
				success = false;
				break;
			} else if (this.html[this.index + 1] !== '!') {
				break;
			} else if (this.html.slice(this.index + 2, this.index + 4) === '--') {
				if (this.currentNode)
					this.currentNode.addTextContent(
						this.html.slice(startIndex, this.index),
					);
				if (!this.parseComment()) return false;
				startIndex = this.index;
			} else {
				this.index++;
			}
		} while (success);
		if (success) {
			if (this.currentNode) {
				const tmpIndex = this.index;
				this.index = startIndex;
				this.index = tmpIndex;
				this.currentNode.addTextContent(
					this.html.slice(startIndex, this.index),
				);
			}
			this.index++;
		}
		return success;
	}

	private parseComment(): boolean {
		const textStartIndex = this.index;
		const textEndIndex = this.html.indexOf('-->', textStartIndex);
		if (textEndIndex < 0) return false;
		this.index = textEndIndex + 3;
		return true;
	}

	private setTag(): boolean {
		const startIndex = this.index;
		tagRegex.lastIndex = startIndex - 1;
		const tagMatch = tagRegex.exec(this.html);
		if (!tagMatch) return false;
		this.currentTagIsClosed = tagMatch[0][1] === '/';
		this.currentTag = tagMatch[0].slice(this.currentTagIsClosed ? 2 : 1);
		this.index = startIndex + this.currentTag.length;
		return true;
	}

	private enterNode() {
		this.currentNodeIndex = this.nodes.length;
		const parentIndex = hasElements(this.parents)
			? this.parents[this.parents.length - 1]
			: null;
		const node = new ParserNode(
			this.currentTag,
			this.currentNodeIndex,
			parentIndex,
			this.nodes,
			this.ignoreAttributes,
		);
		this.currentNode = node;
		this.nodes.push(node);
		this.parents.push(this.currentNodeIndex);
	}

	private exitNode() {
		this.parents.pop();
		this.currentNode = hasElements(this.parents)
			? this.nodes[getLast(this.parents)]
			: stubParserNode;
	}

	private moveCursorAfterCloseBracket(): boolean {
		this.index = this.html.indexOf('>', this.index);
		if (this.index < 0) return false;
		this.index++;
		return true;
	}

	private shouldSkipNode(): boolean {
		return this.skipTags.includes(this.currentTag);
	}
	private setAttrs(): boolean {
		const endIndex = this.html.indexOf('>', this.index);
		if (endIndex < 0) return false;
		while (this.index < endIndex) {
			attrRegex.lastIndex = this.index;
			const attrMatch = attrRegex.exec(this.html);
			if (!attrMatch || attrMatch.index > endIndex) {
				this.index = endIndex + 1;
				return true;
			}
			this.index = attrMatch.index + attrMatch[0].length;
			const attr = this.html.slice(attrMatch.index, this.index);
			equalSignRegex.lastIndex = this.index;
			const equalSignMatch = equalSignRegex.exec(this.html);
			if (
				!equalSignMatch ||
				equalSignMatch.index !== this.index ||
				equalSignMatch.index > endIndex
			) {
				if (this.currentNode) this.currentNode.addAttr(attr, attr);
				this.index++;
			} else {
				this.index = equalSignMatch.index + equalSignMatch[0].length;
				const isQuoted = this.html[this.index] === '"';
				if (isQuoted) {
					quotedAttrValueRegex.lastIndex = this.index;
					const valueMatch = quotedAttrValueRegex.exec(this.html);
					if (
						!valueMatch ||
						valueMatch.index > endIndex ||
						valueMatch.index + valueMatch[0].length > endIndex
					)
						return false;
					if (this.currentNode)
						this.currentNode.addAttr(attr, unquote(valueMatch[0]));
					this.index = valueMatch.index + valueMatch[0].length + 1;
				} else {
					attrValueRegex.lastIndex = this.index;
					const valueMatch = attrValueRegex.exec(this.html);
					if (
						!valueMatch ||
						valueMatch.index > endIndex ||
						valueMatch.index + valueMatch[0].length > endIndex
					)
						return false;
					if (this.currentNode) this.currentNode.addAttr(attr, valueMatch[0]);
					this.index = valueMatch.index + valueMatch[0].length + 1;
				}
			}
		}
		this.index = endIndex + 1;
		return true;
	}

	private isStyleOrScript(): boolean {
		return this.currentTag === 'style' || this.currentTag === 'script';
	}

	private isVoidNode(): boolean {
		return isVoidNode(this.currentTag);
	}

	private setError(errorMessage: string): false {
		this.htmlNodes[0] = makeErrorHtmlNode(errorMessage);
		return false;
	}

	private skipNode(): boolean {
		let depth = 0;
		const tagRegex = getTagRegex(this.currentTag);
		while (true) {
			tagRegex.lastIndex = this.index;
			const match = tagRegex.exec(this.html);
			if (!match) return false;
			const matchStr = match[0];
			this.index = tagRegex.lastIndex;
			if (!this.moveCursorAfterCloseBracket()) return false;
			if (matchStr[1] === '/') {
				if (depth === 0) {
					return true;
				} else {
					depth--;
				}
			} else {
				depth++;
			}
		}
	}
}
