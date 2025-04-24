require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const cors = require('cors');
app.use(cors());
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '1234', // Replace with your MySQL password
  database: 'ayesha', // Replace with your database name
});
db.connect((err) => {
  if (err) {
    console.error('❌ Database Connection Error:', err);
    return;
  }
  console.log('✅ Connected to MySQL Database.');
});

// Nodemailer Setup


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shafaaprint219@gmail.com',
    pass: 'lcqdatdtozwkgnxy', 
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Nodemailer Setup Error:', error);
  } else {
    console.log('✅ Nodemailer Ready to Send Emails.');
  }
});

// Multer File Upload Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Print Order Submission API
app.post('/submitPrintOrder', upload.fields([
  { name: 'fileUpload' },
  { name: 'paymentProof' }
]), (req, res) => {
  const { name, email, department, year, phone, copies, printType, paymentMode, details } = req.body;

  const fileUploadPath = req.files?.fileUpload?.[0]?.path || '';
  const paymentProofPath = req.files?.paymentProof?.[0]?.path || '';

  const insertQuery = `
    INSERT INTO print_orders 
    (name, email, department, year, phone, copies, print_type, payment_mode, payment_proof_path, details, file_upload_path) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [name, email, department, year, phone, copies, printType, paymentMode, paymentProofPath, details, fileUploadPath], (err) => {
    if (err) {
      console.error('❌ Database Error:', err);
      return res.status(500).send('❌ Failed to Submit Print Order.');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '🖨️ New Print Order Received',
      html: `
        <h2>📥 Dear Shafaa Printer, You have a new order!</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Year:</strong> ${year}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Copies:</strong> ${copies}</p>
        <p><strong>Print Type:</strong> ${printType}</p>
        <p><strong>Payment Mode:</strong> ${paymentMode}</p>
        <p><strong>Details:</strong> ${details}</p>
      `,
      attachments: [
        ...(fileUploadPath ? [{ filename: path.basename(fileUploadPath), path: fileUploadPath }] : []),
        ...(paymentProofPath ? [{ filename: path.basename(paymentProofPath), path: paymentProofPath }] : [])
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email Error:', error);
        return res.status(500).send('✅ Order Saved but Email Failed.');
      }

      console.log('✅ Email Sent:', info.response);
      res.send('✅ Print Order Submitted & Email Sent Successfully!');
    });
  });
});

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Shafaa Prints Server Running at http://localhost:${PORT}`);
});
