/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
const YOUR_DOMAIN = 'newmanknight.co.uk';
const RECIPIENT_EMAIL = 'adam@youi.design';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const corsHeaders = {
			'Access-Control-Allow-Headers': '*', // What headers are allowed. * is wildcard. Instead of using '*', you can specify a list of specific headers that are allowed, such as: Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization.
			'Access-Control-Allow-Methods': 'POST', // Allowed methods. Others could be GET, PUT, DELETE etc.
			'Access-Control-Allow-Origin': 'https://newmanknight.co.uk' // This is URLs that are allowed to access the server. * is the wildcard character meaning any URL can.
		};

		if (request.method === 'OPTIONS') {
			return new Response('OK', {
				headers: corsHeaders
			});
		}
		if (request.method !== 'POST') {
			return Response.json({ data: { errors: ['Method not allowed'] } }, { status: 400 });
		}

		const body: FormData = await request.formData();

		if (!body || typeof body !== 'object') {
			return Response.json({ data: { errors: ['Please fill out the form'] } }, { status: 400 });
		}

		const subject = `Contact form submission from ${body.get('name')}`;
		const rawEmail = {
			to: RECIPIENT_EMAIL,
			from: `welcome@${YOUR_DOMAIN}`,
			replyTo: body.get('email'),
			subject,
			html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>${subject}</h1>
            <p style="color: #777; font-size: 12px;">Sent: ${new Date().toLocaleDateString()}</p>
            <p></p>
            <p>Dear Mark,<br/>
            You have received a message from the website contact form:</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Contact Details</h3>
              <p><strong>Name:</strong> ${body.get('name')}</p>
              <p><strong>Email:</strong> ${body.get('email')}</p>
              <p><strong>Phone:</strong> ${body.get('phone')}</p>
              <p><strong>Message:</strong> ${body.get('message')}</p>
            </div>
          </div>
        `
		};

		// Send a welcome email
		const response = await env.EMAIL.send(rawEmail);

		return new Response(`Email sent: ${response.messageId}`);
	}
} satisfies ExportedHandler<Env>;


function normalizeInput(value: unknown) {
	return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

