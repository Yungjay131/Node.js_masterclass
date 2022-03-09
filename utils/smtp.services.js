const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (options) => {
    let status = true;
    try{
        /* create reusable transporter object using the default SMTP transport */
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        /* send mail with defined transport object */ 
        const message = {
            from: `${process.env.SMTP_FROM_EMAIL} <${process.env.SMTP_FROM_EMAIL}>`, // sender address
            to: options.email, // list of receivers
            subject: options.subject,
            text: options.message, // plain text body
        };

        const messageInfo = await transporter.sendMail(message);

        console.log("Message sent: %s", messageInfo.messageId);
        /* Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>*/
    }catch(error){
        console.error(error.message);
        status = false;
    }finally{
       return status;
    }

}

module.exports = { sendPasswordResetEmail };