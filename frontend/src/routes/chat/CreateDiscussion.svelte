<script lang=ts>

	import { invalidate, invalidateAll } from '$app/navigation'

	let form: HTMLFormElement;
	let show_discussion_creation_form = false;
	let minlength = 3
	let maxlength = 100
	let i = 0;

	async function handleDiscussionCreation()
	{
		let formdata = new FormData( form )
		let title = formdata.get('title')
		formdata.delete('title')
		//let users = Object.values( Object.fromEntries( formdata ) ).filter( str => str.trim() != '')
		let users = Array.from( formdata.values() ).filter( str => str.trim() != '' )
		const body = JSON.stringify({
			title,
			users,
		})
		const headers =  {
			"Content-Type": "application/json",
		}
		show_discussion_creation_form = false
		let res = await fetch('/users/createDiscussion', {
				method: 'POST',
				headers,
				body,
			})
		if (! res.ok ) {
			let body = await res.json()
			alert(`Error: ${res.statusText}\nCould not create new discussion because ${body.message}`)
		}
		// Let SSE take care of new discussions
		//else
		//	invalidate('discussions')
		i = 0
	}

	async function addUserFormInput()
	{
		++i;
		let label = document.createElement('label') as HTMLLabelElement
		label.innerHTML = `User ${i + 1}: `
		let input = document.createElement('input') as HTMLInputElement
		input.setAttribute('type', 'text')
		input.setAttribute('name', `${i}`)
		input.setAttribute('minlength', `${minlength}`)
		input.setAttribute('maxlength', `${maxlength}`)
		label.appendChild(input)
		form.appendChild(label)
		input.focus()
	}


</script>

{#if !show_discussion_creation_form }
	<button on:click={ () => show_discussion_creation_form = true } >
		Create Discussion
	</button>
{:else}
	<form bind:this={form} on:submit|preventDefault|stopPropagation={ handleDiscussionCreation }>
		<button on:click|preventDefault|stopPropagation={ addUserFormInput } >
			Add user
		</button>
		<button type=submit>
			Create Discussion
		</button>
		<label>
			Choose a name for the conversation
			<input type=text name=title required {minlength} {maxlength}>
		</label>
		<label>
			User 1
			<input type=text name=0 required {minlength} {maxlength}>
		</label>
	</form>
{/if}

<style>
	label  {
		display: block;
	}
</style>
