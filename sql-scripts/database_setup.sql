-- ===============================================================
-- Database: ApartmentManagerDB
-- Version: 1.0.0
-- Description: SQL Server 2022 script for Apartment Management System
-- ===============================================================

USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ApartmentManagerDB')
BEGIN
    CREATE DATABASE ApartmentManagerDB;
END
GO

USE ApartmentManagerDB;
GO

-- 1. Roles
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL
);

-- 2. Users
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Phone NVARCHAR(20) NULL,
    RoleID INT FOREIGN KEY REFERENCES Roles(RoleID),
    Status NVARCHAR(20) DEFAULT 'Active', -- Active, Pending, Rejected, Locked
    AvatarPath NVARCHAR(500) NULL,
    LastLoginAt DATETIME NULL,
    FailedLoginCount INT DEFAULT 0,
    LockedUntil DATETIME NULL,
    IsApproved BIT DEFAULT 0,
    ApprovedBy INT NULL, -- Self-reference handled via trigger or app logic
    ApprovedAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- 3. Permissions
CREATE TABLE Permissions (
    PermissionID INT PRIMARY KEY IDENTITY(1,1),
    PermissionName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL
);

-- 4. RolePermissions
CREATE TABLE RolePermissions (
    RoleID INT FOREIGN KEY REFERENCES Roles(RoleID),
    PermissionID INT FOREIGN KEY REFERENCES Permissions(PermissionID),
    PRIMARY KEY (RoleID, PermissionID)
);

-- 5. Buildings
CREATE TABLE Buildings (
    BuildingID INT PRIMARY KEY IDENTITY(1,1),
    BuildingName NVARCHAR(100) NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    Description NVARCHAR(255) NULL
);

-- 6. Blocks
CREATE TABLE Blocks (
    BlockID INT PRIMARY KEY IDENTITY(1,1),
    BlockName NVARCHAR(50) NOT NULL,
    BuildingID INT FOREIGN KEY REFERENCES Buildings(BuildingID)
);

-- 7. Floors
CREATE TABLE Floors (
    FloorID INT PRIMARY KEY IDENTITY(1,1),
    FloorNumber INT NOT NULL,
    BlockID INT FOREIGN KEY REFERENCES Blocks(BlockID)
);

-- 8. Apartments
CREATE TABLE Apartments (
    ApartmentID INT PRIMARY KEY IDENTITY(1,1),
    ApartmentCode NVARCHAR(20) NOT NULL UNIQUE,
    FloorID INT FOREIGN KEY REFERENCES Floors(FloorID),
    Area FLOAT NOT NULL,
    ApartmentType NVARCHAR(50) NULL, -- Studio, 1BR, 2BR, Penthouse
    Status NVARCHAR(20) DEFAULT 'Empty', -- Empty, Occupied, Rented, Maintenance, Locked
    MaxResidents INT DEFAULT 4,
    Note NVARCHAR(500) NULL
);

-- 9. Residents
CREATE TABLE Residents (
    ResidentID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NULL FOREIGN KEY REFERENCES Users(UserID),
    FullName NVARCHAR(100) NOT NULL,
    DOB DATE NULL,
    Gender NVARCHAR(10) NULL,
    CCCD NVARCHAR(20) NOT NULL UNIQUE,
    Phone NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    Address NVARCHAR(255) NULL,
    AvatarPath NVARCHAR(500) NULL,
    ResidentType NVARCHAR(50) DEFAULT 'Owner', -- Owner, Tenant, Member
    MoveInDate DATE NULL,
    MoveOutDate DATE NULL,
    ApartmentID INT FOREIGN KEY REFERENCES Apartments(ApartmentID),
    Status NVARCHAR(20) DEFAULT 'Active'
);

-- 10. Contracts
CREATE TABLE Contracts (
    ContractID INT PRIMARY KEY IDENTITY(1,1),
    ApartmentID INT FOREIGN KEY REFERENCES Apartments(ApartmentID),
    ResidentID INT FOREIGN KEY REFERENCES Residents(ResidentID),
    ContractType NVARCHAR(50) NOT NULL, -- Buy, Rent
    StartDate DATE NOT NULL,
    EndDate DATE NULL,
    DepositAmount DECIMAL(18, 2) DEFAULT 0,
    MonthlyRent DECIMAL(18, 2) DEFAULT 0,
    DocumentPath NVARCHAR(500) NULL,
    Status NVARCHAR(20) DEFAULT 'Active' -- Active, Expired, Terminated
);

-- 11. FeeTypes
CREATE TABLE FeeTypes (
    FeeTypeID INT PRIMARY KEY IDENTITY(1,1),
    FeeName NVARCHAR(100) NOT NULL,
    Unit NVARCHAR(20) NULL, -- m2, kWh, m3, month
    DefaultAmount DECIMAL(18, 2) DEFAULT 0,
    Description NVARCHAR(255) NULL
);

-- 12. Invoices
CREATE TABLE Invoices (
    InvoiceID INT PRIMARY KEY IDENTITY(1,1),
    ApartmentID INT FOREIGN KEY REFERENCES Apartments(ApartmentID),
    ResidentID INT FOREIGN KEY REFERENCES Residents(ResidentID),
    Month INT NOT NULL,
    Year INT NOT NULL,
    TotalAmount DECIMAL(18, 2) DEFAULT 0,
    PaymentStatus NVARCHAR(20) DEFAULT 'Unpaid', -- Unpaid, Paid, Partial
    CreatedDate DATETIME DEFAULT GETDATE(),
    PaidDate DATETIME NULL,
    ConfirmedBy INT NULL FOREIGN KEY REFERENCES Users(UserID),
    Note NVARCHAR(500) NULL
);

-- 13. InvoiceDetails
CREATE TABLE InvoiceDetails (
    InvoiceDetailID INT PRIMARY KEY IDENTITY(1,1),
    InvoiceID INT FOREIGN KEY REFERENCES Invoices(InvoiceID),
    FeeTypeID INT FOREIGN KEY REFERENCES FeeTypes(FeeTypeID),
    Quantity FLOAT DEFAULT 1,
    UnitPrice DECIMAL(18, 2) DEFAULT 0,
    Amount DECIMAL(18, 2) DEFAULT 0
);

-- 14. Vehicles
CREATE TABLE Vehicles (
    VehicleID INT PRIMARY KEY IDENTITY(1,1),
    ResidentID INT FOREIGN KEY REFERENCES Residents(ResidentID),
    ApartmentID INT FOREIGN KEY REFERENCES Apartments(ApartmentID),
    VehicleType NVARCHAR(50) NOT NULL, -- Car, Motorbike, Bicycle
    LicensePlate NVARCHAR(20) NOT NULL UNIQUE,
    Brand NVARCHAR(50) NULL,
    Color NVARCHAR(20) NULL,
    RegisterDate DATE DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Active'
);

-- 15. Complaints
CREATE TABLE Complaints (
    ComplaintID INT PRIMARY KEY IDENTITY(1,1),
    ResidentID INT FOREIGN KEY REFERENCES Residents(ResidentID),
    ApartmentID INT FOREIGN KEY REFERENCES Apartments(ApartmentID),
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    ComplaintType NVARCHAR(50) NULL,
    PriorityLevel NVARCHAR(20) DEFAULT 'Normal', -- High, Normal, Low
    Status NVARCHAR(20) DEFAULT 'New', -- New, Processing, Resolved, Closed
    ImageAttachmentPath NVARCHAR(500) NULL,
    SatisfactionRating INT NULL, -- 1 to 5
    CreatedDate DATETIME DEFAULT GETDATE(),
    AssignedTo INT NULL FOREIGN KEY REFERENCES Users(UserID),
    ResolvedDate DATETIME NULL,
    ResponseNote NVARCHAR(MAX) NULL
);

-- 16. Notifications
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    NotificationType NVARCHAR(50) NULL, -- General, Urgent, Maintenance, Payment
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CreatedDate DATETIME DEFAULT GETDATE(),
    TargetRole NVARCHAR(50) NULL, -- All, Resident, Manager
    IsUrgent BIT DEFAULT 0
);

-- 17. NotificationReads
CREATE TABLE NotificationReads (
    NotificationReadID INT PRIMARY KEY IDENTITY(1,1),
    NotificationID INT FOREIGN KEY REFERENCES Notifications(NotificationID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    ReadAt DATETIME DEFAULT GETDATE()
);

-- 18. Visitors
CREATE TABLE Visitors (
    VisitorID INT PRIMARY KEY IDENTITY(1,1),
    ResidentID INT FOREIGN KEY REFERENCES Residents(ResidentID),
    ApartmentID INT FOREIGN KEY REFERENCES Apartments(ApartmentID),
    VisitorName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20) NULL,
    VisitDate DATETIME NOT NULL,
    LeaveDate DATETIME NULL,
    ApprovalStatus NVARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
    Note NVARCHAR(500) NULL
);

-- 19. Assets
CREATE TABLE Assets (
    AssetID INT PRIMARY KEY IDENTITY(1,1),
    AssetName NVARCHAR(100) NOT NULL,
    AssetType NVARCHAR(50) NULL,
    Location NVARCHAR(255) NULL,
    PurchaseDate DATE NULL,
    Status NVARCHAR(20) DEFAULT 'Good', -- Good, Maintenance, Broken, Replaced
    LastMaintenanceDate DATE NULL,
    NextMaintenanceDate DATE NULL,
    RepairCost DECIMAL(18, 2) DEFAULT 0
);

-- 20. SystemConfig
CREATE TABLE SystemConfig (
    ConfigID INT PRIMARY KEY IDENTITY(1,1),
    ConfigKey NVARCHAR(100) UNIQUE NOT NULL,
    ConfigValue NVARCHAR(500) NULL,
    Description NVARCHAR(300) NULL,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    UpdatedBy INT NULL FOREIGN KEY REFERENCES Users(UserID)
);

-- 21. AuditLogs
CREATE TABLE AuditLogs (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Action NVARCHAR(50) NOT NULL, -- Login, Create, Update, Delete, Logout
    EntityName NVARCHAR(50) NULL,
    EntityID INT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    Description NVARCHAR(MAX) NULL
);
GO

-- ===============================================================
-- SEED DATA
-- ===============================================================

CREATE OR ALTER PROCEDURE sp_SeedInitialData
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Roles
    IF NOT EXISTS (SELECT * FROM Roles)
    BEGIN
        INSERT INTO Roles (RoleName, Description) VALUES 
        ('Super Admin', 'Full system access'),
        ('Manager', 'Management of apartment operations'),
        ('Resident', 'Apartment resident access');
    END

    -- 2. SystemConfig
    IF NOT EXISTS (SELECT * FROM SystemConfig WHERE ConfigKey = 'IsSeeded')
    BEGIN
        INSERT INTO SystemConfig (ConfigKey, ConfigValue, Description) VALUES 
        ('IsSeeded', 'true', 'Flag to indicate initial seed data has been run'),
        ('ApartmentNameFormat', 'Block {block} - Tầng {floor} - Căn {code}', 'Format for displaying apartment names'),
        ('MaxLoginAttempts', '5', 'Maximum failed login attempts before locking'),
        ('LockDurationMinutes', '15', 'Duration of account lock in minutes'),
        ('AppVersion', '1.0.0', 'Current application version');
    END

    -- 3. Super Admin (Password: Admin@123456 - Hashed value placeholder)
    -- In a real app, use BCrypt to hash this. For seed, we'll use a placeholder.
    IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'superadmin')
    BEGIN
        DECLARE @AdminRoleID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Super Admin');
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone, RoleID, Status, IsApproved, ApprovedAt)
        VALUES ('superadmin', '$2a$12$R9h/lIPzHZ7.3m69K/Lh8u.t.t.t.t.t.t.t.t.t.t.t.t.t.t.t', 'Super Admin', 'superadmin@system.local', '0123456789', @AdminRoleID, 'Active', 1, GETDATE());
    END

    -- 3.1. Admin User (Username: admin, Password: admin@123)
    IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'admin')
    BEGIN
        DECLARE @ManagerRoleID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Manager');
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone, RoleID, Status, IsApproved, ApprovedAt)
        VALUES ('admin', '$2b$12$WWulh19KoY/XGxZKj/1Wkew5FFQ4oqNiM66qFcNuk/Yx/umcS5PvC', 'Admin User', 'admin@system.local', '0987654321', @ManagerRoleID, 'Active', 1, GETDATE());
    END

    -- 4. Sample Building Data
    IF NOT EXISTS (SELECT * FROM Buildings)
    BEGIN
        INSERT INTO Buildings (BuildingName, Address, Description) VALUES ('Apartment Pro Complex', '123 Main St, City', 'Modern residential complex');
        DECLARE @BuildingID INT = SCOPE_IDENTITY();

        INSERT INTO Blocks (BlockName, BuildingID) VALUES ('Block A', @BuildingID), ('Block B', @BuildingID);
        
        DECLARE @BlockAID INT = (SELECT BlockID FROM Blocks WHERE BlockName = 'Block A');
        INSERT INTO Floors (FloorNumber, BlockID) VALUES (1, @BlockAID), (2, @BlockAID), (3, @BlockAID), (4, @BlockAID), (5, @BlockAID);
        
        DECLARE @Floor1ID INT = (SELECT FloorID FROM Floors WHERE FloorNumber = 1 AND BlockID = @BlockAID);
        INSERT INTO Apartments (ApartmentCode, FloorID, Area, ApartmentType, Status) VALUES 
        ('A101', @Floor1ID, 75.5, '2BR', 'Empty'),
        ('A102', @Floor1ID, 75.5, '2BR', 'Empty'),
        ('A103', @Floor1ID, 45.0, 'Studio', 'Empty'),
        ('A104', @Floor1ID, 120.0, '3BR', 'Empty');
    END

    -- 5. Fee Types
    IF NOT EXISTS (SELECT * FROM FeeTypes)
    BEGIN
        INSERT INTO FeeTypes (FeeName, Unit, DefaultAmount, Description) VALUES 
        (N'Phí quản lý', N'm2', 10000, N'Phí quản lý vận hành hàng tháng'),
        (N'Phí gửi xe máy', N'xe', 100000, N'Phí gửi xe máy hàng tháng'),
        (N'Phí gửi ô tô', N'xe', 1200000, N'Phí gửi ô tô hàng tháng'),
        (N'Phí vệ sinh', N'căn hộ', 50000, N'Phí thu gom rác và vệ sinh chung');
    END
END
GO

-- Execute Seed Data
EXEC sp_SeedInitialData;
GO
