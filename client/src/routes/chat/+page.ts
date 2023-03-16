import type { PageLoad } from './$types.d';
//import { current_user } from '$lib/stores'

//let user = "username not set";

//const unsubscribe = current_user.subscribe( (value: string) => {
//	user = value;
//});
 
export const load = ( async ({ fetch, url }) => {

  const res1 = await fetch( url.origin + '/users/getAllDiscussions');
  const discussions = await res1.json();

  console.log( "Loaded", url.origin + '/users/getAllDiscussions', discussions )

  const res2  = await fetch( url.origin + '/users/myName')
  const { data: my_name } = await res2.json()

  console.log(my_name)

  return {
	  discussions,
	  my_name,
  } 
}) satisfies PageLoad;

