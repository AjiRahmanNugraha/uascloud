-- SQL commands to set up the MySQL database for the mental health website

-- Create the database
CREATE DATABASE IF NOT EXISTS mental_health_db;

-- Use the database
USE mental_health_db;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create an index on username for faster lookups
CREATE INDEX idx_username ON users(username);
