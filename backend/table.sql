-- Create Database
CREATE DATABASE IF NOT EXISTS brightways;
USE brightways;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('child', 'caregiver', 'admin') DEFAULT 'child',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_type ENUM('autism', 'adhd', 'dyslexia') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    duration_minutes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_type (activity_type)
);

-- User Activity Progress table (best score per activity)
CREATE TABLE IF NOT EXISTS user_activity_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INT,
    time_spent_seconds INT,
    status ENUM('in_progress', 'completed', 'not_started') DEFAULT 'not_started',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_activity (user_id, activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_activity_id (activity_id)
);

-- Activity Sessions table (every attempt, used for history & trend charts)
CREATE TABLE IF NOT EXISTS activity_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    activity_type ENUM('autism', 'adhd', 'dyslexia') NOT NULL,
    score_percent INT NOT NULL DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    INDEX idx_user_sessions (user_id),
    INDEX idx_user_type_sessions (user_id, activity_type)
);

-- Caregiver -> child profile mapping
-- child_user_id links to users.id when the child also has an account (optional)
CREATE TABLE IF NOT EXISTS child_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    caregiver_id INT NOT NULL,
    child_user_id INT DEFAULT NULL,
    child_name VARCHAR(100) NOT NULL,
    child_age INT,
    condition_type ENUM('autism', 'adhd', 'dyslexia') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (child_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_caregiver_id (caregiver_id),
    INDEX idx_child_user_id (child_user_id)
);

-- Sample activities data
INSERT INTO activities (activity_type, title, description, difficulty_level, duration_minutes) VALUES
('autism',   'Social Stories',        'Learn about social situations through stories',       'easy',   10),
('autism',   'Emotion Recognition',   'Identify different emotions from facial expressions', 'medium', 15),
('adhd',     'Memory Sequence',       'Remember and repeat sequences to build focus',        'easy',    5),
('adhd',     'Focus Challenge',       'Improve concentration with progressive tasks',        'medium', 10),
('dyslexia', 'Word Recognition',      'Practice word recognition and spelling',              'easy',   10),
('dyslexia', 'Reading Comprehension', 'Improve reading skills with short stories',           'medium', 15);
