import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import handlebars from "handlebars";
import nodemailer, { createTestAccount } from "nodemailer";

export enum Templates {
  inviteProvider = "inviteProvider",
  resetPassword = "resetPassword",
}

export const DefaultSubject: Partial<Record<Templates, string>> = {
  [Templates.inviteProvider]: "Please sign up for Rheumote Control",
  [Templates.resetPassword]: "Reset your password",
};

export const DefaultTo: Partial<Record<Templates, string | string[]>> = {};

export enum UnsubGroup {}

export interface TemplateType {
  [Templates.inviteProvider]: z.infer<typeof InviteProviderMailSchema>;
  [Templates.resetPassword]: z.infer<typeof SendResetPasswordMailSchema>;
}

type TemplateMessage<T extends Templates> = TemplateType[T] & {
  to?: string | string[];
  subject?: string;
  from?: string;
};

type TemplateMessageParams<T extends Templates> =
  | TemplateMessage<T>[]
  | TemplateMessage<T>;

// const isDevelopment = process.env.NODE_ENV === "development"
const isDevelopment = false

const InviteProviderMailSchema = z.object({
  signupLink: z.string().url(),
});

const SendResetPasswordMailSchema = z.object({
  resetLink: z.string().url(),
});

export class MailService {
  // For handling some single emails
  transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null =
    null;
  templates = Templates;
  adminDestinations: string[] = "declan@mountaindev.com".split(",");
  fileContentDict: Record<string, string> = {};

  constructor() {
    void this.loadTransporter();
  }

  private async loadTransporter() {
    const transportOptions: SMTPTransport.Options = isDevelopment
      ? await createTestAccount().then(({ user, pass }) => ({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user, pass },
        }))
      : (process.env.EMAIL_SERVER as SMTPTransport.Options);
    this.transporter = nodemailer.createTransport(transportOptions);
  }

  /**
   * Prepare a template to store in the class so that it doesn't get opened over and over again when sending mail
   */
  public async prepTemplate<T extends Templates>(name: T) {
    // This only works when we run it from apps/nextjs. If script runs then it fails
    // In that case it needs to be ../../apps/nextjs/src/templates
    const templateDirectory = path.join(process.cwd(), "src/templates");
    let fileContent = this.fileContentDict[name];
    if (fileContent) {
      
    } else {
      
      fileContent = await fs.readFile(templateDirectory + `/${name}.hbs`, {
        encoding: "utf8",
      });
      this.fileContentDict[name] = fileContent;
    }
  }

  public async getTemplate<T extends Templates>(
    name: T,
    params: TemplateType[T],
  ): Promise<string> {
    const templateDirectory = path.join(process.cwd(), "src/templates");
    let fileContent = this.fileContentDict[name];
    if (fileContent) {
      
    } else {
      
      fileContent = await fs.readFile(templateDirectory + `/${name}.hbs`, {
        encoding: "utf8",
      });
      this.fileContentDict[name] = fileContent;
    }
    const template = handlebars.compile(fileContent);
    const templateResult = template(params);
    return templateResult;
  }

  async sendTemplateMessages<T extends Templates>(
    template: T,
    params: TemplateMessageParams<T>,
  ) {
    if (!this.transporter) throw new Error("Transporter not loaded");
    const paramsArray = Array.isArray(params) ? params : [params];
    if (!DefaultTo[template] && !paramsArray.every((p) => p.to)) {
      throw new Error("Missing to and no default to set");
    }

    if (!DefaultSubject[template] && !paramsArray.every((p) => p.subject)) {
      throw new Error("Missing to and no default to set");
    }

    // When sending template emails, we can't have too many files open at the same time
    // So we batch them in groups of 100 (the template file)
    // https://github.com/vercel/next.js/issues/52646 related
    await this.prepTemplate(template); // Prep template to ensure it is only opened once
    const batchSize = 100;
    const sent: (Error | SMTPTransport.SentMessageInfo)[] = [];

    // Create batches
    for (let i = 0; i < paramsArray.length; i += batchSize) {
      const batchParams = paramsArray.slice(i, i + batchSize);
      const batchMessages = await Promise.all(
        batchParams.map(async (item) => ({
          ...item,
          from: item.from ? item.from : process.env.EMAIL_FROM,
          to: item.to ? item.to : DefaultTo[template],
          subject: item.subject ? item.subject : DefaultSubject[template],
          html: await this.getTemplate(template, item),
        })),
      );
      const sentBatch = await this.sendViaTransporter(batchMessages);
      sent.push(...sentBatch);
    }

    return sent;
  }

  private async sendViaTransporter(messages: Mail.Options[], batchSize = 50) {
    if (messages.some((m) => m.text)) {
      throw new Error("Text is not supported, just use html");
    }

    const batches = messages.reduce((acc, message, i) => {
      const batchIndex = Math.floor(i / batchSize);
      acc[batchIndex] = acc[batchIndex] ?? [];
      acc[batchIndex]?.push(message);
      return acc;
    }, [] as Mail.Options[][]);

    const sentInfo: (SMTPTransport.SentMessageInfo | Error)[] = [];

    if (!this.transporter) throw new Error("Transporter not loaded");
    for (const batch of batches) {
      await Promise.all(
        batch.map((msg) =>
          this.transporter
            ?.sendMail(msg)
            .then((info) => {
              sentInfo.push(info);
              
              if (isDevelopment) {
                // Log development info here if needed
              }
            })
            .catch((error: Error) => {
              sentInfo.push(error);
              
              console.error("error", error.message);
            }),
        ),
      );
    }
    return sentInfo;
  }
}
