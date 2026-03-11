export type Selector =
	| {
			type: 'id' | 'class' | 'tag';
			value: string;
	  }
	| {
			type: 'attr';
			key: string;
			value: string;
	  };
