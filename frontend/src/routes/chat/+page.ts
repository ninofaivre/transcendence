import type { PageLoad } from './$types.d';
import { current_user } from '$lib/stores'
import { onDestroy } from 'svelte'

let user = "username not set";

const unsubscribe = current_user.subscribe( (value: string) => {
	user = value;
});
 
export const load = (async ({ fetch, url, depends }) => {

  const res = await fetch( url.origin + '/users/getAllDiscussions');
  const item = await res.json();

  console.log( "Loaded", url.origin + '/users/getAllDiscussions', item )
  depends('discussions')
 
  return item 
}) satisfies PageLoad;

