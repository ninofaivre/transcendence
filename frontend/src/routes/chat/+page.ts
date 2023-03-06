import type { PageLoad } from './$types.d';
import { current_user } from '$lib/stores'
import { onDestroy } from 'svelte'

let user = "username not set";

const unsubscribe = current_user.subscribe( (value: string) => {
	user = value;
});

const messages_alice_bob = [
	{author: `Alice`, data: `Hi Bob, hi ${ user } !`},
	{author: `Bob`, data: `Hi ${ user }, hi Alice !`},
]

const messages_bob_charlotte = [
	{author: 'Bob', data: 'Anyone here ?'},
	{author: user, data: 'Hello Everyone !'},
	{author: 'Charlotte', data: 'Here I am'},
]

const messages_alice_and_me = [
	{author: `Charlotte`, data: `Good morning ${ user }`},
	{author: user, data: 'Good morning dear'},
]

//export const load = (({ params }) => {
//  return {
//    discussion: [
//        { id: 0, name: "Discussion with Bob and Alice", users: ["alice", "bob", user], messages: messages_alice_bob},
//        { id: 1, users: ["Bob", "Charlotte", user], messages: messages_bob_charlotte },
//        { id: 2, name: "Charlotte and I", users: ["alice", user], messages: messages_alice_and_me}
//    ],
//    unsubscribe,
//   }
//}) satisfies PageLoad;
 
export const load = (async ({ fetch, url }) => {

  console.log( url.origin + '/users/getAllDiscussions' )
  const res = await fetch( url.origin + '/users/getAllDiscussions');
  const item = await res.json();

  console.log("Loaded ", item)
 
  return { item };
}) satisfies PageLoad;

