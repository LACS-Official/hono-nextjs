import nodemailer from 'nodemailer';

/**
 * 使用 Resend REST API 发送邮件 (适用于 Cloudflare 等 Serverless/Edge 运行时，避免 TCP 连接阻塞)
 */
async function sendViaResend(to: string, from: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { id: string };
      console.log(`[Email Service] Resend HTTP API 发送成功！MessageId: ${data.id}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[Email Service] Resend HTTP API 发送失败 (HTTP ${response.status}):`, errorText);
      return false;
    }
  } catch (error) {
    console.error('[Email Service] Resend HTTP API 发信异常:', error);
    return false;
  }
}

/**
 * 发送验证码邮件的主入口函数
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  
  const from = resendFrom || process.env.SMTP_FROM || `"玩机管家" <noreply@yourdomain.com>`;
  const subject = '【玩机管家】邮箱账号注册验证码';
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333; border-radius: 12px; border: 1px solid #eee;">
      <div style="text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 15px;">
        <h2 style="color: #3498db; margin: 0; font-size: 24px;">玩机管家 (ADMT)</h2>
        <p style="margin: 5px 0 0 0; color: #777; font-size: 14px;">您的专属系统助手</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">尊敬的用户，您好：</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">您正在使用此邮箱注册玩机管家账号。请在注册界面输入以下 6 位数字验证码完成身份校验：</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; padding: 12px 28px; font-size: 32px; font-weight: bold; color: #ffffff; background-color: #3498db; border-radius: 8px; letter-spacing: 6px; box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);">
            ${code}
          </span>
        </div>
        
        <p style="font-size: 14px; color: #e74c3c; line-height: 1.6; margin: 0 0 20px 0;">* 注意：此验证码有效时间为 10 分钟。如果并非您本人操作，请忽略此封邮件。</p>
      </div>
      <div style="border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 12px; color: #999;">
        <p style="margin: 0;">此邮件为系统自动发出，请勿直接回复。</p>
        <p style="margin: 5px 0 0 0;">© 2026 领创工作室 版权所有</p>
      </div>
    </div>
  `;

  // 开发调试日志打印
  console.log(`[Email Service] 正在向 ${email} 发送验证码: ${code}`);

  // 1. 如果配置了 Resend API，则优先通过 Resend REST API 方式发送邮件 (完美兼容 Cloudflare)
  if (resendApiKey && !resendApiKey.includes('your_resend_api_key')) {
    return await sendViaResend(email, from, subject, html);
  }

  // 2. 否则退化到用 SMTP / Nodemailer 发送
  const host = process.env.SMTP_HOST || 'smtp.resend.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // 如果 SMTP 配置没有被替换为真实的，则退化为本地控制台输出，直接视为成功以方便开发测试
  if (
    !user || 
    user.includes('your_email') || 
    (user === 'resend' && (!pass || pass.includes('your_smtp_auth_code_here') || pass.includes('your_resend_api_key')))
  ) {
    console.warn(`[Email Service] ⚠️ 发信配置处于占位模板状态，已将验证码打印在上方后台控制台，请在客户端输入该验证码完成注册。`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: email,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] SMTP 邮件发送成功！MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] SMTP 发信失败:`, error);
    // 为了不卡死调试，发信网络异常时我们依然能在日志中找到验证码，但返回 false
    return false;
  }
}
