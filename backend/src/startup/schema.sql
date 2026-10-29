CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS countries (name VARCHAR(255) PRIMARY KEY) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS room_types (name VARCHAR(100) PRIMARY KEY) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS rooms (
  room_number VARCHAR(10) PRIMARY KEY,
  room_type VARCHAR(100) NOT NULL,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (room_type) REFERENCES room_types(name)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS seasonal_rates (
  room_type VARCHAR(100) NOT NULL, season ENUM('low','mid','high') NOT NULL,
  nightly_price DECIMAL(18,2) NOT NULL,
  PRIMARY KEY (room_type,season), FOREIGN KEY (room_type) REFERENCES room_types(name)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  holder_first_name VARCHAR(255) NOT NULL, holder_last_name VARCHAR(255) NOT NULL,
  holder_country VARCHAR(255) NOT NULL, guest_count INT UNSIGNED NULL,
  arrival DATE NOT NULL, departure DATE NOT NULL, nights INT UNSIGNED NOT NULL,
  status ENUM('active','cancelled') NOT NULL DEFAULT 'active', version INT UNSIGNED NOT NULL DEFAULT 1,
  total_price DECIMAL(18,2) NOT NULL,
  synthetic_dates BOOLEAN NOT NULL DEFAULT FALSE, synthetic_room_assignment BOOLEAN NOT NULL DEFAULT FALSE,
  source_id VARCHAR(255) NULL,
  FOREIGN KEY (holder_country) REFERENCES countries(name),
  CHECK (departure > arrival), CHECK (nights > 0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS booking_guests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, booking_id INT UNSIGNED NOT NULL,
  first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS booking_rooms (
  booking_id INT UNSIGNED NOT NULL, room_number VARCHAR(10) NOT NULL, room_total DECIMAL(18,2) NOT NULL,
  PRIMARY KEY (booking_id,room_number), INDEX allocation_room (room_number,booking_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id), FOREIGN KEY (room_number) REFERENCES rooms(room_number)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS room_nights (
  booking_id INT UNSIGNED NOT NULL, room_number VARCHAR(10) NOT NULL, night_date DATE NOT NULL,
  season ENUM('low','mid','high') NOT NULL, exact_charge DECIMAL(18,2) NOT NULL,
  PRIMARY KEY (booking_id,room_number,night_date),
  FOREIGN KEY (booking_id,room_number) REFERENCES booking_rooms(booking_id,room_number)
) ENGINE=InnoDB;
