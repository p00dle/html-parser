import type { Selector } from './Selector.js';

const char = /[^[\] .#]+/y;
const space = /\s+/g;
const nonEquals = /[^=]+/g;
const nonClosing = /[^\]]+/g;

function unquote(str: string): string {
	const lastIndex = str.length - 1;
	if (str[0] === '"') {
		if (str[lastIndex] === '"') {
			return str.slice(1, lastIndex);
		} else {
			throw new Error('Malformed selector string. Unterminated quote');
		}
	} else {
		return str;
	}
}

export function parseSelector(selectorString: string): Selector[][] {
	const str = selectorString.trim();
	const selectors: Selector[][] = [[]];
	let depth = 0;
	let cursor = 0;
	const end = str.length;
	while (cursor < end) {
		const qualifier = str[cursor];
		switch (qualifier) {
			case '#':
			case '.': {
				char.lastIndex = cursor + 1;
				const match = char.exec(str);
				if (!match)
					throw new Error(
						'Malformed selector string. expected identifier after "#"',
					);
				selectors[depth].push({
					type: qualifier === '#' ? 'id' : 'class',
					value: match[0],
				});
				cursor = char.lastIndex;
				break;
			}
			case ' ': {
				depth++;
				selectors[depth] = [];
				space.lastIndex = cursor;
				const match = space.exec(str);
				if (match) {
					cursor = space.lastIndex;
				}
				break;
			}
			case '[': {
				nonEquals.lastIndex = cursor + 1;
				const keyMatch = nonEquals.exec(str);
				if (!keyMatch)
					throw new Error(
						'Malformed selector string. expected attribute name after "["',
					);
				cursor = nonEquals.lastIndex;
				if (str[cursor] !== '=')
					throw new Error(
						'Malformed selector string. expected "=" after attribute name',
					);
				nonClosing.lastIndex = cursor + 1;
				const valueMatch = nonClosing.exec(str);
				if (!valueMatch)
					throw new Error(
						'Malformed selector string. expected attribute value after "="',
					);
				cursor = nonClosing.lastIndex;
				if (str[cursor] !== ']')
					throw new Error(
						'Malformed selector string. expected "]" after attribute value',
					);
				cursor += 1;
				selectors[depth].push({
					type: 'attr',
					key: keyMatch[0].trim(),
					value: unquote(valueMatch[0].trim()),
				});
				break;
			}
			default: {
				char.lastIndex = cursor;
				const match = char.exec(str);
				if (!match)
					throw new Error('Malformed selector string. expected node type');
				selectors[depth].push({ type: 'tag', value: match[0].toLowerCase() });
				cursor = char.lastIndex;
				break;
			}
		}
	}
	return selectors;
}
