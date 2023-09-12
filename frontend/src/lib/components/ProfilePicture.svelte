<script lang="ts">
	import { Avatar } from "@skeletonlabs/skeleton"
	import { reload_img } from "$stores"

	export let src: string
	export let fallback: string

	// The way this works is you need to to give the PP an url with an id search parameter
	// Now, when you want to reload the image, you set $reload_img.id to the id that identifiees
	// the image you want to reload, typically a username and you set the $reload.img.trigger to
	// Date.now() so that the store is triggered no matter what

	let url = new URL(src)
	url.searchParams.set("reload", Date.now().toString())
	let id = url.searchParams.get("id") || ""
	let derived_src = url.toString()

	$: {
		if ($reload_img.trigger) {
			if ($reload_img.id === id) {
				url.searchParams.set("reload", Date.now().toString())
				derived_src = url.toString()
			}
		}
	}
</script>

<Avatar src={derived_src} {fallback} alt="{id}_profile" class={$$props.class} />
