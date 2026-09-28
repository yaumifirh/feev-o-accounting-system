-- =========================================================
-- FIFO ACCOUNTING SYSTEM
-- DISTRIBUTOR MAKANAN & MINUMAN
-- DATABASE SQL FINAL - VERSI AWAL
-- =========================================================


-- =========================================================
-- EXTENSION
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- CLEANUP
-- =========================================================

drop table if exists public.journal_details cascade;
drop table if exists public.journal_entries cascade;

drop table if exists public.inventory_movements cascade;
drop table if exists public.inventory_layers cascade;

drop table if exists public.sale_items cascade;
drop table if exists public.sales cascade;

drop table if exists public.purchase_items cascade;
drop table if exists public.purchases cascade;

drop table if exists public.customers cascade;
drop table if exists public.suppliers cascade;

drop table if exists public.products cascade;
drop table if exists public.categories cascade;

drop table if exists public.accounts cascade;

drop table if exists public.profiles cascade;


-- =========================================================
-- CATEGORIES
-- =========================================================

create table public.categories (

    id uuid primary key
        default gen_random_uuid(),

    name varchar(50) not null unique,

    description varchar(255),

    created_at timestamptz not null
        default now(),

    constraint categories_name_check
        check (
            name in (
                'Makanan',
                'Minuman'
            )
        )

);


-- =========================================================
-- PRODUCTS
-- =========================================================

create table public.products (

    id uuid primary key
        default gen_random_uuid(),

    sku varchar(50) not null unique,

    name varchar(150) not null,

    category_id uuid not null
        references public.categories(id),

    unit varchar(30) not null,

    purchase_price numeric(18,2) not null
        default 0,

    selling_price numeric(18,2) not null
        default 0,

    current_stock numeric(18,2) not null
        default 0,

    minimum_stock numeric(18,2) not null
        default 0,

    is_active boolean not null
        default true,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint products_purchase_price_check
        check (
            purchase_price >= 0
        ),

    constraint products_selling_price_check
        check (
            selling_price >= 0
        ),

    constraint products_stock_check
        check (
            current_stock >= 0
        ),

    constraint products_minimum_stock_check
        check (
            minimum_stock >= 0
        )

);


-- =========================================================
-- SUPPLIERS
-- =========================================================

create table public.suppliers (

    id uuid primary key
        default gen_random_uuid(),

    supplier_code varchar(50) not null unique,

    name varchar(150) not null,

    phone varchar(50),

    email varchar(150),

    address text,

    created_at timestamptz not null
        default now()

);


-- =========================================================
-- CUSTOMERS
-- =========================================================

create table public.customers (

    id uuid primary key
        default gen_random_uuid(),

    customer_code varchar(50) not null unique,

    name varchar(150) not null,

    phone varchar(50),

    email varchar(150),

    address text,

    created_at timestamptz not null
        default now()

);


-- =========================================================
-- PURCHASES
-- HEADER TRANSAKSI PEMBELIAN
-- =========================================================

create table public.purchases (

    id uuid primary key
        default gen_random_uuid(),

    purchase_number varchar(50) not null unique,

    purchase_date date not null
        default current_date,

    supplier_id uuid
        references public.suppliers(id),

    total_amount numeric(18,2) not null
        default 0,

    status varchar(30) not null
        default 'posted',

    notes text,

    created_at timestamptz not null
        default now(),

    constraint purchases_status_check
        check (
            status in (
                'draft',
                'posted',
                'cancelled'
            )
        )

);


-- =========================================================
-- PURCHASE ITEMS
-- DETAIL PRODUK DALAM PEMBELIAN
-- =========================================================

create table public.purchase_items (

    id uuid primary key
        default gen_random_uuid(),

    purchase_id uuid not null
        references public.purchases(id)
        on delete cascade,

    product_id uuid not null
        references public.products(id),

    quantity numeric(18,2) not null,

    unit_price numeric(18,2) not null,

    subtotal numeric(18,2)
        generated always as (
            quantity * unit_price
        )
        stored,

    created_at timestamptz not null
        default now(),

    constraint purchase_items_quantity_check
        check (
            quantity > 0
        ),

    constraint purchase_items_price_check
        check (
            unit_price >= 0
        )

);


-- =========================================================
-- FIFO INVENTORY LAYERS
-- SETIAP PEMBELIAN MEMBENTUK FIFO LAYER
-- =========================================================

create table public.inventory_layers (

    id uuid primary key
        default gen_random_uuid(),

    product_id uuid not null
        references public.products(id),

    purchase_id uuid
        references public.purchases(id),

    purchase_item_id uuid
        references public.purchase_items(id),

    layer_date timestamptz not null
        default now(),

    quantity_in numeric(18,2) not null,

    quantity_remaining numeric(18,2) not null,

    unit_cost numeric(18,2) not null,

    created_at timestamptz not null
        default now(),

    constraint inventory_layers_quantity_check
        check (
            quantity_in > 0
        ),

    constraint inventory_layers_remaining_check
        check (
            quantity_remaining >= 0
            and quantity_remaining <= quantity_in
        ),

    constraint inventory_layers_cost_check
        check (
            unit_cost >= 0
        )

);


-- =========================================================
-- SALES
-- HEADER TRANSAKSI PENJUALAN
-- =========================================================

create table public.sales (

    id uuid primary key
        default gen_random_uuid(),

    sale_number varchar(50) not null unique,

    sale_date date not null
        default current_date,

    customer_id uuid
        references public.customers(id),

    total_amount numeric(18,2) not null
        default 0,

    total_cogs numeric(18,2) not null
        default 0,

    status varchar(30) not null
        default 'posted',

    notes text,

    created_at timestamptz not null
        default now(),

    constraint sales_status_check
        check (
            status in (
                'draft',
                'posted',
                'cancelled'
            )
        )

);


-- =========================================================
-- SALE ITEMS
-- DETAIL PRODUK DALAM PENJUALAN
-- =========================================================

create table public.sale_items (

    id uuid primary key
        default gen_random_uuid(),

    sale_id uuid not null
        references public.sales(id)
        on delete cascade,

    product_id uuid not null
        references public.products(id),

    quantity numeric(18,2) not null,

    selling_price numeric(18,2) not null,

    cogs numeric(18,2) not null
        default 0,

    subtotal numeric(18,2)
        generated always as (
            quantity * selling_price
        )
        stored,

    created_at timestamptz not null
        default now(),

    constraint sale_items_quantity_check
        check (
            quantity > 0
        ),

    constraint sale_items_price_check
        check (
            selling_price >= 0
        ),

    constraint sale_items_cogs_check
        check (
            cogs >= 0
        )

);


-- =========================================================
-- INVENTORY MOVEMENTS
-- RIWAYAT PERGERAKAN STOK
-- =========================================================

create table public.inventory_movements (

    id uuid primary key
        default gen_random_uuid(),

    product_id uuid not null
        references public.products(id),

    movement_date timestamptz not null
        default now(),

    movement_type varchar(30) not null,

    reference_id uuid,

    quantity_in numeric(18,2) not null
        default 0,

    quantity_out numeric(18,2) not null
        default 0,

    balance_quantity numeric(18,2) not null
        default 0,

    unit_cost numeric(18,2),

    notes text,

    constraint inventory_movements_type_check
        check (
            movement_type in (
                'purchase',
                'sale',
                'adjustment',
                'return_purchase',
                'return_sale'
            )
        ),

    constraint inventory_movements_quantity_check
        check (
            quantity_in >= 0
            and quantity_out >= 0
        )

);


-- =========================================================
-- ACCOUNTS
-- =========================================================

create table public.accounts (

    id uuid primary key
        default gen_random_uuid(),

    account_code varchar(20) not null unique,

    account_name varchar(150) not null,

    account_type varchar(50) not null,

    normal_balance varchar(10) not null,

    is_active boolean not null
        default true,

    created_at timestamptz not null
        default now()

);


-- =========================================================
-- JOURNAL ENTRIES
-- HEADER JURNAL
-- =========================================================

create table public.journal_entries (

    id uuid primary key
        default gen_random_uuid(),

    journal_number varchar(50) not null unique,

    journal_date date not null
        default current_date,

    reference_type varchar(50),

    reference_id uuid,

    description text,

    created_at timestamptz not null
        default now()

);


-- =========================================================
-- JOURNAL DETAILS
-- DETAIL JURNAL
-- =========================================================

create table public.journal_details (

    id uuid primary key
        default gen_random_uuid(),

    journal_entry_id uuid not null
        references public.journal_entries(id)
        on delete cascade,

    account_id uuid not null
        references public.accounts(id),

    debit numeric(18,2) not null
        default 0,

    credit numeric(18,2) not null
        default 0,

    description text,

    constraint journal_details_debit_check
        check (
            debit >= 0
        ),

    constraint journal_details_credit_check
        check (
            credit >= 0
        )

);


-- =========================================================
-- PROFILES
-- SATU ROLE: ADMIN
-- =========================================================

create table public.profiles (

    id uuid primary key
        references auth.users(id)
        on delete cascade,

    full_name varchar(150) not null
        default 'System User',

    role varchar(30) not null
        default 'admin',

    is_active boolean not null
        default true,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint profiles_role_check
        check (
            role = 'admin'
        )

);


-- =========================================================
-- FUNCTION CREATE PROFILE
-- =========================================================

create or replace function public.handle_new_user()

returns trigger

language plpgsql

security definer

set search_path = public

as $$

begin

    insert into public.profiles (
        id,
        full_name,
        role
    )

    values (
        new.id,

        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            'System User'
        ),

        'admin'
    )

    on conflict (id)
    do nothing;

    return new;

end;

$$;


-- =========================================================
-- TRIGGER AUTH USER
-- =========================================================

drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created

after insert on auth.users

for each row

execute procedure public.handle_new_user();


-- =========================================================
-- DEFAULT CATEGORIES
-- =========================================================

insert into public.categories (
    name,
    description
)

values

(
    'Makanan',
    'Produk makanan yang dibeli dan didistribusikan perusahaan'
),

(
    'Minuman',
    'Produk minuman yang dibeli dan didistribusikan perusahaan'
)

on conflict (name)
do nothing;


-- =========================================================
-- DEFAULT ACCOUNTS
-- =========================================================

insert into public.accounts (
    account_code,
    account_name,
    account_type,
    normal_balance
)

values

('1101', 'Kas', 'Asset', 'Debit'),

('1102', 'Piutang Usaha', 'Asset', 'Debit'),

('1103', 'Persediaan Barang Dagang', 'Asset', 'Debit'),

('2101', 'Utang Usaha', 'Liability', 'Credit'),

('3101', 'Modal', 'Equity', 'Credit'),

('4101', 'Penjualan', 'Revenue', 'Credit'),

('5101', 'Harga Pokok Penjualan', 'Expense', 'Debit'),

('6101', 'Beban Operasional', 'Expense', 'Debit')

on conflict (account_code)
do nothing;


-- =========================================================
-- INDEX
-- =========================================================

create index if not exists idx_products_category_id
on public.products(category_id);

create index if not exists idx_products_active
on public.products(is_active);

create index if not exists idx_inventory_layers_product
on public.inventory_layers(product_id);

create index if not exists idx_inventory_layers_date
on public.inventory_layers(layer_date);

create index if not exists idx_inventory_layers_remaining
on public.inventory_layers(product_id, quantity_remaining);

create index if not exists idx_purchase_items_purchase
on public.purchase_items(purchase_id);

create index if not exists idx_purchase_items_product
on public.purchase_items(product_id);

create index if not exists idx_purchases_date
on public.purchases(purchase_date);

create index if not exists idx_purchases_supplier
on public.purchases(supplier_id);

create index if not exists idx_sale_items_sale
on public.sale_items(sale_id);

create index if not exists idx_sale_items_product
on public.sale_items(product_id);

create index if not exists idx_sales_date
on public.sales(sale_date);

create index if not exists idx_inventory_movements_product
on public.inventory_movements(product_id);

create index if not exists idx_inventory_movements_date
on public.inventory_movements(movement_date);

create index if not exists idx_journal_details_account
on public.journal_details(account_id);

create index if not exists idx_journal_entries_date
on public.journal_entries(journal_date);


-- =========================================================
-- SELESAI
-- =========================================================