-- Core tables migration
-- This migration creates the essential tables for the application

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  handle VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  avatar_color VARCHAR(7) DEFAULT '#94a3b8',
  avatar_image TEXT,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'Member',
  is_approved BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'Actif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  image TEXT NOT NULL,
  caption VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_handle, post_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  following_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_handle, following_handle)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  receiver_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  user2_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_handle, user2_handle)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
