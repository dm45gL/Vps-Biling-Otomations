# vps-biling-otomations
# Hypervisor-Biling-Otomations

Tugas Mata Kuliah: Analisis & Pengujian Sistem IF7A

Mata Kuliah: Analisis & Pengujian Sistem

Nama:  Dimas Galih Laksono (22EO10019)

Deskripsi Proyek Repositori ini berisi artefak, dokumen, dan kode yang berkaitan dengan tugas mata kuliah Analisis & Pengujian Sistem. Proyek ini bertujuan untuk melakukan penjualan VPS, Hosting dan reseler domain, projek ini di buat menggunakan expresJS dan juga typescrip, dan menggunakan database PostgreSQL, program ini di buat dengan tujuan hypervisor otomatios dengan penerapan paymentgetway yang tersinkronisasi. 

Desain Proyek (Unified Modeling System)

1. Use Case
SysAdmin (Teknis & Infrastruktur)
Integrasi API: Proxmox, WHM, SSL, Domain.
Uji koneksi API real-time.
Sinkronisasi template VM & paket hosting.
CRUD Produk VPS/Hosting: CPU, RAM, Disk, Rate Limit, Template OS, Paket WHM.
Monitoring Infrastruktur: status global, resource node Proxmox.
Manajemen layanan global & backup storage.
User Bisnis (Harga & Pemasaran)
Manajemen harga produk & domain.
CRUD kode promo.
CRUD konten: banner, testimonial, halaman statis.
User Keuangan (Transaksi & Laporan)
Manajemen transaksi & invoice (Midtrans/Xendit).
Laporan keuangan & analisis produk terlaris.
Otomasi billing: suspend 3 hari, terminate 15 hari setelah jatuh tempo.
Client (Portal & Storefront)
Register/Login JWT, 2FA opsional.
Cek domain & harga real-time.
Onboarding: profil & billing wajib.
Checkout & payment gateway, riwayat invoice.


2. Sequence Diagram

```
sequenceDiagram
    autonumber

    participant Client
    participant API as Backend API
    participant DB as Database
    participant Payment as Payment Gateway
    participant Hypervisor as Hypervisor (Proxmox/VMware)

    %% Browse Product
    Client ->> API: Get Public Products
    API ->> DB: Query PublicProduct + Pricing + Region
    DB -->> API: Product List
    API -->> Client: Show Products

    %% Create Order
    Client ->> API: Create Order (pricingId, region, billingAddress, promo?)
    API ->> DB: Validate Client & Billing Address
    API ->> DB: Validate Promo (Promo & PromoUsage)
    API ->> DB: Create Order (PENDING_PAYMENT)
    DB -->> API: Order Created
    API -->> Client: Order + Payment Info

    %% Payment
    Client ->> Payment: Pay Invoice
    Payment -->> API: Payment Callback (SUCCESS)

    API ->> DB: Update Order status = PAID
    API ->> DB: Allocate IP Address
    API ->> DB: Select Hypervisor & Template
    API ->> DB: Create VPS (PROVISIONING)

    %% Provisioning
    API ->> Hypervisor: Create VM (cpu, ram, disk, template)
    Hypervisor -->> API: VM Created (vmid)

    API ->> Hypervisor: Attach IP Address
    API ->> Hypervisor: Start VM
    Hypervisor -->> API: VM Running

    API ->> DB: Update VPS status = RUNNING
    API ->> DB: Mark IP as USED
    API -->> Client: VPS Ready
```


Arsitektur Proyek (Unified Modeling System)
arsitektur pada projek saya kali ini menggunakan typescrip dan express untuk backend nya, lalu saya menggunakan postgresql database utama dan menggunakan redis sebagai database transite dan midlware otp
untuk jwt menggunakan ES256, menggunakan smtp untuk mengirim otp, dll

Tech Stack
Jelaskan Contoh Tech Stack yang digunakan.
FE: Vue + typescrip
BE: Express + Tyepscrip
Database: postgresql, redis
Service: whm, proxmox, vmware, ESXi 


## Unitest
![Unitest](asets/Screenshot%20From%202026-01-04%2010-37-02.png)


## Linter
![Linter](asets/Screenshot%20From%202026-01-04%2010-38-18.png)



## Run SonarQube
![Run SonarQube](asets/Screenshot%20From%202026-01-04%2010-43-13.png)

## Hasil SonarQube
![Hasil SonarQube](asets/Screenshot%20From%202026-01-04%2010-52-22.png)


