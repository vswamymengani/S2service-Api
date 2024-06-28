const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000; // Keep the original port for consistency

app.use(bodyParser.json());
app.use(cors());

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 's2s'
});

const saltRounds = 10; // Salt rounds for bcrypt hashing

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

app.get('/profile', (req, res) => {
  const email = req.query.email;

  const sql = 'SELECT fullname, gender, email, mobile, presentaddress FROM s2customer WHERE email = ?';
  
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error('Error fetching profile details:', err);
      return res.json({ message: 'Something unexpected has occurred' });
    }
    
    if (result.length > 0) {
      return res.json({ success: true, profile: result[0] });
    } else {
      return res.json({ success: false, message: 'User not found' });
    }
  });
});

// API for updating customer details
app.put('/updateProfile', (req, res) => {
  const { name, phone, userEmail, email } = req.body;

  const query = 'UPDATE s2customer SET fullname = ?, mobile = ?, email = ? WHERE email = ?';
  const values = [name, phone, userEmail, email];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
    } else {
      res.json({ success: true, message: 'Profile updated successfully' });
    }
  });
});



// Register new customer
app.post('/registercustomer', (req, res) => {
  bcrypt.hash(req.body.password.toString(), saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.json({ message: 'Server error' });
    }

    const sql = 'INSERT INTO s2customer (fullname, gender, email, mobile, presentaddress, password, confirmpassword) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [
      req.body.fullname,
      req.body.gender,
      req.body.email,
      req.body.mobile,
      req.body.presentaddress,
      hashedPassword,
      req.body.confirmpassword
    ];

    console.log('Inserting user with values:', values);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.json({ message: 'Something unexpected has occurred' });
      }
      return res.json({ success: 'User added successfully' });
    });
  });
});

// Register new technician
app.post('/registertechnician', (req, res) => {
  bcrypt.hash(req.body.password.toString(), saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.json({ message: 'Server error' });
    }

    const sql = 'INSERT INTO s2technician (fullname, gender, email, mobile, presentaddress, workExperience, password, confirmpassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
      req.body.fullname,
      req.body.gender,
      req.body.email,
      req.body.mobile,
      req.body.presentaddress,
      req.body.workExperience,
      hashedPassword,
      req.body.confirmpassword
    ];

    console.log('Inserting user with values:', values);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.json({ message: 'Something unexpected has occurred' });
      }
      return res.json({ success: 'User added successfully' });
    });
  });
});

// Register new admin
app.post('/registeradmin', (req, res) => {
  bcrypt.hash(req.body.password.toString(), saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.json({ message: 'Server error' });
    }

    const sql = 'INSERT INTO s2admin (email, password, confirmpassword) VALUES (?, ?, ?)';
    const values = [
      req.body.email,
      hashedPassword,
      req.body.confirmpassword
    ];

    console.log('Inserting user with values:', values);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.json({ message: 'Something unexpected has occurred' });
      }
      return res.json({ success: 'User added successfully' });
    });
  });
});

// Delete customer account
app.delete('/user/:email', (req, res) => {
  const { email } = req.params;

  const sql = 'DELETE FROM s2customer WHERE email = ?';

  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.json({ message: 'Something unexpected has occurred' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ success: 'User deleted successfully' });
  });
});

// Customer login
app.post('/logincustomer', (req, res) => {
  const sql = 'SELECT * FROM s2customer WHERE email = ?';
  db.query(sql, [req.body.email], (err, data) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.json({ Error: 'Login error in server' });
    }
    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.json({ Error: 'Error comparing passwords' });
        }
        if (response) {
          return res.json({ Status: 'Success' });
        } else {
          return res.json({ Error: 'Password not matched' });
        }
      });
    } else {
      return res.json({ Error: 'Email not exists' });
    }
  });
});

// Technician login
app.post('/logintechnician', (req, res) => {
  const sql = 'SELECT * FROM s2technician WHERE email = ?';
  db.query(sql, [req.body.email], (err, data) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.json({ Error: 'Login error in server' });
    }
    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.json({ Error: 'Error comparing passwords' });
        }
        if (response) {
          return res.json({ Status: 'Success' });
        } else {
          return res.json({ Error: 'Password not matched' });
        }
      });
    } else {
      return res.json({ Error: 'Email not exists' });
    }
  });
});

// Admin login
app.post('/loginadmin', (req, res) => {
  const sql = 'SELECT * FROM s2admin WHERE email = ?';
  db.query(sql, [req.body.email], (err, data) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.json({ Error: 'Login error in server' });
    }
    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.json({ Error: 'Error comparing passwords' });
        }
        if (response) {
          return res.json({ Status: 'Success' });
        } else {
          return res.json({ Error: 'Password not matched' });
        }
      });
    } else {
      return res.json({ Error: 'Email not exists' });
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
