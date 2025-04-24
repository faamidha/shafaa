const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// MySQL Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '1234', // Replace with your MySQL password
  database: 'ayesha', // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL database.');
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shafaaprint219@gmail.com',
    pass: 'lcqdatdtozwkgnxy', // Replace with a secure app password
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Nodemailer setup error:', error);
  } else {
    console.log('✅ Nodemailer is ready to send emails.');
  }
});

// Multer file storage setup
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

app.post('/submitPrintOrder', upload.fields([
  { name: 'fileUpload' },
  { name: 'paymentProof' }
]), (req, res) => {
  const { name, email, department, year, phone, copies, printType, paymentMode, details } = req.body;

  const fileUploadPath = req.files.fileUpload?.[0]?.path || '';
  const paymentProofPath = req.files.paymentProof?.[0]?.path || '';

  const insertQuery = `
    INSERT INTO print_orders1 
    (name, email, department, year, phone, copies, print_type, payment_mode, payment_proof_path, detials, file_upload_path) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [name, email, department, year, phone, copies, printType, paymentMode, paymentProofPath, details, fileUploadPath], (err) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).send('Failed to submit print order.');
    }

    const mailOptions = {
      from: 'shafaaprint219@gmail.com',
      to: 'shafaaprint219@gmail.com',
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
        console.error('❌ Email error:', error);
        return res.status(500).send('Order saved but email failed.');
      }

      console.log('✅ Email sent:', info.response);
      res.send('✅ Print order submitted, connected to database, and email sent successfully!');
    });
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Shafaa Prints server running at http://localhost:${PORT}`);
});