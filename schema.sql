-- TOKO NADYN POS: DATABASE SCHEMA (SQL SERVER)
-- Run this script in SQL Server Management Studio (SSMS) to initialize the database.

-- 1. Master Data: Users
CREATE DATABASE [TokoNadyn];
GO
USE [TokoNadyn];
GO
CREATE TABLE [Users] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Username] NVARCHAR(50) NOT NULL UNIQUE,
    [Password] NVARCHAR(255) NOT NULL,
    [Nama] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(20) NOT NULL, -- 'admin' or 'kasir'
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- 2. Master Data: Suppliers
CREATE TABLE [Suppliers] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Nama] NVARCHAR(150) NOT NULL,
    [Kontak] NVARCHAR(100),
    [Telepon] NVARCHAR(20),
    [Alamat] NVARCHAR(MAX),
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- 3. Master Data: Customers
CREATE TABLE [Customers] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Nama] NVARCHAR(150) NOT NULL,
    [Telepon] NVARCHAR(20),
    [Alamat] NVARCHAR(MAX),
    [Piutang] DECIMAL(18, 2) DEFAULT 0,
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- 4. Master Data: Barang (Products)
CREATE TABLE [Barang] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Kode] NVARCHAR(50) UNIQUE NOT NULL,
    [Nama] NVARCHAR(150) NOT NULL,
    [Kategori] NVARCHAR(50),
    [Satuan] NVARCHAR(20),
    [HargaBeli] DECIMAL(18, 2) DEFAULT 0,
    [HargaJual] DECIMAL(18, 2) DEFAULT 0,
    [Stok] DECIMAL(18, 2) DEFAULT 0,
    [StokMin] DECIMAL(18, 2) DEFAULT 0,
    [SupplierId] INT REFERENCES [Suppliers](Id),
    [IsMeter] BIT DEFAULT 0, -- 1 for meter/roll based, 0 for pcs
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- 5. Penjualan (Sales)
CREATE TABLE [Penjualan] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [NoNota] NVARCHAR(50) UNIQUE NOT NULL,
    [Tanggal] DATE NOT NULL,
    [CustomerId] INT REFERENCES [Customers](Id),
    [Subtotal] DECIMAL(18, 2) NOT NULL,
    [Diskon] DECIMAL(18, 2) DEFAULT 0,
    [Total] DECIMAL(18, 2) NOT NULL,
    [Bayar] DECIMAL(18, 2) NOT NULL,
    [Kembali] DECIMAL(18, 2) DEFAULT 0,
    [Metode] NVARCHAR(50), -- 'Cash', 'Transfer', 'QRIS', 'Piutang'
    [UserCreated] NVARCHAR(50),
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

CREATE TABLE [PenjualanItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [PenjualanId] INT REFERENCES [Penjualan](Id) ON DELETE CASCADE,
    [BarangId] INT REFERENCES [Barang](Id),
    [NamaBarang] NVARCHAR(150),
    [Kategori] NVARCHAR(50),
    [Qty] DECIMAL(18, 2) NOT NULL,
    [HargaBeli] DECIMAL(18, 2), -- HPP at time of sale
    [HargaJual] DECIMAL(18, 2) NOT NULL,
    [Diskon] DECIMAL(18, 2) DEFAULT 0,
    [Subtotal] DECIMAL(18, 2) NOT NULL
);

-- 6. Pembelian (Purchases)
CREATE TABLE [Pembelian] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [NoFaktur] NVARCHAR(50) UNIQUE NOT NULL,
    [Tanggal] DATE NOT NULL,
    [SupplierId] INT REFERENCES [Suppliers](Id),
    [Total] DECIMAL(18, 2) NOT NULL,
    [Lunas] BIT DEFAULT 0,
    [JatuhTempo] DATE,
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

CREATE TABLE [PembelianItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [PembelianId] INT REFERENCES [Pembelian](Id) ON DELETE CASCADE,
    [BarangId] INT REFERENCES [Barang](Id),
    [NamaBarang] NVARCHAR(150),
    [Satuan] NVARCHAR(20),
    [Qty] DECIMAL(18, 2) NOT NULL,
    [HargaBeli] DECIMAL(18, 2) NOT NULL
);

-- 7. Hutang & Piutang Tracking
CREATE TABLE [HutangSupplier] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [SupplierId] INT REFERENCES [Suppliers](Id),
    [NoFaktur] NVARCHAR(50),
    [TanggalFaktur] DATE,
    [Total] DECIMAL(18, 2) NOT NULL,
    [Sisa] DECIMAL(18, 2) NOT NULL,
    [Lunas] BIT DEFAULT 0,
    [JatuhTempo] DATE
);

CREATE TABLE [CicilanHutang] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [HutangId] INT REFERENCES [HutangSupplier](Id) ON DELETE CASCADE,
    [Jumlah] DECIMAL(18, 2) NOT NULL,
    [Tanggal] DATE NOT NULL,
    [Keterangan] NVARCHAR(MAX)
);

-- 8. Stock & Inventory Management
CREATE TABLE [StockMovements] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [BarangId] INT REFERENCES [Barang](Id),
    [Tipe] NVARCHAR(10), -- 'in', 'out', 'adj'
    [Qty] DECIMAL(18, 2) NOT NULL,
    [Keterangan] NVARCHAR(MAX),
    [RefId] INT, -- References sales or purchase ID
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- 9. Accounting (Automatic Journals)
CREATE TABLE [Jurnal] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Tanggal] DATETIME DEFAULT GETDATE(),
    [Keterangan] NVARCHAR(MAX),
    [CreatedBy] NVARCHAR(50)
);

CREATE TABLE [JurnalItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [JurnalId] INT REFERENCES [Jurnal](Id) ON DELETE CASCADE,
    [Akun] NVARCHAR(50) NOT NULL, -- 'kas', 'piutang', 'persediaan', 'hutang', 'modal', 'penjualan', 'hpp', 'biaya'
    [Debit] DECIMAL(18, 2) DEFAULT 0,
    [Kredit] DECIMAL(18, 2) DEFAULT 0
);

-- 10. Cash Flow
CREATE TABLE [CashFlow] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Tipe] NVARCHAR(10), -- 'in', 'out'
    [Kategori] NVARCHAR(100),
    [Keterangan] NVARCHAR(MAX),
    [Jumlah] DECIMAL(18, 2) NOT NULL,
    [Tanggal] DATE NOT NULL,
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- ==========================================
-- INITIAL DATA (SEEDING)
-- ==========================================

-- Insert Default Admin & Kasir
INSERT INTO [Users] ([Username], [Password], [Nama], [Role])
VALUES 
('admin', 'admin123', 'Administrator Toko', 'admin'),
('kasir', 'kasir123', 'Kasir Utama', 'kasir');

-- Optional: Initial Sample Supplier
INSERT INTO [Suppliers] ([Nama], [Kontak], [Telepon], [Alamat])
VALUES ('SUPPLIER PUSAT', 'Bpk. Ahmad', '08123456789', 'Jl. Raya Listrik No. 1');
