export function leftpad(input: string, pad: string, size: number): string {
	while (input.length < size) {
		input = pad + input;
	}
	return input;
}

export function sorted(input: string[]) {
	let cloned = input.slice(0);
	cloned.sort((a: string, b: string) => a.localeCompare(b));
	return cloned;
}
