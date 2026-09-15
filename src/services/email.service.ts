import nodemailer from "nodemailer";
import { EMAIL_USER,CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN } from "../config/env.js";

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: EMAIL_USER,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
  },
}); //through this transporter we can connect our server with the SMTP(It is a special server made only to work with mail sending) server of google that need credentials to verify and connect and that is responsible for sending mails to our client.


// Verify the connection configuration , yaani connection establish hua ki nahi .
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});




// Main function to send email . In this we just pass who and what . 
const sendEmail = async (to:string, subject:string, text:string, html:string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Banking-Ledger-System" <${EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



// for registration
export async function sendRegistrationEmail(userEmail:string,name:string) {
  const subject = "Welcome to Banking-Ledger-System";
  const text = `Hello ${name}, /n/n Thanks for registering at Banking-Ledger-System. `;
  const html = `
  <div>
    <p>
      Thanks for registering at <strong>Banking Ledger System</strong>.
    </p>
    <p>
      Your account has been created successfully. You can now log in and
      start managing your account.
    </p>
    <br />
    <p>
      Thanks,<br />
      <strong>Banking Ledger System</strong>
    </p>
  </div>
`;
  await sendEmail(userEmail, subject, text, html);
}



//for login
export async function sendLoginEmail(userEmail: string, name: string) {
  const subject = "Login Alert - Banking Ledger System";
  const text = `Hello ${name},You have successfully logged in to your Banking Ledger System account.If this was you, no further action is required.If you did not log in, please secure your account immediately.Thanks,Banking Ledger System`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hello ${name},</h2>
      <p>You have successfully logged in to your <strong>Banking Ledger System</strong> account.</p>
      <p>If this was you, no further action is required.</p>
      <p>
        If you did not log in, please secure your account immediately.
      </p>
      <br />
      <p>
        Thanks,<br />
        <strong>Banking Ledger System</strong>
      </p>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
}



export async function sendTransactionEmail(userEmail: string,name: string,amount: number,toAccount: string) {
  const subject = "Transaction Successful - Banking Ledger System";
  const text = `Hello ${name},
Your transaction has been successfully completed.
Amount: ${amount}
Transferred To: ${toAccount}

If you did not make this transaction, please secure your account immediately.

Thanks,
Banking Ledger System`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hello ${name},</h2>
      <p>
        Your transaction has been successfully completed.
      </p>
      <p>
        <strong>Transaction Details:</strong>
      </p>
      <ul>
        <li><strong>Amount:</strong> ${amount}</li>
        <li><strong>Transferred To:</strong> ${toAccount}</li>
      </ul>
      <p>
        If you did not make this transaction, please secure your account immediately.
      </p>
      <br />
      <p>
        Thanks,<br />
        <strong>Banking Ledger System</strong>
      </p>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
}



export async function sendTransactionFailedEmail(
  userEmail: string,
  name: string,
  amount: number,
  toAccount: string
) {
  const subject = "Transaction Failed - Banking Ledger System";
  const text = `Hello ${name},Unfortunately, your transaction could not be completed.

Amount: ${amount}
Transfer To: ${toAccount}
Status: FAILED

No money was transferred as part of this failed transaction.

If you did not attempt this transaction, please secure your account immediately.

Thanks,
Banking Ledger System`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hello ${name},</h2>
      <p>
        Unfortunately, your transaction could not be completed.
      </p>
      <p>
        <strong>Transaction Details:</strong>
      </p>
      <ul>
        <li><strong>Amount:</strong> ${amount}</li>
        <li><strong>Transfer To:</strong> ${toAccount}</li>
        <li><strong>Status:</strong> FAILED</li>
      </ul>
      <p>
        No money was transferred as part of this failed transaction.
      </p>
      <p>
        If you did not attempt this transaction, please secure your account immediately.
      </p>
      <br />
      <p>
        Thanks,<br />
        <strong>Banking Ledger System</strong>
      </p>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
}

/*---------------------------------------------------------------------------------------------------------------------
In total to use nodemailer,
Get the credentials -> connect our server to SMTP server of google -> now ready to send mails or do operation on client mails
*/
