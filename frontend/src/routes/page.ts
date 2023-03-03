import type { PageLoad } from './$types.d';
 
export const load = (async ({ fetch, params }) => {

  const res = await fetch(`/api/items/${params.id}`);
  const item = await res.json();
 
  return { item };
}) satisfies PageLoad;
