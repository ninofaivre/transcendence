export interface Discussion {
	id: number
	users: string[]
	title: string
}

// export		interface Message
// {https://stackoverflow.com/questions/52703321/make-some-properties-optional-in-a-typescript-type?answertab=scoredesc#tab-top
//     id: number
//     content: string
//     from: string
//     discussionId: number
// }

export interface Message {
	id: number
	event?: {}
	message: {
		content: string
		relatedId?: number | null
		relatedUsers?: string[]
		relatedRoles?: string[]
	}
	author: string
	creationDate: Date
}
