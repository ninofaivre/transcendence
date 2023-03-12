export		interface Discussion
{
    id: number
    users: string[]
    name?: string
}

export		interface Message
{
    content: string
    from: string
    discussionId: number
}

