import { PUBLIC_BACKEND_URL } from '$env/static/public'
import type { PageLoad } from './$types.d';
import { fetchGet } from '$lib/global'
//import { current_user } from '$lib/stores'

//let user = "username not set";

//const unsubscribe = current_user.subscribe( (value: string) => {
//	user = value;
//});

export const load = (async ({ fetch }) => {

    const res1 = await fetchGet('/users/getAllDiscussions');
    // const res1 = await fetch(PUBLIC_BACKEND_URL + '/users/getAllDiscussions');
    const discussions = await res1.json();

    console.log("Loaded", PUBLIC_BACKEND_URL + '/users/getAllDiscussions', discussions)

    const res2 = await fetchGet('/users/myName')
    // const res2 = await fetch(PUBLIC_BACKEND_URL + '/users/myName')
    const { data: my_name } = await res2.json()

    console.log(my_name)

    return {
        discussions,
        my_name,
    }
}) satisfies PageLoad;

