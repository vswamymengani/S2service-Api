const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');


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

// Endpoint to insert image
app.post('/api/services', (req, res) => {
  const { name, category, imagePath } = req.body;
  fs.readFile(imagePath, (err, imageData) => {
      if (err) return res.status(500).send('Error reading image file');

      const query = 'INSERT INTO services (name, category, image) VALUES (?, ?, ?)';
      const values = [name, category, imageData];
      
      db.query(query, values, (err) => {
          if (err) return res.status(500).send('Error inserting data');
          res.send('Image inserted successfully');
      });
  });
});

// Endpoint to retrieve image
app.get('/api/image/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT image FROM services WHERE id = ?';

  db.query(query, [id], (err, results) => {
      if (err) return res.status(500).send('Error fetching image');
      if (results.length === 0) return res.status(404).send('Image not found');

      const image = results[0].image;

      res.setHeader('Content-Type', 'image/png'); // Adjust based on actual image type
      res.send(image);
  });
});

// API endpoint to fetch services
app.get('/api/services', (req, res) => {
  const query = 'SELECT * FROM services';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});


// API endpoint to fetch services
app.get('/api/Appliancerepair', (req, res) => {
  const query = 'SELECT * FROM Appliancerepair';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

// // Endpoint to insert image
// app.post('/api/Appliancerepair', (req, res) => {
//   const { name, category, imagePath } = req.body;
//   fs.readFile(imagePath, (err, imageData) => {
//       if (err) return res.status(500).send('Error reading image file');

//       const query = 'INSERT INTO Appliancerepair (name, image) VALUES (?,?)';
//       const values = [name, imageData];
      
//       db.query(query, values, (err) => {
//           if (err) return res.status(500).send('Error inserting data');
//           res.send('Image inserted successfully');
//       });
//   });
// });

// Endpoint to retrieve image
app.get('/api/image/:id', (req, res) => {
  const { AppliancerepairId } = req.params;
  const query = 'SELECT image FROM Appliancerepair WHERE id = ?';

  db.query(query, [AppliancerepairId], (err, results) => {
      if (err) return res.status(500).send('Error fetching image');
      if (results.length === 0) return res.status(404).send('Image not found');

      const image = results[0].image;

      res.setHeader('Content-Type', 'image/png'); // Adjust based on actual image type
      res.send(image);
  });
});

// Endpoint to insert image
app.post('/api/AC', (req, res) => {
  const { name, category, imagePath } = req.body;
  fs.readFile(imagePath, (err, imageData) => {
      if (err) return res.status(500).send('Error reading image file');

      const query = 'INSERT INTO AC (name, warranty, rating, reviews, price, description, image) VALUES (?, ?, ?,?,?,?,?)';
      const values = [name, category, imageData];
      
      db.query(query, values, (err) => {
          if (err) return res.status(500).send('Error inserting data');
          res.send('Image inserted successfully');
      });
  });
});

// Endpoint to retrieve image
app.get('/api/image/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT image FROM AC WHERE id = ?';

  db.query(query, [id], (err, results) => {
      if (err) return res.status(500).send('Error fetching image');
      if (results.length === 0) return res.status(404).send('Image not found');

      const image = results[0].image;

      res.setHeader('Content-Type', 'image/png'); // Adjust based on actual image type
      res.send(image);
  });
});

// API endpoint to fetch Appliancerepair
// app.get('/api/Appliancerepair', (req, res) => {
//   const query = 'SELECT * FROM Appliancerepair';
//   db.query(query, (err, results) => {
//     if (err) {
//       console.error('Error fetching services:', err);
//       res.status(500).send('Error fetching services');
//       return;
//     }
//     res.json(results);
//   });
// });

// // API endpoint to fetch AC
app.get('/api/AC', (req, res) => {
  const query = 'SELECT * FROM AC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/ChimneyService', (req, res) => {
  const query = 'SELECT * FROM ChimneyService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});


app.get('/api/Appliancerepair/:id', (req, res) => {
  const AppliancerepairId = req.params.id;
  const query = 'SELECT * FROM Appliancerepair WHERE id = ?';
  db.query(query, [AppliancerepairId], (err, results) => {
    if (err) {
      console.error('Error fetching service details:', err);
      res.status(500).send('Error fetching service details');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Service not found');
      return;
    }
    res.json(results[0]);
  });
});

app.get('/api/image/:id', (req, res) => {
  const AppliancerepairId = req.params.id;
  const query = 'SELECT image FROM Appliancerepair WHERE id = ?';
  db.query(query, [AppliancerepairId], (err, results) => {
    if (err) {
      console.error('Error fetching image:', err);
      res.status(500).send('Error fetching image');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Image not found');
      return;
    }
    res.contentType('image/jpeg');
    res.send(results[0].image);
  });
});

app.get('/api/GastoveService', (req, res) => {
  const query = 'SELECT * FROM GastoveService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/GeyserService', (req, res) => {
  const query = 'SELECT * FROM GeyserService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/InverterService', (req, res) => {
  const query = 'SELECT * FROM InverterService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/WaterPurifier', (req, res) => {
  const query = 'SELECT * FROM WaterPurifier';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/LaptopService', (req, res) => {
  const query = 'SELECT * FROM LaptopService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
