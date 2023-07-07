<script lang="ts">
    // import { Autocomplete } from "@skeletonlabs/skeleton"
    import Autocomplete from "./Autocomplete.svelte"
    import type { AutocompleteOption } from "@skeletonlabs/skeleton"

    import { invitationsClient, usersClient } from "$clients"
    import { invalidate } from "$app/navigation"
    import { reportUnexpectedCode } from "$lib/global"
    import { page } from "$app/stores"
	import { my_name } from "$stores"

    let search_input: string = ""
    let users: AutocompleteOption[] = []

    async function sendFriendRequest(username: string) {
        const { status, body } = await invitationsClient.friend.createFriendInvitation({
            body: { invitedUserName: username },
        })
        if (status != 201) {
            reportUnexpectedCode(status, "create friend request", body, "error")
        } else {
            invalidate(":friendships")
            console.log("Sent friendship request to " + username)
        }
    }

    async function onUserSelection(event: any) {
        sendFriendRequest(event.detail.label)
    }

    async function getUsernames(input: string) {
            return usersClient
            .searchUsers({
                    query: {
                        userNameContains: input,
                    },
                })
                .then(({ status, body }) => {
                    console.log(body)
                    if (status === 200) {
                        users = body.map((obj) => ({ label: obj.userName, value: obj.userName }))
                    } else reportUnexpectedCode(status, "create friend request", body)
            })
    }

    console.log($page.data.friendList)

    $: getUsernames(search_input)
    $: denylist = [...$page.data.friendList, $my_name]
</script>

<input class="input" type="search" bind:value={search_input} placeholder="Search user..." />

<div class="card max-h-48 w-full max-w-sm overflow-y-auto p-4" tabindex="-1">
    <Autocomplete
        options={users}
        {denylist}
        on:selection={onUserSelection}
    />
</div>

<style>
</style>
