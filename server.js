const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require("cors");
const bcrypt = require("bcrypt");


const app = express();
const port = 3000; // Changed port number to 8081

app.use(bodyParser.json());

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

//api for perticular user id
app.get("/user/:id", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM s2service WHERE id = ?";

  db.query(sql, id, (err, result) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.json({ message: "Something unexpected has occurred" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = result[0]; // Changed variable name to 'user'
    // Remove the password field from the response for security reasons
    delete user.password;
    return res.json({ user });
  });
});

//api for all users
app.get("/user", (req, res) => {
  const sql = "SELECT * FROM s2service ";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.json({ message: "Something unexpected has occurred" });
    }
    return res.json({ users: result }); // Changed key to 'users'
  });
});

//api for new user
app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password.toString(), saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.json({ message: "Server error" });
    }

    const sql =
    "INSERT INTO s2service (usertype,fullname,gender, email,mobile,presentaddress, password, confirmpassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ";
    
    const values = [
      req.body.usertype,
      req.body.fullname,
      req.body.gender,
      req.body.email,
      req.body.mobile,
      req.body.presentaddress, // Corrected the order of values
      hashedPassword, // Store hashed password in the database
      req.body.confirmpassword, // Include value for confirmpassword
    ];
     db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.json({ message: "Something unexpected has occurred" + err });
      }
      return res.json({ success: "User added successfully" });
    });
  });
});

//api for delete account for existing user
app.delete("/user/:email", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM s2service WHERE email = ? ";

  db.query(sql, id, (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.json({ message: "Something unexpected has occurred" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ success: "User deleted successfully" });
  });
});

// api for existing and new user authentiction and checking new user or existing user
app.post('/login', (req, res) => {
  const sql = 'SELECT * FROM s2service WHERE email = ?';
  db.query(sql, [req.body.email], (err, data) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.json({ Error: "Login error in server" });
    }
    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return res.json({ Error: "Error comparing passwords" });
        }
        if (response) {
          return res.json({ Status: "Success" });
        } else {
          return res.json({ Error: "Password not matched" });
        }
      });
    } else {
      return res.json({ Error: "Email not exists" });
    }
  });
});

//api for updating details of existing user
app.put("/user/:id", (req, res) => {
  const { id } = req.params;

  // Hash the password if it's provided
  const hashedPassword = req.body.password ? bcrypt.hashSync(req.body.password.toString(), saltRounds) : undefined;

  const sql = "UPDATE s2service SET usertype=?, fullname=?, gender=?, email=?, mobile=?, presentaddress=?, password=? WHERE id=? ";
  const values = [
    req.body.usertype,
    req.body.fullname,
    req.body.gender,
    req.body.email,
    req.body.mobile,
    req.body.presentaddress,
    hashedPassword, // Store hashed password in the database
    id
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.json({ message: "Something unexpected has occurred" });
    }
    return res.json({ success: "User updated successfully" });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
