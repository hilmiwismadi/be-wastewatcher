-- Seed script to add 23 dummy trash bins with devices and status data
-- Each bin will have 3 devices (Organic, Anorganic, Residue) with randomized percentages

-- Insert 23 dummy trash bins
-- Combination of directions: Utara, Timur, Barat, Selatan and floors LT 1-6

-- LT 1
INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
VALUES
('TB-UTARA-LT1', 'Utara LT 1', 'North Wing Level 1', 'Academic Building', 'Lantai 1', 240, '2024-01-15', 'active'),
('TB-TIMUR-LT1', 'Timur LT 1', 'East Wing Level 1', 'Academic Building', 'Lantai 1', 240, '2024-01-15', 'active'),
('TB-BARAT-LT1', 'Barat LT 1', 'West Wing Level 1', 'Academic Building', 'Lantai 1', 240, '2024-01-15', 'active'),
('TB-SELATAN-LT1', 'Selatan LT 1', 'South Wing Level 1', 'Academic Building', 'Lantai 1', 240, '2024-01-15', 'active');

-- LT 2
INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
VALUES
('TB-UTARA-LT2', 'Utara LT 2', 'North Wing Level 2', 'Academic Building', 'Lantai 2', 240, '2024-01-15', 'active'),
('TB-TIMUR-LT2', 'Timur LT 2', 'East Wing Level 2', 'Academic Building', 'Lantai 2', 240, '2024-01-15', 'active'),
('TB-BARAT-LT2', 'Barat LT 2', 'West Wing Level 2', 'Academic Building', 'Lantai 2', 240, '2024-01-15', 'active'),
('TB-SELATAN-LT2', 'Selatan LT 2', 'South Wing Level 2', 'Academic Building', 'Lantai 2', 240, '2024-01-15', 'active');

-- LT 3
INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
VALUES
('TB-UTARA-LT3', 'Utara LT 3', 'North Wing Level 3', 'Academic Building', 'Lantai 3', 240, '2024-01-15', 'active'),
('TB-TIMUR-LT3', 'Timur LT 3', 'East Wing Level 3', 'Academic Building', 'Lantai 3', 240, '2024-01-15', 'active'),
('TB-BARAT-LT3', 'Barat LT 3', 'West Wing Level 3', 'Academic Building', 'Lantai 3', 240, '2024-01-15', 'active');

-- LT 4
INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
VALUES
('TB-UTARA-LT4', 'Utara LT 4', 'North Wing Level 4', 'Academic Building', 'Lantai 4', 240, '2024-01-15', 'active'),
('TB-TIMUR-LT4', 'Timur LT 4', 'East Wing Level 4', 'Academic Building', 'Lantai 4', 240, '2024-01-15', 'active'),
('TB-BARAT-LT4', 'Barat LT 4', 'West Wing Level 4', 'Academic Building', 'Lantai 4', 240, '2024-01-15', 'active'),
('TB-SELATAN-LT4', 'Selatan LT 4', 'South Wing Level 4', 'Academic Building', 'Lantai 4', 240, '2024-01-15', 'active');

-- LT 5
INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
VALUES
('TB-UTARA-LT5', 'Utara LT 5', 'North Wing Level 5', 'Academic Building', 'Lantai 5', 240, '2024-01-15', 'active'),
('TB-TIMUR-LT5', 'Timur LT 5', 'East Wing Level 5', 'Academic Building', 'Lantai 5', 240, '2024-01-15', 'active'),
('TB-BARAT-LT5', 'Barat LT 5', 'West Wing Level 5', 'Academic Building', 'Lantai 5', 240, '2024-01-15', 'active'),
('TB-SELATAN-LT5', 'Selatan LT 5', 'South Wing Level 5', 'Academic Building', 'Lantai 5', 240, '2024-01-15', 'active');

-- LT 6
INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
VALUES
('TB-UTARA-LT6', 'Utara LT 6', 'North Wing Level 6', 'Academic Building', 'Lantai 6', 240, '2024-01-15', 'active'),
('TB-TIMUR-LT6', 'Timur LT 6', 'East Wing Level 6', 'Academic Building', 'Lantai 6', 240, '2024-01-15', 'active'),
('TB-BARAT-LT6', 'Barat LT 6', 'West Wing Level 6', 'Academic Building', 'Lantai 6', 240, '2024-01-15', 'active');

-- Insert devices for each trash bin (3 devices per bin: Organic, Anorganic, Residue)
-- LT 1
INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
VALUES
-- Utara LT 1
('DEV-UTARA-LT1-ORG', 'TB-UTARA-LT1', 'Organic', '2024-01-15', 'active'),
('DEV-UTARA-LT1-ANO', 'TB-UTARA-LT1', 'Anorganic', '2024-01-15', 'active'),
('DEV-UTARA-LT1-RES', 'TB-UTARA-LT1', 'Residue', '2024-01-15', 'active'),
-- Timur LT 1
('DEV-TIMUR-LT1-ORG', 'TB-TIMUR-LT1', 'Organic', '2024-01-15', 'active'),
('DEV-TIMUR-LT1-ANO', 'TB-TIMUR-LT1', 'Anorganic', '2024-01-15', 'active'),
('DEV-TIMUR-LT1-RES', 'TB-TIMUR-LT1', 'Residue', '2024-01-15', 'active'),
-- Barat LT 1
('DEV-BARAT-LT1-ORG', 'TB-BARAT-LT1', 'Organic', '2024-01-15', 'active'),
('DEV-BARAT-LT1-ANO', 'TB-BARAT-LT1', 'Anorganic', '2024-01-15', 'active'),
('DEV-BARAT-LT1-RES', 'TB-BARAT-LT1', 'Residue', '2024-01-15', 'active'),
-- Selatan LT 1
('DEV-SELATAN-LT1-ORG', 'TB-SELATAN-LT1', 'Organic', '2024-01-15', 'active'),
('DEV-SELATAN-LT1-ANO', 'TB-SELATAN-LT1', 'Anorganic', '2024-01-15', 'active'),
('DEV-SELATAN-LT1-RES', 'TB-SELATAN-LT1', 'Residue', '2024-01-15', 'active');

-- LT 2
INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
VALUES
-- Utara LT 2
('DEV-UTARA-LT2-ORG', 'TB-UTARA-LT2', 'Organic', '2024-01-15', 'active'),
('DEV-UTARA-LT2-ANO', 'TB-UTARA-LT2', 'Anorganic', '2024-01-15', 'active'),
('DEV-UTARA-LT2-RES', 'TB-UTARA-LT2', 'Residue', '2024-01-15', 'active'),
-- Timur LT 2
('DEV-TIMUR-LT2-ORG', 'TB-TIMUR-LT2', 'Organic', '2024-01-15', 'active'),
('DEV-TIMUR-LT2-ANO', 'TB-TIMUR-LT2', 'Anorganic', '2024-01-15', 'active'),
('DEV-TIMUR-LT2-RES', 'TB-TIMUR-LT2', 'Residue', '2024-01-15', 'active'),
-- Barat LT 2
('DEV-BARAT-LT2-ORG', 'TB-BARAT-LT2', 'Organic', '2024-01-15', 'active'),
('DEV-BARAT-LT2-ANO', 'TB-BARAT-LT2', 'Anorganic', '2024-01-15', 'active'),
('DEV-BARAT-LT2-RES', 'TB-BARAT-LT2', 'Residue', '2024-01-15', 'active'),
-- Selatan LT 2
('DEV-SELATAN-LT2-ORG', 'TB-SELATAN-LT2', 'Organic', '2024-01-15', 'active'),
('DEV-SELATAN-LT2-ANO', 'TB-SELATAN-LT2', 'Anorganic', '2024-01-15', 'active'),
('DEV-SELATAN-LT2-RES', 'TB-SELATAN-LT2', 'Residue', '2024-01-15', 'active');

-- LT 3
INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
VALUES
-- Utara LT 3
('DEV-UTARA-LT3-ORG', 'TB-UTARA-LT3', 'Organic', '2024-01-15', 'active'),
('DEV-UTARA-LT3-ANO', 'TB-UTARA-LT3', 'Anorganic', '2024-01-15', 'active'),
('DEV-UTARA-LT3-RES', 'TB-UTARA-LT3', 'Residue', '2024-01-15', 'active'),
-- Timur LT 3
('DEV-TIMUR-LT3-ORG', 'TB-TIMUR-LT3', 'Organic', '2024-01-15', 'active'),
('DEV-TIMUR-LT3-ANO', 'TB-TIMUR-LT3', 'Anorganic', '2024-01-15', 'active'),
('DEV-TIMUR-LT3-RES', 'TB-TIMUR-LT3', 'Residue', '2024-01-15', 'active'),
-- Barat LT 3
('DEV-BARAT-LT3-ORG', 'TB-BARAT-LT3', 'Organic', '2024-01-15', 'active'),
('DEV-BARAT-LT3-ANO', 'TB-BARAT-LT3', 'Anorganic', '2024-01-15', 'active'),
('DEV-BARAT-LT3-RES', 'TB-BARAT-LT3', 'Residue', '2024-01-15', 'active');

-- LT 4
INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
VALUES
-- Utara LT 4
('DEV-UTARA-LT4-ORG', 'TB-UTARA-LT4', 'Organic', '2024-01-15', 'active'),
('DEV-UTARA-LT4-ANO', 'TB-UTARA-LT4', 'Anorganic', '2024-01-15', 'active'),
('DEV-UTARA-LT4-RES', 'TB-UTARA-LT4', 'Residue', '2024-01-15', 'active'),
-- Timur LT 4
('DEV-TIMUR-LT4-ORG', 'TB-TIMUR-LT4', 'Organic', '2024-01-15', 'active'),
('DEV-TIMUR-LT4-ANO', 'TB-TIMUR-LT4', 'Anorganic', '2024-01-15', 'active'),
('DEV-TIMUR-LT4-RES', 'TB-TIMUR-LT4', 'Residue', '2024-01-15', 'active'),
-- Barat LT 4
('DEV-BARAT-LT4-ORG', 'TB-BARAT-LT4', 'Organic', '2024-01-15', 'active'),
('DEV-BARAT-LT4-ANO', 'TB-BARAT-LT4', 'Anorganic', '2024-01-15', 'active'),
('DEV-BARAT-LT4-RES', 'TB-BARAT-LT4', 'Residue', '2024-01-15', 'active'),
-- Selatan LT 4
('DEV-SELATAN-LT4-ORG', 'TB-SELATAN-LT4', 'Organic', '2024-01-15', 'active'),
('DEV-SELATAN-LT4-ANO', 'TB-SELATAN-LT4', 'Anorganic', '2024-01-15', 'active'),
('DEV-SELATAN-LT4-RES', 'TB-SELATAN-LT4', 'Residue', '2024-01-15', 'active');

-- LT 5
INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
VALUES
-- Utara LT 5
('DEV-UTARA-LT5-ORG', 'TB-UTARA-LT5', 'Organic', '2024-01-15', 'active'),
('DEV-UTARA-LT5-ANO', 'TB-UTARA-LT5', 'Anorganic', '2024-01-15', 'active'),
('DEV-UTARA-LT5-RES', 'TB-UTARA-LT5', 'Residue', '2024-01-15', 'active'),
-- Timur LT 5
('DEV-TIMUR-LT5-ORG', 'TB-TIMUR-LT5', 'Organic', '2024-01-15', 'active'),
('DEV-TIMUR-LT5-ANO', 'TB-TIMUR-LT5', 'Anorganic', '2024-01-15', 'active'),
('DEV-TIMUR-LT5-RES', 'TB-TIMUR-LT5', 'Residue', '2024-01-15', 'active'),
-- Barat LT 5
('DEV-BARAT-LT5-ORG', 'TB-BARAT-LT5', 'Organic', '2024-01-15', 'active'),
('DEV-BARAT-LT5-ANO', 'TB-BARAT-LT5', 'Anorganic', '2024-01-15', 'active'),
('DEV-BARAT-LT5-RES', 'TB-BARAT-LT5', 'Residue', '2024-01-15', 'active'),
-- Selatan LT 5
('DEV-SELATAN-LT5-ORG', 'TB-SELATAN-LT5', 'Organic', '2024-01-15', 'active'),
('DEV-SELATAN-LT5-ANO', 'TB-SELATAN-LT5', 'Anorganic', '2024-01-15', 'active'),
('DEV-SELATAN-LT5-RES', 'TB-SELATAN-LT5', 'Residue', '2024-01-15', 'active');

-- LT 6
INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
VALUES
-- Utara LT 6
('DEV-UTARA-LT6-ORG', 'TB-UTARA-LT6', 'Organic', '2024-01-15', 'active'),
('DEV-UTARA-LT6-ANO', 'TB-UTARA-LT6', 'Anorganic', '2024-01-15', 'active'),
('DEV-UTARA-LT6-RES', 'TB-UTARA-LT6', 'Residue', '2024-01-15', 'active'),
-- Timur LT 6
('DEV-TIMUR-LT6-ORG', 'TB-TIMUR-LT6', 'Organic', '2024-01-15', 'active'),
('DEV-TIMUR-LT6-ANO', 'TB-TIMUR-LT6', 'Anorganic', '2024-01-15', 'active'),
('DEV-TIMUR-LT6-RES', 'TB-TIMUR-LT6', 'Residue', '2024-01-15', 'active'),
-- Barat LT 6
('DEV-BARAT-LT6-ORG', 'TB-BARAT-LT6', 'Organic', '2024-01-15', 'active'),
('DEV-BARAT-LT6-ANO', 'TB-BARAT-LT6', 'Anorganic', '2024-01-15', 'active'),
('DEV-BARAT-LT6-RES', 'TB-BARAT-LT6', 'Residue', '2024-01-15', 'active');

-- Insert BinStatus for each device with randomized percentages (10-95%)
-- LT 1 Devices
INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
VALUES
('BS-UTARA-LT1-ORG', 'DEV-UTARA-LT1-ORG', 2.8, 45.3, 'normal', 'Normal'),
('BS-UTARA-LT1-ANO', 'DEV-UTARA-LT1-ANO', 1.5, 32.1, 'normal', 'Normal'),
('BS-UTARA-LT1-RES', 'DEV-UTARA-LT1-RES', 0.7, 18.5, 'normal', 'Normal'),
('BS-TIMUR-LT1-ORG', 'DEV-TIMUR-LT1-ORG', 3.2, 67.8, 'warning', 'Normal'),
('BS-TIMUR-LT1-ANO', 'DEV-TIMUR-LT1-ANO', 2.1, 54.2, 'warning', 'Normal'),
('BS-TIMUR-LT1-RES', 'DEV-TIMUR-LT1-RES', 0.9, 28.7, 'normal', 'Normal'),
('BS-BARAT-LT1-ORG', 'DEV-BARAT-LT1-ORG', 4.1, 82.5, 'critical', 'Merata'),
('BS-BARAT-LT1-ANO', 'DEV-BARAT-LT1-ANO', 2.8, 71.3, 'warning', 'Normal'),
('BS-BARAT-LT1-RES', 'DEV-BARAT-LT1-RES', 1.2, 35.6, 'normal', 'Normal'),
('BS-SELATAN-LT1-ORG', 'DEV-SELATAN-LT1-ORG', 1.8, 38.9, 'normal', 'Normal'),
('BS-SELATAN-LT1-ANO', 'DEV-SELATAN-LT1-ANO', 1.3, 42.5, 'normal', 'Normal'),
('BS-SELATAN-LT1-RES', 'DEV-SELATAN-LT1-RES', 0.5, 15.2, 'normal', 'Normal');

-- LT 2 Devices
INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
VALUES
('BS-UTARA-LT2-ORG', 'DEV-UTARA-LT2-ORG', 3.5, 72.4, 'warning', 'Merata'),
('BS-UTARA-LT2-ANO', 'DEV-UTARA-LT2-ANO', 2.3, 58.6, 'warning', 'Normal'),
('BS-UTARA-LT2-RES', 'DEV-UTARA-LT2-RES', 1.1, 31.2, 'normal', 'Normal'),
('BS-TIMUR-LT2-ORG', 'DEV-TIMUR-LT2-ORG', 2.2, 51.7, 'warning', 'Normal'),
('BS-TIMUR-LT2-ANO', 'DEV-TIMUR-LT2-ANO', 1.7, 44.8, 'normal', 'Normal'),
('BS-TIMUR-LT2-RES', 'DEV-TIMUR-LT2-RES', 0.6, 19.3, 'normal', 'Normal'),
('BS-BARAT-LT2-ORG', 'DEV-BARAT-LT2-ORG', 4.5, 88.2, 'critical', 'Menumpuk di satu sisi'),
('BS-BARAT-LT2-ANO', 'DEV-BARAT-LT2-ANO', 3.1, 76.5, 'critical', 'Merata'),
('BS-BARAT-LT2-RES', 'DEV-BARAT-LT2-RES', 1.4, 41.7, 'normal', 'Normal'),
('BS-SELATAN-LT2-ORG', 'DEV-SELATAN-LT2-ORG', 2.6, 62.3, 'warning', 'Normal'),
('BS-SELATAN-LT2-ANO', 'DEV-SELATAN-LT2-ANO', 1.9, 48.9, 'normal', 'Normal'),
('BS-SELATAN-LT2-RES', 'DEV-SELATAN-LT2-RES', 0.8, 24.6, 'normal', 'Normal');

-- LT 3 Devices
INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
VALUES
('BS-UTARA-LT3-ORG', 'DEV-UTARA-LT3-ORG', 2.1, 49.5, 'normal', 'Normal'),
('BS-UTARA-LT3-ANO', 'DEV-UTARA-LT3-ANO', 1.6, 39.7, 'normal', 'Normal'),
('BS-UTARA-LT3-RES', 'DEV-UTARA-LT3-RES', 0.7, 22.4, 'normal', 'Normal'),
('BS-TIMUR-LT3-ORG', 'DEV-TIMUR-LT3-ORG', 3.8, 78.9, 'critical', 'Merata'),
('BS-TIMUR-LT3-ANO', 'DEV-TIMUR-LT3-ANO', 2.7, 66.4, 'warning', 'Normal'),
('BS-TIMUR-LT3-RES', 'DEV-TIMUR-LT3-RES', 1.0, 29.8, 'normal', 'Normal'),
('BS-BARAT-LT3-ORG', 'DEV-BARAT-LT3-ORG', 1.9, 43.2, 'normal', 'Normal'),
('BS-BARAT-LT3-ANO', 'DEV-BARAT-LT3-ANO', 1.4, 36.5, 'normal', 'Normal'),
('BS-BARAT-LT3-RES', 'DEV-BARAT-LT3-RES', 0.6, 17.9, 'normal', 'Normal');

-- LT 4 Devices
INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
VALUES
('BS-UTARA-LT4-ORG', 'DEV-UTARA-LT4-ORG', 4.2, 85.7, 'critical', 'Menumpuk di satu sisi'),
('BS-UTARA-LT4-ANO', 'DEV-UTARA-LT4-ANO', 3.0, 73.8, 'warning', 'Normal'),
('BS-UTARA-LT4-RES', 'DEV-UTARA-LT4-RES', 1.3, 38.4, 'normal', 'Normal'),
('BS-TIMUR-LT4-ORG', 'DEV-TIMUR-LT4-ORG', 2.4, 56.3, 'warning', 'Normal'),
('BS-TIMUR-LT4-ANO', 'DEV-TIMUR-LT4-ANO', 1.8, 46.7, 'normal', 'Normal'),
('BS-TIMUR-LT4-RES', 'DEV-TIMUR-LT4-RES', 0.9, 26.1, 'normal', 'Normal'),
('BS-BARAT-LT4-ORG', 'DEV-BARAT-LT4-ORG', 3.3, 69.2, 'warning', 'Merata'),
('BS-BARAT-LT4-ANO', 'DEV-BARAT-LT4-ANO', 2.5, 61.5, 'warning', 'Normal'),
('BS-BARAT-LT4-RES', 'DEV-BARAT-LT4-RES', 1.1, 33.7, 'normal', 'Normal'),
('BS-SELATAN-LT4-ORG', 'DEV-SELATAN-LT4-ORG', 2.0, 47.8, 'normal', 'Normal'),
('BS-SELATAN-LT4-ANO', 'DEV-SELATAN-LT4-ANO', 1.5, 40.3, 'normal', 'Normal'),
('BS-SELATAN-LT4-RES', 'DEV-SELATAN-LT4-RES', 0.7, 20.5, 'normal', 'Normal');

-- LT 5 Devices
INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
VALUES
('BS-UTARA-LT5-ORG', 'DEV-UTARA-LT5-ORG', 2.7, 59.4, 'warning', 'Normal'),
('BS-UTARA-LT5-ANO', 'DEV-UTARA-LT5-ANO', 2.0, 52.1, 'warning', 'Normal'),
('BS-UTARA-LT5-RES', 'DEV-UTARA-LT5-RES', 0.8, 25.3, 'normal', 'Normal'),
('BS-TIMUR-LT5-ORG', 'DEV-TIMUR-LT5-ORG', 4.6, 91.3, 'critical', 'Terisi penuh'),
('BS-TIMUR-LT5-ANO', 'DEV-TIMUR-LT5-ANO', 3.4, 81.6, 'critical', 'Merata'),
('BS-TIMUR-LT5-RES', 'DEV-TIMUR-LT5-RES', 1.5, 44.2, 'normal', 'Normal'),
('BS-BARAT-LT5-ORG', 'DEV-BARAT-LT5-ORG', 1.7, 41.5, 'normal', 'Normal'),
('BS-BARAT-LT5-ANO', 'DEV-BARAT-LT5-ANO', 1.3, 34.8, 'normal', 'Normal'),
('BS-BARAT-LT5-RES', 'DEV-BARAT-LT5-RES', 0.5, 16.7, 'normal', 'Normal'),
('BS-SELATAN-LT5-ORG', 'DEV-SELATAN-LT5-ORG', 3.1, 68.5, 'warning', 'Normal'),
('BS-SELATAN-LT5-ANO', 'DEV-SELATAN-LT5-ANO', 2.2, 55.9, 'warning', 'Normal'),
('BS-SELATAN-LT5-RES', 'DEV-SELATAN-LT5-RES', 1.0, 30.4, 'normal', 'Normal');

-- LT 6 Devices
INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
VALUES
('BS-UTARA-LT6-ORG', 'DEV-UTARA-LT6-ORG', 2.3, 53.7, 'warning', 'Normal'),
('BS-UTARA-LT6-ANO', 'DEV-UTARA-LT6-ANO', 1.7, 45.2, 'normal', 'Normal'),
('BS-UTARA-LT6-RES', 'DEV-UTARA-LT6-RES', 0.6, 21.8, 'normal', 'Normal'),
('BS-TIMUR-LT6-ORG', 'DEV-TIMUR-LT6-ORG', 3.9, 80.4, 'critical', 'Merata'),
('BS-TIMUR-LT6-ANO', 'DEV-TIMUR-LT6-ANO', 2.9, 70.7, 'warning', 'Normal'),
('BS-TIMUR-LT6-RES', 'DEV-TIMUR-LT6-RES', 1.2, 37.1, 'normal', 'Normal'),
('BS-BARAT-LT6-ORG', 'DEV-BARAT-LT6-ORG', 2.5, 60.8, 'warning', 'Normal'),
('BS-BARAT-LT6-ANO', 'DEV-BARAT-LT6-ANO', 1.9, 50.3, 'warning', 'Normal'),
('BS-BARAT-LT6-RES', 'DEV-BARAT-LT6-RES', 0.9, 27.5, 'normal', 'Normal');

-- Insert DeviceHealth for all devices with randomized battery percentages (65-95%)
-- LT 1
INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
VALUES
('DH-UTARA-LT1-ORG', 'DEV-UTARA-LT1-ORG', 87, 0),
('DH-UTARA-LT1-ANO', 'DEV-UTARA-LT1-ANO', 92, 0),
('DH-UTARA-LT1-RES', 'DEV-UTARA-LT1-RES', 78, 0),
('DH-TIMUR-LT1-ORG', 'DEV-TIMUR-LT1-ORG', 84, 0),
('DH-TIMUR-LT1-ANO', 'DEV-TIMUR-LT1-ANO', 91, 0),
('DH-TIMUR-LT1-RES', 'DEV-TIMUR-LT1-RES', 76, 0),
('DH-BARAT-LT1-ORG', 'DEV-BARAT-LT1-ORG', 69, 1),
('DH-BARAT-LT1-ANO', 'DEV-BARAT-LT1-ANO', 88, 0),
('DH-BARAT-LT1-RES', 'DEV-BARAT-LT1-RES', 93, 0),
('DH-SELATAN-LT1-ORG', 'DEV-SELATAN-LT1-ORG', 81, 0),
('DH-SELATAN-LT1-ANO', 'DEV-SELATAN-LT1-ANO', 85, 0),
('DH-SELATAN-LT1-RES', 'DEV-SELATAN-LT1-RES', 90, 0);

-- LT 2
INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
VALUES
('DH-UTARA-LT2-ORG', 'DEV-UTARA-LT2-ORG', 73, 0),
('DH-UTARA-LT2-ANO', 'DEV-UTARA-LT2-ANO', 86, 0),
('DH-UTARA-LT2-RES', 'DEV-UTARA-LT2-RES', 94, 0),
('DH-TIMUR-LT2-ORG', 'DEV-TIMUR-LT2-ORG', 89, 0),
('DH-TIMUR-LT2-ANO', 'DEV-TIMUR-LT2-ANO', 82, 0),
('DH-TIMUR-LT2-RES', 'DEV-TIMUR-LT2-RES', 95, 0),
('DH-BARAT-LT2-ORG', 'DEV-BARAT-LT2-ORG', 67, 2),
('DH-BARAT-LT2-ANO', 'DEV-BARAT-LT2-ANO', 71, 1),
('DH-BARAT-LT2-RES', 'DEV-BARAT-LT2-RES', 88, 0),
('DH-SELATAN-LT2-ORG', 'DEV-SELATAN-LT2-ORG', 79, 0),
('DH-SELATAN-LT2-ANO', 'DEV-SELATAN-LT2-ANO', 83, 0),
('DH-SELATAN-LT2-RES', 'DEV-SELATAN-LT2-RES', 91, 0);

-- LT 3
INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
VALUES
('DH-UTARA-LT3-ORG', 'DEV-UTARA-LT3-ORG', 85, 0),
('DH-UTARA-LT3-ANO', 'DEV-UTARA-LT3-ANO', 90, 0),
('DH-UTARA-LT3-RES', 'DEV-UTARA-LT3-RES', 77, 0),
('DH-TIMUR-LT3-ORG', 'DEV-TIMUR-LT3-ORG', 68, 1),
('DH-TIMUR-LT3-ANO', 'DEV-TIMUR-LT3-ANO', 74, 0),
('DH-TIMUR-LT3-RES', 'DEV-TIMUR-LT3-RES', 92, 0),
('DH-BARAT-LT3-ORG', 'DEV-BARAT-LT3-ORG', 87, 0),
('DH-BARAT-LT3-ANO', 'DEV-BARAT-LT3-ANO', 93, 0),
('DH-BARAT-LT3-RES', 'DEV-BARAT-LT3-RES', 89, 0);

-- LT 4
INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
VALUES
('DH-UTARA-LT4-ORG', 'DEV-UTARA-LT4-ORG', 70, 1),
('DH-UTARA-LT4-ANO', 'DEV-UTARA-LT4-ANO', 75, 0),
('DH-UTARA-LT4-RES', 'DEV-UTARA-LT4-RES', 88, 0),
('DH-TIMUR-LT4-ORG', 'DEV-TIMUR-LT4-ORG', 84, 0),
('DH-TIMUR-LT4-ANO', 'DEV-TIMUR-LT4-ANO', 91, 0),
('DH-TIMUR-LT4-RES', 'DEV-TIMUR-LT4-RES', 86, 0),
('DH-BARAT-LT4-ORG', 'DEV-BARAT-LT4-ORG', 79, 0),
('DH-BARAT-LT4-ANO', 'DEV-BARAT-LT4-ANO', 82, 0),
('DH-BARAT-LT4-RES', 'DEV-BARAT-LT4-RES', 94, 0),
('DH-SELATAN-LT4-ORG', 'DEV-SELATAN-LT4-ORG', 88, 0),
('DH-SELATAN-LT4-ANO', 'DEV-SELATAN-LT4-ANO', 92, 0),
('DH-SELATAN-LT4-RES', 'DEV-SELATAN-LT4-RES', 85, 0);

-- LT 5
INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
VALUES
('DH-UTARA-LT5-ORG', 'DEV-UTARA-LT5-ORG', 81, 0),
('DH-UTARA-LT5-ANO', 'DEV-UTARA-LT5-ANO', 87, 0),
('DH-UTARA-LT5-RES', 'DEV-UTARA-LT5-RES', 90, 0),
('DH-TIMUR-LT5-ORG', 'DEV-TIMUR-LT5-ORG', 65, 3),
('DH-TIMUR-LT5-ANO', 'DEV-TIMUR-LT5-ANO', 72, 1),
('DH-TIMUR-LT5-RES', 'DEV-TIMUR-LT5-RES', 83, 0),
('DH-BARAT-LT5-ORG', 'DEV-BARAT-LT5-ORG', 89, 0),
('DH-BARAT-LT5-ANO', 'DEV-BARAT-LT5-ANO', 93, 0),
('DH-BARAT-LT5-RES', 'DEV-BARAT-LT5-RES', 86, 0),
('DH-SELATAN-LT5-ORG', 'DEV-SELATAN-LT5-ORG', 77, 0),
('DH-SELATAN-LT5-ANO', 'DEV-SELATAN-LT5-ANO', 84, 0),
('DH-SELATAN-LT5-RES', 'DEV-SELATAN-LT5-RES', 91, 0);

-- LT 6
INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
VALUES
('DH-UTARA-LT6-ORG', 'DEV-UTARA-LT6-ORG', 83, 0),
('DH-UTARA-LT6-ANO', 'DEV-UTARA-LT6-ANO', 88, 0),
('DH-UTARA-LT6-RES', 'DEV-UTARA-LT6-RES', 92, 0),
('DH-TIMUR-LT6-ORG', 'DEV-TIMUR-LT6-ORG', 69, 1),
('DH-TIMUR-LT6-ANO', 'DEV-TIMUR-LT6-ANO', 76, 0),
('DH-TIMUR-LT6-RES', 'DEV-TIMUR-LT6-RES', 85, 0),
('DH-BARAT-LT6-ORG', 'DEV-BARAT-LT6-ORG', 80, 0),
('DH-BARAT-LT6-ANO', 'DEV-BARAT-LT6-ANO', 87, 0),
('DH-BARAT-LT6-RES', 'DEV-BARAT-LT6-RES', 94, 0);
