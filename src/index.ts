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
const RECIPIENT_EMAIL = ['adam@youi.design', 'mark@newmanknight.co.uk'];
const TURNSTILE_SECRET_KEY = '0x4AAAAAADqaPt9kjB0RgSvUY1qAqOE0uQ4';
const TURNSTILE_SITE_KEY = '0x4AAAAAADqaPlYE62V0X6Hi';

type ContactErrors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'turnstile', string>>
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s.-]{7,30}$/;

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
			return Response.json({ errors: { method: 'Method not allowed' } }, {
				status: 400,
				headers: corsHeaders
			});
		}

		const body: FormData = await request.formData();

		const name = normalizeInput(body.get('name'));
		const email = normalizeInput(body.get('email')).toLowerCase();
		const phone = normalizeInput(body.get('phone'));
		const message = normalizeInput(body.get('message'));
		const turnstileToken = normalizeInput(body.get('turnstileToken'));
		const errors: ContactErrors = {};

		if (!body || typeof body !== 'object') {
			return Response.json({ errors: { form: 'Please fill out the form' } }, {
				status: 400,
				headers: corsHeaders
			});
		}

		if (name.length < 2 || name.length > 100) {
			errors.name = 'Please enter your name';
		}

		if (!emailPattern.test(email) || email.length > 254) {
			errors.email = 'Please enter a valid email address';
		}

		if (!phonePattern.test(phone)) {
			errors.phone = 'Please enter a valid phone number';
		}

		if (message.length < 10 || message.length > 4000) {
			errors.message = 'Please enter a message more than 10';
		}

		if (!turnstileToken) {
			errors.turnstile = 'Please complete the security check';
		}

		if (Object.keys(errors).length > 0) {
			return Response.json({ errors }, { status: 400, headers: corsHeaders });
		}

		try {
			await verifyTurnstile(turnstileToken);
		} catch (e) {
			return Response.json({ errors: { turnstile: e } }, {
				status: 400,
				headers: corsHeaders
			});
		}


		const subject = `Contact form submission from ${name}`;
		const rawEmail = {
			to: RECIPIENT_EMAIL,
			from: {email: `website@${YOUR_DOMAIN}`, name: 'Newman Knight website'},
			replyTo: body.get('email') as string,
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
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Message:</strong> ${message}</p>
            </div>
          </div>
        `
		};

		// Send email
		await env.EMAIL.send(rawEmail);

		return new Response('OK', {
			headers: corsHeaders
		});
	}
} satisfies ExportedHandler<Env>;


function normalizeInput(value: unknown) {
	return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}


async function verifyTurnstile(token: string, remoteIp?: string) {
	if (!TURNSTILE_SECRET_KEY) {
		throw new Error('Turnstile is not configured');
	}

	const formData = new FormData();
	formData.append('secret', TURNSTILE_SECRET_KEY);
	formData.append('response', token);

	if (remoteIp) {
		formData.append('remoteip', remoteIp);
	}

	const result: Response | {
		success: boolean
	} = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		body: formData
	}).catch(() => ({ success: false }));

	console.log('Turnstile result: ', result);

	// if (result?.success === false) {
	// 	throw new Error('Security check failed');
	// }
}
