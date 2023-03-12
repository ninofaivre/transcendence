export		interface Discussion
{
    id: number
    users: string[]
    title: string
}

export		interface Message
{
    id: number
    content: string
    from: string
    discussionId: number
}

