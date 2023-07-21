import { WorkerRouter, ok, RouteContext, html, HTMLResponse } from '@worker-tools/shed';

export interface Env {
	DB: D1Database;
}

const default_styles = html`<style>
	@media (prefers-color-scheme: dark) {
		body {
			color: white;
			background-color: black;
		}
	}
</style> `;

const default_page = async (ctx: RouteContext) => html`<!DOCTYPE html>
	<html>
		<head>
			<title>${await visitors_count(ctx)} visitors</title>
			${default_styles}
		</head>
		<body>
			<p>${await visitors_count(ctx)} visitors</p>
			<p><a href="/visitors/get">/visitors/get</a> to see visitor locations</p>
			<p><a href="/visitors/add">/visitors/add</a> to add yourself as a visitor</p>
			<p><a href="/visitors/remove">/visitors/remove</a> to remove yourself as a visitor</p>
		</body>
	</html>`;

const response_all_visitors = async (ctx: RouteContext): Promise<Response> => {
	const { results } = await ctx.env.DB.prepare('SELECT country, city FROM visitors').all();
	return Response.json(results);
};

const visitors_count = async (ctx: RouteContext): Promise<number> => {
	const { results } = await ctx.env.DB.prepare('SELECT COUNT(*) as count from visitors').all().catch(console.error);
	return results[0]?.count;
};

const router = new WorkerRouter()
	.get('/api/visitors', async (_req, ctx) => ok((await visitors_count(ctx)).toString()))
	.get('/visitors/get', async (_req, ctx) => response_all_visitors(ctx))
	.get('/visitors/add', async (req, ctx) => {
		await ctx.env.DB.prepare('INSERT INTO visitors VALUES (?, ?, ?, ?, ?)')
			.bind(req.cf?.country, req.cf?.city, req.cf?.latitude, req.cf?.longitude, req.headers.get('x-real-ip'))
			.all()
			.catch(console.error);
		return response_all_visitors(ctx);
	})
	.get('/visitors/remove', async (req, ctx) => {
		await ctx.env.DB.prepare('DELETE FROM visitors WHERE ip = ?').bind(req.headers.get('x-real-ip')).all().catch(console.error);
		return response_all_visitors(ctx);
	})
	.any('*', async (_req, ctx) => new HTMLResponse(await default_page(ctx)));

export default router;
