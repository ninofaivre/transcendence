// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {

		interface Discussion {
			id: number
			users: string[]
			messages: message[]
			name?: string
		}

		interface message  {
			content: string
			from: string
			discussionId: number
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
