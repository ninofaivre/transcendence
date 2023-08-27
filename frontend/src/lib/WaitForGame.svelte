<script>
	import { ProgressRadial, modalStore } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { checkError } from "./global"
	import { goto } from "$app/navigation"

    let value = 100;
    let i = 5;

    const promise = new Promise((resolve) => {
        const solve = () => {
            resolve(true)
            goto("/")
            onClose();
        }
        setTimeout(solve, 6000)
    })
    // const promise = client.invitations.game.createGameInvitation({
    // 	body: {
    // 		invitedUserName: $modalStore[0].meta?.username,
    // 	},
    // })

    while (i--) {
        setTimeout(() => {
            value -= 20;
        }, 1000 * i)
    }


	function onClose() {
		if ($modalStore[0].response) {
			$modalStore[0].response(undefined)
		}
	}

	;(async function inviteToGame() {
		// const ret = await client.invitations.game.createGameInvitation({
		// 	body: {
		// 		invitedUserName: "coco",
		// 	},
		// })
		// if (ret.status != 201) {
		// 	$modalStore[0].close()
		// 	checkError(ret, "invite to a game")
		// } else {
		// goto(`/api/game/${ret.body.gameId}`)
		// }
	})()

    $: {
        if (value <= 0 ) onClose()
    }
</script>

<div class="card p-8 grid grid-rows-3 ">
	<p class="">Waiting for challenge to be accepted</p>
    <div class="justify-self-center self-center ">
        {#await promise}
            <ProgressRadial bind:value width="w-16">
                {value / 20}
            </ProgressRadial>
        {:then ret} 
                <p>Challenge accepted !</p>
        {/await}
    </div>
	<button on:click={onClose} class="btn btn-sm self-center variant-ghost-error h-fit w-fit justify-self-center mt-4">Cancel</button>
</div>

<style>
    p {
        font-family: "Press Start 2P", "ArcadeClassic", serif;
    }
</style>
