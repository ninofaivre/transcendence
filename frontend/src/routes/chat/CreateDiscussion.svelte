<script lang="ts">

    import { InputChip } from '@skeletonlabs/skeleton';

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
        let users = Array.from( formdata.values() )
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
        i = 0
    }

    async function addUserFormInput()
    {
        ++i;
        let label = document.createElement('label') as HTMLLabelElement
        label.setAttribute('class', 'label')
        label.innerHTML = `User ${i + 1}: `
        let input = document.createElement('input') as HTMLInputElement
        input.setAttribute('type', 'text')
        input.setAttribute('name', `${i}`)
        input.setAttribute('minlength', `${minlength}`)
        input.setAttribute('maxlength', `${maxlength}`)
        input.setAttribute('required', '')
        input.setAttribute('class', 'input')
        label.appendChild(input)
        form.appendChild(label)
        input.focus()
    }


</script>

{#if !show_discussion_creation_form }
    <button on:click={ () => show_discussion_creation_form = true }
    >
        Create Discussion
    </button>
{:else}
    <form bind:this={form} on:submit|preventDefault|stopPropagation={ handleDiscussionCreation }>
        <button on:click|preventDefault|stopPropagation={ addUserFormInput }
            class="btn variant-filled"
        >
            Add user
        </button>
        <button type=submit
            class="btn variant-filled"
        >
            Create Discussion
        </button>
        <label
            class="label"
        >
            Choose a name for the conversation
            <input type=text name=title required {minlength} {maxlength}
                class="input"
            >
        </label>
        <label
            class="label"
        >
            User 1
            <input type=text name=0 required {minlength} {maxlength}
                class="input"
            >
        </label>
    </form>
{/if}
