import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function submitPhone(phone: string) {
	const body = new FormData();
	body.set("name", "Test User");
	body.set("email", "test@example.com");
	body.set("phone", phone);
	body.set("message", "A test contact form message.");
	// Omit Turnstile so tests stop at validation without external calls or emails.
	const request = new IncomingRequest("https://example.com", { method: "POST", body });
	return worker.fetch(request, env);
}

describe("Contact form phone validation", () => {
	it.each([
		"079544083",
		"0795440831",
		"079544083123",
		"07954 4083",
		"",
		"abcdefghijk",
		"0795440831a",
		"+447954408312",
	])("rejects an invalid phone number: %s", async (phone) => {
		const response = await submitPhone(phone);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			errors: {
				phone: "Please enter a phone number with exactly 11 digits",
				turnstile: "Please complete the security check",
			},
		});
	});

	it.each(["07954408312", "02079460958", "07954 408312", " 07954408312 "])(
		"accepts an 11-digit phone number: %s",
		async (phone) => {
			const response = await submitPhone(phone);
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				errors: { turnstile: "Please complete the security check" },
			});
		},
	);
});
