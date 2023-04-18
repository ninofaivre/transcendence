export interface Discussion {
	id: number
	users: string[]
	title: string
}

// export		interface Message
// {
//     id: number
//     content: string
//     from: string
//     discussionId: number
// }

export type Message = {
	id: number
	event: {}
	message: {
		content: string
		relatedId: number | null
		relatedUsers: string[]
		relatedRoles: string[]
	}
	author: string
	creationDate: string // Or Date ?
}
