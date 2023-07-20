export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env) {
		const { pathname } = new URL(request.url);

		if (pathname === '/visitors') {
			// If you did not use `DB` as your binding name, change it here
			const { results } = await env.DB.prepare('SELECT * FROM visitors').all();
			return Response.json(results);
		}
		if (pathname === '/visitors/add') {
			const { results } = await env.DB.prepare('INSERT INTO visitors VALUES (?, ?, ?, ?, ?)')
				.bind(request.cf?.country, request.cf?.city, request.cf?.latitude, request.cf?.longitude, request.headers.get('x-real-ip'))
				.all();
			console.log(results);
		}
		return new Response('Call /visitors to see everyone who visit. Call /visitors/add to add yourself as a visitor.');
	},
};
