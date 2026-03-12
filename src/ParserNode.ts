export class ParserNode {
	public children: number[] = [];
	public classes: string[] = [];
	public attrs: Record<string, string> = {};
	public id: string | null = null;
	public textContent: string | null = null;

	constructor(
		public tag: string,
		public index: number,
		public parent: number | null,
		public allNodesRef: ParserNode[],
		private ignoreAttributesHash: Record<string, boolean>,
		public isTextNode: boolean = false,
	) {
		if (parent !== null) {
			if (!this.allNodesRef[parent]) {
				console.log(parent, this);
			}
			this.allNodesRef[parent].addChild(this.index);
		}
	}

	public addChild(nodeIndex: number) {
		this.children.push(nodeIndex);
	}

	public addClass(className: string) {
		this.classes.push(className);
	}

	public addAttr(attribute: string, value: string) {
		const attr = attribute.toLowerCase();
		if (this.ignoreAttributesHash[attr]) return;
		switch (attr) {
			case 'class':
				for (const className of value.trim().split(' '))
					this.classes.push(className);

				return;
			case 'id':
				this.id = value;
				return;
			default:
				this.attrs[attr] = value;
				return;
		}
	}

	public addTextContent(text: string) {
		const index = this.allNodesRef.length;
		if (text.trim().length === 0) return;
		const textNode = new ParserNode(
			'',
			index,
			this.index,
			this.allNodesRef,
			this.ignoreAttributesHash,
			true,
		);
		this.allNodesRef.push(textNode);
		textNode.textContent = text;
	}
}

export const stubParserNode = new ParserNode('', 0, null, [], {});
