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
  host: 's2smsdatabase.cvme0g0k6zs6.ap-southeast-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Taknev321$',
  database: 's2sms'
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

    const sql = 'INSERT INTO s2customer (fullname, gender,  mobile, presentaddress, email, password, confirmpassword) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [
      req.body.fullname,
      req.body.gender,
      req.body.mobile,
      req.body.presentaddress,
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

// API endpoint to fetch services home page
app.get('/api/s2services', (req, res) => {
  const query = 'SELECT * FROM s2services';
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
app.get('/api/s2appliancerepair', (req, res) => {
  const query = 'SELECT * FROM s2appliancerepair';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});



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


// // API endpoint to fetch AC
app.get('/api/s2ac', (req, res) => {
  const query = 'SELECT * FROM s2ac';
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

app.get('/api/s2gastoveservice', (req, res) => {
  const query = 'SELECT * FROM s2gastoveservice';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2geyserservice', (req, res) => {
  const query = 'SELECT * FROM s2geyserservice';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2inverterservice', (req, res) => {
  const query = 'SELECT * FROM s2inverterservice';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2WaterPurifier', (req, res) => {
  const query = 'SELECT * FROM s2WaterPurifier';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2LaptopService', (req, res) => {
  const query = 'SELECT * FROM s2LaptopService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2MicrowaveService', (req, res) => {
  const query = 'SELECT * FROM s2MicrowaveService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2RefrigeratorService', (req, res) => {
  const query = 'SELECT * FROM s2RefrigeratorService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2TVService', (req, res) => {
  const query = 'SELECT * FROM s2TVService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2WashingMachineService', (req, res) => {
  const query = 'SELECT * FROM s2WashingMachineService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2HomeRepair', (req, res) => {
  const query = 'SELECT * FROM s2HomeRepair';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2Electrician', (req, res) => {
  const query = 'SELECT * FROM s2Electrician';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});
app.get('/api/s2Plumber', (req, res) => {
  const query = 'SELECT * FROM s2Plumber';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2Carpenter', (req, res) => {
  const query = 'SELECT * FROM s2Carpenter';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2CleaningService', (req, res) => {
  const query = 'SELECT * FROM s2CleaningService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2Full_Home_Cleaning', (req, res) => {
  const query = 'SELECT * FROM s2Full_Home_Cleaning';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2KitchenCleanigService', (req, res) => {
  const query = 'SELECT * FROM s2KitchenCleanigService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2SofaCleaningService', (req, res) => {
  const query = 'SELECT * FROM s2SofaCleaningService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2PestControlService', (req, res) => {
  const query = 'SELECT * FROM s2PestControlService';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2Cockroachcontrol', (req, res) => {
  const query = 'SELECT * FROM s2Cockroachcontrol';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2TermiteControl', (req, res) => {
  const query = 'SELECT * FROM s2TermiteControl';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/s2BedBugsControl', (req, res) => {
  const query = 'SELECT * FROM s2BedBugsControl';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

 //PERSONAL SERVICES API'S


app.get('/api/SalonForWomen', (req, res) => {
  const query = 'SELECT * FROM SalonForWomen';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SalonWomenLuxe', (req, res) => {
  const query = 'SELECT * FROM SalonWomenLuxe';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SalonWomenPrime', (req, res) => {
  const query = 'SELECT * FROM SalonWomenPrime';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SalonWomenClassic', (req, res) => {
  const query = 'SELECT * FROM SalonWomenClassic';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SpaForWomen', (req, res) => {
  const query = 'SELECT * FROM SpaForWomen';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/Ayurveda', (req, res) => {
  const query = 'SELECT * FROM Ayurveda';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});


app.get('/api/SpaWomenPrime', (req, res) => {
  const query = 'SELECT * FROM SpaWomenPrime';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SpaWomenLuxe', (req, res) => {
  const query = 'SELECT * FROM SpaWomenLuxe';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/HairStudioWomen', (req, res) => {
  const query = 'SELECT * FROM HairStudioWomen';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/MakeupStudio', (req, res) => {
  const query = 'SELECT * FROM MakeupStudio';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SalonForMen', (req, res) => {
  const query = 'SELECT * FROM SalonForMen';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SalonMenRoyale', (req, res) => {
  const query = 'SELECT * FROM SalonMenRoyale';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SalonMenPrime', (req, res) => {
  const query = 'SELECT * FROM SalonMenPrime';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});


app.get('/api/MassageForMen', (req, res) => {
  const query = 'SELECT * FROM MassageForMen';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SpaMenPrime', (req, res) => {
  const query = 'SELECT * FROM SpaMenPrime';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SpaMenAyurveda', (req, res) => {
  const query = 'SELECT * FROM SpaMenAyurveda';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).send('Error fetching services');
      return;
    }
    res.json(results);
  });
});

app.get('/api/SpaMenRoyal', (req, res) => {
  const query = 'SELECT * FROM SpaMenRoyal';
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
