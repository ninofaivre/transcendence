import type { PageLoadEvent } from "./$types"
import type { PageLoad } from "./$types"
import { dmsClient } from "$lib/clients"

export const load = async ({ depends, params }: PageLoadEvent) => {

	depends(`:dms${params.id}`)
	const { status, body: messages } = await dmsClient.getDmElements({
        params: {
            dmId: params.id as string
        }
    })
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(messages as any)?.message
			}\"`,
		)
	}

    console.log("Your messages:", messages)
    return { messages }
}
