import nodemailer from "nodemailer";

export const handler = async (event) => {
  console.log("[send-email] Function called, method:", event.httpMethod);

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    console.log("[send-email] Request body:", JSON.stringify(body, null, 2));

    const {
      customerEmail,
      customerName,
      packageName,
      packageType,
      transactionId,
      amount,
      licensePlate,
      phoneNumber,
    } = body;

    if (!customerEmail) {
      console.error("[send-email] Missing customerEmail");
      return { statusCode: 400, body: JSON.stringify({ error: "customerEmail is required" }) };
    }

    const host = process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER || "info@xntric.ca";
    const pass = process.env.SMTP_PASS || "Dontaskme@77";

    console.log("[send-email] SMTP config:", { host, port, user });

    if (!host || !user || !pass) {
      console.error("[send-email] SMTP environment variables are not configured");
      return { statusCode: 500, body: JSON.stringify({ error: "Email service not configured" }) };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    console.log("[send-email] Verifying SMTP connection...");
    await transporter.verify();
    console.log("[send-email] SMTP connection verified OK");

    const isMembership = packageType === "membership";

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#1a5fb4 0%,#2162af 100%);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:0.5px;">BlueVerse</h1>
                    <p style="color:#d0e4ff;margin:8px 0 0;font-size:14px;">${isMembership ? "Membership Purchase Confirmation" : "Purchase Confirmation"}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 40px 10px;text-align:center;">
                    <div style="width:64px;height:64px;background-color:#e6f4ea;border-radius:50%;margin:0 auto 16px;line-height:64px;">
                      <span style="font-size:32px;color:#34a853;">&#10003;</span>
                    </div>
                    <h2 style="color:#1a1a1a;margin:0 0 6px;font-size:22px;">Payment Successful!</h2>
                    <p style="color:#666;margin:0;font-size:14px;">Thank you for your purchase. Your transaction has been processed successfully.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding:20px 24px 12px;">
                          <h3 style="color:#2162af;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.8px;">Customer Details</h3>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;width:140px;">Name</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${customerName || "N/A"}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;">Email</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${customerEmail}</td>
                            </tr>
                            ${phoneNumber ? `
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;">Phone</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${phoneNumber}</td>
                            </tr>` : ""}
                            ${licensePlate ? `
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;">License Plate</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${licensePlate}</td>
                            </tr>` : ""}
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 24px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td>
                      </tr>
                      <tr>
                        <td style="padding:12px 24px 20px;">
                          <h3 style="color:#2162af;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.8px;">Order Details</h3>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;width:140px;">Package</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${packageName || "N/A"}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;">Type</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${isMembership ? "Membership" : "Washbook / One-time"}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;">Amount Paid</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:700;">AED ${Number(amount || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;">Transaction ID</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${transactionId || "N/A"}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0;color:#555;font-size:14px;">Date</td>
                              <td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" })}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 40px 30px;text-align:center;">
                    <p style="color:#999;font-size:12px;margin:0;">
                      If you have any questions, please contact us at <a href="mailto:${user}" style="color:#2162af;text-decoration:none;">${user}</a>
                    </p>
                    <p style="color:#ccc;font-size:11px;margin:12px 0 0;">
                      &copy; ${new Date().getFullYear()} BlueVerse. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    console.log("[send-email] Sending email to:", customerEmail, "BCC: saad@xntric.ca, sales@blueverse.ae, accounts@blueverse.ae");

    const info = await transporter.sendMail({
      from: `"BlueVerse" <${user}>`,
      to: customerEmail,
      bcc: ["saad@xntric.ca", "sales@blueverse.ae", "accounts@blueverse.ae"],
      subject: isMembership
        ? `BlueVerse - Membership Purchase Confirmation (${packageName || "Membership"})`
        : `BlueVerse - Purchase Confirmation (${packageName || "Service"})`,
      html: htmlBody,
    });

    console.log("[send-email] Email sent successfully! Message ID:", info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: info.messageId }),
    };
  } catch (err) {
    console.error("[send-email] Email send error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send email", details: err.message }),
    };
  }
};
