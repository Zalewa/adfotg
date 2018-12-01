export function leftpad(input: string, pad: string, size: number): string {
	while (input.length < size) {
		input = pad + input;
	}
	return input;
}
