
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const safeColor = (color) =>
  /^#[0-9a-fA-F]{6}$/.test(color || "")
    ? color
    : "#2563eb";

export const passwordResetTemplate = ({
  name,
  resetUrl,
  hospitalName = "Hospital Management System",
  emailResetHeading = "Reset Your Password",
  emailResetMessage =
    "We received a request to reset your account password. Click the button below to create a new password.",
  emailResetButtonText = "Reset Password",
  emailResetButtonColor = "#2563eb",
  emailResetFooter =
    "This is an automated security email. Please do not reply.",
}) => {
  const hospital = escapeHtml(hospitalName);
  const username = escapeHtml(name);
  const heading = escapeHtml(emailResetHeading);
  const message = escapeHtml(emailResetMessage).replace(
    /\r?\n/g,
    "<br/>"
  );
  const buttonText = escapeHtml(emailResetButtonText);
  const buttonColor = safeColor(emailResetButtonColor);
  const footer = escapeHtml(emailResetFooter).replace(
    /\r?\n/g,
    "<br/>"
  );
  const url = escapeHtml(resetUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#1e40af;padding:30px;text-align:center;color:#ffffff;">
              <h2 style="margin:0;">${hospital}</h2>
              <p style="font-size:13px;">Account Security</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;color:#334155;">
              <h2 style="color:#0f172a;">${heading}</h2>

              <p>Hello ${username},</p>

              <p style="line-height:1.7;">${message}</p>

              <div style="text-align:center;margin:30px 0;">
                <a href="${url}"
                  style="display:inline-block;background:${buttonColor};color:#ffffff;
                  padding:15px 28px;border-radius:8px;text-decoration:none;
                  font-weight:bold;">
                  ${buttonText}
                </a>
              </div>

              <p style="font-size:14px;color:#dc2626;">
                This link expires in 15 minutes.
              </p>

              <p style="font-size:13px;color:#64748b;">
                If you did not request this change, ignore this email.
              </p>

              <p style="font-size:12px;word-break:break-all;color:#64748b;">
                If the button doesn't work, use this link:<br/>
                <a href="${url}">${url}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:22px;text-align:center;
              font-size:12px;color:#64748b;">
              ${footer}
              <p>© ${new Date().getFullYear()} ${hospital}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
