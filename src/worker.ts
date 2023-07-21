import { WorkerRouter, ok } from '@worker-tools/shed';

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
}

const all_visitors = 'SELECT country, city, latitude, longitude FROM visitors';
const console_error = (e: Error) => console.error(e);

const router = new WorkerRouter()
	.get('/visitors', async (_req, ctx) => {
		const { results } = await ctx.env.DB.prepare(all_visitors).all();
		return Response.json(results);
	})
	.get('/visitors/add', async (req, ctx) => {
		await ctx.env.DB.prepare('INSERT INTO visitors VALUES (?, ?, ?, ?, ?)')
			.bind(req.cf?.country, req.cf?.city, req.cf?.latitude, req.cf?.longitude, req.headers.get('x-real-ip'))
			.all()
			.catch(console_error);
		const { results } = await ctx.env.DB.prepare(all_visitors).all();
		return Response.json(results);
	})
	.get('/visitors/remove', async (req, ctx) => {
		await ctx.env.DB.prepare('DELETE FROM visitors WHERE ip = ?').bind(req.headers.get('x-real-ip')).all().catch(console_error);
		const { results } = await ctx.env.DB.prepare(all_visitors).all();
		return Response.json(results);
	})
	.any('*', () =>
		ok(
			'Call /visitors to see everyone who visit.\nCall /visitors/add to add yourself as a visitor.\nCall /visitors/remove to remove yourself as a visitor.'
		)
	);

export default router;
