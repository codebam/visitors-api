import { WorkerRouter, ok, RouteContext } from '@worker-tools/shed';

export interface Env {
	DB: D1Database;
}

const console_error = (e: Error) => console.error(e);

const response_all_visitors = async (ctx: RouteContext): Promise<Response> => {
	const { results } = await ctx.env.DB.prepare('SELECT country, city, latitude, longitude FROM visitors').all();
	return Response.json(results);
};

const visitors_count = async (ctx: RouteContext): Promise<number> => {
	const { results } = await ctx.env.DB.prepare('SELECT COUNT(*) as count from visitors').all().catch(console_error);
	return results[0]?.count;
};

const router = new WorkerRouter()
	.get('/visitors', async (_req, ctx) => response_all_visitors(ctx))
	.get('/visitors/add', async (req, ctx) => {
		await ctx.env.DB.prepare('INSERT INTO visitors VALUES (?, ?, ?, ?, ?)')
			.bind(req.cf?.country, req.cf?.city, req.cf?.latitude, req.cf?.longitude, req.headers.get('x-real-ip'))
			.all()
			.catch(console_error);
		return response_all_visitors(ctx);
	})
	.get('/visitors/remove', async (req, ctx) => {
		await ctx.env.DB.prepare('DELETE FROM visitors WHERE ip = ?').bind(req.headers.get('x-real-ip')).all().catch(console_error);
		return response_all_visitors(ctx);
	})
	.any('*', async (_req, ctx) =>
		ok(
			(await visitors_count(ctx)) +
				' visitors' +
				'\nCall /visitors to see everyone who visit.\nCall /visitors/add to add yourself as a visitor.\nCall /visitors/remove to remove yourself as a visitor.'
		)
	);

export default router;
