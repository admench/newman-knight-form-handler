export interface EmailAddress {
  email: string;
  name?: string;
}

// Structured email builder (recommended)
export interface EmailMessageBuilder {
  to: string | EmailAddress | (string | EmailAddress)[]; // Max 50 recipients
  from: string | EmailAddress;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | EmailAddress | (string | EmailAddress)[];
  bcc?: string | EmailAddress | (string | EmailAddress)[];
  replyTo?: string | EmailAddress;
  attachments?: Attachment[];
  // Custom headers. See /email-service/reference/headers/
  headers?: { [key: string]: string };
  // The combined number of addresses in `to`, `cc`, and `bcc` must not
  // exceed 50. See /email-service/platform/limits/ for all limits.
}

interface Attachment {
  content: string | ArrayBuffer | ArrayBufferView; // Base64 string or binary content
  filename: string;
  type: string; // MIME type
  disposition: "attachment" | "inline";
  contentId?: string; // For inline attachments
}

interface EmailSendResult {
  messageId: string; // Unique email ID
}

export interface SendEmail {
  send(message: EmailMessageBuilder): Promise<EmailSendResult>;
}

// Errors are thrown as standard Error objects with a `code` property
// try { await env.EMAIL.send(...) } catch (e) { console.log(e.code, e.message) }