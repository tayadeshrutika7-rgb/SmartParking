

DROP DATABASE IF EXISTS SmartParking;
CREATE DATABASE SmartParking;
USE SmartParking;

CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(60) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('driver', 'admin') NOT NULL DEFAULT 'driver',
    CHECK (phone IS NULL OR LENGTH(phone) BETWEEN 10 AND 15)
);

CREATE TABLE Vehicle (
    plate_no VARCHAR(10) PRIMARY KEY,
    owner_id INT NOT NULL,
    vehicle_type ENUM('car', 'motorcycle', 'truck') NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES User(user_id)
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    CHECK (plate_no <> '')
);

CREATE TABLE ParkingLot (
    lot_id INT PRIMARY KEY AUTO_INCREMENT,
    location VARCHAR(100) NOT NULL,
    total_spots INT NOT NULL,
    available_spots INT NOT NULL,
    hourly_rate DECIMAL(6,2) NOT NULL DEFAULT 5.00,
    CHECK (total_spots > 0),
    CHECK (available_spots >= 0 AND available_spots <= total_spots),
    CHECK (hourly_rate >= 0)
);

CREATE TABLE Reservation (
    res_id INT PRIMARY KEY AUTO_INCREMENT,
    plate_no VARCHAR(10),
    lot_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    price DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (plate_no) REFERENCES Vehicle(plate_no)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (lot_id) REFERENCES ParkingLot(lot_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CHECK (end_time > start_time),
    CHECK (price >= 0)
);


CREATE TABLE Payment (
    pay_id INT PRIMARY KEY AUTO_INCREMENT,
    res_id INT,
    amount DECIMAL(8,2) NOT NULL,
    method ENUM('cash', 'credit_card', 'mobile_payment') NOT NULL,
    pay_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (res_id) REFERENCES Reservation(res_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CHECK (amount > 0)
);


-- USERS (passwords are hashed with bcrypt - password is 'password123' for all)
INSERT INTO User (name, phone, email, password, role) VALUES
('Ali Ben', '0612345678', 'ali.ben@email.com', '$2b$10$rKz5qY5q5q5q5q5q5q5q5uX8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J', 'driver'),
('Sara Nouri', '0698765432', 'sara.nouri@email.com', '$2b$10$rKz5qY5q5q5q5q5q5q5q5uX8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J', 'driver'),
('Youssef Karim', '0654321987', 'youssef.karim@email.com', '$2b$10$rKz5qY5q5q5q5q5q5q5q5uX8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J', 'driver'),
('Admin User', '0600000000', 'admin@smartcity.com', '$2b$10$rKz5qY5q5q5q5q5q5q5q5uX8J8J8J8J8J8J8J8J8J8J8J8J8J8J8J', 'admin');

-- VEHICLES
INSERT INTO Vehicle (plate_no, owner_id, vehicle_type) VALUES
('A123BC', 1, 'car'),
('B456CD', 2, 'car'),
('M789EF', 2, 'motorcycle'),
('T654GH', 3, 'truck');

-- PARKING LOTS
INSERT INTO ParkingLot (location, total_spots, available_spots, hourly_rate) VALUES
('Casablanca Downtown', 100, 20, 10.00),
('Rabat Agdal', 75, 10, 8.50),
('Marrakech Center', 120, 45, 9.00),
('Fes Medina', 60, 15, 7.00);

-- RESERVATIONS
INSERT INTO Reservation (plate_no, lot_id, start_time, end_time, price, status) VALUES
('A123BC', 1, '2025-10-25 09:00:00', '2025-10-25 11:30:00', 25.00, 'completed'),
('B456CD', 2, '2025-10-25 10:00:00', '2025-10-25 12:00:00', 17.00, 'completed'),
('M789EF', 3, '2025-10-25 14:00:00', '2025-10-25 16:00:00', 18.00, 'active'),
('T654GH', 1, '2025-10-25 08:00:00', '2025-10-25 12:00:00', 40.00, 'completed');

-- PAYMENTS
INSERT INTO Payment (res_id, amount, method, pay_date) VALUES
(1, 25.00, 'credit_card', '2025-10-25 11:35:00'),
(2, 17.00, 'mobile_payment', '2025-10-25 12:05:00'),
(3, 18.00, 'cash', '2025-10-25 16:10:00'),
(4, 40.00, 'credit_card', '2025-10-25 12:15:00');

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

/***************************************************************************
 SP 1: Get parking lot details by ID
 Returns parking lot information or error message if not found
***************************************************************************/
DROP PROCEDURE IF EXISTS sp_get_parking_lot;
DELIMITER $$
CREATE PROCEDURE sp_get_parking_lot(IN v_lot_id INT)
BEGIN
    IF EXISTS (SELECT 1 FROM ParkingLot WHERE lot_id = v_lot_id) THEN
        SELECT * FROM ParkingLot WHERE lot_id = v_lot_id;
    ELSE
        SELECT CONCAT('Parking lot ID ', v_lot_id, ' not found') AS error;
    END IF;
END$$
DELIMITER ;

/***************************************************************************
 SP 2: Get parking lot availability status
 Returns location, available spots, and status message
***************************************************************************/
DROP PROCEDURE IF EXISTS sp_check_availability;
DELIMITER $$
CREATE PROCEDURE sp_check_availability(IN v_lot_id INT)
BEGIN
    DECLARE v_location VARCHAR(100);
    DECLARE v_available INT;
    DECLARE v_total INT;
    
    SELECT location, available_spots, total_spots
    INTO v_location, v_available, v_total
    FROM ParkingLot
    WHERE lot_id = v_lot_id;
    
    IF v_location IS NULL THEN
        SELECT CONCAT('Parking lot ID ', v_lot_id, ' is invalid') AS error;
    ELSE
        SELECT 
            v_lot_id AS lot_id,
            v_location AS location,
            v_available AS available_spots,
            v_total AS total_spots,
            CASE 
                WHEN v_available = 0 THEN 'Full'
                WHEN v_available < v_total * 0.2 THEN 'Almost Full'
                ELSE 'Available'
            END AS status;
    END IF;
END$$
DELIMITER ;

/***************************************************************************
 SP 3: Get user's vehicles
 Returns all vehicles owned by a specific user
***************************************************************************/
DROP PROCEDURE IF EXISTS sp_get_user_vehicles;
DELIMITER $$
CREATE PROCEDURE sp_get_user_vehicles(IN v_user_id INT)
BEGIN
    DECLARE v_name VARCHAR(50);
    
    SELECT name INTO v_name FROM User WHERE user_id = v_user_id;
    
    IF v_name IS NULL THEN
        SELECT CONCAT('User ID ', v_user_id, ' not found') AS error;
    ELSE
        SELECT 
            v.plate_no,
            v.vehicle_type,
            v_name AS owner_name
        FROM Vehicle v
        WHERE v.owner_id = v_user_id;
    END IF;
END$$
DELIMITER ;

/***************************************************************************
 SP 4: Get reservation details with vehicle and location info
 Returns complete reservation information or error
***************************************************************************/
DROP PROCEDURE IF EXISTS sp_get_reservation_details;
DELIMITER $$
CREATE PROCEDURE sp_get_reservation_details(IN v_res_id INT)
BEGIN
    DECLARE v_exists INT;
    
    SELECT COUNT(*) INTO v_exists FROM Reservation WHERE res_id = v_res_id;
    
    IF v_exists = 0 THEN
        SELECT CONCAT('Reservation ID ', v_res_id, ' not found') AS error;
    ELSE
        SELECT 
            r.res_id,
            r.plate_no,
            v.vehicle_type,
            pl.location,
            r.start_time,
            r.end_time,
            r.price,
            r.status
        FROM Reservation r
        LEFT JOIN Vehicle v ON r.plate_no = v.plate_no
        LEFT JOIN ParkingLot pl ON r.lot_id = pl.lot_id
        WHERE r.res_id = v_res_id;
    END IF;
END$$
DELIMITER ;

/***************************************************************************
 SP 5: Calculate parking price
 Calculates price based on parking lot hourly rate and duration
***************************************************************************/
DROP PROCEDURE IF EXISTS sp_calculate_price;
DELIMITER $$
CREATE PROCEDURE sp_calculate_price(
    IN v_lot_id INT,
    IN v_start_time DATETIME,
    IN v_end_time DATETIME,
    OUT v_price DECIMAL(8,2)
)
BEGIN
    DECLARE v_rate DECIMAL(6,2);
    DECLARE v_hours DECIMAL(10,2);
    
    SELECT hourly_rate INTO v_rate FROM ParkingLot WHERE lot_id = v_lot_id;
    
    SET v_hours = TIMESTAMPDIFF(MINUTE, v_start_time, v_end_time) / 60.0;
    SET v_price = v_rate * v_hours;
END$$
DELIMITER ;

/***************************************************************************
 SP 6: Get active reservations for a parking lot
 Returns all active reservations at a specific parking lot
***************************************************************************/
DROP PROCEDURE IF EXISTS sp_get_active_reservations;
DELIMITER $$
CREATE PROCEDURE sp_get_active_reservations(IN v_lot_id INT)
BEGIN
    SELECT 
        r.res_id,
        r.plate_no,
        v.vehicle_type,
        r.start_time,
        r.end_time,
        r.price
    FROM Reservation r
    LEFT JOIN Vehicle v ON r.plate_no = v.plate_no
    WHERE r.lot_id = v_lot_id 
    AND r.status = 'active'
    ORDER BY r.start_time;
END$$
DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

/***************************************************************************
 TRIGGER 1: Before Insert on Reservation
 - Checks if parking lot has available spots
 - Validates that end_time > start_time
 - Decreases available_spots when reservation is created
***************************************************************************/
DROP TRIGGER IF EXISTS trg_reservation_insert;
DELIMITER $$
CREATE TRIGGER trg_reservation_insert
BEFORE INSERT ON Reservation
FOR EACH ROW
BEGIN
    DECLARE v_available INT;
    DECLARE v_location VARCHAR(100);
    
    -- Get available spots for the parking lot
    SELECT available_spots, location 
    INTO v_available, v_location
    FROM ParkingLot 
    WHERE lot_id = NEW.lot_id;
    
    -- Check if parking lot has available spots
    IF v_available <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Reservation failed: No available spots in this parking lot';
    END IF;
    
    -- Validate time logic
    IF NEW.end_time <= NEW.start_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Reservation failed: End time must be after start time';
    END IF;
    
    -- Update available spots (decrease by 1)
    UPDATE ParkingLot
    SET available_spots = available_spots - 1
    WHERE lot_id = NEW.lot_id;
END$$
DELIMITER ;

/***************************************************************************
 TRIGGER 2: After Delete on Reservation
 - Increases available_spots when reservation is deleted/cancelled
 - Only updates if the reservation had a valid lot_id
***************************************************************************/
DROP TRIGGER IF EXISTS trg_reservation_delete;
DELIMITER $$
CREATE TRIGGER trg_reservation_delete
AFTER DELETE ON Reservation
FOR EACH ROW
BEGIN
    -- Increase available spots when reservation is deleted
    IF OLD.lot_id IS NOT NULL THEN
        UPDATE ParkingLot
        SET available_spots = available_spots + 1
        WHERE lot_id = OLD.lot_id
        AND available_spots < total_spots;
    END IF;
END$$
DELIMITER ;

/***************************************************************************
 TRIGGER 3: Before Update on Reservation Status
 - When status changes from 'active' to 'completed' or 'cancelled'
 - Frees up the parking spot
***************************************************************************/
DROP TRIGGER IF EXISTS trg_reservation_status_update;
DELIMITER $
CREATE TRIGGER trg_reservation_status_update
BEFORE UPDATE ON Reservation
FOR EACH ROW
BEGIN
    DECLARE v_available INT;
    
    -- If status is changing from active to completed/cancelled, free the spot
    IF OLD.status = 'active' AND NEW.status IN ('completed', 'cancelled') THEN
        UPDATE ParkingLot
        SET available_spots = available_spots + 1
        WHERE lot_id = NEW.lot_id
        AND available_spots < total_spots;
    END IF;
    
    -- If status is changing from completed/cancelled to active, occupy the spot
    IF OLD.status IN ('completed', 'cancelled') AND NEW.status = 'active' THEN
        SELECT available_spots INTO v_available
        FROM ParkingLot WHERE lot_id = NEW.lot_id;
        
        IF v_available <= 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot reactivate: No available spots';
        END IF;
        
        UPDATE ParkingLot
        SET available_spots = available_spots - 1
        WHERE lot_id = NEW.lot_id;
    END IF;
END$
DELIMITER ;

/***************************************************************************
 TRIGGER 4: Before Delete on Vehicle
 - Prevents deletion if vehicle has active reservations
***************************************************************************/
DROP TRIGGER IF EXISTS trg_vehicle_delete;
DELIMITER $$
CREATE TRIGGER trg_vehicle_delete
BEFORE DELETE ON Vehicle
FOR EACH ROW
BEGIN
    DECLARE v_active_count INT;
    
    -- Check if vehicle has any active reservations
    SELECT COUNT(*) INTO v_active_count
    FROM Reservation
    WHERE plate_no = OLD.plate_no
    AND status = 'active';
    
    IF v_active_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete vehicle: Has active reservations';
    END IF;
END$$
DELIMITER ;

/***************************************************************************
 TRIGGER 5: After Insert on Payment
 - Automatically updates reservation status to 'completed' after payment
***************************************************************************/
DROP TRIGGER IF EXISTS trg_payment_insert;
DELIMITER $$
CREATE TRIGGER trg_payment_insert
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    -- Update reservation status to completed after payment
    UPDATE Reservation
    SET status = 'completed'
    WHERE res_id = NEW.res_id
    AND status = 'active';
END$$
DELIMITER ;

-- =====================================================
-- TEST QUERIES FOR PROCEDURES
-- =====================================================

-- Test SP 1: Get parking lot details
CALL sp_get_parking_lot(1);
CALL sp_get_parking_lot(999); -- Should return error

-- Test SP 2: Check availability
CALL sp_check_availability(1);
CALL sp_check_availability(3);

-- Test SP 3: Get user vehicles
CALL sp_get_user_vehicles(1);
CALL sp_get_user_vehicles(2);

-- Test SP 4: Get reservation details
CALL sp_get_reservation_details(1);
CALL sp_get_reservation_details(999); -- Should return error

-- Test SP 5: Calculate price
CALL sp_calculate_price(1, '2025-12-10 09:00:00', '2025-12-10 11:30:00', @calculated_price);
SELECT @calculated_price AS estimated_price;

-- Test SP 6: Get active reservations
CALL sp_get_active_reservations(1);
CALL sp_get_active_reservations(3);

-- =====================================================
-- TEST QUERIES FOR TRIGGERS
-- =====================================================

-- Test TRIGGER 1: Try to insert reservation with no available spots
START TRANSACTION;
    -- First, make a parking lot full
    UPDATE ParkingLot SET available_spots = 0 WHERE lot_id = 4;
    
    -- Try to insert reservation (should fail)
    INSERT INTO Reservation (plate_no, lot_id, start_time, end_time, price)
    VALUES ('A123BC', 4, '2025-12-10 10:00:00', '2025-12-10 12:00:00', 20.00);
ROLLBACK;

-- Test TRIGGER 1: Successful reservation insert
START TRANSACTION;
    SELECT available_spots FROM ParkingLot WHERE lot_id = 1;
    
    INSERT INTO Reservation (plate_no, lot_id, start_time, end_time, price)
    VALUES ('A123BC', 1, '2025-12-10 10:00:00', '2025-12-10 12:00:00', 20.00);
    
    -- Check that available_spots decreased
    SELECT available_spots FROM ParkingLot WHERE lot_id = 1;
ROLLBACK;

-- Test TRIGGER 2: Delete reservation
START TRANSACTION;
    SELECT available_spots FROM ParkingLot WHERE lot_id = 3;
    
    DELETE FROM Reservation WHERE res_id = 3;
    
    -- Check that available_spots increased
    SELECT available_spots FROM ParkingLot WHERE lot_id = 3;
ROLLBACK;

-- Test TRIGGER 3: Update reservation status
START TRANSACTION;
    SELECT available_spots FROM ParkingLot WHERE lot_id = 3;
    
    UPDATE Reservation 
    SET status = 'completed'
    WHERE res_id = 3;
    
    -- Check that available_spots increased
    SELECT available_spots FROM ParkingLot WHERE lot_id = 3;
ROLLBACK;

-- Test TRIGGER 4: Try to delete vehicle with active reservations
START TRANSACTION;
    -- Should fail because vehicle has active reservation
    DELETE FROM Vehicle WHERE plate_no = 'M789EF';
ROLLBACK;

-- Test TRIGGER 5: Payment automatically completes reservation
START TRANSACTION;
    SELECT status FROM Reservation WHERE res_id = 3;
    
    -- Insert payment
    INSERT INTO Payment (res_id, amount, method)
    VALUES (3, 18.00, 'credit_card');
    
    -- Check that reservation status is now 'completed'
    SELECT status FROM Reservation WHERE res_id = 3;
ROLLBACK;

-- =====================================================
-- USEFUL QUERIES FOR APPLICATION
-- =====================================================

-- Get all parking lots with availability percentage
SELECT 
    lot_id,
    location,
    total_spots,
    available_spots,
    ROUND((available_spots / total_spots * 100), 2) AS availability_percentage,
    hourly_rate
FROM ParkingLot
ORDER BY availability_percentage DESC;

-- Get user's reservation history
SELECT 
    r.res_id,
    r.plate_no,
    v.vehicle_type,
    pl.location,
    r.start_time,
    r.end_time,
    r.price,
    r.status,
    p.method AS payment_method
FROM Reservation r
LEFT JOIN Vehicle v ON r.plate_no = v.plate_no
LEFT JOIN ParkingLot pl ON r.lot_id = pl.lot_id
LEFT JOIN Payment p ON r.res_id = p.res_id
WHERE v.owner_id = 1
ORDER BY r.start_time DESC;

-- Get revenue by parking lot
SELECT 
    pl.location,
    COUNT(r.res_id) AS total_reservations,
    SUM(r.price) AS total_revenue
FROM ParkingLot pl
LEFT JOIN Reservation r ON pl.lot_id = r.lot_id
WHERE r.status = 'completed'
GROUP BY pl.lot_id, pl.location
ORDER BY total_revenue DESC;