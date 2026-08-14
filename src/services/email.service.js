import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    secure: true,
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: process.env.FROM,
        pass: process.env.PASS
    }
})

export async function sendMail(To,sub,msg) {
    await transporter.sendMail({
        from:process.env.FROM,
        to:To,
        subject: sub,
        html: msg
    })

    console.log('Email Sent Successfully!')
}