export function hasElements(arr: unknown[]): boolean {
	return arr.length > 0;
}

export function getLast<T>(arr: T[]): T {
	return arr[arr.length - 1];
}

export function unquote(str: string): string {
	return str.slice(1, str.length - 1);
}
