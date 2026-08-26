import { Resend } from "resend";

// ConfiguraÃ§Ã£o da Vercel para receber multipart/form-data (upload de arquivos)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper para ler o body bruto da requisiÃ§Ã£o
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Parser simples de multipart/form-data
function parseMultipart(buffer, boundary) {
  const fields = {};
  let attachment = null;

  const boundaryBuf = Buffer.from("--" + boundary);
  const parts = [];
  let start = 0;

  // Encontra todas as partes
  while (true) {
    const idx = buffer.indexOf(boundaryBuf, start);
    if (idx === -1) break;
    const next = buffer.indexOf(boundaryBuf, idx + boundaryBuf.length);
    if (next === -1) break;
    parts.push(buffer.slice(idx + boundaryBuf.length + 2, next - 2)); // remove \r\n
    start = next;
  }

  for (const part of parts) {
    // Separa header do corpo
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const headerStr = part.slice(0, headerEnd).toString("utf8");
    const body = part.slice(headerEnd + 4);

    // Pega o nome do campo
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const fileMatch = headerStr.match(/filename="([^"]+)"/);
    if (!nameMatch) continue;

    const fieldName = nameMatch[1];

    if (fileMatch && fileMatch[1]) {
      // Ã‰ um arquivo
      const filename = fileMatch[1];
      const contentTypeMatch = headerStr.match(/Content-Type:\s*(.+)/i);
      const contentType = contentTypeMatch
        ? contentTypeMatch[1].trim()
        : "application/octet-stream";

      if (filename && body.length > 0) {
        attachment = {
          filename,
          content: body,
          contentType,
        };
      }
    } else {
      // Ã‰ um campo de texto
      fields[fieldName] = body.toString("utf8").trim();
    }
  }

  return { fields, attachment };
}

export default async function handler(req, res) {
  // Permite CORS (caso precise)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "MÃ©todo nÃ£o permitido" });
  }

  try {
    const contentType = req.headers["content-type"] || "";
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: "Content-Type invÃ¡lido" });
    }

    const boundary = boundaryMatch[1].trim();
    const rawBody = await getRawBody(req);
    const { fields, attachment } = parseMultipart(rawBody, boundary);

    const { nome, telefone, email, assunto, mensagem } = fields;

    // ValidaÃ§Ã£o bÃ¡sica
    if (!nome || !email || !mensagem) {
      return res.status(400).json({ error: "Campos obrigatÃ³rios ausentes" });
    }

    const assuntoLabel =
      assunto === "curriculo"
        ? "Envio de CurrÃ­culo"
        : assunto === "orcamento"
        ? "Solicitar OrÃ§amento"
        : "DÃºvidas Gerais";

    // Monta o email
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailPayload = {
      from: "C&W SeguranÃ§a <onboarding@resend.dev>",
      to: ["cwsegurancaprivada@gmail.com"],
      replyTo: email,
      subject: `[${assuntoLabel}] Contato de ${nome} pelo site`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
          <div style="background: #1a1a1a; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
            <h1 style="color: #c9a84c; margin: 0; font-size: 22px;">C&amp;W SeguranÃ§a</h1>
            <p style="color: #999; margin: 4px 0 0; font-size: 13px;">Nova mensagem via site</p>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 6px 6px; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Assunto:</td>
                <td style="padding: 8px 0; color: #222;">${assuntoLabel}</td>
              </tr>
              <tr style="background: #f5f5f5;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Nome:</td>
                <td style="padding: 8px; color: #222;">${nome}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">E-mail:</td>
                <td style="padding: 8px 0; color: #222;"><a href="mailto:${email}" style="color: #c9a84c;">${email}</a></td>
              </tr>
              <tr style="background: #f5f5f5;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Telefone:</td>
                <td style="padding: 8px; color: #222;">${telefone || "NÃ£o informado"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Mensagem:</td>
                <td style="padding: 8px 0; color: #222; white-space: pre-wrap;">${mensagem}</td>
              </tr>
            </table>
            ${
              attachment
                ? `<p style="margin-top: 16px; padding: 10px; background: #fff8e1; border-left: 3px solid #c9a84c; border-radius: 4px; font-size: 14px; color: #555;">ðŸ“Ž Arquivo anexado: <strong>${attachment.filename}</strong></p>`
                : ""
            }
          </div>
          <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #aaa;">Mensagem enviada pelo formulÃ¡rio de contato em <strong>cwseguranca.com.br</strong></p>
        </div>
      `,
      attachments: attachment
        ? [
            {
              filename: attachment.filename,
              content: attachment.content.toString("base64"),
            },
          ]
        : [],
    };

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error("Erro Resend:", error);
      return res.status(500).json({ error: "Falha ao enviar email", detail: error });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
