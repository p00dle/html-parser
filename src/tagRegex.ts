const cache: Record<string, RegExp> = {};
export function getTagRegex(tag: string): RegExp {
	if (!cache[tag]) {
		cache[tag] = new RegExp(`</?${tag}`, 'g');
	}
	return cache[tag];
}
