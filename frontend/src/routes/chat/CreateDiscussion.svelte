<script lang=ts>

	import { invalidate, invalidateAll } from '$app/navigation'

	async function handleDiscussionCreation()
	{
		let users = {
			users: Object.values( Object.fromEntries( new FormData( form ) ) ).filter( str => str.trim() != '')
		}
		const body = JSON.stringify(users)
		const headers =  {
			"Content-Type": "application/json",
		}
		show_discussion_creation_form = false
		fetch('/users/createDiscussion', {
				method: 'POST',
				headers,
				body,
			})
			.catch(error => alert(`Could not create discussion: ${error}`))
		invalidate(url => url.pathname === '/chat')
		//invalidate(url => url.pathname.includes('chat'))
		//invalidateAll()
	}

	let i = 0;
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

	let form: HTMLFormElement;
	let show_discussion_creation_form = false;
	let minlength = 3
	let maxlength = 100

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
