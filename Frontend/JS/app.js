/* =========================================================
   FIFO ACCOUNTING SYSTEM
   APP.JS
   Distributor Makanan & Minuman
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let products = [];
let categories = [];

let editingProductId = null;


/* =========================================================
   PURCHASE VARIABLES
========================================================= */

let suppliers = [];
let purchaseItems = [];
let customers = [];
let editingSupplierId = null;
let editingCustomerId = null;
let editingPurchaseId = null;


/* =========================================================
   CHART VARIABLES
========================================================= */

let salesTrendChart = null;
let purchaseTrendChart = null;
let topProductsChart = null;
let inventoryCategoryChart = null;


/* =========================================================
   UBAH TOMBOL EDIT & HAPUS MENJADI ICON
========================================================= */

function initializeActionIcons() {

    const buttons =
        document.querySelectorAll(
            "button"
        );


    buttons.forEach(
        function (button) {

            const text =
                button.textContent
                    .trim()
                    .toLowerCase();


            /* =================================================
               EDIT
            ================================================= */

            if (
                text === "edit" ||
                text.includes("edit ")
            ) {

                button.classList.add(
                    "action-button",
                    "action-edit"
                );

                button.setAttribute(
                    "aria-label",
                    "Edit"
                );

                button.setAttribute(
                    "title",
                    "Edit"
                );

                button.innerHTML = `
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M12 20h9"
                        ></path>

                        <path
                            d="M16.5 3.5
                               a2.121 2.121 0 0 1 3 3
                               L8 18
                               l-4 1
                               1-4Z"
                        ></path>
                    </svg>
                `;

            }


            /* =================================================
               HAPUS
            ================================================= */

            if (
                text === "hapus" ||
                text.includes("hapus ")
            ) {

                button.classList.add(
                    "action-button",
                    "action-delete"
                );

                button.setAttribute(
                    "aria-label",
                    "Hapus"
                );

                button.setAttribute(
                    "title",
                    "Hapus"
                );

                button.innerHTML = `
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M3 6h18"
                        ></path>

                        <path
                            d="M8 6V4
                               a1 1 0 0 1 1-1
                               h6
                               a1 1 0 0 1 1 1
                               v2"
                        ></path>

                        <path
                            d="M19 6
                               v14
                               a1 1 0 0 1-1 1
                               H6
                               a1 1 0 0 1-1-1
                               V6"
                        ></path>

                        <path
                            d="M10 11v6"
                        ></path>

                        <path
                            d="M14 11v6"
                        ></path>
                    </svg>
                `;

            }

        }
    );

}


/* =========================================================
   PENYESUAIAN PERSEDIAAN
   BARANG RUSAK & EXPIRED
========================================================= */


/* =========================================================
   LOAD PRODUCT DROPDOWN
========================================================= */

async function loadAdjustmentProducts() {

    const select =
        document.getElementById(
            "adjustmentProductInput"
        );

    if (!select) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("products")

            .select(
                "id, sku, name, unit"
            )

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        select.innerHTML =
            '<option value="">Pilih Produk</option>';


        (data || []).forEach(
            function (product) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    product.id;


                option.textContent =
                    product.sku +
                    " — " +
                    product.name;


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat produk untuk penyesuaian:",
            error
        );


        select.innerHTML =
            '<option value="">Gagal memuat produk</option>';

    }

}


/* =========================================================
   SET DEFAULT DATE
========================================================= */

function setAdjustmentDefaultDate() {

    const dateInput =
        document.getElementById(
            "adjustmentDateInput"
        );


    if (!dateInput) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        )
        .padStart(
            2,
            "0"
        );


    dateInput.value =
        year +
        "-" +
        month +
        "-" +
        day;

}


/* =========================================================
   LOAD RIWAYAT PENYESUAIAN
========================================================= */

async function loadInventoryAdjustments() {

    const tbody =
        document.getElementById(
            "inventoryAdjustmentTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="empty-state">
                Memuat riwayat penyesuaian...
            </td>
        </tr>
    `;


    try {

        /* =================================================
           AMBIL DATA PENYESUAIAN
        ================================================= */

        const {
            data,
            error
        } = await supabaseClient

            .from(
                "inventory_adjustments"
            )

            .select(`
                id,
                adjustment_number,
                adjustment_date,
                adjustment_type,
                quantity,
                total_cost,
                notes,
                products (
                    id,
                    sku,
                    name,
                    unit
                )
            `)

            .order(
                "adjustment_date",
                {
                    ascending: false
                }
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        /* =================================================
           JIKA BELUM ADA DATA
        ================================================= */

        if (
            !data ||
            data.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        Belum ada penyesuaian persediaan.
                    </td>
                </tr>
            `;

            return;

        }


        /* =================================================
           AMBIL ID PENYESUAIAN
        ================================================= */

        const adjustmentIds =
            data.map(
                function (adjustment) {

                    return adjustment.id;

                }
            );


        /* =================================================
           AMBIL JURNAL BERDASARKAN REFERENCE_ID
        ================================================= */

        const {
            data: journalData,
            error: journalError
        } = await supabaseClient

            .from(
                "journal_entries"
            )

            .select(`
                id,
                journal_number,
                reference_id,
                reference_type
            `)

            .eq(
                "reference_type",
                "adjustment"
            )

            .in(
                "reference_id",
                adjustmentIds
            );


        if (journalError) {
            throw journalError;
        }


        /* =================================================
           BUAT MAP JURNAL
        ================================================= */

        const journalMap =
            {};


        (journalData || []).forEach(
            function (journal) {

                journalMap[
                    String(
                        journal.reference_id
                    )
                ] =
                    journal.journal_number;

            }
        );


        /* =================================================
           RENDER TABLE
        ================================================= */

        tbody.innerHTML = "";


        data.forEach(
            function (
                adjustment,
                index
            ) {

                const row =
                    document.createElement(
                        "tr"
                    );


                const productName =
                    adjustment.products
                        ? adjustment.products.name
                        : "-";


                const journalNumber =
                    journalMap[
                        String(
                            adjustment.id
                        )
                    ] || "-";


                const typeLabel =
                    adjustment.adjustment_type ===
                    "expired"
                        ? "Expired"
                        : "Rusak";


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${adjustment.adjustment_number || "-"}
                    </td>

                    <td>
                        ${
                            typeof formatDate ===
                            "function"
                                ? formatDate(
                                      adjustment.adjustment_date
                                  )
                                : adjustment.adjustment_date
                        }
                    </td>

                    <td>
                        ${productName}
                    </td>

                    <td>
                        ${typeLabel}
                    </td>

                    <td>
                        ${formatNumber(
                            adjustment.quantity
                        )}
                    </td>

                    <td>
                        ${formatRupiah(
                            adjustment.total_cost
                        )}
                    </td>

                    <td>
                        ${journalNumber}
                    </td>

                `;


                tbody.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat riwayat penyesuaian:",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    Riwayat penyesuaian gagal dimuat.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   SIMPAN PENYESUAIAN
========================================================= */

async function saveInventoryAdjustment(
    event
) {

    event.preventDefault();


    const productInput =
        document.getElementById(
            "adjustmentProductInput"
        );


    const dateInput =
        document.getElementById(
            "adjustmentDateInput"
        );


    const typeInput =
        document.getElementById(
            "adjustmentTypeInput"
        );


    const quantityInput =
        document.getElementById(
            "adjustmentQuantityInput"
        );


    const notesInput =
        document.getElementById(
            "adjustmentNotesInput"
        );


    const saveButton =
        document.getElementById(
            "saveInventoryAdjustmentButton"
        );


    const productId =
        productInput
            ? productInput.value
            : "";


    const adjustmentDate =
        dateInput
            ? dateInput.value
            : "";


    const adjustmentType =
        typeInput
            ? typeInput.value
            : "";


    const quantity =
        Number(
            quantityInput
                ? quantityInput.value
                : 0
        );


    const notes =
        notesInput
            ? notesInput.value.trim()
            : "";


    /* =====================================================
       VALIDASI
    ===================================================== */

    if (!productId) {

        showToast(
            "Silakan pilih produk.",
            "error"
        );

        return;

    }


    if (!adjustmentDate) {

        showToast(
            "Tanggal penyesuaian wajib diisi.",
            "error"
        );

        return;

    }


    if (
        adjustmentType !== "expired" &&
        adjustmentType !== "damaged"
    ) {

        showToast(
            "Silakan pilih jenis penyesuaian.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        showToast(
            "Jumlah harus lebih dari 0.",
            "error"
        );

        return;

    }


    /* =====================================================
       DISABLE BUTTON
    ===================================================== */

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Memproses...";

    }


    try {

        /* =================================================
           PANGGIL POSTGRES FUNCTION
        ================================================= */

        const {
            data,
            error
        } = await supabaseClient

            .rpc(
                "process_inventory_adjustment",
                {
                    p_product_id:
                        productId,

                    p_adjustment_date:
                        adjustmentDate,

                    p_adjustment_type:
                        adjustmentType,

                    p_quantity:
                        quantity,

                    p_notes:
                        notes || null
                }
            );


        if (error) {
            throw error;
        }


        /* =================================================
           HASIL RPC
        ================================================= */

        const result =
            Array.isArray(data)
                ? data[0]
                : data;


        if (!result) {

            throw new Error(
                "Sistem tidak mengembalikan hasil penyesuaian."
            );

        }


        const adjustmentNumber =
            result.adjustment_number ||
            "-";


        const totalCost =
            Number(
                result.total_cost ||
                0
            );


        const journalNumber =
            result.journal_number ||
            "-";


        /* =================================================
           SUKSES
        ================================================= */

        showToast(
            "Penyesuaian " +
            adjustmentNumber +
            " berhasil disimpan.",
            "success"
        );


        alert(
            "Penyesuaian berhasil disimpan.\n\n" +
            "No. Penyesuaian: " +
            adjustmentNumber +
            "\n" +
            "Total Kerugian: " +
            formatRupiah(
                totalCost
            ) +
            "\n" +
            "Jurnal: " +
            journalNumber
        );


        /* =================================================
           RESET FORM
        ================================================= */

        const form =
            document.getElementById(
                "inventoryAdjustmentForm"
            );


        if (form) {
            form.reset();
        }


        setAdjustmentDefaultDate();


        /* =================================================
           REFRESH RIWAYAT
        ================================================= */

        await loadInventoryAdjustments();


        /* =================================================
           REFRESH MODUL TERKAIT
        ================================================= */

        if (
            typeof loadFifo ===
            "function"
        ) {

            await loadFifo();

        }


        if (
            typeof loadDashboard ===
            "function"
        ) {

            await loadDashboard();

        }


    } catch (error) {

        console.error(
            "Gagal menyimpan penyesuaian persediaan:",
            error
        );


        showToast(
            error.message ||
            "Penyesuaian persediaan gagal disimpan.",
            "error"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Simpan Penyesuaian";

        }

    }

}


/* =========================================================
   INITIALIZE HALAMAN PENYESUAIAN
========================================================= */

function initializeAdjustmentPage() {

    const form =
        document.getElementById(
            "inventoryAdjustmentForm"
        );


    if (!form) {
        return;
    }


    /* =====================================================
       LOAD DATA
    ===================================================== */

    loadAdjustmentProducts();

    setAdjustmentDefaultDate();

    loadInventoryAdjustments();


    /* =====================================================
       SUBMIT
    ===================================================== */

    if (
        !form.dataset.initialized
    ) {

        form.addEventListener(
            "submit",
            saveInventoryAdjustment
        );


        form.dataset.initialized =
            "true";

    }

}


function updateCurrentDate() {

    const dateElement =
        document.getElementById("currentDate");

    if (!dateElement) {
        return;
    }

    const now = new Date();

    const formattedDate =
        new Intl.DateTimeFormat(
            "id-ID",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        ).format(now);

    dateElement.textContent =
        formattedDate;
}


function updateCurrentDate() {

    const dateElement =
        document.getElementById("currentDate");

    if (!dateElement) {
        return;
    }

    const now = new Date();

    dateElement.textContent =
        new Intl.DateTimeFormat(
            "id-ID",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        ).format(now);
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
    "🔥🔥 DOMCONTENTLOADED JALAN"
);

        /* =================================================
           INITIALIZE UI / EVENT LISTENERS
        ================================================= */

        updateCurrentDate();
        
        initializeMenu();

        initializeNavigation();

        initializeProductModule();

        initializePurchaseModule();

        initializeSupplierModal();

        initializeCustomerModal();


        /* =================================================
   QUICK ADD CUSTOMER DARI PENJUALAN
================================================= */

const addCustomerFromSalesButton =
    document.getElementById(
        "addCustomerFromSalesButton"
    );

if (addCustomerFromSalesButton) {

    addCustomerFromSalesButton.addEventListener(
        "click",
        function () {

            console.log(
                "🔥 + PELANGGAN BARU DI PENJUALAN DIKLIK"
            );

            const masterCustomerButton =
                document.getElementById(
                    "addCustomerButton"
                );

            if (masterCustomerButton) {

                masterCustomerButton.click();

            } else {

                console.error(
                    "❌ addCustomerButton tidak ditemukan."
                );

            }

        }
    );

}

        initializeAdjustmentPage();

        initializeProfileMenu();

        initializeProfileModal();


        /* =================================================
           LOAD MASTER DATA TERLEBIH DAHULU
        ================================================= */

        await loadCategories();

        await loadProducts();

        console.log(
    "🔥 SETELAH LOAD PRODUCTS:",
    products.length
);

        await loadSuppliers();

        console.log(
    "🔥 SETELAH LOAD SUPPLIERS:",
    products.length
);

        await loadPurchases();


        /* =================================================
           FIFO DIJALANKAN SETELAH PRODUCTS SIAP
        ================================================= */

        initializeFifo();


        /* =================================================
           DASHBOARD DIJALANKAN TERAKHIR
        ================================================= */

        await loadDashboard();


    }
);



/* =========================================================
   MENU SIDEBAR
========================================================= */

function initializeMenu() {

    const menuToggle =
        document.getElementById("menuToggle");

    const mainLayout =
        document.getElementById("mainLayout");


    if (!menuToggle || !mainLayout) {
        return;
    }


    menuToggle.addEventListener(
        "click",
        function () {

            mainLayout.classList.toggle(
                "menu-collapsed"
            );

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-page]"
        );


    const pageSections =
        document.querySelectorAll(
            ".page-section"
        );


    navItems.forEach(function (item) {

        item.addEventListener(
            "click",
            function () {

                const targetPage =
                    item.dataset.page;


                navItems.forEach(
                    function (nav) {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                item.classList.add(
                    "active"
                );


                pageSections.forEach(
                    function (section) {

                        section.classList.remove(
                            "active-page"
                        );

                    }
                );


                const targetSection =
                    document.getElementById(
                        targetPage + "Page"
                    );


                if (targetSection) {

                    targetSection.classList.add(
                        "active-page"
                    );

                }


                /* =================================================
                   KHUSUS HALAMAN PEMBELIAN
                ================================================= */

                if (
                    targetPage ===
                    "purchases"
                ) {

                    loadSuppliers();

                    loadProducts();

                    loadPurchases();

                }


/* =====================================================
   SUPPLIER
===================================================== */

if (
    targetPage ===
    "suppliers"
) {

    loadSupplierTable();

}


/* =====================================================
   CUSTOMER
===================================================== */

if (
    targetPage ===
    "customers"
) {

    loadCustomerTable();

}

                /* =================================================
                   KHUSUS HALAMAN JURNAL
                ================================================= */

                if (
                    targetPage ===
                    "journal"
                ) {

                    initializeJournalPage();

                }


                /* =================================================
                   KHUSUS HALAMAN KARTU PERSEDIAAN
                ================================================= */

                if (
    targetPage ===
    "inventoryCard"
) {

    initializeInventoryCardPage();

}

if (targetPage === "adjustment") {

    initializeAdjustmentPage();

}

            }
        );

    });


    const pageButtons =
        document.querySelectorAll(
            "[data-page-target]"
        );


    pageButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const target =
                    button.dataset.pageTarget;


                const navTarget =
                    document.querySelector(
                        `.nav-item[data-page="${target}"]`
                    );


                if (navTarget) {

                    navTarget.click();

                }

            }
        );

    });

}


/* =========================================================
   PROFILE / ACCOUNT DROPDOWN
========================================================= */

function initializeProfileMenu() {

    const accountButton =
        document.getElementById(
            "accountButton"
        );


    const accountMenu =
        document.getElementById(
            "accountMenu"
        );


    if (!accountButton || !accountMenu) {
        return;
    }


    accountButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            accountMenu.classList.toggle(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !accountMenu.contains(event.target) &&
                !accountButton.contains(event.target)
            ) {

                accountMenu.classList.remove(
                    "show"
                );

            }

        }
    );


    const editProfileButton =
        document.getElementById(
            "editProfileButton"
        );


    if (editProfileButton) {

        editProfileButton.addEventListener(
            "click",
            function () {

                accountMenu.classList.remove(
                    "show"
                );

                openProfileModal();

            }
        );

    }


    const accountInfoButton =
        document.getElementById(
            "accountInfoButton"
        );


    if (accountInfoButton) {

        accountInfoButton.addEventListener(
            "click",
            function () {

                accountMenu.classList.remove(
                    "show"
                );

                openProfileModal();

            }
        );

    }

}


/* =========================================================
   PROFILE MODAL
========================================================= */

function initializeProfileModal() {

    const closeProfileButton =
        document.getElementById(
            "closeProfileModal"
        );


    const cancelProfileButton =
        document.getElementById(
            "cancelProfileModal"
        );


    const profileModal =
        document.getElementById(
            "profileModal"
        );


    if (closeProfileButton) {

        closeProfileButton.addEventListener(
            "click",
            closeProfileModal
        );

    }


    if (cancelProfileButton) {

        cancelProfileButton.addEventListener(
            "click",
            closeProfileModal
        );

    }


    if (profileModal) {

        profileModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === profileModal
                ) {

                    closeProfileModal();

                }

            }
        );

    }

}


/* =========================================================
   OPEN PROFILE MODAL
========================================================= */

function openProfileModal() {

    const modal =
        document.getElementById(
            "profileModal"
        );


    const session =
        typeof getDemoSession === "function"
            ? getDemoSession()
            : null;


    if (!modal || !session) {
        return;
    }


    const nameInput =
        document.getElementById(
            "profileFullName"
        );


    const emailInput =
        document.getElementById(
            "profileEmail"
        );


    const roleInput =
        document.getElementById(
            "profileRole"
        );


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (nameInput) {

        nameInput.value =
            session.full_name || "";

    }


    if (emailInput) {

        emailInput.value =
            session.email || "";

    }


    if (roleInput) {

        roleInput.value =
            session.role ||
            "System Administrator";

    }


    if (avatar) {

        avatar.textContent =
            getInitials(
                session.full_name ||
                session.email ||
                "User"
            );

    }


    modal.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE PROFILE MODAL
========================================================= */

function closeProfileModal() {

    const modal =
        document.getElementById(
            "profileModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   PRODUCT MODULE
========================================================= */

function initializeProductModule() {

    const addProductButton =
        document.getElementById(
            "addProductButton"
        );


    const closeProductButton =
        document.getElementById(
            "closeProductModal"
        );


    const cancelProductButton =
        document.getElementById(
            "cancelProductModal"
        );


    const productForm =
        document.getElementById(
            "productForm"
        );


    const searchProduct =
        document.getElementById(
            "productSearch"
        );


    if (addProductButton) {

        addProductButton.addEventListener(
            "click",
            function () {

                openProductModal();

            }
        );

    }


    if (closeProductButton) {

        closeProductButton.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (cancelProductButton) {

        cancelProductButton.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (productForm) {

        productForm.addEventListener(
            "submit",
            saveProduct
        );

    }


    if (searchProduct) {

        searchProduct.addEventListener(
            "input",
            function () {

                renderProducts(
                    searchProduct.value
                );

            }
        );

    }


    const productModal =
        document.getElementById(
            "productModal"
        );


    if (productModal) {

        productModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === productModal
                ) {

                    closeProductModal();

                }

            }
        );

    }

}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

    const categorySelect =
        document.getElementById(
            "productCategory"
        );


    categories = [
        {
            id: "food",
            name: "Makanan"
        },
        {
            id: "beverage",
            name: "Minuman"
        }
    ];


    if (!categorySelect) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("categories")

            .select(
                "id,name"
            )

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (!error && data && data.length > 0) {

            categories =
                data;

        }

    } catch (error) {

        console.warn(
            "Kategori database belum dapat dibaca. Menggunakan kategori default.",
            error
        );

    }


    categorySelect.innerHTML = `
        <option value="">
            Pilih kategori
        </option>

        ${categories.map(
            function (category) {

                return `
                    <option value="${escapeHtml(
                        category.name
                    )}">
                        ${escapeHtml(
                            category.name
                        )}
                    </option>
                `;

            }
        ).join("")}
    `;

}


/* =========================================================
   LOAD PRODUCTS
   DIGUNAKAN OLEH MASTER PRODUK + SALES + MODUL LAIN
========================================================= */

async function loadProducts() {

    const tableBody =
        document.getElementById(
            "productTableBody"
        );


    /* =====================================================
       TAMPILKAN LOADING HANYA JIKA TABEL PRODUK ADA
    ===================================================== */

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="table-loading">
                    Memuat data produk...
                </td>
            </tr>
        `;

    }


    /* =====================================================
       AMBIL DATA PRODUK DARI SUPABASE
    ===================================================== */

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("products")

            .select(`
                id,
                sku,
                name,
                category_id,
                unit,
                purchase_price,
                selling_price,
                current_stock,
                minimum_stock,
                is_active,
                created_at,
                categories (
                    id,
                    name
                )
            `)

            .eq(
                "is_active",
                true
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        /* =================================================
           JIKA ERROR
        ================================================= */

        if (error) {

            console.error(
                "Gagal mengambil produk:",
                error
            );

            products = [];


            /* Render hanya jika fungsi/halamannya tersedia */

            if (typeof renderProducts === "function") {
                renderProducts();
            }


            if (
                typeof updateDashboardProductCount ===
                "function"
            ) {
                updateDashboardProductCount();
            }


            return;

        }


        /* =================================================
           SIMPAN KE ARRAY GLOBAL PRODUCTS
        ================================================= */

        products =
            data || [];


            /* =================================================
   URUTKAN PRODUK BERDASARKAN NOMOR SKU
   CONTOH:
   PMN-001
   PMK-002
   PMN-003
   PMK-004
================================================= */

products.sort(function(a, b) {

    const numberA =
        parseInt(
            String(a.sku || "")
                .split("-")
                .pop(),
            10
        ) || 0;


    const numberB =
        parseInt(
            String(b.sku || "")
                .split("-")
                .pop(),
            10
        ) || 0;


    return numberA - numberB;

});

console.log(
    "🔥 LOAD PRODUCTS BERHASIL:",
    products
);

console.log(
    "🔥 JUMLAH PRODUCTS:",
    products.length
);


        /* =================================================
           MASTER PRODUK
        ================================================= */

        if (
            typeof renderProducts ===
            "function"
        ) {

            renderProducts();

        }


        /* =================================================
           DASHBOARD
        ================================================= */

        if (
            typeof updateDashboardProductCount ===
            "function"
        ) {

            updateDashboardProductCount();

        }


        if (
            typeof renderLowStockWarning ===
            "function"
        ) {

            renderLowStockWarning();

        }


        if (
            typeof renderRecentInventory ===
            "function"
        ) {

            renderRecentInventory();

        }


        if (
            typeof updateDashboardInventorySummary ===
            "function"
        ) {

            updateDashboardInventorySummary();

        }


    } catch (error) {

        console.error(
            "Error loadProducts:",
            error
        );


        products = [];


        if (
            typeof renderProducts ===
            "function"
        ) {

            renderProducts();

        }


        if (
            typeof renderLowStockWarning ===
            "function"
        ) {

            renderLowStockWarning();

        }


        if (
            typeof renderRecentInventory ===
            "function"
        ) {

            renderRecentInventory();

        }


        if (
            typeof updateDashboardInventorySummary ===
            "function"
        ) {

            updateDashboardInventorySummary();

        }

    }

}


/* =========================================================
   PRODUCT STOCK STATUS
========================================================= */

function isLowStock(product) {

    const currentStock =
        Number(
            product.current_stock || 0
        );


    const minimumStock =
        Number(
            product.minimum_stock || 0
        );


    return (
        minimumStock > 0 &&
        currentStock <= minimumStock
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(
    searchKeyword = ""
) {

    const tableBody =
        document.getElementById(
            "productTableBody"
        );


    if (!tableBody) {
        return;
    }


    const keyword =
        String(
            searchKeyword || ""
        )
        .toLowerCase()
        .trim();


    const filteredProducts =
        products.filter(
            function (product) {

                const productName =
                    String(
                        product.name || ""
                    ).toLowerCase();


                const sku =
                    String(
                        product.sku || ""
                    ).toLowerCase();


                return (
                    productName.includes(keyword) ||
                    sku.includes(keyword)
                );

            }
        );


    if (filteredProducts.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10">

                    <div class="empty-state">

                        <strong>
                            Belum ada produk
                        </strong>

                        <span>
                            Tambahkan produk makanan
                            atau minuman terlebih dahulu.
                        </span>

                    </div>

                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filteredProducts.map(
            function (product) {

                const category =
                    product.categories
                        ? product.categories.name
                        : "-";


                const lowStock =
                    isLowStock(product);


                const statusHtml =
                    lowStock

                        ? `
                            <span class="stock-status low">
                                🔴 Stok Rendah
                            </span>
                        `

                        : `
                            <span class="stock-status safe">
                                🟢 Aman
                            </span>
                        `;


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    product.sku || "-"
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeHtml(
                                product.name || "-"
                            )}
                        </td>


                        <td>

                            <span class="category-badge">

                                ${escapeHtml(
                                    category
                                )}

                            </span>

                        </td>


                        <td>
                            ${escapeHtml(
                                product.unit || "-"
                            )}
                        </td>


                        <td>
                            ${formatRupiah(
                                product.purchase_price
                            )}
                        </td>


                        <td>
                            ${formatRupiah(
                                product.selling_price
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                product.current_stock
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                product.minimum_stock
                            )}
                        </td>


                        <td>
                            ${statusHtml}
                        </td>


                        <td>

    <div class="table-actions">

        <button
            type="button"
            class="action-button action-edit"
            title="Edit"
            aria-label="Edit"
            onclick="editProduct('${product.id}')"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
        </button>

        <button
            type="button"
            class="action-button action-delete"
            title="Hapus"
            aria-label="Hapus"
            onclick="deleteProduct('${product.id}')"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v5"></path>
                <path d="M14 11v5"></path>
                <path d="M9 6V4h6v2"></path>
            </svg>
        </button>

    </div>

</td>

                    </tr>
                `;

            }
        ).join("");

}


/* =========================================================
   OPEN PRODUCT MODAL
========================================================= */

function openProductModal(
    product = null
) {

    const modal =
        document.getElementById(
            "productModal"
        );


    const title =
        document.getElementById(
            "productModalTitle"
        );


    const form =
        document.getElementById(
            "productForm"
        );


    if (!modal || !form) {
        return;
    }


    editingProductId =
        product
            ? product.id
            : null;


    form.reset();


    if (title) {

        title.textContent =
            product
                ? "Edit Produk"
                : "Tambah Produk";

    }


    const minimumStockInput =
        document.getElementById(
            "productMinStock"
        );


    if (minimumStockInput) {

        minimumStockInput.value =
            product
                ? Number(
                    product.minimum_stock || 0
                )
                : 0;

    }


    if (product) {

        const skuInput =
            document.getElementById(
                "productSku"
            );


        const nameInput =
            document.getElementById(
                "productName"
            );


        const categoryInput =
            document.getElementById(
                "productCategory"
            );


        const unitInput =
            document.getElementById(
                "productUnit"
            );


        const purchaseInput =
            document.getElementById(
                "productPurchasePrice"
            );


        const sellingInput =
            document.getElementById(
                "productSellingPrice"
            );


        if (skuInput) {

            skuInput.value =
                product.sku || "";

        }


        if (nameInput) {

            nameInput.value =
                product.name || "";

        }


        if (categoryInput) {

            categoryInput.value =
                product.categories
                    ? product.categories.name
                    : "";

        }


        if (unitInput) {

            unitInput.value =
                product.unit || "";

        }


        if (purchaseInput) {

            purchaseInput.value =
                product.purchase_price || "";

        }


        if (sellingInput) {

            sellingInput.value =
                product.selling_price || "";

        }

    }


    modal.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE PRODUCT MODAL
========================================================= */

function closeProductModal() {

    const modal =
        document.getElementById(
            "productModal"
        );


    const form =
        document.getElementById(
            "productForm"
        );


    if (form) {

        form.reset();

    }


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    editingProductId =
        null;

}


/* =========================================================
   SAVE PRODUCT
========================================================= */

async function saveProduct(
    event
) {

    event.preventDefault();


    const skuInput =
        document.getElementById(
            "productSku"
        );


    const nameInput =
        document.getElementById(
            "productName"
        );


    const categoryInput =
        document.getElementById(
            "productCategory"
        );


    const unitInput =
        document.getElementById(
            "productUnit"
        );


    const purchaseInput =
        document.getElementById(
            "productPurchasePrice"
        );


    const sellingInput =
        document.getElementById(
            "productSellingPrice"
        );


    const minimumStockInput =
        document.getElementById(
            "productMinStock"
        );


    if (
        !skuInput ||
        !nameInput ||
        !categoryInput ||
        !unitInput ||
        !purchaseInput ||
        !sellingInput ||
        !minimumStockInput
    ) {

        showToast(
            "Form produk belum lengkap.",
            "error"
        );

        return;

    }


    const sku =
        skuInput.value.trim();


    const name =
        nameInput.value.trim();


    const category =
        categoryInput.value;


    const unit =
        unitInput.value.trim();


    const purchasePrice =
        Number(
            purchaseInput.value
        );


    const sellingPrice =
        Number(
            sellingInput.value
        );


    const minimumStock =
        Number(
            minimumStockInput.value
        );


    if (
        !sku ||
        !name ||
        !category ||
        !unit
    ) {

        showToast(
            "Mohon lengkapi data produk.",
            "error"
        );

        return;

    }


    if (
        Number.isNaN(purchasePrice) ||
        Number.isNaN(sellingPrice) ||
        Number.isNaN(minimumStock)
    ) {

        showToast(
            "Harga dan minimum stok harus berupa angka.",
            "error"
        );

        return;

    }


    if (
        purchasePrice < 0 ||
        sellingPrice < 0 ||
        minimumStock < 0
    ) {

        showToast(
            "Harga dan stok minimum tidak boleh bernilai negatif.",
            "error"
        );

        return;

    }


    const saveButton =
        document.getElementById(
            "saveProductButton"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Menyimpan...";

    }


    try {

        const {
            data: categoryData,
            error: categoryError
        } = await supabaseClient

            .from("categories")

            .select(
                "id,name"
            )

            .eq(
                "name",
                category
            )

            .maybeSingle();


        if (categoryError) {
            throw categoryError;
        }


        if (!categoryData) {

            throw new Error(
                `Kategori ${category} belum tersedia di database.`
            );

        }


        const wasEditing =
            Boolean(
                editingProductId
            );


        if (wasEditing) {

            const {
                error
            } = await supabaseClient

                .from("products")

                .update({

                    sku:
                        sku,

                    name:
                        name,

                    category_id:
                        categoryData.id,

                    unit:
                        unit,

                    purchase_price:
                        purchasePrice,

                    selling_price:
                        sellingPrice,

                    minimum_stock:
                        minimumStock

                })

                .eq(
                    "id",
                    editingProductId
                );


            if (error) {
                throw error;
            }


            closeProductModal();

            showToast(
                "Produk berhasil diperbarui.",
                "success"
            );

        } else {

            const {
                error
            } = await supabaseClient

                .from("products")

                .insert({

                    sku:
                        sku,

                    name:
                        name,

                    category_id:
                        categoryData.id,

                    unit:
                        unit,

                    purchase_price:
                        purchasePrice,

                    selling_price:
                        sellingPrice,

                    current_stock:
                        0,

                    minimum_stock:
                        minimumStock,

                    is_active:
                        true

                });


            if (error) {
                throw error;
            }


            closeProductModal();

            showToast(
                "Produk berhasil ditambahkan.",
                "success"
            );

        }


        await loadProducts();

        await loadDashboard();


    } catch (error) {

        console.error(
            "Gagal menyimpan produk:",
            error
        );


        showToast(
            "Gagal menyimpan produk: " +
            (
                error.message ||
                "Terjadi kesalahan."
            ),
            "error"
        );

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Simpan Produk";

        }

    }

}


/* =========================================================
   EDIT PRODUCT
========================================================= */

function editProduct(
    productId
) {

    const product =
        products.find(
            function (item) {

                return String(
                    item.id
                ) ===
                String(
                    productId
                );

            }
        );


    if (!product) {

        showToast(
            "Produk tidak ditemukan.",
            "error"
        );

        return;

    }


    openProductModal(
        product
    );

}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(
    productId
) {

    const product =
        products.find(
            function (item) {

                return String(
                    item.id
                ) ===
                String(
                    productId
                );

            }
        );


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Nonaktifkan produk "${product.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient

            .from("products")

            .update({

                is_active:
                    false

            })

            .eq(
                "id",
                productId
            );


        if (error) {
            throw error;
        }


        showToast(
            "Produk berhasil dinonaktifkan.",
            "success"
        );


        await loadProducts();

        await loadDashboard();


    } catch (error) {

        console.error(
            "Gagal menonaktifkan produk:",
            error
        );


        showToast(
            "Produk gagal dinonaktifkan.",
            "error"
        );

    }

}


/* =========================================================
   =========================================================
   PURCHASE MODULE
   =========================================================
========================================================= */


/* =========================================================
   INITIALIZE PURCHASE MODULE
========================================================= */

function initializePurchaseModule() {

    const purchaseForm =
        document.getElementById(
            "purchaseForm"
        );


    const purchaseProductSearch =
        document.getElementById(
            "purchaseProductSearch"
        );


    const purchaseQuantity =
        document.getElementById(
            "purchaseQuantity"
        );


    const purchaseUnitPrice =
        document.getElementById(
            "purchaseUnitPrice"
        );


    const purchaseDate =
        document.getElementById(
            "purchaseDate"
        );


    const closePurchaseButton =
        document.getElementById(
            "closePurchaseModal"
        );


    const cancelPurchaseButton =
        document.getElementById(
            "cancelPurchaseModal"
        );


    const addPurchaseButton =
        document.getElementById(
            "addPurchaseButton"
        );


    const addSupplierButton =
        document.getElementById(
            "addSupplierFromPurchaseButton"
        );


    const searchPurchase =
        document.getElementById(
            "purchaseSearch"
        );


    /* =========================================
       SUPPLIER
    ========================================== */

    if (addSupplierButton) {

        addSupplierButton.addEventListener(
            "click",
            function () {

                openSupplierModal();

            }
        );

    }


    /* =========================================
       ADD PURCHASE BUTTON
    ========================================== */

    if (addPurchaseButton) {
        
        addPurchaseButton.addEventListener(
            "click",
            function () {

                openPurchaseModal();

            }
        );
        
    }

    const addPurchaseItemButton =
    document.getElementById(
        "addPurchaseItemButton"
    );

if (addPurchaseItemButton) {

    addPurchaseItemButton.addEventListener(
        "click",
        addPurchaseItem
    );

}
    

    /* =========================================
       CLOSE PURCHASE
    ========================================== */

    if (closePurchaseButton) {

        closePurchaseButton.addEventListener(
            "click",
            closePurchaseModal
        );

    }


    if (cancelPurchaseButton) {

        cancelPurchaseButton.addEventListener(
            "click",
            closePurchaseModal
        );

    }


    /* =========================================
       SUBMIT PURCHASE
    ========================================== */

    if (purchaseForm) {

    purchaseForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            console.log(
                "TOMBOL SIMPAN PEMBELIAN TERTEKAN"
            );

            savePurchase(event);

        }
    );

}


    /* =========================================
       PRODUCT SEARCH
    ========================================== */

    if (purchaseProductSearch) {

        purchaseProductSearch.addEventListener(
            "input",
            function () {

                searchPurchaseProducts(
                    purchaseProductSearch.value
                );

            }
        );


        purchaseProductSearch.addEventListener(
            "focus",
            function () {

                searchPurchaseProducts(
                    purchaseProductSearch.value
                );

            }
        );

    }


    /* =========================================
       QUANTITY
    ========================================== */

    if (purchaseQuantity) {

        purchaseQuantity.addEventListener(
            "input",
            calculatePurchaseTotal
        );

    }


    /* =========================================
       UNIT PRICE
    ========================================== */

    if (purchaseUnitPrice) {

        purchaseUnitPrice.addEventListener(
            "input",
            calculatePurchaseTotal
        );

    }


    /* =========================================
       PURCHASE DATE
    ========================================== */

    if (purchaseDate) {

        if (!purchaseDate.value) {

            purchaseDate.value =
                getTodayDate();

        }

    }


    /* =========================================
       PURCHASE SEARCH
    ========================================== */

    if (searchPurchase) {

        searchPurchase.addEventListener(
            "input",
            function () {

                renderPurchases(
                    searchPurchase.value
                );

            }
        );

    }


    /* =========================================
       PURCHASE MODAL
    ========================================== */

    const purchaseModal =
        document.getElementById(
            "purchaseModal"
        );


    if (purchaseModal) {

        purchaseModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    purchaseModal
                ) {

                    closePurchaseModal();

                }

            }
        );

    }

}


/* =========================================================
   LOAD SUPPLIERS
========================================================= */

async function loadSuppliers() {

    const supplierSelect =
        document.getElementById(
            "purchaseSupplier"
        );


    if (!supplierSelect) {
        return;
    }


    supplierSelect.innerHTML = `
        <option value="">
            Memuat supplier...
        </option>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("suppliers")

            .select(`
                id,
                supplier_code,
                name,
                phone,
                email,
                address,
                created_at
            `)

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        suppliers =
            data || [];


        if (suppliers.length === 0) {

            supplierSelect.innerHTML = `
                <option value="">
                    Belum ada supplier
                </option>
            `;

            return;

        }


        supplierSelect.innerHTML = `
            <option value="">
                Pilih supplier
            </option>

            ${suppliers.map(
                function (supplier) {

                    const code =
                        supplier.supplier_code
                            ? supplier.supplier_code + " — "
                            : "";

                    return `
                        <option value="${escapeHtml(
                            supplier.id
                        )}">
                            ${escapeHtml(
                                code +
                                (
                                    supplier.name ||
                                    "-"
                                )
                            )}
                        </option>
                    `;

                }
            ).join("")}
        `;


    } catch (error) {

        console.error(
            "Gagal memuat supplier:",
            error
        );


        suppliers = [];


        supplierSelect.innerHTML = `
            <option value="">
                Gagal memuat supplier
            </option>
        `;

    }

}


/* =========================================================
   LOAD SUPPLIER TABLE
========================================================= */

async function loadSupplierTable() {

    const tableBody =
        document.getElementById(
            "supplierTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="empty-state"
            >
                Memuat data supplier...
            </td>
        </tr>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("suppliers")

            .select(`
                id,
                supplier_code,
                name,
                phone,
                email,
                address,
                created_at
            `)

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        const supplierData =
            data || [];


        if (
            supplierData.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-state"
                    >
                        Belum ada data supplier.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML =
            supplierData.map(
                function (
                    supplier,
                    index
                ) {

                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.supplier_code ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.name ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.phone ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.email ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.address ||
                                    "-"
                                )}
                            </td>

                            <td>
                                <span
                                    class="status-badge active"
                                >
                                    Aktif
                                </span>
                            </td>

                            <td>

                                <div
                                    class="table-actions"
                                >

                                  <button
    type="button"
    style="
        position: relative;
        z-index: 99999;
        pointer-events: auto;
        cursor: pointer;
    "
    onclick="alert('EDIT DIKLIK')"
>
    EDIT
</button>

<button
    type="button"
    class="action-button action-delete"
    title="Hapus"
    aria-label="Hapus"
    data-supplier-id="${supplier.id}"
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v5"></path>
        <path d="M14 11v5"></path>
        <path d="M9 6V4h6v2"></path>
    </svg>
</button>

                                </div>

                            </td>

                        </tr>
                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Gagal memuat tabel supplier:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-state"
                >
                    Gagal memuat data supplier.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   EDIT SUPPLIER
========================================================= */

window.editSupplier = async function(supplierId) {

    console.log("EDIT SUPPLIER DIKLIK:", supplierId);


    try {

        /* =====================================================
           AMBIL DATA SUPPLIER
        ===================================================== */

        const {
            data: supplier,
            error
        } = await supabaseClient

            .from("suppliers")

            .select(`
                id,
                supplier_code,
                name,
                phone,
                email,
                address
            `)

            .eq(
                "id",
                supplierId
            )

            .single();


        if (error) {
            throw error;
        }


        if (!supplier) {

            showToast(
                "Data supplier tidak ditemukan.",
                "error"
            );

            return;

        }


        console.log(
            "DATA SUPPLIER DITEMUKAN:",
            supplier
        );


        /* =====================================================
           SIMPAN ID YANG SEDANG DIEDIT
        ===================================================== */

        editingSupplierId =
            supplier.id;


        /* =====================================================
           AMBIL ELEMENT FORM
        ===================================================== */

        const modal =
            document.getElementById(
                "supplierModal"
            );

        const codeInput =
            document.getElementById(
                "supplierCodeInput"
            );

        const nameInput =
            document.getElementById(
                "supplierNameInput"
            );

        const phoneInput =
            document.getElementById(
                "supplierPhoneInput"
            );

        const emailInput =
            document.getElementById(
                "supplierEmailInput"
            );

        const addressInput =
            document.getElementById(
                "supplierAddressInput"
            );


        /* =====================================================
           CEK MODAL
        ===================================================== */

        if (!modal) {

            console.error(
                "supplierModal TIDAK DITEMUKAN."
            );

            showToast(
                "Form supplier tidak ditemukan.",
                "error"
            );

            return;

        }


        /* =====================================================
           ISI DATA KE FORM
        ===================================================== */

        if (codeInput) {

            codeInput.value =
                supplier.supplier_code || "";

        }


        if (nameInput) {

            nameInput.value =
                supplier.name || "";

        }


        if (phoneInput) {

            phoneInput.value =
                supplier.phone || "";

        }


        if (emailInput) {

            emailInput.value =
                supplier.email || "";

        }


        if (addressInput) {

            addressInput.value =
                supplier.address || "";

        }


        /* =====================================================
           UBAH JUDUL MODAL
        ===================================================== */

        const title =
            modal.querySelector(
                ".modal-header h2"
            );


        if (title) {

            title.textContent =
                "Edit Supplier";

        }


        /* =====================================================
           UBAH TOMBOL
        ===================================================== */

        const saveButton =
            document.querySelector(
                "#supplierForm .btn-primary"
            );


        if (saveButton) {

            saveButton.textContent =
                "Simpan Perubahan";

        }


        /* =====================================================
           PAKSA MODAL TAMPIL
        ===================================================== */

        modal.style.setProperty(
            "display",
            "flex",
            "important"
        );

        modal.style.setProperty(
            "opacity",
            "1",
            "important"
        );

        modal.style.setProperty(
            "visibility",
            "visible",
            "important"
        );

        modal.style.setProperty(
            "pointer-events",
            "auto",
            "important"
        );


        /* =====================================================
           TAMBAHKAN CLASS SHOW JIKA ADA
        ===================================================== */

        modal.classList.add(
            "show"
        );


        console.log(
            "MODAL EDIT SUPPLIER BERHASIL DIBUKA."
        );


    } catch (error) {

        console.error(
            "GAGAL EDIT SUPPLIER:",
            error
        );

        showToast(
            "Data supplier gagal dimuat: " +
            (
                error.message ||
                "Terjadi kesalahan."
            ),
            "error"
        );

    }

};


/* =========================================================
   LOAD CUSTOMER TABLE
========================================================= */

async function loadCustomerTable() {

    const tableBody =
        document.getElementById(
            "customerTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="empty-state"
            >
                Memuat data pelanggan...
            </td>
        </tr>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("customers")

            .select(`
                id,
                customer_code,
                name,
                phone,
                email,
                address,
                created_at
            `)

            .order(
                "customer_code",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        customers =
            data || [];


        if (customers.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-state"
                    >
                        Belum ada data pelanggan.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML =

            customers.map(
                function (
                    customer,
                    index
                ) {

                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>


                            <td>
                                ${escapeHtml(
                                    customer.customer_code ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    customer.name ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    customer.phone ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    customer.email ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    customer.address ||
                                    "-"
                                )}
                            </td>


                            <td>

                                <span
                                    class="status-badge active"
                                >
                                    Aktif
                                </span>

                            </td>


<td>
    <div class="table-actions">

        <button
            type="button"
            class="btn-table-edit action-button action-edit"
            title="Edit"
            aria-label="Edit"
            data-customer-id="${customer.id}"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
        </button>

        <button
            type="button"
            class="btn-table-delete action-button action-delete"
            title="Hapus"
            aria-label="Hapus"
            data-customer-id="${customer.id}"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v5"></path>
                <path d="M14 11v5"></path>
                <path d="M9 6V4h6v2"></path>
            </svg>
        </button>

    </div>
</td>
                        </tr>

                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Gagal memuat data pelanggan:",
            error
        );


        customers = [];


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-state"
                >
                    Gagal memuat data pelanggan.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   GENERATE SUPPLIER CODE
========================================================= */

async function generateSupplierCode() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("suppliers")

            .select(
                "supplier_code"
            );


        if (error) {
            throw error;
        }


        let highestNumber =
            0;


        (data || []).forEach(
            function (supplier) {

                const code =
                    String(
                        supplier.supplier_code || ""
                    )
                    .trim()
                    .toUpperCase();


                const match =
                    code.match(
                        /^SUP-(\d+)$/
                    );


                if (match) {

                    const number =
                        Number(
                            match[1]
                        );


                    if (
                        Number.isFinite(number) &&
                        number > highestNumber
                    ) {

                        highestNumber =
                            number;

                    }

                }

            }
        );


        return (
            "SUP-" +
            String(
                highestNumber + 1
            ).padStart(
                3,
                "0"
            )
        );


    } catch (error) {

        console.error(
            "Gagal membuat kode supplier:",
            error
        );


        return (
            "SUP-" +
            Date.now()
        );

    }

}


/* =========================================================
   GENERATE CUSTOMER CODE
========================================================= */

async function generateCustomerCode() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("customers")

            .select(
                "customer_code"
            );


        if (error) {
            throw error;
        }


        let highestNumber = 0;


        (data || []).forEach(
            function (customer) {

                const code =
                    String(
                        customer.customer_code ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                const match =
                    code.match(
                        /^PLG-(\d+)$/
                    );


                if (!match) {
                    return;
                }


                const number =
                    Number(
                        match[1]
                    );


                if (
                    number >
                    highestNumber
                ) {

                    highestNumber =
                        number;

                }

            }
        );


        const nextNumber =
            highestNumber + 1;


        return (
            "PLG-" +
            String(
                nextNumber
            ).padStart(
                3,
                "0"
            )
        );


    } catch (error) {

        console.error(
            "Gagal membuat kode pelanggan:",
            error
        );


        return null;

    }

}


/* =========================================================
   OPEN SUPPLIER MODAL
========================================================= */

async function openSupplierModal() {

    const modal =
        document.getElementById(
            "supplierModal"
        );


    const form =
        document.getElementById(
            "supplierForm"
        );


    const title =
        document.getElementById(
            "supplierModalTitle"
        );


    const codeInput =
        document.getElementById(
            "supplierCode"
        );


    if (!modal || !form) {
        return;
    }


    form.reset();


    if (title) {

        title.textContent =
            "Tambah Supplier";

    }


    if (codeInput) {

        codeInput.value =
            "Membuat kode...";


        codeInput.value =
            await generateSupplierCode();

    }


    modal.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE SUPPLIER MODAL
========================================================= */

function closeSupplierModal() {

    const modal =
        document.getElementById(
            "supplierModal"
        );


    const form =
        document.getElementById(
            "supplierForm"
        );


    if (form) {

        form.reset();

    }


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   GENERATE KODE SUPPLIER OTOMATIS
========================================================= */

async function generateSupplierCode() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("suppliers")

            .select("supplier_code")
            .order(
                "supplier_code",
                {
                    ascending: false
                }
            )
            .limit(1);


        if (error) {
            throw error;
        }


        /* =============================================
           BELUM ADA SUPPLIER
        ============================================= */

        if (
            !data ||
            data.length === 0
        ) {

            return "SUP-001";

        }


        /* =============================================
           AMBIL NOMOR TERAKHIR
        ============================================= */

        const lastCode =
            String(
                data[0].supplier_code || ""
            );


        const lastNumber =
            parseInt(
                lastCode
                    .split("-")
                    .pop(),
                10
            ) || 0;


        const nextNumber =
            lastNumber + 1;


        return (
            "SUP-" +
            String(nextNumber)
                .padStart(3, "0")
        );


    } catch (error) {

        console.error(
            "Gagal membuat kode supplier:",
            error
        );


        return "SUP-001";

    }

}


/* =========================================================
   INITIALIZE SUPPLIER MODAL
========================================================= */

function initializeSupplierModal() {

    const openButton =
        document.getElementById(
            "addSupplierButton"
        );

    const closeButton =
        document.getElementById(
            "closeSupplierModalButton"
        );

    const cancelButton =
        document.getElementById(
            "cancelSupplierButton"
        );

    const supplierForm =
        document.getElementById(
            "supplierForm"
        );

    const modal =
        document.getElementById(
            "supplierModal"
        );

    const editButtonsContainer =
        document.getElementById(
            "supplierTableBody"
        );


    if (!modal) {
        return;
    }


/* =========================================================
   QUICK ADD SUPPLIER DARI PEMBELIAN
========================================================= */

if (
    !document.body.dataset.supplierQuickAddInitialized
) {

    document.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    "#addSupplierFromPurchaseButton"
                );

            if (!button) {
                return;
            }

            console.log(
                "🔥 QUICK ADD SUPPLIER TERDETEKSI"
            );

            /* =============================================
               BUKA MODAL SUPPLIER
            ============================================= */

            editingSupplierId = null;

            const supplierForm =
                document.getElementById(
                    "supplierForm"
                );

            const modal =
                document.getElementById(
                    "supplierModal"
                );

            if (supplierForm) {
                supplierForm.reset();
            }

            if (modal) {

                const title =
                    modal.querySelector(
                        ".modal-header h2"
                    );

                if (title) {
                    title.textContent =
                        "Tambah Supplier";
                }

                const saveButton =
                    document.querySelector(
                        "#supplierForm .btn-primary"
                    );

                if (saveButton) {
                    saveButton.textContent =
                        "Simpan Supplier";
                }

                modal.style.setProperty(
                    "display",
                    "flex",
                    "important"
                );

                modal.style.setProperty(
                    "opacity",
                    "1",
                    "important"
                );

                modal.style.setProperty(
                    "visibility",
                    "visible",
                    "important"
                );

                modal.style.setProperty(
                    "pointer-events",
                    "auto",
                    "important"
                );

                modal.classList.add(
                    "show"
                );
            }

            /* =============================================
               GENERATE KODE SUPPLIER
            ============================================= */

            const codeInput =
                document.getElementById(
                    "supplierCodeInput"
                );

            if (codeInput) {

                codeInput.value =
                    "Membuat kode...";

                try {

                    const newCode =
                        await generateSupplierCode();

                    codeInput.value =
                        newCode ||
                        "SUP-001";

                } catch (error) {

                    console.error(
                        "Gagal membuat kode supplier:",
                        error
                    );

                    codeInput.value =
                        "SUP-001";
                }
            }

        }
    );

    document.body.dataset.supplierQuickAddInitialized =
        "true";
}


    /* =====================================================
       TAMBAH SUPPLIER
    ===================================================== */

    if (openButton) {

    openButton.addEventListener(
        "click",
        async function() {

            /* =========================================
               MODE TAMBAH SUPPLIER
            ========================================= */

            editingSupplierId = null;


            if (supplierForm) {
                supplierForm.reset();
            }


            /* =========================================
               JUDUL MODAL
            ========================================= */

            const title =
                modal.querySelector(
                    ".modal-header h2"
                );


            if (title) {

                title.textContent =
                    "Tambah Supplier";

            }


            /* =========================================
               TOMBOL SIMPAN
            ========================================= */

            const saveButton =
                document.querySelector(
                    "#supplierForm .btn-primary"
                );


            if (saveButton) {

                saveButton.textContent =
                    "Simpan Supplier";

            }


            /* =========================================
               GENERATE KODE OTOMATIS
            ========================================= */

            const codeInput =
                document.getElementById(
                    "supplierCodeInput"
                );


            if (codeInput) {

                codeInput.value =
                    "Membuat kode...";


                codeInput.value =
                    await generateSupplierCode();

            }


            /* =========================================
               BUKA MODAL
            ========================================= */

            modal.style.display =
                "flex";

        }
    );

}


    /* =====================================================
       TUTUP X
    ===================================================== */

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeSupplierModal();

            }
        );

    }


    /* =====================================================
       TUTUP BATAL
    ===================================================== */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                closeSupplierModal();

            }
        );

    }


    /* =====================================================
       TUTUP KLIK LUAR
    ===================================================== */

    if (
        !modal.dataset.backgroundInitialized
    ) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeSupplierModal();

                }

            }
        );


        modal.dataset.backgroundInitialized =
            "true";

    }


    /* =====================================================
       SUBMIT FORM
    ===================================================== */

    if (
        supplierForm &&
        !supplierForm.dataset.submitInitialized
    ) {

        supplierForm.addEventListener(
            "submit",
            saveSupplier
        );


        supplierForm.dataset.submitInitialized =
            "true";

    }

}


/* =========================================================
   EDIT SUPPLIER
========================================================= */

async function editSupplier(
    supplierId
) {

    try {

        const {
            data: supplier,
            error
        } = await supabaseClient

            .from("suppliers")

            .select(`
                id,
                supplier_code,
                name,
                phone,
                email,
                address
            `)

            .eq(
                "id",
                supplierId
            )

            .single();


        if (error) {
            throw error;
        }


        if (!supplier) {

            showToast(
                "Data supplier tidak ditemukan.",
                "error"
            );

            return;

        }


        editingSupplierId =
            supplier.id;


        const modal =
            document.getElementById(
                "supplierModal"
            );


        const codeInput =
            document.getElementById(
                "supplierCodeInput"
            );


        const nameInput =
            document.getElementById(
                "supplierNameInput"
            );


        const phoneInput =
            document.getElementById(
                "supplierPhoneInput"
            );


        const emailInput =
            document.getElementById(
                "supplierEmailInput"
            );


        const addressInput =
            document.getElementById(
                "supplierAddressInput"
            );


        const title =
            modal
                ? modal.querySelector(
                    ".modal-header h2"
                )
                : null;


        const saveButton =
            document.querySelector(
                "#supplierForm .btn-primary"
            );


        if (codeInput) {
            codeInput.value =
                supplier.supplier_code || "";
        }


        if (nameInput) {
            nameInput.value =
                supplier.name || "";
        }


        if (phoneInput) {
            phoneInput.value =
                supplier.phone || "";
        }


        if (emailInput) {
            emailInput.value =
                supplier.email || "";
        }


        if (addressInput) {
            addressInput.value =
                supplier.address || "";
        }


        if (title) {
            title.textContent =
                "Edit Supplier";
        }


        if (saveButton) {
            saveButton.textContent =
                "Simpan Perubahan";
        }


        if (modal) {

            modal.style.display =
                "flex";

        }


    } catch (error) {

        console.error(
            "Gagal mengambil data supplier:",
            error
        );


        showToast(
            "Data supplier gagal dimuat.",
            "error"
        );

    }

}


/* =========================================================
   CLOSE SUPPLIER MODAL
========================================================= */

function closeSupplierModal() {

    const modal =
        document.getElementById(
            "supplierModal"
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        "none";


    editingSupplierId =
        null;


    const supplierForm =
        document.getElementById(
            "supplierForm"
        );


    if (supplierForm) {
        supplierForm.reset();
    }


    const title =
        modal.querySelector(
            ".modal-header h2"
        );


    if (title) {
        title.textContent =
            "Tambah Supplier";
    }


    const saveButton =
        document.querySelector(
            "#supplierForm .btn-primary"
        );


    if (saveButton) {
        saveButton.textContent =
            "Simpan Supplier";
    }

}


/* =========================================================
   SAVE / UPDATE SUPPLIER
========================================================= */

async function saveSupplier(event) {

    event.preventDefault();


    const codeInput =
        document.getElementById(
            "supplierCodeInput"
        );


    const nameInput =
        document.getElementById(
            "supplierNameInput"
        );


    const phoneInput =
        document.getElementById(
            "supplierPhoneInput"
        );


    const emailInput =
        document.getElementById(
            "supplierEmailInput"
        );


    const addressInput =
        document.getElementById(
            "supplierAddressInput"
        );


    const saveButton =
        document.querySelector(
            "#supplierForm .btn-primary"
        );


    const supplierForm =
        document.getElementById(
            "supplierForm"
        );


    if (
        !codeInput ||
        !nameInput ||
        !phoneInput ||
        !emailInput ||
        !addressInput
    ) {

        showToast(
            "Form supplier belum tersedia.",
            "error"
        );

        return;

    }


    const supplierCode =
        codeInput.value.trim();


    const name =
        nameInput.value.trim();


    const phone =
        phoneInput.value.trim();


    const email =
        emailInput.value.trim();


    const address =
        addressInput.value.trim();


    if (!supplierCode) {

        showToast(
            "Kode supplier wajib diisi.",
            "error"
        );

        codeInput.focus();

        return;

    }


    if (!name) {

        showToast(
            "Nama supplier wajib diisi.",
            "error"
        );

        nameInput.focus();

        return;

    }


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Menyimpan...";

    }


    try {

        /* =================================================
           CEK DUPLIKAT NAMA
        ================================================= */

        let duplicateQuery =
            supabaseClient
                .from("suppliers")
                .select("id,name")
                .ilike("name", name)
                .limit(1);


        if (editingSupplierId) {

            duplicateQuery =
                duplicateQuery.neq(
                    "id",
                    editingSupplierId
                );

        }


        const {
            data: existingSupplier,
            error: duplicateError
        } = await duplicateQuery;


        if (duplicateError) {
            throw duplicateError;
        }


        if (
            existingSupplier &&
            existingSupplier.length > 0
        ) {

            throw new Error(
                "Supplier dengan nama tersebut sudah terdaftar."
            );

        }


        /* =================================================
           MODE EDIT
        ================================================= */

        if (editingSupplierId) {

            const {
                data,
                error
            } = await supabaseClient

                .from("suppliers")

                .update({

                    supplier_code:
                        supplierCode,

                    name:
                        name,

                    phone:
                        phone || null,

                    email:
                        email || null,

                    address:
                        address || null

                })

                .eq(
                    "id",
                    editingSupplierId
                )

                .select(`
                    id,
                    supplier_code,
                    name,
                    phone,
                    email,
                    address
                `)

                .single();


            if (error) {
                throw error;
            }


            await loadSupplierTable();

            await loadSuppliers();


            closeSupplierModal();


            showToast(
                "Supplier " +
                data.name +
                " berhasil diperbarui.",
                "success"
            );


            return;

        }


        /* =================================================
           MODE TAMBAH
        ================================================= */

        const {
            data,
            error
        } = await supabaseClient

            .from("suppliers")

            .insert({

                supplier_code:
                    supplierCode,

                name:
                    name,

                phone:
                    phone || null,

                email:
                    email || null,

                address:
                    address || null

            })

            .select(`
                id,
                supplier_code,
                name,
                phone,
                email,
                address,
                created_at
            `)

            .single();


        if (error) {
            throw error;
        }


        await loadSupplierTable();

        await loadSuppliers();


        const supplierSelect =
            document.getElementById(
                "purchaseSupplier"
            );


        if (
            supplierSelect &&
            data
        ) {

            supplierSelect.value =
                data.id;

        }


        if (supplierForm) {
            supplierForm.reset();
        }


        closeSupplierModal();


        showToast(
            "Supplier " +
            data.name +
            " berhasil ditambahkan.",
            "success"
        );


    } catch (error) {

        console.error(
            "Gagal menyimpan supplier:",
            error
        );


        showToast(
            "Supplier gagal disimpan: " +
            (
                error.message ||
                "Terjadi kesalahan."
            ),
            "error"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingSupplierId
                    ? "Simpan Perubahan"
                    : "Simpan Supplier";

        }

    }

}


/* =========================================================
   LOAD SUPPLIER TABLE
========================================================= */

async function loadSupplierTable() {

    const tableBody =
        document.getElementById(
            "supplierTableBody"
        );


    if (!tableBody) {

        console.warn(
            "supplierTableBody tidak ditemukan."
        );

        return;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="empty-state"
            >
                Memuat data supplier...
            </td>
        </tr>
    `;


    try {

        /* =================================================
           AMBIL DATA DARI TABEL SUPPLIERS
        ================================================= */

        const {
            data,
            error
        } = await supabaseClient

            .from("suppliers")

            .select(`
                id,
                supplier_code,
                name,
                phone,
                email,
                address,
                created_at
            `)

            .order(
                "supplier_code",
                {
                    ascending: true
                }
            );


        /* =================================================
           CEK ERROR SUPABASE
        ================================================= */

        if (error) {

            throw error;

        }


        console.log(
            "Data supplier dari Supabase:",
            data
        );


        const supplierData =
            data || [];


        /* =================================================
           JIKA BELUM ADA DATA
        ================================================= */

        if (
            supplierData.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-state"
                    >
                        Belum ada data supplier.
                    </td>
                </tr>
            `;

            return;

        }


        /* =================================================
           TAMPILKAN DATA
        ================================================= */

        tableBody.innerHTML =
            supplierData.map(
                function (
                    supplier,
                    index
                ) {

                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.supplier_code ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.name ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.phone ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.email ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    supplier.address ||
                                    "-"
                                )}
                            </td>

                            <td>

                                <span
                                    class="status-badge active"
                                >
                                    Aktif
                                </span>

                            </td>

                            <td>

                                <div
                                    class="table-actions"
                                >

<button
    type="button"
    class="btn-table-edit action-button action-edit"
    title="Edit"
    aria-label="Edit"
    data-supplier-id="${supplier.id}"
    onclick="editSupplier('${supplier.id}')"
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
</button>

<button
    type="button"
    class="btn-table-delete action-button action-delete"
    title="Hapus"
    aria-label="Hapus"
    data-supplier-id="${supplier.id}"
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v5"></path>
        <path d="M14 11v5"></path>
        <path d="M9 6V4h6v2"></path>
    </svg>
</button>

                                </div>

                            </td>

                        </tr>
                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Gagal memuat tabel supplier:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-state"
                >
                    Gagal memuat data supplier.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   LOAD PURCHASE PRODUCTS
========================================================= */

function loadPurchaseProducts() {

    const searchInput =
        document.getElementById(
            "purchaseProductSearch"
        );

    if (!searchInput) {
        return;
    }

    /*
       Tidak perlu mengisi dropdown lagi.
       Data produk sudah tersimpan di array "products".
       Fungsi searchPurchaseProducts()
       akan mengambil data tersebut.
    */

}


/* =========================================================
   SEARCH PURCHASE PRODUCTS
========================================================= */

function searchPurchaseProducts(keyword) {

    const suggestions =
        document.getElementById(
            "purchaseProductSuggestions"
        );

    if (!suggestions) {
        return;
    }

    keyword =
        String(keyword || "")
            .trim()
            .toLowerCase();

    /* =========================================
       JIKA KOLOM KOSONG
       AUTOCOMPLETE JANGAN MUNCUL
    ========================================= */

    if (!keyword) {

        suggestions.innerHTML = "";

        suggestions.classList.remove(
            "show"
        );

        return;
    }

    /* =========================================
       FILTER PRODUK
    ========================================= */

    const activeProducts =
        products.filter(
            function (product) {

                return (
                    product.is_active !== false
                );
            }
        );

    const filteredProducts =
        activeProducts.filter(
            function (product) {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();

                const sku =
                    String(
                        product.sku || ""
                    ).toLowerCase();

                return (
                    name.includes(keyword) ||
                    sku.includes(keyword)
                );
            }
        );

    /* =========================================
       JIKA TIDAK ADA PRODUK
    ========================================= */

    if (
        filteredProducts.length === 0
    ) {

        suggestions.innerHTML = `
            <div class="product-suggestion-empty">
                Produk tidak ditemukan.
            </div>
        `;

        suggestions.classList.add(
            "show"
        );

        return;
    }

    /* =========================================
       TAMPILKAN HASIL
    ========================================= */

    const displayedProducts =
        filteredProducts.slice(
            0,
            10
        );

    suggestions.innerHTML =
        displayedProducts.map(
            function (product) {

                return `
                    <div
                        class="product-suggestion-item"
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                    >

                        <div class="product-suggestion-name">
                            ${escapeHtml(
                                product.name || "-"
                            )}
                        </div>

                        <div class="product-suggestion-code">
                            SKU:
                            ${escapeHtml(
                                product.sku || "-"
                            )}
                        </div>

                        <div class="product-suggestion-stock">
                            Stok:
                            ${formatNumber(
                                Number(
                                    product.current_stock || 0
                                )
                            )}
                            ${escapeHtml(
                                product.unit || ""
                            )}
                        </div>

                    </div>
                `;
            }
        )
        .join("");

    suggestions.classList.add(
        "show"
    );

    /* =========================================
       KLIK HASIL PRODUK
    ========================================= */

    suggestions
        .querySelectorAll(
            ".product-suggestion-item"
        )
        .forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        selectPurchaseProduct(
                            item.dataset.productId
                        );

                    }
                );

            }
        );
}


/* =========================================================
   SELECT PURCHASE PRODUCT
========================================================= */

function selectPurchaseProduct(
    productId
) {

    const product =
        products.find(
            function (item) {

                return String(
                    item.id
                ) ===
                String(
                    productId
                );

            }
        );


    if (!product) {
        return;
    }


    const searchInput =
        document.getElementById(
            "purchaseProductSearch"
        );


    const hiddenProduct =
        document.getElementById(
            "purchaseProduct"
        );


    const suggestions =
        document.getElementById(
            "purchaseProductSuggestions"
        );


    const productInfo =
        document.getElementById(
            "selectedPurchaseProductInfo"
        );


    /* =========================================
       SIMPAN PRODUCT ID
    ========================================== */

    if (hiddenProduct) {

        hiddenProduct.value =
            product.id;

    }


    /* =========================================
       TAMPILKAN NAMA PRODUK
    ========================================== */

    if (searchInput) {

        searchInput.value =
            product.name || "";

    }


    /* =========================================
       TUTUP SUGGESTION
    ========================================== */

    if (suggestions) {

        suggestions.classList.remove(
            "show"
        );

    }


    /* =========================================
       TAMPILKAN INFO PRODUK
    ========================================== */

    if (productInfo) {

        productInfo.textContent =
            `SKU: ${
                product.sku || "-"
            } • Stok saat ini: ${
                formatNumber(
                    Number(
                        product.current_stock || 0
                    )
                )
            } ${
                product.unit || ""
            }`;


        productInfo.classList.add(
            "selected"
        );

    }


    /* =========================================
       UPDATE HARGA
    ========================================== */

    updatePurchaseProductPrice();


    /* =========================================
       UPDATE TOTAL
    ========================================== */

    calculatePurchaseTotal();

}


/* =========================================================
   UPDATE PURCHASE PRODUCT PRICE
========================================================= */

function updatePurchaseProductPrice() {

    const productSelect =
        document.getElementById(
            "purchaseProduct"
        );


    const priceInput =
        document.getElementById(
            "purchaseUnitPrice"
        );


    if (!productSelect || !priceInput) {
        return;
    }


    const product =
        products.find(
            function (item) {

                return String(
                    item.id
                ) ===
                String(
                    productSelect.value
                );

            }
        );


    if (!product) {

        priceInput.value =
            "";

        return;

    }


    priceInput.value =
        Number(
            product.purchase_price || 0
        );

}


/* =========================================================
   CALCULATE PURCHASE SUBTOTAL
========================================================= */

function calculatePurchaseTotal() {

    const quantityInput =
        document.getElementById(
            "purchaseQuantity"
        );

    const priceInput =
        document.getElementById(
            "purchaseUnitPrice"
        );

    const subtotalElement =
        document.getElementById(
            "purchaseSubtotal"
        );

    if (
        !quantityInput ||
        !priceInput ||
        !subtotalElement
    ) {
        return;
    }

    const quantity =
        Number(
            quantityInput.value
        ) || 0;

    const unitPrice =
        Number(
            priceInput.value
        ) || 0;

    const subtotal =
        quantity *
        unitPrice;

    /* =========================================
       SUBTOTAL ITEM YANG SEDANG DIINPUT
    ========================================= */

    subtotalElement.textContent =
        formatRupiah(
            subtotal
        );

    /* =========================================
       TOTAL SEMUA ITEM
    ========================================= */

    const totalElement =
        document.getElementById(
            "purchaseTotal"
        );

    if (!totalElement) {
        return;
    }

    const total =
        purchaseItems.reduce(
            function (sum, item) {

                return (
                    sum +
                    Number(
                        item.subtotal || 0
                    )
                );

            },
            0
        );

    totalElement.textContent =
        formatRupiah(
            total
        );
}


/* =========================================================
   OPEN PURCHASE MODAL
========================================================= */

function openPurchaseModal() {

    const modal =
        document.getElementById("purchaseModal");

    const form =
        document.getElementById("purchaseForm");

    const title =
        document.getElementById("purchaseModalTitle");

    if (!modal || !form) {
        return;
    }

    editingPurchaseId = null;

    form.reset();

    purchaseItems = [];

    renderPurchaseItems();

    if (title) {
        title.textContent = "Tambah Pembelian";
    }

    /* =========================================
       GENERATE NOMOR PEMBELIAN OTOMATIS
    ========================================== */

   const purchaseNumber =
    document.getElementById("purchaseNumber");

if (purchaseNumber) {
    purchaseNumber.value = "PB-0001";
}


    /* =========================================
       SET TANGGAL HARI INI
    ========================================== */

    const purchaseDate =
        document.getElementById("purchaseDate");

    if (purchaseDate) {

        purchaseDate.value =
            getTodayDate();

    }


    /* =========================================
       LOAD DATA PRODUK
    ========================================== */

    loadPurchaseProducts();

    calculatePurchaseTotal();


    modal.classList.add("show");

}


/* =========================================================
   CLOSE PURCHASE MODAL
========================================================= */

function closePurchaseModal() {

    const modal =
        document.getElementById(
            "purchaseModal"
        );


    const form =
        document.getElementById(
            "purchaseForm"
        );


    if (form) {

        form.reset();

    }


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    editingPurchaseId =
        null;

}


/* =========================================================
   GENERATE PURCHASE NUMBER
========================================================= */

function generatePurchaseNumber() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const random =
        Math.floor(
            Math.random() *
            9000
        ) + 1000;


    return (
        "PB-" +
        year +
        month +
        "-" +
        random
    );

}


/* =========================================================
   HELPER - GENERATE NOMOR JURNAL
========================================================= */

async function generateJournalNumber() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("journal_entries")

            .select("journal_number");


        if (error) {

            throw error;

        }


        let highestNumber = 0;


        (data || []).forEach(
            function (journal) {

                const code =
                    String(
                        journal.journal_number || ""
                    )
                    .trim()
                    .toUpperCase();


                const match =
                    code.match(/^JU-(\d+)$/);


                if (match) {

                    const number =
                        Number(
                            match[1]
                        );


                    if (
                        Number.isFinite(number) &&
                        number > highestNumber
                    ) {

                        highestNumber =
                            number;

                    }

                }

            }
        );


        return (
            "JU-" +
            String(
                highestNumber + 1
            )
            .padStart(4, "0")
        );


    } catch (error) {

        console.error(
            "Gagal membuat nomor jurnal:",
            error
        );

        throw error;

    }

}


/* =========================================================
   HELPER - AMBIL ID AKUN BERDASARKAN KODE
========================================================= */

async function getAccountIdByCode(accountCode) {

    const {
        data,
        error
    } = await supabaseClient

        .from("accounts")

        .select(
            "id, account_code, account_name"
        )

        .eq(
            "account_code",
            accountCode
        )

        .eq(
            "is_active",
            true
        )

        .single();


    if (error) {

        throw error;

    }


    if (!data) {

        throw new Error(
            "Akun dengan kode " +
            accountCode +
            " tidak ditemukan."
        );

    }


    return data.id;

}


/* =========================================================
   HELPER - BUAT JURNAL PEMBELIAN
========================================================= */

async function createPurchaseJournal(
    purchase,
    paymentMethod,
    totalAmount
) {

    /*
       Tentukan akun kredit berdasarkan metode pembayaran.

       cash   → Kas
       credit → Utang Usaha
    */

    const debitAccountId =
        await getAccountIdByCode(
            "1103"
        );


    const creditAccountCode =
        paymentMethod === "credit"
            ? "2101"
            : "1101";


    const creditAccountId =
        await getAccountIdByCode(
            creditAccountCode
        );


    /* =========================================
       GENERATE NOMOR JURNAL
    ========================================== */

    const journalNumber =
        await generateJournalNumber();


    /* =========================================
       INSERT JOURNAL HEADER
    ========================================== */

    const {
        data: journalEntry,
        error: journalError
    } = await supabaseClient

        .from("journal_entries")

        .insert({

            journal_number:
                journalNumber,

            journal_date:
                purchase.purchase_date,

            reference_type:
                "purchase",

            reference_id:
                purchase.id,

            description:
                "Pembelian " +
                purchase.purchase_number

        })

        .select()

        .single();


    if (journalError) {

        throw journalError;

    }


    try {

        /* =====================================
           INSERT JOURNAL DETAILS
        ====================================== */

        const journalDetails = [

            {

                journal_entry_id:
                    journalEntry.id,

                account_id:
                    debitAccountId,

                debit:
                    Number(totalAmount),

                credit:
                    0,

                description:
                    "Persediaan dari pembelian"

            },

            {

                journal_entry_id:
                    journalEntry.id,

                account_id:
                    creditAccountId,

                debit:
                    0,

                credit:
                    Number(totalAmount),

                description:
                    paymentMethod === "credit"
                        ? "Pembelian secara kredit"
                        : "Pembelian secara tunai"

            }

        ];


        const {
            error: detailError
        } = await supabaseClient

            .from("journal_details")

            .insert(
                journalDetails
            );


        if (detailError) {

            throw detailError;

        }


        console.log(
            "Jurnal pembelian berhasil dibuat:",
            journalNumber
        );


        return journalEntry.id;


    } catch (error) {

        /*
           Kalau detail jurnal gagal,
           hapus header jurnal supaya
           tidak ada jurnal setengah jadi.
        */

        await supabaseClient

            .from("journal_entries")

            .delete()

            .eq(
                "id",
                journalEntry.id
            );


        throw error;

    }

}


/* =========================================================
   CREATE SALES JOURNAL
   JURNAL OTOMATIS PENJUALAN + HPP FIFO
========================================================= */

async function createSaleJournal(
    sale,
    paymentMethod,
    totalAmount,
    totalCOGS
) {

    /* =====================================================
       AMBIL AKUN
    ===================================================== */

    const debitSalesAccountCode =
        paymentMethod === "credit"
            ? "1102"
            : "1101";

    const debitSalesAccountId =
        await getAccountIdByCode(
            debitSalesAccountCode
        );


    const salesAccountId =
        await getAccountIdByCode(
            "4101"
        );


    const cogsAccountId =
        await getAccountIdByCode(
            "5101"
        );


    const inventoryAccountId =
        await getAccountIdByCode(
            "1103"
        );


    /* =====================================================
       GENERATE NOMOR JURNAL
    ===================================================== */

    const journalNumber =
        await generateJournalNumber();


    /* =====================================================
       INSERT JOURNAL HEADER
    ===================================================== */

    const {
        data: journalEntry,
        error: journalError
    } = await supabaseClient

        .from("journal_entries")

        .insert({

            journal_number:
                journalNumber,

            journal_date:
                sale.sale_date,

            reference_type:
                "sale",

            reference_id:
                sale.id,

            description:
                "Penjualan " +
                sale.sale_number

        })

        .select()

        .single();


    if (journalError) {

        throw journalError;

    }


    try {

        /* =================================================
           DETAIL JURNAL
        ================================================= */

        const journalDetails = [

            /* =============================================
               JURNAL PENJUALAN
            ============================================== */

            {

                journal_entry_id:
                    journalEntry.id,

                account_id:
                    debitSalesAccountId,

                debit:
                    Number(totalAmount),

                credit:
                    0,

                description:
                    paymentMethod === "credit"
                        ? "Piutang usaha dari penjualan"
                        : "Penerimaan kas dari penjualan"

            },

            {

                journal_entry_id:
                    journalEntry.id,

                account_id:
                    salesAccountId,

                debit:
                    0,

                credit:
                    Number(totalAmount),

                description:
                    "Pendapatan penjualan"

            },

            /* =============================================
               JURNAL HPP
            ============================================== */

            {

                journal_entry_id:
                    journalEntry.id,

                account_id:
                    cogsAccountId,

                debit:
                    Number(totalCOGS),

                credit:
                    0,

                description:
                    "HPP berdasarkan FIFO"

            },

            {

                journal_entry_id:
                    journalEntry.id,

                account_id:
                    inventoryAccountId,

                debit:
                    0,

                credit:
                    Number(totalCOGS),

                description:
                    "Pengurangan persediaan berdasarkan FIFO"

            }

        ];


        /* =================================================
           VALIDASI DEBIT = KREDIT
        ================================================= */

        const totalDebit =
            journalDetails.reduce(
                function (
                    total,
                    detail
                ) {

                    return (
                        total +
                        Number(
                            detail.debit || 0
                        )
                    );

                },
                0
            );


        const totalCredit =
            journalDetails.reduce(
                function (
                    total,
                    detail
                ) {

                    return (
                        total +
                        Number(
                            detail.credit || 0
                        )
                    );

                },
                0
            );


        if (
            Math.abs(
                totalDebit -
                totalCredit
            ) > 0.01
        ) {

            throw new Error(
                "Jurnal penjualan tidak seimbang. Debit dan kredit berbeda."
            );

        }


        /* =================================================
           INSERT JOURNAL DETAILS
        ================================================= */

        const {
            error: detailError
        } = await supabaseClient

            .from("journal_details")

            .insert(
                journalDetails
            );


        if (detailError) {

            throw detailError;

        }


        console.log(
            "Jurnal penjualan berhasil dibuat:",
            journalNumber
        );


        console.log(
            "Total debit:",
            totalDebit
        );


        console.log(
            "Total kredit:",
            totalCredit
        );


        return journalEntry.id;


    } catch (error) {

        /* ================================================
           CLEANUP JIKA DETAIL GAGAL
        ================================================ */

        await supabaseClient

            .from("journal_details")

            .delete()

            .eq(
                "journal_entry_id",
                journalEntry.id
            );


        await supabaseClient

            .from("journal_entries")

            .delete()

            .eq(
                "id",
                journalEntry.id
            );


        throw error;

    }

}


/* =========================================================
   JOURNAL PAGE
   MENAMPILKAN JURNAL OTOMATIS DARI SUPABASE
========================================================= */


/* =========================================================
   FORMAT JENIS TRANSAKSI
========================================================= */

function formatJournalType(referenceType) {

    const type =
        String(
            referenceType || ""
        )
        .trim()
        .toLowerCase();


    const typeMap = {

        purchase:
            "Pembelian",

        sale:
            "Penjualan",

        adjustment:
            "Penyesuaian",

        return_purchase:
            "Retur Pembelian",

        return_sale:
            "Retur Penjualan"

    };


    return (
        typeMap[type] ||
        referenceType ||
        "-"
    );

}


/* =========================================================
   FORMAT NOMOR JURNAL / REFERENSI
========================================================= */

function formatJournalReference(
    journal
) {

    if (
        journal &&
        journal.journal_number
    ) {

        return journal.journal_number;

    }


    return "-";

}


/* =========================================================
   FORMAT TANGGAL JURNAL
========================================================= */

function formatJournalDate(
    dateValue
) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

    }


    const day =
        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        );


    const month =
        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const year =
        date.getFullYear();


    return (
        day +
        "/" +
        month +
        "/" +
        year
    );

}


/* =========================================================
   LOAD JOURNALS
========================================================= */

async function loadJournals() {

    const tableBody =
        document.getElementById(
            "journalTableBody"
        );


    if (!tableBody) {

        return;

    }


    /* =====================================================
       TAMPILKAN LOADING
    ===================================================== */

    tableBody.innerHTML = `

        <tr>

            <td colspan="7">

                <div class="empty-state">

                    <strong>Memuat jurnal...</strong>

                    <span>
                        Data jurnal sedang diambil dari sistem.
                    </span>

                </div>

            </td>

        </tr>

    `;


    try {

        /* =================================================
           AMBIL JOURNAL ENTRIES
        ================================================= */

        const {
            data: journalEntries,
            error: journalError
        } = await supabaseClient

            .from("journal_entries")

            .select(`
                id,
                journal_number,
                journal_date,
                reference_type,
                reference_id,
                description,
                created_at
            `)

            .order(
                "journal_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (journalError) {

            throw journalError;

        }


        /* =================================================
           KALAU BELUM ADA JURNAL
        ================================================= */

        if (
            !journalEntries ||
            journalEntries.length === 0
        ) {

            window.journalDataCache =
                [];

            updateJournalSummary(
                []
            );

            renderJournalTable(
                []
            );

            return;

        }


        /* =================================================
           AMBIL SEMUA JOURNAL DETAILS
        ================================================= */

        const journalEntryIds =
            journalEntries.map(
                function (entry) {

                    return entry.id;

                }
            );


        const {
            data: journalDetails,
            error: detailError
        } = await supabaseClient

            .from("journal_details")

            .select(`
                id,
                journal_entry_id,
                account_id,
                debit,
                credit,
                description
            `)

            .in(
                "journal_entry_id",
                journalEntryIds
            );


        if (detailError) {

            throw detailError;

        }


        /* =================================================
           AMBIL ACCOUNT
        ================================================= */

        const accountIds =
            [
                ...new Set(
                    (
                        journalDetails ||
                        []
                    )
                    .map(
                        function (detail) {

                            return detail.account_id;

                        }
                    )
                    .filter(
                        function (id) {

                            return (
                                id !== null &&
                                id !== undefined
                            );

                        }
                    )
                )
            ];


        let accounts = [];


        if (
            accountIds.length > 0
        ) {

            const {
                data: accountData,
                error: accountError
            } = await supabaseClient

                .from("accounts")

                .select(`
                    id,
                    account_code,
                    account_name,
                    account_type,
                    normal_balance
                `)

                .in(
                    "id",
                    accountIds
                );


            if (accountError) {

                throw accountError;

            }


            accounts =
                accountData ||
                [];

        }


        /* =================================================
           BUAT MAP ACCOUNT
        ================================================= */

        const accountMap =
            {};


        accounts.forEach(
            function (account) {

                accountMap[
                    String(
                        account.id
                    )
                ] = account;

            }
        );


        /* =================================================
           GABUNG HEADER + DETAIL
        ================================================= */

        const journalRows =
            [];


        journalEntries.forEach(
            function (entry) {

                const details =
                    (
                        journalDetails ||
                        []
                    )
                    .filter(
                        function (detail) {

                            return (
                                String(
                                    detail.journal_entry_id
                                ) ===
                                String(
                                    entry.id
                                )
                            );

                        }
                    );


                if (
                    details.length === 0
                ) {

                    journalRows.push({

                        id:
                            entry.id,

                        journal_number:
                            entry.journal_number,

                        journal_date:
                            entry.journal_date,

                        reference_type:
                            entry.reference_type,

                        reference_id:
                            entry.reference_id,

                        description:
                            entry.description,

                        detail_id:
                            null,

                        account_id:
                            null,

                        account_code:
                            "-",

                        account_name:
                            "Tidak ada detail akun",

                        detail_description:
                            "-",

                        debit:
                            0,

                        credit:
                            0

                    });


                    return;

                }


                details.forEach(
                    function (detail) {

                        const account =
                            accountMap[
                                String(
                                    detail.account_id
                                )
                            ];


                        journalRows.push({

                            id:
                                entry.id,

                            journal_number:
                                entry.journal_number,

                            journal_date:
                                entry.journal_date,

                            reference_type:
                                entry.reference_type,

                            reference_id:
                                entry.reference_id,

                            description:
                                entry.description,

                            detail_id:
                                detail.id,

                            account_id:
                                detail.account_id,

                            account_code:
                                account
                                    ? account.account_code
                                    : "-",

                            account_name:
                                account
                                    ? account.account_name
                                    : "Akun tidak ditemukan",

                            detail_description:
                                detail.description ||
                                entry.description ||
                                "-",

                            debit:
                                Number(
                                    detail.debit ||
                                    0
                                ),

                            credit:
                                Number(
                                    detail.credit ||
                                    0
                                )

                        });

                    }
                );

            }
        );


        /* =================================================
           SIMPAN KE CACHE
        ================================================= */

        window.journalDataCache =
            journalRows;


        /* =================================================
           UPDATE SUMMARY
        ================================================= */

        updateJournalSummary(
            journalRows
        );


        /* =================================================
           RENDER TABLE
        ================================================= */

        renderJournalTable(
            journalRows
        );


        console.log(
            "Data jurnal berhasil dimuat:",
            journalRows
        );


    } catch (error) {

        console.error(
            "Gagal memuat jurnal:",
            error
        );


        window.journalDataCache =
            [];


        updateJournalSummary(
            []
        );


        tableBody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state">

                        <strong>Jurnal gagal dimuat</strong>

                        <span>
                            ${
                                error.message ||
                                "Terjadi kesalahan saat mengambil data jurnal."
                            }
                        </span>

                    </div>

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   UPDATE JOURNAL SUMMARY
========================================================= */

function updateJournalSummary(
    rows
) {

    const totalTransactionsElement =
        document.getElementById(
            "journalTotalTransactions"
        );


    const totalDebitElement =
        document.getElementById(
            "journalTotalDebit"
        );


    const totalCreditElement =
        document.getElementById(
            "journalTotalCredit"
        );


    /* =====================================================
       HITUNG JUMLAH JURNAL UNIK
    ===================================================== */

    const uniqueJournalIds =
        new Set();


    (
        rows ||
        []
    )
    .forEach(
        function (row) {

            if (row.id) {

                uniqueJournalIds.add(
                    String(
                        row.id
                    )
                );

            }

        }
    );


    /* =====================================================
       HITUNG DEBIT DAN KREDIT
    ===================================================== */

    let totalDebit = 0;

    let totalCredit = 0;


    (
        rows ||
        []
    )
    .forEach(
        function (row) {

            totalDebit +=
                Number(
                    row.debit ||
                    0
                );


            totalCredit +=
                Number(
                    row.credit ||
                    0
                );

        }
    );


    /* =====================================================
       TAMPILKAN
    ===================================================== */

    if (
        totalTransactionsElement
    ) {

        totalTransactionsElement.textContent =
            formatNumber(
                uniqueJournalIds.size
            );

    }


    if (
        totalDebitElement
    ) {

        totalDebitElement.textContent =
            formatRupiah(
                totalDebit
            );

    }


    if (
        totalCreditElement
    ) {

        totalCreditElement.textContent =
            formatRupiah(
                totalCredit
            );

    }

}


/* =========================================================
   RENDER JOURNAL TABLE
========================================================= */

function renderJournalTable(
    rows
) {

    const tableBody =
        document.getElementById(
            "journalTableBody"
        );


    if (!tableBody) {

        return;

    }


    /* =====================================================
       FILTER ROWS
    ===================================================== */

    if (
        !rows ||
        rows.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state">

                        <strong>Belum ada jurnal</strong>

                        <span>
                            Jurnal akan muncul otomatis setelah transaksi pembelian atau penjualan tercatat.
                        </span>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    /* =====================================================
       BUAT HTML
    ===================================================== */

    let html = "";


    rows.forEach(
        function (row) {

            const debit =
                Number(
                    row.debit ||
                    0
                );


            const credit =
                Number(
                    row.credit ||
                    0
                );


            /* =================================================
               TENTUKAN POSISI AKUN
               
               Debit  → posisi normal
               Credit → menjorok ke kanan
            ================================================= */

            const accountClass =
                credit > 0 &&
                debit === 0
                    ? "journal-account-credit"
                    : "journal-account-debit";


            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            formatJournalDate(
                                row.journal_date
                            )
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(
                                formatJournalReference(
                                    row
                                )
                            )}
                        </strong>
                    </td>

                    <td>

                        <span class="journal-type-badge">
                            ${escapeHtml(
                                formatJournalType(
                                    row.reference_type
                                )
                            )}
                        </span>

                    </td>

                    <td>

                        <div class="${accountClass}">

                            <strong>
                                ${escapeHtml(
                                    row.account_code
                                )}
                            </strong>

                            <br>

                            <span>
                                ${escapeHtml(
                                    row.account_name
                                )}
                            </span>

                        </div>

                    </td>

                    <td>

                        ${escapeHtml(
                            row.detail_description ||
                            row.description ||
                            "-"
                        )}

                    </td>

                    <td class="journal-amount">
                        ${
                            debit > 0
                                ? formatRupiah(
                                    debit
                                )
                                : "-"
                        }
                    </td>

                    <td class="journal-amount">
                        ${
                            credit > 0
                                ? formatRupiah(
                                    credit
                                )
                                : "-"
                        }
                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;

}


/* =========================================================
   APPLY JOURNAL FILTERS
========================================================= */

function applyJournalFilters() {

    const startDateInput =
        document.getElementById(
            "journalStartDate"
        );


    const endDateInput =
        document.getElementById(
            "journalEndDate"
        );


    const typeInput =
        document.getElementById(
            "journalTypeFilter"
        );


    const startDate =
        startDateInput
            ? startDateInput.value
            : "";


    const endDate =
        endDateInput
            ? endDateInput.value
            : "";


    const type =
        typeInput
            ? typeInput.value
            : "";


    /* =====================================================
       VALIDASI PERIODE
    ===================================================== */

    if (
        startDate &&
        endDate &&
        startDate > endDate
    ) {

        showToast(
            "Tanggal awal tidak boleh lebih besar dari tanggal akhir.",
            "warning"
        );

        return;

    }


    const sourceRows =
        window.journalDataCache ||
        [];


    /* =====================================================
       FILTER
    ===================================================== */

    const filteredRows =
        sourceRows.filter(
            function (row) {

                const rowDate =
                    String(
                        row.journal_date ||
                        ""
                    )
                    .slice(
                        0,
                        10
                    );


                const rowType =
                    String(
                        row.reference_type ||
                        ""
                    );


                if (
                    startDate &&
                    rowDate < startDate
                ) {

                    return false;

                }


                if (
                    endDate &&
                    rowDate > endDate
                ) {

                    return false;

                }


                if (
                    type &&
                    rowType !== type
                ) {

                    return false;

                }


                return true;

            }
        );


    /* =====================================================
       UPDATE TABLE + SUMMARY
    ===================================================== */

    updateJournalSummary(
        filteredRows
    );


    renderJournalTable(
        filteredRows
    );

}


/* =========================================================
   RESET JOURNAL FILTER
========================================================= */

function resetJournalFilters() {

    const startDateInput =
        document.getElementById(
            "journalStartDate"
        );


    const endDateInput =
        document.getElementById(
            "journalEndDate"
        );


    const typeInput =
        document.getElementById(
            "journalTypeFilter"
        );


    if (startDateInput) {

        startDateInput.value =
            "";

    }


    if (endDateInput) {

        endDateInput.value =
            "";

    }


    if (typeInput) {

        typeInput.value =
            "";

    }


    const rows =
        window.journalDataCache ||
        [];


    updateJournalSummary(
        rows
    );


    renderJournalTable(
        rows
    );

}


/* =========================================================
   INITIALIZE JOURNAL PAGE
========================================================= */

function initializeJournalPage() {

    const refreshButton =
        document.getElementById(
            "refreshJournalButton"
        );


    const applyButton =
        document.getElementById(
            "applyJournalFilterButton"
        );


    const resetButton =
        document.getElementById(
            "resetJournalFilterButton"
        );


    /* =====================================================
       REFRESH
    ===================================================== */

    if (
        refreshButton &&
        !refreshButton.dataset.initialized
    ) {

        refreshButton.addEventListener(
            "click",
            async function () {

                refreshButton.disabled =
                    true;

                refreshButton.textContent =
                    "Memuat...";


                try {

                    await loadJournals();

                    showToast(
                        "Data jurnal berhasil diperbarui.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Gagal refresh jurnal:",
                        error
                    );

                } finally {

                    refreshButton.disabled =
                        false;

                    refreshButton.textContent =
                        "↻ Refresh";

                }

            }
        );


        refreshButton.dataset.initialized =
            "true";

    }


    /* =====================================================
       APPLY FILTER
    ===================================================== */

    if (
        applyButton &&
        !applyButton.dataset.initialized
    ) {

        applyButton.addEventListener(
            "click",
            function () {

                applyJournalFilters();

            }
        );


        applyButton.dataset.initialized =
            "true";

    }


    /* =====================================================
       RESET FILTER
    ===================================================== */

    if (
        resetButton &&
        !resetButton.dataset.initialized
    ) {

        resetButton.addEventListener(
            "click",
            function () {

                resetJournalFilters();

            }
        );


        resetButton.dataset.initialized =
            "true";

    }


    /* =====================================================
       LOAD AWAL
    ===================================================== */

    loadJournals();

}



/* =========================================================
   SAVE PURCHASE
   PEMBELIAN + FIFO + STOK + INVENTORY MOVEMENT
   + JURNAL OTOMATIS
========================================================= */

async function savePurchase(event) {

    event.preventDefault();

    const saveButton =
        document.getElementById(
            "savePurchaseButton"
        );

    let purchaseId = null;

    let journalEntryId = null;

    /*
       Menyimpan perubahan stok yang sudah dilakukan.
       Digunakan apabila terjadi error sehingga
       stok dapat dikembalikan.
    */
    const stockChanges = [];


    try {

        /* =========================================
           VALIDASI HEADER
        ========================================== */

        let purchaseNumber =
            document
                .getElementById("purchaseNumber")
                .value
                .trim();


        if (!purchaseNumber) {

            purchaseNumber =
                "PB-" +
                String(
                    purchaseDataCache.length + 1
                )
                .padStart(4, "0");


            const purchaseNumberInput =
                document.getElementById(
                    "purchaseNumber"
                );


            if (purchaseNumberInput) {

                purchaseNumberInput.value =
                    purchaseNumber;

            }

        }


        const purchaseDate =
            document
                .getElementById("purchaseDate")
                .value;


        const supplierId =
            document
                .getElementById("purchaseSupplier")
                .value;


        /* =========================================
           METODE PEMBAYARAN
        ========================================== */

        const paymentMethodElement =
            document.getElementById(
                "purchasePaymentMethod"
            );


        const paymentMethod =
            paymentMethodElement
                ? paymentMethodElement.value
                : "cash";


        const notes = "";


        /* =========================================
           VALIDASI HEADER
        ========================================== */

        if (!purchaseDate) {

            showToast(
                "Tanggal pembelian wajib diisi.",
                "warning"
            );

            return;

        }


        if (!supplierId) {

            showToast(
                "Pilih supplier terlebih dahulu.",
                "warning"
            );

            return;

        }


        if (
            paymentMethod !== "cash" &&
            paymentMethod !== "credit"
        ) {

            showToast(
                "Pilih metode pembayaran yang valid.",
                "warning"
            );

            return;

        }


        if (
            purchaseItems.length === 0
        ) {

            showToast(
                "Tambahkan minimal satu item pembelian.",
                "warning"
            );

            return;

        }


        /* =========================================
           VALIDASI SEMUA ITEM
        ========================================== */

        for (
            let i = 0;
            i < purchaseItems.length;
            i++
        ) {

            const item =
                purchaseItems[i];


            if (!item.product_id) {

                throw new Error(
                    `Produk pada item ke-${i + 1} tidak valid.`
                );

            }


            if (
                !Number.isFinite(
                    Number(item.quantity)
                ) ||
                Number(item.quantity) <= 0
            ) {

                throw new Error(
                    `Jumlah produk pada item ke-${i + 1} tidak valid.`
                );

            }


            if (
                !Number.isFinite(
                    Number(item.unit_price)
                ) ||
                Number(item.unit_price) < 0
            ) {

                throw new Error(
                    `Harga produk pada item ke-${i + 1} tidak valid.`
                );

            }

        }


        /* =========================================
           HITUNG TOTAL
        ========================================== */

        const totalAmount =
            purchaseItems.reduce(
                function (sum, item) {

                    return (
                        sum +
                        (
                            Number(item.quantity) *
                            Number(item.unit_price)
                        )
                    );

                },
                0
            );


        /* =========================================
           DISABLE BUTTON
        ========================================== */

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "Menyimpan...";

        }


        /* =========================================
           1. INSERT PURCHASE HEADER
        ========================================== */

        const {
            data: purchase,
            error: purchaseError
        } = await supabaseClient

            .from("purchases")

            .insert([{

                purchase_number:
                    purchaseNumber,

                purchase_date:
                    purchaseDate,

                supplier_id:
                    supplierId,

                total_amount:
                    totalAmount,

                status:
                    "posted",

                payment_method:
                    paymentMethod,

                notes:
                    notes || null

            }])

            .select()

            .single();


        if (purchaseError) {

            throw purchaseError;

        }


        purchaseId =
            purchase.id;


        /* =========================================
           2. INSERT PURCHASE ITEMS
        ========================================== */

        const purchaseItemPayload =
            purchaseItems.map(
                function (item) {

                    return {

                        purchase_id:
                            purchase.id,

                        product_id:
                            item.product_id,

                        quantity:
                            Number(item.quantity),

                        unit_price:
                            Number(item.unit_price)

                    };

                }
            );


        const {
            data: insertedItems,
            error: itemsError
        } = await supabaseClient

            .from("purchase_items")

            .insert(
                purchaseItemPayload
            )

            .select();


        if (itemsError) {

            throw itemsError;

        }


        if (
            !insertedItems ||
            insertedItems.length !==
            purchaseItems.length
        ) {

            throw new Error(
                "Data detail pembelian tidak berhasil disimpan dengan lengkap."
            );

        }


        /* =========================================
           3. PROCESS SETIAP ITEM
        ========================================== */

        for (
            let i = 0;
            i < purchaseItems.length;
            i++
        ) {

            const item =
                purchaseItems[i];


            const insertedItem =
                insertedItems[i];


            if (!insertedItem) {

                throw new Error(
                    `Detail pembelian untuk ${item.product_name} tidak ditemukan.`
                );

            }


            /* =====================================
               CARI PRODUK
            ====================================== */

            const product =
                products.find(
                    function (productItem) {

                        return (
                            productItem.id ===
                            item.product_id
                        );

                    }
                );


            if (!product) {

                throw new Error(
                    `Produk ${item.product_name} tidak ditemukan.`
                );

            }


            const oldStock =
                Number(
                    product.current_stock || 0
                );


            const quantity =
                Number(
                    item.quantity
                );


            const unitPrice =
                Number(
                    item.unit_price
                );


            const newStock =
                oldStock +
                quantity;


            /* =====================================
               3A. INSERT FIFO LAYER
            ====================================== */

            const {
                error: layerError
            } = await supabaseClient

                .from("inventory_layers")

                .insert([{

                    product_id:
                        item.product_id,

                    purchase_id:
                        purchase.id,

                    purchase_item_id:
                        insertedItem.id,

                    layer_date:
                        new Date().toISOString(),

                    quantity_in:
                        quantity,

                    quantity_remaining:
                        quantity,

                    unit_cost:
                        unitPrice

                }]);


            if (layerError) {

                throw layerError;

            }


            /* =====================================
               3B. UPDATE CURRENT STOCK
            ====================================== */

            const {
                error: stockError
            } = await supabaseClient

                .from("products")

                .update({

                    current_stock:
                        newStock,

                    purchase_price:
                        unitPrice

                })

                .eq(
                    "id",
                    item.product_id
                );


            if (stockError) {

                throw stockError;

            }


            stockChanges.push({

                productId:
                    item.product_id,

                oldStock:
                    oldStock,

                newStock:
                    newStock

            });


            /* =====================================
               3C. INVENTORY MOVEMENT
            ====================================== */

            const {
                error: movementError
            } = await supabaseClient

                .from("inventory_movements")

                .insert([{

                    product_id:
                        item.product_id,

                    movement_date:
                        purchaseDate,

                    movement_type:
                        "purchase",

                    reference_id:
                        purchase.id,

                    quantity_in:
                        quantity,

                    quantity_out:
                        0,

                    balance_quantity:
                        newStock,

                    unit_cost:
                        unitPrice,

                    notes:
                        "Pembelian " +
                        purchaseNumber

                }]);


            if (movementError) {

                throw movementError;

            }

        }


        /* =========================================
           4. BUAT JURNAL OTOMATIS
        ========================================== */

        journalEntryId =
            await createPurchaseJournal(
                purchase,
                paymentMethod,
                totalAmount
            );


        /* =========================================
           5. REFRESH DATA
        ========================================== */

        purchaseItems = [];


        await loadProducts();

        await loadPurchases();

        await loadDashboard();


        resetPurchaseForm();


        /* =========================================
           SUCCESS
        ========================================== */

        showToast(
            "Pembelian " +
            purchaseNumber +
            " berhasil disimpan dan jurnal otomatis dibuat.",
            "success"
        );


        console.log(
            "Pembelian berhasil disimpan:",
            purchase
        );


        console.log(
            "Metode pembayaran:",
            paymentMethod
        );


        console.log(
            "Jurnal pembelian:",
            journalEntryId
        );


    } catch (error) {

        console.error(
            "Gagal menyimpan pembelian:",
            error
        );


        /* =========================================
           ROLLBACK JURNAL
        ========================================== */

        if (journalEntryId) {

            try {

                await supabaseClient

                    .from("journal_entries")

                    .delete()

                    .eq(
                        "id",
                        journalEntryId
                    );

            } catch (journalRollbackError) {

                console.error(
                    "Gagal rollback jurnal:",
                    journalRollbackError
                );

            }

        }


        /* =========================================
           ROLLBACK PURCHASE
        ========================================== */

        if (purchaseId) {

            await rollbackPurchase(
                purchaseId,
                stockChanges
            );

        }


        showToast(
            error.message ||
            "Transaksi pembelian gagal disimpan.",
            "error"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Simpan Pembelian";

        }

    }

}


/* =========================================================
   RESET PURCHASE FORM
========================================================= */

function resetPurchaseForm() {

    const form =
        document.getElementById("purchaseForm");

    if (form) {
        form.reset();
    }


    purchaseItems = [];

    renderPurchaseItems();


    const purchaseNumber =
        document.getElementById("purchaseNumber");

    if (purchaseNumber) {
        purchaseNumber.value = "";
    }


    const purchaseProductSearch =
        document.getElementById("purchaseProductSearch");

    if (purchaseProductSearch) {
        purchaseProductSearch.value = "";
    }


    const purchaseProduct =
        document.getElementById("purchaseProduct");

    if (purchaseProduct) {
        purchaseProduct.value = "";
    }


    const purchaseQuantity =
        document.getElementById("purchaseQuantity");

    if (purchaseQuantity) {
        purchaseQuantity.value = "";
    }


    const purchaseUnitPrice =
        document.getElementById("purchaseUnitPrice");

    if (purchaseUnitPrice) {
        purchaseUnitPrice.value = "";
    }


    const productInfo =
        document.getElementById(
            "selectedPurchaseProductInfo"
        );

    if (productInfo) {

        productInfo.textContent =
            "Belum ada produk dipilih.";

        productInfo.classList.remove(
            "selected"
        );

    }


    const suggestions =
        document.getElementById(
            "purchaseProductSuggestions"
        );

    if (suggestions) {

        suggestions.innerHTML = "";

        suggestions.classList.remove(
            "show"
        );

    }


    const purchaseSubtotal =
        document.getElementById(
            "purchaseSubtotal"
        );

    if (purchaseSubtotal) {

        purchaseSubtotal.textContent =
            formatRupiah(0);

    }


    const purchaseTotal =
        document.getElementById(
            "purchaseTotal"
        );

    if (purchaseTotal) {

        purchaseTotal.textContent =
            formatRupiah(0);

    }


    const purchaseDate =
        document.getElementById(
            "purchaseDate"
        );

    if (purchaseDate) {

        purchaseDate.value =
            getTodayDate();

    }

}


/* =========================================================
   ROLLBACK PURCHASE
========================================================= */

async function rollbackPurchase(purchaseId, stockChanges = []) {
    console.warn("Menjalankan rollback transaksi:", purchaseId);

    // 1. Kembalikan stok produk
    for (const change of stockChanges.reverse()) {
        try {
            const { error } = await supabaseClient
                .from("products")
                .update({
                    current_stock: change.oldStock
                })
                .eq("id", change.productId);

            if (error) {
                console.error(
                    "Gagal mengembalikan stok:",
                    change.productId,
                    error
                );
            }
        } catch (error) {
            console.error(
                "Error saat mengembalikan stok:",
                change.productId,
                error
            );
        }
    }

    // 2. Hapus inventory movements
    try {
        const { error } = await supabaseClient
            .from("inventory_movements")
            .delete()
            .eq("reference_id", purchaseId);

        if (error) {
            console.error(
                "Gagal menghapus inventory movements:",
                error
            );
        }
    } catch (error) {
        console.error(
            "Error saat menghapus inventory movements:",
            error
        );
    }

    // 3. Hapus FIFO layers
    try {
        const { error } = await supabaseClient
            .from("inventory_layers")
            .delete()
            .eq("purchase_id", purchaseId);

        if (error) {
            console.error(
                "Gagal menghapus inventory layers:",
                error
            );
        }
    } catch (error) {
        console.error(
            "Error saat menghapus inventory layers:",
            error
        );
    }

    // 4. Hapus purchase items
    try {
        const { error } = await supabaseClient
            .from("purchase_items")
            .delete()
            .eq("purchase_id", purchaseId);

        if (error) {
            console.error(
                "Gagal menghapus purchase items:",
                error
            );
        }
    } catch (error) {
        console.error(
            "Error saat menghapus purchase items:",
            error
        );
    }

    // 5. Hapus purchase header
    try {
        const { error } = await supabaseClient
            .from("purchases")
            .delete()
            .eq("id", purchaseId);

        if (error) {
            console.error(
                "Gagal menghapus purchase:",
                error
            );
        }
    } catch (error) {
        console.error(
            "Error saat menghapus purchase:",
            error
        );
    }

    console.log("Rollback selesai.");
}


/* =========================================================
   LOAD PURCHASES
========================================================= */

async function loadPurchases() {

    const tableBody =
        document.getElementById(
            "purchaseTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="table-loading">
                Memuat data pembelian...
            </td>
        </tr>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("purchases")

            .select(`
                id,
                purchase_number,
                purchase_date,
                supplier_id,
                total_amount,
                status,
                notes,
                suppliers (
                    id,
                    name
                )
            `)

            .order(
                "purchase_date",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        renderPurchases(
            "",
            data || []
        );


    } catch (error) {

        console.error(
            "Gagal memuat pembelian:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="6">

                    <div class="empty-state">

                        <strong>
                            Gagal memuat data pembelian
                        </strong>

                        <span>
                            ${escapeHtml(
                                error.message ||
                                "Terjadi kesalahan."
                            )}
                        </span>

                    </div>

                </td>
            </tr>
        `;

    }

}


/* =========================================================
   PURCHASE DATA CACHE
========================================================= */

let purchaseDataCache = [];


/* =========================================================
   RENDER PURCHASES
========================================================= */

function renderPurchases(
    searchKeyword = "",
    data = null
) {

    const tableBody =
        document.getElementById(
            "purchaseTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (data !== null) {

        purchaseDataCache =
            data;

    }


    const keyword =
        String(
            searchKeyword || ""
        )
        .toLowerCase()
        .trim();


    const filteredPurchases =
        purchaseDataCache.filter(
            function (purchase) {

                const number =
                    String(
                        purchase.purchase_number || ""
                    ).toLowerCase();


                const supplier =
                    purchase.suppliers
                        ? String(
                            purchase.suppliers.name || ""
                        ).toLowerCase()
                        : "";


                return (
                    number.includes(keyword) ||
                    supplier.includes(keyword)
                );

            }
        );


    if (filteredPurchases.length === 0) {

        tableBody.innerHTML = `
            <tr>

                <td colspan="6">

                    <div class="empty-state">

                        <strong>
                            Belum ada transaksi pembelian
                        </strong>

                        <span>
                            Tambahkan transaksi pembelian
                            untuk menambah persediaan.
                        </span>

                    </div>

                </td>

            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filteredPurchases.map(
            function (purchase) {

                const supplier =
                    purchase.suppliers
                        ? purchase.suppliers.name
                        : "-";


                let statusClass =
                    "purchase-status";


                if (
                    purchase.status ===
                    "posted"
                ) {

                    statusClass +=
                        " posted";

                } else if (
                    purchase.status ===
                    "cancelled"
                ) {

                    statusClass +=
                        " cancelled";

                } else {

                    statusClass +=
                        " draft";

                }


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    purchase.purchase_number || "-"
                                )}
                            </strong>
                        </td>


                        <td>
                            ${formatDate(
                                purchase.purchase_date
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                supplier
                            )}
                        </td>


                        <td>
                            ${formatRupiah(
                                purchase.total_amount
                            )}
                        </td>


                        <td>
                            <span class="${statusClass}">
                                ${escapeHtml(
                                    formatPurchaseStatus(
                                        purchase.status
                                    )
                                )}
                            </span>
                        </td>


                        <td>

                            <button
                                type="button"
                                class="table-action"
                                onclick="viewPurchase('${purchase.id}')"
                            >
                                Detail
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/* =========================================================
   ADD PURCHASE ITEM
========================================================= */

function addPurchaseItem() {

    const productId =
        document.getElementById(
            "purchaseProduct"
        )?.value;

    const quantityInput =
        document.getElementById(
            "purchaseQuantity"
        );

    const unitPriceInput =
        document.getElementById(
            "purchaseUnitPrice"
        );

    const quantity =
        Number(
            quantityInput?.value || 0
        );

    const unitPrice =
        Number(
            unitPriceInput?.value || 0
        );

    /* =========================================
       VALIDASI PRODUK
    ========================================= */

    if (!productId) {

        showToast(
            "Pilih produk terlebih dahulu.",
            "error"
        );

        return;
    }

    /* =========================================
       VALIDASI JUMLAH
    ========================================= */

    if (
        !quantity ||
        quantity <= 0
    ) {

        showToast(
            "Masukkan jumlah barang yang valid.",
            "error"
        );

        return;
    }

    /* =========================================
       VALIDASI HARGA
    ========================================= */

    if (
        unitPrice < 0 ||
        isNaN(unitPrice)
    ) {

        showToast(
            "Masukkan harga beli yang valid.",
            "error"
        );

        return;
    }

    /* =========================================
       CARI PRODUK
    ========================================= */

    const product =
        products.find(
            function (item) {

                return String(
                    item.id
                ) ===
                String(
                    productId
                );

            }
        );

    if (!product) {

        showToast(
            "Data produk tidak ditemukan.",
            "error"
        );

        return;
    }

    /* =========================================
       BUAT ITEM PEMBELIAN
    ========================================= */

    const subtotal =
        quantity * unitPrice;

    const purchaseItem = {

        product_id:
            product.id,

        product_name:
            product.name || "-",

        sku:
            product.sku || "-",

        quantity:
            quantity,

        unit_price:
            unitPrice,

        subtotal:
            subtotal

    };

    /* =========================================
       MASUKKAN KE ARRAY
    ========================================= */

    purchaseItems.push(
        purchaseItem
    );

    /* =========================================
       TAMPILKAN KE TABEL
    ========================================= */

    renderPurchaseItems();

    /* =========================================
       KOSONGKAN INPUT
    ========================================= */

    const searchInput =
        document.getElementById(
            "purchaseProductSearch"
        );

    const hiddenProduct =
        document.getElementById(
            "purchaseProduct"
        );

    const productInfo =
        document.getElementById(
            "selectedPurchaseProductInfo"
        );

    if (searchInput) {
        searchInput.value = "";
    }

    if (hiddenProduct) {
        hiddenProduct.value = "";
    }

    if (quantityInput) {
        quantityInput.value = "";
    }

    if (unitPriceInput) {
        unitPriceInput.value = "";
    }

    if (productInfo) {

        productInfo.textContent =
            "Belum ada produk dipilih.";

        productInfo.classList.remove(
            "selected"
        );
    }

    calculatePurchaseTotal();

    showToast(
        "Item berhasil ditambahkan.",
        "success"
    );
}


/* =========================================================
   RENDER PURCHASE ITEMS
========================================================= */

function renderPurchaseItems() {

    const tableBody =
        document.getElementById(
            "purchaseItemTableBody"
        );

    if (!tableBody) {
        return;
    }

    /* =========================================
       JIKA BELUM ADA ITEM
    ========================================= */

    if (
        purchaseItems.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    class="empty-table-message"
                >
                    Belum ada barang
                    yang ditambahkan.
                </td>

            </tr>
        `;

        return;
    }

    /* =========================================
       TAMPILKAN ITEM
    ========================================= */

    tableBody.innerHTML =
        purchaseItems.map(
            function (item, index) {

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    item.product_name
                                )}
                            </strong>

                            <div
                                style="
                                    font-size:11px;
                                    color:#999;
                                    margin-top:3px;
                                "
                            >
                                ${escapeHtml(
                                    item.sku
                                )}
                            </div>
                        </td>

                        <td>
                            ${formatNumber(
                                item.quantity
                            )}
                        </td>

                        <td>
                            ${formatRupiah(
                                item.unit_price
                            )}
                        </td>

                        <td>
                            ${formatRupiah(
                                item.subtotal
                            )}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="table-action"
                                onclick="removePurchaseItem(${index})"
                            >
                                Hapus
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");
}


/* =========================================================
   REMOVE PURCHASE ITEM
========================================================= */

function removePurchaseItem(index) {

    if (
        index < 0 ||
        index >= purchaseItems.length
    ) {
        return;
    }

    purchaseItems.splice(
        index,
        1
    );

    renderPurchaseItems();

    calculatePurchaseTotal();

    showToast(
        "Item berhasil dihapus.",
        "success"
    );
}


/* =========================================================
   VIEW PURCHASE DETAIL
========================================================= */

async function viewPurchase(
    purchaseId
) {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("purchase_items")

            .select(`
                id,
                quantity,
                unit_price,
                subtotal,
                products (
                    id,
                    sku,
                    name,
                    unit
                )
            `)

            .eq(
                "purchase_id",
                purchaseId
            );


        if (error) {

            throw error;

        }


        const purchase =
            purchaseDataCache.find(
                function (item) {

                    return String(
                        item.id
                    ) ===
                    String(
                        purchaseId
                    );

                }
            );


        if (!purchase) {

            showToast(
                "Data pembelian tidak ditemukan.",
                "error"
            );

            return;

        }


        const supplier =
            purchase.suppliers
                ? purchase.suppliers.name
                : "-";


        let detailText =
            "Pembelian: " +
            purchase.purchase_number +
            "\n" +
            "Tanggal: " +
            formatDate(
                purchase.purchase_date
            ) +
            "\n" +
            "Supplier: " +
            supplier +
            "\n\n";


        (data || []).forEach(
            function (item) {

                const productName =
                    item.products
                        ? item.products.name
                        : "Produk";


                detailText +=
                    productName +
                    " — " +
                    formatNumber(
                        item.quantity
                    ) +
                    " × " +
                    formatRupiah(
                        item.unit_price
                    ) +
                    " = " +
                    formatRupiah(
                        item.subtotal
                    ) +
                    "\n";

            }
        );


        detailText +=
            "\nTotal: " +
            formatRupiah(
                purchase.total_amount
            );


        alert(
            detailText
        );


    } catch (error) {

        console.error(
            "Gagal mengambil detail pembelian:",
            error
        );


        showToast(
            "Detail pembelian gagal dimuat.",
            "error"
        );

    }

}


/* =========================================================
   VIEW SALE DETAIL
========================================================= */

async function viewSale(
    saleId
) {

    try {

        /* =====================================================
           AMBIL DATA TRANSAKSI PENJUALAN
        ===================================================== */

        const {
            data: sale,
            error: saleError
        } = await supabaseClient

            .from("sales")

            .select(`
                id,
                sale_number,
                sale_date,
                total_amount,
                total_cogs,
                status,
                customer_id,
                customers (
                    id,
                    name
                )
            `)

            .eq(
                "id",
                saleId
            )

            .single();


        if (saleError) {

            throw saleError;

        }


        if (!sale) {

            showToast(
                "Data penjualan tidak ditemukan.",
                "error"
            );

            return;

        }


        /* =====================================================
           AMBIL DETAIL BARANG PENJUALAN
        ===================================================== */

        const {
            data: items,
            error: itemError
        } = await supabaseClient

            .from("sale_items")

            .select(`
                id,
                quantity,
                selling_price,
                subtotal,
                products (
                    id,
                    sku,
                    name,
                    unit
                )
            `)

            .eq(
                "sale_id",
                saleId
            );


        if (itemError) {

            throw itemError;

        }


        /* =====================================================
           DATA CUSTOMER
        ===================================================== */

        const customer =
            sale.customers
                ? sale.customers.name
                : "-";


        /* =====================================================
           SUSUN DETAIL
        ===================================================== */

        let detailText =
            "Penjualan: " +
            sale.sale_number +
            "\n" +
            "Tanggal: " +
            formatDate(
                sale.sale_date
            ) +
            "\n" +
            "Pelanggan: " +
            customer +
            "\n" +
            "Status: " +
            formatSaleStatus(
                sale.status
            ) +
            "\n\n";


        /* =====================================================
           DETAIL PRODUK
        ===================================================== */

        (items || []).forEach(
            function (item) {

                const productName =
                    item.products
                        ? item.products.name
                        : "Produk";


                detailText +=
                    productName +
                    " — " +
                    formatNumber(
                        item.quantity
                    ) +
                    " × " +
                    formatRupiah(
                        item.selling_price
                    ) +
                    " = " +
                    formatRupiah(
                        item.subtotal
                    ) +
                    "\n";

            }
        );


        /* =====================================================
           TOTAL
        ===================================================== */

        detailText +=
            "\nTotal Penjualan: " +
            formatRupiah(
                sale.total_amount
            );


        detailText +=
            "\nTotal HPP: " +
            formatRupiah(
                sale.total_cogs
            );


        /* =====================================================
           TAMPILKAN DETAIL
        ===================================================== */

        alert(
            detailText
        );


    } catch (error) {

        console.error(
            "Gagal mengambil detail penjualan:",
            error
        );


        showToast(
            "Detail penjualan gagal dimuat.",
            "error"
        );

    }

}


/* =========================================================
   FORMAT PURCHASE STATUS
========================================================= */

function formatPurchaseStatus(
    status
) {

    if (status === "posted") {
        return "Posted";
    }


    if (status === "cancelled") {
        return "Dibatalkan";
    }


    if (status === "draft") {
        return "Draft";
    }


    return status || "-";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


/* =========================================================
   GET TODAY DATE
========================================================= */

function getTodayDate() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    await updateDashboardProductCount();

    await updateDashboardInventoryValue();

    await updateDashboardPurchaseCount();

    await updateDashboardSalesCount();

    renderRecentInventory();

    renderLowStockWarning();

    updateDashboardInventorySummary();

    await loadDashboardCharts();

}


/* =========================================================
   PRODUCT COUNT
========================================================= */

async function updateDashboardProductCount() {

    const element =
        document.getElementById(
            "totalProducts"
        );


    if (!element) {
        return;
    }


    try {

        const {
            count,
            error
        } = await supabaseClient

            .from("products")

            .select(
                "id",
                {
                    count:
                        "exact",
                    head:
                        true
                }
            )

            .eq(
                "is_active",
                true
            );


        if (error) {
            throw error;
        }


        element.textContent =
            count || 0;


    } catch (error) {

        console.error(
            "Dashboard product count:",
            error
        );


        element.textContent =
            "0";

    }

}


/* =========================================================
   INVENTORY VALUE
========================================================= */

async function updateDashboardInventoryValue() {

    const element =
        document.getElementById(
            "inventoryValue"
        );


    if (!element) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("products")

            .select(
                "current_stock,purchase_price"
            )

            .eq(
                "is_active",
                true
            );


        if (error) {
            throw error;
        }


        let total =
            0;


        (data || []).forEach(
            function (product) {

                total +=
                    Number(
                        product.current_stock || 0
                    ) *
                    Number(
                        product.purchase_price || 0
                    );

            }
        );


        element.textContent =
            formatRupiah(
                total
            );


    } catch (error) {

        console.error(
            "Dashboard inventory:",
            error
        );


        element.textContent =
            "Rp0";

    }

}


/* =========================================================
   PURCHASE COUNT
========================================================= */

async function updateDashboardPurchaseCount() {

    const element =
        document.getElementById(
            "purchaseCount"
        );


    if (!element) {
        return;
    }


    try {

        const {
            count,
            error
        } = await supabaseClient

            .from("purchases")

            .select(
                "id",
                {
                    count:
                        "exact",
                    head:
                        true
                }
            );


        if (error) {
            throw error;
        }


        element.textContent =
            count || 0;


    } catch (error) {

        console.error(
            "Dashboard purchase count:",
            error
        );


        element.textContent =
            "0";

    }

}


/* =========================================================
   SALES COUNT
========================================================= */

async function updateDashboardSalesCount() {

    const element =
        document.getElementById(
            "salesCount"
        );


    if (!element) {
        return;
    }


    try {

        const {
            count,
            error
        } = await supabaseClient

            .from("sales")

            .select(
                "id",
                {
                    count:
                        "exact",
                    head:
                        true
                }
            );


        if (error) {
            throw error;
        }


        element.textContent =
            count || 0;


    } catch (error) {

        console.error(
            "Dashboard sales count:",
            error
        );


        element.textContent =
            "0";

    }

}


/* =========================================================
   DASHBOARD INVENTORY SUMMARY
========================================================= */

function updateDashboardInventorySummary() {

    const activeProducts =
        products.filter(
            function (product) {

                return product.is_active !== false;

            }
        );


    const lowStockProducts =
        activeProducts.filter(
            function (product) {

                return isLowStock(
                    product
                );

            }
        );


    const activeElement =
        document.getElementById(
            "dashboardActiveProducts"
        );


    const lowStockElement =
        document.getElementById(
            "dashboardLowStockProducts"
        );


    if (activeElement) {

        activeElement.textContent =
            formatNumber(
                activeProducts.length
            );

    }


    if (lowStockElement) {

        lowStockElement.textContent =
            formatNumber(
                lowStockProducts.length
            );

    }

}


/* =========================================================
   RECENT INVENTORY
========================================================= */

function renderRecentInventory() {

    const tableBody =
        document.getElementById(
            "dashboardInventoryBody"
        );


    if (!tableBody) {
        return;
    }


    const activeProducts =
        products
            .filter(
                function (product) {

                    return product.is_active !== false;

                }
            )
            .slice(
                0,
                5
            );


    if (activeProducts.length === 0) {

        tableBody.innerHTML = `
            <tr>

                <td colspan="5">

                    <div class="empty-state">

                        <strong>
                            Belum ada data persediaan
                        </strong>

                        <span>
                            Data persediaan akan muncul
                            setelah produk ditambahkan.
                        </span>

                    </div>

                </td>

            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        activeProducts.map(
            function (product) {

                const category =
                    product.categories
                        ? product.categories.name
                        : "-";


                const inventoryValue =
                    Number(
                        product.current_stock || 0
                    ) *
                    Number(
                        product.purchase_price || 0
                    );


                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                product.sku || "-"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                product.name || "-"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                category
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                product.current_stock
                            )}
                        </td>


                        <td>
                            ${formatRupiah(
                                inventoryValue
                            )}
                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/* =========================================================
   LOW STOCK WARNING
========================================================= */

function renderLowStockWarning() {

    const countElement =
        document.getElementById(
            "lowStockCount"
        );


    const listElement =
        document.getElementById(
            "lowStockList"
        );


    if (!countElement || !listElement) {
        return;
    }


    const activeProducts =
        products.filter(
            function (product) {

                return product.is_active !== false;

            }
        );


    const lowStockProducts =
        activeProducts.filter(
            function (product) {

                return isLowStock(
                    product
                );

            }
        );


    countElement.textContent =
        lowStockProducts.length;


    const summaryElement =
        document.getElementById(
            "dashboardLowStockProducts"
        );


    if (summaryElement) {

        summaryElement.textContent =
            lowStockProducts.length;

    }


    if (lowStockProducts.length === 0) {

        listElement.innerHTML = `
            <div class="stock-safe-message">
                ✓ Semua stok berada pada kondisi aman.
            </div>
        `;

        return;

    }


    const sortedProducts =
        lowStockProducts
            .slice()
            .sort(
                function (a, b) {

                    return Number(
                        a.current_stock || 0
                    ) -
                    Number(
                        b.current_stock || 0
                    );

                }
            )
            .slice(
                0,
                5
            );


    listElement.innerHTML =
        sortedProducts
            .map(
                function (product) {

                    const currentStock =
                        Number(
                            product.current_stock || 0
                        );


                    const minimumStock =
                        Number(
                            product.minimum_stock || 0
                        );


                    return `
                        <div class="stock-warning-item">


                            <div class="stock-warning-product">

                                <strong>
                                    ${escapeHtml(
                                        product.name || "-"
                                    )}
                                </strong>

                                <span>
                                    SKU:
                                    ${escapeHtml(
                                        product.sku || "-"
                                    )}
                                </span>

                            </div>


                            <div class="stock-warning-quantity">

                                Stok:
                                ${formatNumber(
                                    currentStock
                                )}

                                /

                                Min:
                                ${formatNumber(
                                    minimumStock
                                )}

                            </div>


                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   DASHBOARD CHARTS
========================================================= */

async function loadDashboardCharts() {

    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Chart.js belum tersedia."
        );

        return;

    }


    renderInventoryCategoryChart();

    await loadSalesTrendChart();

    await loadPurchaseTrendChart();

    await loadTopProductsChart();

}


/* =========================================================
   GENERATE LAST 6 MONTHS
========================================================= */

function getLastSixMonths() {

    const result =
        [];

    const now =
        new Date();


    for (
        let i = 5;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );


        result.push({

            key:
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                )}`,

            label:
                date.toLocaleDateString(
                    "id-ID",
                    {
                        month:
                            "short",
                        year:
                            "numeric"
                    }
                )

        });

    }


    return result;

}


/* =========================================================
   FIND OBJECT VALUE
========================================================= */

function getObjectValue(
    object,
    possibleKeys
) {

    if (!object) {
        return null;
    }


    for (
        const key of possibleKeys
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                object,
                key
            )
        ) {

            return object[key];

        }

    }


    return null;

}


/* =========================================================
   DATE TO MONTH KEY
========================================================= */

function getMonthKey(
    value
) {

    if (!value) {
        return null;
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        )
    );

}


/* =========================================================
   SALES TREND
========================================================= */

async function loadSalesTrendChart() {

    const canvas =
        document.getElementById(
            "salesTrendChart"
        );


    if (!canvas) {
        return;
    }


    const months =
        getLastSixMonths();


    const values =
        months.map(
            function () {

                return 0;

            }
        );


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("sales")

            .select("*");


        if (error) {
            throw error;
        }


        (data || []).forEach(
            function (row) {

                const date =
                    getObjectValue(
                        row,
                        [
                            "sale_date",
                            "transaction_date",
                            "date",
                            "created_at"
                        ]
                    );


                const monthKey =
                    getMonthKey(
                        date
                    );


                const index =
                    months.findIndex(
                        function (month) {

                            return (
                                month.key ===
                                monthKey
                            );

                        }
                    );


                if (index === -1) {
                    return;
                }


                const amount =
                    Number(
                        getObjectValue(
                            row,
                            [
                                "total_sales",
                                "total_amount",
                                "grand_total",
                                "total",
                                "amount"
                            ]
                        ) || 0
                    );


                values[index] +=
                    amount;

            }
        );


    } catch (error) {

        console.warn(
            "Data tren penjualan belum dapat dibaca:",
            error
        );

    }


    destroyChart(
        salesTrendChart
    );


    salesTrendChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        months.map(
                            function (item) {

                                return item.label;

                            }
                        ),

                    datasets: [

                        {

                            label:
                                "Penjualan",

                            data:
                                values,

                            borderColor:
                                "#7b5aa6",

                            backgroundColor:
                                "rgba(123,90,166,0.12)",

                            borderWidth:
                                2,

                            fill:
                                true,

                            tension:
                                0.35,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                5

                        }

                    ]

                },

                options:
                    createCurrencyChartOptions()

            }
        );

}


/* =========================================================
   PURCHASE TREND
========================================================= */

async function loadPurchaseTrendChart() {

    const canvas =
        document.getElementById(
            "purchaseTrendChart"
        );


    if (!canvas) {
        return;
    }


    const months =
        getLastSixMonths();


    const values =
        months.map(
            function () {

                return 0;

            }
        );


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("purchases")

            .select("*");


        if (error) {
            throw error;
        }


        (data || []).forEach(
            function (row) {

                const date =
                    getObjectValue(
                        row,
                        [
                            "purchase_date",
                            "transaction_date",
                            "date",
                            "created_at"
                        ]
                    );


                const monthKey =
                    getMonthKey(
                        date
                    );


                const index =
                    months.findIndex(
                        function (month) {

                            return (
                                month.key ===
                                monthKey
                            );

                        }
                    );


                if (index === -1) {
                    return;
                }


                const amount =
                    Number(
                        getObjectValue(
                            row,
                            [
                                "total_amount",
                                "total_purchase",
                                "grand_total",
                                "total",
                                "amount"
                            ]
                        ) || 0
                    );


                values[index] +=
                    amount;

            }
        );


    } catch (error) {

        console.warn(
            "Data tren pembelian belum dapat dibaca:",
            error
        );

    }


    destroyChart(
        purchaseTrendChart
    );


    purchaseTrendChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        months.map(
                            function (item) {

                                return item.label;

                            }
                        ),

                    datasets: [

                        {

                            label:
                                "Pembelian",

                            data:
                                values,

                            borderColor:
                                "#5f8c69",

                            backgroundColor:
                                "rgba(95,140,105,0.12)",

                            borderWidth:
                                2,

                            fill:
                                true,

                            tension:
                                0.35,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                5

                        }

                    ]

                },

                options:
                    createCurrencyChartOptions()

            }
        );

}


/* =========================================================
   TOP 5 PRODUCTS SOLD
========================================================= */

async function loadTopProductsChart() {

    const canvas =
        document.getElementById(
            "topProductsChart"
        );

    if (!canvas) {
        return;
    }

    const productTotals = {};


    products.forEach(
        function (product) {

            productTotals[
                String(product.id)
            ] = {

                name:
                    product.name || "-",

                quantity:
                    0

            };

        }
    );


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("sale_items")

            .select("*");


        if (error) {
            throw error;
        }


        (data || []).forEach(
            function (item) {

                const productId =
                    getObjectValue(
                        item,
                        [
                            "product_id",
                            "id_product",
                            "productId",
                            "id_produk"
                        ]
                    );


                const quantity =
                    Number(
                        getObjectValue(
                            item,
                            [
                                "quantity",
                                "qty",
                                "jumlah"
                            ]
                        ) || 0
                    );


                if (
                    productId === null ||
                    productId === undefined
                ) {
                    return;
                }


                const key =
                    String(productId);


                if (!productTotals[key]) {

                    productTotals[key] = {

                        name:
                            findProductName(
                                productId
                            ),

                        quantity:
                            0

                    };

                }


                productTotals[key].quantity +=
                    quantity;

            }
        );


    } catch (error) {

        console.warn(
            "Data produk terlaris belum dapat dibaca:",
            error
        );

    }


    const topProducts =
        Object.values(
            productTotals
        )
        .filter(
            function (item) {

                return item.quantity > 0;

            }
        )
        .sort(
            function (a, b) {

                return (
                    b.quantity -
                    a.quantity
                );

            }
        )
        .slice(
            0,
            5
        );


    destroyChart(
        topProductsChart
    );


    topProductsChart =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels:
                        topProducts.length > 0

                            ? topProducts.map(
                                function (item) {
                                    return item.name;
                                }
                            )

                            : [
                                "Belum ada data"
                            ],

                    datasets: [

                        {

                            label:
                                "Jumlah Terjual",

                            data:
                                topProducts.length > 0

                                    ? topProducts.map(
                                        function (item) {
                                            return item.quantity;
                                        }
                                    )

                                    : [
                                        1
                                    ],

                            backgroundColor: [
                                "#f3b6c8",
                                "#b8d9c0",
                                "#f2d58f",
                                "#a9c9e8",
                                "#c5afd6"
                            ],

                            borderColor:
                                "#ffffff",

                            borderWidth:
                                2

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "58%",

                    plugins: {

                        legend: {

                            display:
                                true,

                            position:
                                "right",

                            labels: {

                                font: {

                                    family:
                                        "Inter",

                                    size:
                                        10

                                },

                                padding:
                                    12,

                                usePointStyle:
                                    true,

                                pointStyle:
                                    "circle"

                            }

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (context) {

                                        return (
                                            context.label +
                                            ": " +
                                            formatNumber(
                                                context.raw
                                            ) +
                                            " unit"
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   FIND PRODUCT NAME
========================================================= */

function findProductName(
    productId
) {

    const product =
        products.find(
            function (item) {

                return (
                    String(
                        item.id
                    ) ===
                    String(
                        productId
                    )
                );

            }
        );


    return product
        ? product.name
        : "Produk";

}


/* =========================================================
   INVENTORY VALUE BY CATEGORY
========================================================= */

function renderInventoryCategoryChart() {

    const canvas =
        document.getElementById(
            "inventoryCategoryChart"
        );


    if (!canvas) {
        return;
    }


    const categoryTotals =
        {};


    products
        .filter(
            function (product) {

                return (
                    product.is_active !== false
                );

            }
        )
        .forEach(
            function (product) {

                const category =
                    product.categories
                        ? product.categories.name
                        : "Tanpa Kategori";


                const value =
                    Number(
                        product.current_stock || 0
                    ) *
                    Number(
                        product.purchase_price || 0
                    );


                if (
                    !categoryTotals[category]
                ) {

                    categoryTotals[category] =
                        0;

                }


                categoryTotals[category] +=
                    value;

            }
        );


    const labels =
        Object.keys(
            categoryTotals
        );


    const values =
        Object.values(
            categoryTotals
        );


    destroyChart(
        inventoryCategoryChart
    );


    inventoryCategoryChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        labels.length
                            ? labels
                            : [
                                "Belum ada data"
                            ],

                    datasets: [

                        {

                            label:
                                "Nilai Persediaan",

                            data:
                                labels.length
                                    ? values
                                    : [
                                        0
                                    ],

                            backgroundColor:
                                [
                                    "#f3b6c8",
                                    "#b8d9c0",
                                    "#f2d58f",
                                    "#a9c9e8"
                                ],

                            borderWidth:
                                1

                        }

                    ]

                },

                options:
                    createCurrencyChartOptions()

            }
        );

}


/* =========================================================
   CHART OPTIONS - CURRENCY
========================================================= */

function createCurrencyChartOptions() {

    return {

        responsive:
            true,

        maintainAspectRatio:
            false,

        plugins: {

            legend: {

                display:
                    true,

                labels: {

                    font: {

                        family:
                            "Inter",

                        size:
                            10

                    }

                }

            },

            tooltip: {

                callbacks: {

                    label:
                        function (context) {

                            return (
                                context.dataset.label +
                                ": " +
                                formatRupiah(
                                    context.raw
                                )
                            );

                        }

                }

            }

        },

        scales: {

            y: {

                beginAtZero:
                    true,

                ticks: {

                    font: {

                        family:
                            "Inter",

                        size:
                            9

                    },

                    callback:
                        function (value) {

                            return formatShortRupiah(
                                value
                            );

                        }

                },

                grid: {

                    color:
                        "#ececee"

                }

            },

            x: {

                ticks: {

                    font: {

                        family:
                            "Inter",

                        size:
                            9

                    }

                },

                grid: {

                    display:
                        false

                }

            }

        }

    };

}


/* =========================================================
   CHART OPTIONS - QUANTITY
========================================================= */

function createQuantityChartOptions() {

    return {

        indexAxis:
            "y",

        responsive:
            true,

        maintainAspectRatio:
            false,

        plugins: {

            legend: {

                display:
                    false

            },

            tooltip: {

                callbacks: {

                    label:
                        function (context) {

                            return (
                                "Terjual: " +
                                formatNumber(
                                    context.raw
                                )
                            );

                        }

                }

            }

        },

        scales: {

            x: {

                beginAtZero:
                    true,

                ticks: {

                    font: {

                        family:
                            "Inter",

                        size:
                            9

                    }

                },

                grid: {

                    color:
                        "#ececee"

                }

            },

            y: {

                ticks: {

                    font: {

                        family:
                            "Inter",

                        size:
                            9

                    }

                },

                grid: {

                    display:
                        false

                }

            }

        }

    };

}


/* =========================================================
   DESTROY CHART
========================================================= */

function destroyChart(
    chart
) {

    if (chart) {

        chart.destroy();

    }

}


/* =========================================================
   SHORT RUPIAH
========================================================= */

function formatShortRupiah(
    value
) {

    const number =
        Number(
            value
        ) || 0;


    if (
        Math.abs(number) >=
        1000000000
    ) {

        return (
            "Rp" +
            (
                number /
                1000000000
            ).toFixed(1) +
            " M"
        );

    }


    if (
        Math.abs(number) >=
        1000000
    ) {

        return (
            "Rp" +
            (
                number /
                1000000
            ).toFixed(1) +
            " Jt"
        );

    }


    if (
        Math.abs(number) >=
        1000
    ) {

        return (
            "Rp" +
            (
                number /
                1000
            ).toFixed(0) +
            " Rb"
        );

    }


    return (
        "Rp" +
        number
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.className =
        "toast show " +
        type;


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(
    value
) {

    const number =
        Number(
            value
        ) || 0;


    return new Intl.NumberFormat(
        "id-ID",
        {
            style:
                "currency",

            currency:
                "IDR",

            maximumFractionDigits:
                0
        }
    ).format(
        number
    );

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        "id-ID"
    ).format(
        Number(
            value
        ) || 0
    );

}


/* =========================================================
   GET INITIALS
========================================================= */

function getInitials(
    value
) {

    const text =
        String(
            value || "User"
        )
        .trim();


    if (!text) {
        return "U";
    }


    const parts =
        text
            .split(/\s+/)
            .filter(
                function (part) {

                    return part.length > 0;

                }
            );


    if (parts.length === 1) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.editProduct =
    editProduct;


window.deleteProduct =
    deleteProduct;


window.openProductModal =
    openProductModal;


window.closeProductModal =
    closeProductModal;


window.openProfileModal =
    openProfileModal;


window.closeProfileModal =
    closeProfileModal;


window.openPurchaseModal =
    openPurchaseModal;


window.closePurchaseModal =
    closePurchaseModal;


window.viewPurchase =
    viewPurchase;
    

window.openSupplierModal =
    openSupplierModal;


window.closeSupplierModal =
    closeSupplierModal;


/* =========================================================
   SALES MODULE
   TERHUBUNG LANGSUNG DENGAN MASTER PRODUK
========================================================= */

let saleItems = [];


/* =========================================================
   LOAD CUSTOMER
========================================================= */

async function loadSaleCustomers() {

    const customerSelect =
        document.getElementById("saleCustomer");

    if (!customerSelect) {
        return;
    }

    customerSelect.innerHTML =
        `<option value="">Memuat pelanggan...</option>`;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("customers")
            .select("*")
            .order("name", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        customerSelect.innerHTML =
            `<option value="">Pilih pelanggan</option>`;

        (data || []).forEach(
            function (customer) {

                const option =
                    document.createElement("option");

                option.value =
                    customer.id;

                option.textContent =
                    customer.name;

                customerSelect.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Gagal memuat pelanggan:",
            error
        );

        customerSelect.innerHTML =
            `<option value="">
                Gagal memuat pelanggan
            </option>`;

    }

}


/* =========================================================
   SETUP AUTOCOMPLETE PRODUK SALES
   MENGIKUTI POLA AUTOCOMPLETE PEMBELIAN
========================================================= */

function setupSaleProductSearch() {

    const saleProductSearch =
        document.getElementById(
            "saleProductSearch"
        );


    if (!saleProductSearch) {
        return;
    }


    /* =====================================================
       CEGAH EVENT LISTENER TERPASANG BERULANG
    ===================================================== */

    if (
        saleProductSearch.dataset.salesSearchReady ===
        "true"
    ) {
        return;
    }


    saleProductSearch.dataset.salesSearchReady =
        "true";


    /* =====================================================
       SAAT MENGETIK
    ===================================================== */

    saleProductSearch.addEventListener(
        "input",
        function () {

            searchSaleProducts(
                saleProductSearch.value
            );

        }
    );


    /* =====================================================
       SAAT INPUT MENDAPAT FOCUS
    ===================================================== */

    saleProductSearch.addEventListener(
        "focus",
        function () {

            searchSaleProducts(
                saleProductSearch.value
            );

        }
    );

}


/* =========================================================
   SEARCH SALE PRODUCTS
========================================================= */

function searchSaleProducts(keyword) {

    const suggestions =
        document.getElementById(
            "saleProductSuggestions"
        );


    if (!suggestions) {
        return;
    }


    keyword =
        String(
            keyword || ""
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       JIKA KOLOM KOSONG
    ===================================================== */

    if (!keyword) {

        suggestions.innerHTML = "";

        suggestions.classList.remove(
            "show"
        );

        return;
    }


    /* =====================================================
       FILTER PRODUK AKTIF
    ===================================================== */

    const activeProducts =
        products.filter(
            function (product) {

                return (
                    product.is_active !== false
                );

            }
        );


    /* =====================================================
       CARI BERDASARKAN NAMA / SKU
    ===================================================== */

    const filteredProducts =
        activeProducts.filter(
            function (product) {

                const name =
                    String(
                        product.name || ""
                    )
                    .toLowerCase();


                const sku =
                    String(
                        product.sku || ""
                    )
                    .toLowerCase();


                return (
                    name.includes(keyword) ||
                    sku.includes(keyword)
                );

            }
        );


    /* =====================================================
       JIKA TIDAK ADA HASIL
    ===================================================== */

    if (
        filteredProducts.length === 0
    ) {

        suggestions.innerHTML = `
            <div class="product-suggestion-empty">
                Produk tidak ditemukan.
            </div>
        `;


        suggestions.classList.add(
            "show"
        );


        return;
    }


    /* =====================================================
       TAMPILKAN MAKSIMAL 10 PRODUK
    ===================================================== */

    const displayedProducts =
        filteredProducts.slice(
            0,
            10
        );


    suggestions.innerHTML =
        displayedProducts.map(
            function (product) {

                return `
                    <div
                        class="product-suggestion-item"
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                    >

                        <div class="product-suggestion-name">
                            ${escapeHtml(
                                product.name || "-"
                            )}
                        </div>

                        <div class="product-suggestion-code">
                            SKU:
                            ${escapeHtml(
                                product.sku || "-"
                            )}
                        </div>

                        <div class="product-suggestion-stock">
                            Stok:
                            ${formatNumber(
                                Number(
                                    product.current_stock || 0
                                )
                            )}
                            ${escapeHtml(
                                product.unit || ""
                            )}
                        </div>

                    </div>
                `;

            }
        )
        .join("");


    suggestions.classList.add(
        "show"
    );


    /* =====================================================
       KLIK PRODUK
    ===================================================== */

    suggestions
        .querySelectorAll(
            ".product-suggestion-item"
        )
        .forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        selectSaleProduct(
                            item.dataset.productId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   PILIH PRODUK
========================================================= */

function selectSaleProduct(productId) {

    /*
       CARI LANGSUNG DI ARRAY MASTER PRODUK
    */

    const product =
        products.find(
            function (item) {

                return String(item.id) ===
                    String(productId);

            }
        );


    if (!product) {

        console.warn(
            "Produk tidak ditemukan:",
            productId
        );

        return;

    }


    const searchInput =
        document.getElementById(
            "saleProductSearch"
        );

    const hiddenInput =
        document.getElementById(
            "saleProduct"
        );

    const suggestionsBox =
        document.getElementById(
            "saleProductSuggestions"
        );

    const info =
        document.getElementById(
            "selectedSaleProductInfo"
        );

    const priceInput =
        document.getElementById(
            "saleSellingPrice"
        );


    /* NAMA PRODUK */

    if (searchInput) {

        searchInput.value =
            product.name || "";

    }


    /* ID PRODUK */

    if (hiddenInput) {

        hiddenInput.value =
            product.id;

    }


    /* HARGA JUAL DARI MASTER PRODUK */

    if (priceInput) {

        priceInput.value =
            Number(
                product.selling_price || 0
            );

    }


    /* INFORMASI STOK */

    if (info) {

        info.textContent =
            "Stok tersedia: " +
            formatNumber(
                product.current_stock || 0
            ) +
            " " +
            (
                product.unit ||
                "unit"
            );

    }


    if (suggestionsBox) {

        suggestionsBox.innerHTML =
            "";

    }


    calculateSaleSubtotal();

}


/* =========================================================
   SUBTOTAL ITEM
========================================================= */

function calculateSaleSubtotal() {

    const quantityInput =
        document.getElementById(
            "saleQuantity"
        );

    const priceInput =
        document.getElementById(
            "saleSellingPrice"
        );

    const subtotalElement =
        document.getElementById(
            "saleSubtotal"
        );


    if (
        !quantityInput ||
        !priceInput ||
        !subtotalElement
    ) {

        return;

    }


    const quantity =
        Number(
            quantityInput.value || 0
        );


    const price =
        Number(
            priceInput.value || 0
        );


    const subtotal =
        quantity *
        price;


    subtotalElement.textContent =
        formatRupiah(
            subtotal
        );

}


/* =========================================================
   TAMBAH ITEM PENJUALAN
========================================================= */

function addSaleItem() {

    const productInput =
        document.getElementById(
            "saleProduct"
        );

    const quantityInput =
        document.getElementById(
            "saleQuantity"
        );

    const priceInput =
        document.getElementById(
            "saleSellingPrice"
        );


    if (
        !productInput ||
        !quantityInput ||
        !priceInput
    ) {

        return;

    }


    const productId =
        productInput.value;


    const quantity =
        Number(
            quantityInput.value || 0
        );


    const sellingPrice =
        Number(
            priceInput.value || 0
        );


    /* =====================================================
       VALIDASI PRODUK
    ===================================================== */

    if (!productId) {

        showToast(
            "Silakan pilih produk terlebih dahulu.",
            "error"
        );

        return;

    }


    /* =====================================================
       VALIDASI JUMLAH
    ===================================================== */

    if (
        !quantity ||
        quantity <= 0
    ) {

        showToast(
            "Jumlah penjualan harus lebih dari 0.",
            "error"
        );

        return;

    }


    /* =====================================================
       VALIDASI HARGA
    ===================================================== */

    if (
        sellingPrice < 0
    ) {

        showToast(
            "Harga jual tidak valid.",
            "error"
        );

        return;

    }


    /*
       CARI PRODUK DARI MASTER PRODUK
    */

    const product =
        products.find(
            function (item) {

                return String(item.id) ===
                    String(productId);

            }
        );


    if (!product) {

        showToast(
            "Produk tidak ditemukan.",
            "error"
        );

        return;

    }


    /* =====================================================
       CEK STOK
    ===================================================== */

    const currentStock =
        Number(
            product.current_stock || 0
        );


    const existingQuantity =
        saleItems
            .filter(
                function (item) {

                    return String(
                        item.product_id
                    ) ===
                    String(productId);

                }
            )
            .reduce(
                function (
                    total,
                    item
                ) {

                    return (
                        total +
                        Number(
                            item.quantity || 0
                        )
                    );

                },
                0
            );


    if (
        existingQuantity +
        quantity >
        currentStock
    ) {

        showToast(
            "Stok tidak mencukupi. Stok tersedia: " +
            formatNumber(
                currentStock
            ) +
            " " +
            (
                product.unit ||
                "unit"
            ),
            "error"
        );

        return;

    }


    /* =====================================================
       CEGAH PRODUK DUPLIKAT
    ===================================================== */

    const existingIndex =
        saleItems.findIndex(
            function (item) {

                return String(
                    item.product_id
                ) ===
                String(productId);

            }
        );


    if (
        existingIndex !== -1
    ) {

        saleItems[
            existingIndex
        ].quantity +=
            quantity;


        saleItems[
            existingIndex
        ].selling_price =
            sellingPrice;


        saleItems[
            existingIndex
        ].subtotal =
            saleItems[
                existingIndex
            ].quantity *
            sellingPrice;

    } else {

        saleItems.push({

            product_id:
                product.id,

            product_name:
                product.name,

            quantity:
                quantity,

            selling_price:
                sellingPrice,

            subtotal:
                quantity *
                sellingPrice

        });

    }


    renderSaleItems();

    resetSaleItemInput();

}


/* =========================================================
   RENDER DAFTAR ITEM
========================================================= */

function renderSaleItems() {

    const tableBody =
        document.getElementById(
            "saleItemTableBody"
        );


    if (!tableBody) {

        return;

    }


    if (
        saleItems.length === 0
    ) {

        tableBody.innerHTML =
            `
            <tr>
                <td
                    colspan="6"
                    class="empty-table-message"
                >
                    Belum ada barang
                    yang ditambahkan.
                </td>
            </tr>
            `;

        calculateSaleTotal();

        return;

    }


    tableBody.innerHTML =
        saleItems
            .map(
                function (
                    item,
                    index
                ) {

                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        item.product_name
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${formatNumber(
                                    item.quantity
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    item.selling_price
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    item.subtotal
                                )}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="table-action"
                                    onclick="removeSaleItem(${index})"
                                >
                                    Hapus
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");


    calculateSaleTotal();

}


/* =========================================================
   HAPUS ITEM
========================================================= */

function removeSaleItem(index) {

    if (
        index < 0 ||
        index >= saleItems.length
    ) {

        return;

    }


    saleItems.splice(
        index,
        1
    );


    renderSaleItems();

}


/* =========================================================
   RESET INPUT DETAIL BARANG
========================================================= */

function resetSaleItemInput() {

    const searchInput =
        document.getElementById(
            "saleProductSearch"
        );

    const hiddenInput =
        document.getElementById(
            "saleProduct"
        );

    const quantityInput =
        document.getElementById(
            "saleQuantity"
        );

    const priceInput =
        document.getElementById(
            "saleSellingPrice"
        );

    const info =
        document.getElementById(
            "selectedSaleProductInfo"
        );

    const subtotal =
        document.getElementById(
            "saleSubtotal"
        );

    const suggestions =
        document.getElementById(
            "saleProductSuggestions"
        );


    if (searchInput) {

        searchInput.value = "";

    }


    if (hiddenInput) {

        hiddenInput.value = "";

    }


    if (quantityInput) {

        quantityInput.value = "";

    }


    if (priceInput) {

        priceInput.value = "";

    }


    if (info) {

        info.textContent =
            "Belum ada produk dipilih.";

    }


    if (subtotal) {

        subtotal.textContent =
            formatRupiah(0);

    }


    if (suggestions) {

        suggestions.innerHTML = "";

    }

}


/* =========================================================
   TOTAL PENJUALAN
========================================================= */

function calculateSaleTotal() {

    const totalElement =
        document.getElementById(
            "saleTotal"
        );


    if (!totalElement) {

        return;

    }


    const total =
        saleItems.reduce(
            function (
                sum,
                item
            ) {

                return (
                    sum +
                    Number(
                        item.subtotal || 0
                    )
                );

            },
            0
        );


    totalElement.textContent =
        formatRupiah(
            total
        );

}


/* =========================================================
   RESET FORM PENJUALAN
========================================================= */

function resetSaleForm() {

    const form =
        document.getElementById(
            "salesForm"
        );


    if (form) {

        form.reset();

    }


    saleItems = [];


    const saleDate =
        document.getElementById(
            "saleDate"
        );


    if (saleDate) {

        saleDate.value =
            getTodayDate();

    }


    const saleNumber =
        document.getElementById(
            "saleNumber"
        );


    if (saleNumber) {

        saleNumber.value =
            "";

    }


    resetSaleItemInput();

    renderSaleItems();

}


/* =========================================================
   SAVE SALES - TERINTEGRASI FIFO
   SIMPAN PENJUALAN + HITUNG HPP + KURANGI STOK
   + METODE PEMBAYARAN TUNAI / KREDIT
   + JURNAL OTOMATIS
========================================================= */

async function saveSale(event) {

    if (event) {
        event.preventDefault();
    }


    const saveButton =
        document.getElementById("saveSaleButton");

    const saleNumberInput =
        document.getElementById("saleNumber");

    const saleDateInput =
        document.getElementById("saleDate");

    const customerInput =
        document.getElementById("saleCustomer");

    const paymentMethodInput =
        document.getElementById("salePaymentMethod");


    /* =====================================================
       AMBIL DATA HEADER
    ===================================================== */

    const saleDate =
        saleDateInput
            ? saleDateInput.value
            : "";

    const customerId =
        customerInput
            ? customerInput.value
            : "";

    const paymentMethod =
        paymentMethodInput
            ? paymentMethodInput.value
            : "cash";


    /* =====================================================
       VALIDASI HEADER
    ===================================================== */

    if (!saleDate) {

        showToast(
            "Tanggal penjualan wajib diisi.",
            "error"
        );

        return;
    }


    if (!customerId) {

        showToast(
            "Pelanggan wajib dipilih.",
            "error"
        );

        return;
    }


    if (
        paymentMethod !== "cash" &&
        paymentMethod !== "credit"
    ) {

        showToast(
            "Pilih metode pembayaran yang valid.",
            "error"
        );

        return;
    }


    if (
        !saleItems ||
        saleItems.length === 0
    ) {

        showToast(
            "Tambahkan minimal satu barang.",
            "error"
        );

        return;
    }


    /* =====================================================
       VALIDASI PRODUK DAN STOK
    ===================================================== */

    for (
        const item
        of saleItems
    ) {

        const product =
            products.find(
                function (product) {

                    return (
                        String(product.id) ===
                        String(item.product_id)
                    );

                }
            );


        if (!product) {

            showToast(
                "Produk tidak ditemukan.",
                "error"
            );

            return;
        }


        const quantity =
            Number(
                item.quantity || 0
            );


        const currentStock =
            Number(
                product.current_stock || 0
            );


        if (quantity <= 0) {

            showToast(
                "Jumlah penjualan harus lebih dari 0.",
                "error"
            );

            return;
        }


        if (
            quantity >
            currentStock
        ) {

            showToast(
                "Stok " +
                product.name +
                " tidak mencukupi.",
                "error"
            );

            return;
        }

    }


    /* =====================================================
       DISABLE BUTTON
    ===================================================== */

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Menyimpan...";

    }


    /* =====================================================
       DATA UNTUK ROLLBACK
    ===================================================== */

    let saleId = null;

    let journalEntryId = null;

    const insertedSaleItemIds = [];

    const changedLayers = [];

    const changedProducts = [];

    const insertedMovementIds = [];


    try {

        /* =================================================
           GENERATE NOMOR PENJUALAN
        ================================================= */

        let saleNumber = "";

        saleNumber =
            await generateSaleNumber();


        if (saleNumberInput) {

            saleNumberInput.value =
                saleNumber;

        }


        /* =================================================
           HITUNG TOTAL PENJUALAN
        ================================================= */

        const totalAmount =
            saleItems.reduce(
                function (
                    total,
                    item
                ) {

                    return (
                        total +
                        (
                            Number(
                                item.quantity || 0
                            ) *
                            Number(
                                item.selling_price || 0
                            )
                        )
                    );

                },
                0
            );


        /* =================================================
           SIMPAN HEADER SALES
        ================================================= */

        const {
            data: sale,
            error: saleError
        } = await supabaseClient

            .from("sales")

            .insert({

                sale_number:
                    saleNumber,

                sale_date:
                    saleDate,

                customer_id:
                    customerId,

                total_amount:
                    totalAmount,

                total_cogs:
                    0,

                status:
                    "posted",

                payment_method:
                    paymentMethod,

                notes:
                    null

            })

            .select()

            .single();


        if (saleError) {

            throw saleError;

        }


        saleId =
            sale.id;


        /* =================================================
           SIMPAN SALE ITEMS
        ================================================= */

        const saleItemsData =
            saleItems.map(
                function (item) {

                    return {

                        sale_id:
                            sale.id,

                        product_id:
                            item.product_id,

                        quantity:
                            Number(
                                item.quantity
                            ),

                        selling_price:
                            Number(
                                item.selling_price
                            ),

                        cogs:
                            0

                    };

                }
            );


        const {
            data: insertedSaleItems,
            error: itemsError
        } = await supabaseClient

            .from("sale_items")

            .insert(
                saleItemsData
            )

            .select();


        if (itemsError) {

            throw itemsError;

        }


        if (
            !insertedSaleItems ||
            insertedSaleItems.length !== saleItems.length
        ) {

            throw new Error(
                "Detail penjualan gagal dibuat dengan lengkap."
            );

        }


        insertedSaleItems.forEach(
            function (item) {

                insertedSaleItemIds.push(
                    item.id
                );

            }
        );


        /* =================================================
           PROSES FIFO UNTUK SETIAP ITEM
        ================================================= */

        let totalCOGS = 0;


        for (
            let i = 0;
            i < saleItems.length;
            i++
        ) {

            const originalItem =
                saleItems[i];

            const savedSaleItem =
                insertedSaleItems[i];


            const product =
                products.find(
                    function (product) {

                        return (
                            String(product.id) ===
                            String(originalItem.product_id)
                        );

                    }
                );


            if (!product) {

                throw new Error(
                    "Produk tidak ditemukan saat proses FIFO."
                );

            }


            const quantity =
                Number(
                    originalItem.quantity || 0
                );


            /* =============================================
               HITUNG FIFO
            ============================================= */

            const fifoResult =
                await calculateFIFO(
                    originalItem.product_id,
                    quantity,
                    sale.id,
                    savedSaleItem.id
                );


            if (
                !fifoResult ||
                !fifoResult.details ||
                fifoResult.details.length === 0
            ) {

                throw new Error(
                    "FIFO tidak menghasilkan detail untuk produk " +
                    product.name +
                    "."
                );

            }


            const itemCOGS =
                Number(
                    fifoResult.total_cogs || 0
                );


            totalCOGS +=
                itemCOGS;


            /* =============================================
               SIMPAN DETAIL FIFO
            ============================================= */

            for (
                const detail
                of fifoResult.details
            ) {

                const layerId =
                    detail.inventory_layer_id;

                const quantityTaken =
                    Number(
                        detail.quantity_taken || 0
                    );

                const unitCost =
                    Number(
                        detail.unit_cost || 0
                    );


                /* =========================================
                   AMBIL LAYER TERKINI
                ========================================== */

                const {
                    data: currentLayer,
                    error: currentLayerError
                } = await supabaseClient

                    .from("inventory_layers")

                    .select(
                        "id, quantity_remaining"
                    )

                    .eq(
                        "id",
                        layerId
                    )

                    .single();


                if (currentLayerError) {

                    throw currentLayerError;

                }


                const oldRemaining =
                    Number(
                        currentLayer.quantity_remaining || 0
                    );


                if (
                    quantityTaken >
                    oldRemaining
                ) {

                    throw new Error(
                        "Stok pada FIFO layer tidak mencukupi."
                    );

                }


                const newRemaining =
                    oldRemaining -
                    quantityTaken;


                /* =========================================
                   UPDATE FIFO LAYER
                ========================================== */

                const {
                    error: layerUpdateError
                } = await supabaseClient

                    .from("inventory_layers")

                    .update({

                        quantity_remaining:
                            newRemaining

                    })

                    .eq(
                        "id",
                        layerId
                    );


                if (layerUpdateError) {

                    throw layerUpdateError;

                }


                changedLayers.push({

                    id:
                        layerId,

                    oldRemaining:
                        oldRemaining

                });


                /* =========================================
                   SIMPAN SALE FIFO DETAIL
                ========================================== */

                const {
                    error: fifoDetailError
                } = await supabaseClient

                    .from("sale_fifo_details")

                    .insert({

                        sale_id:
                            sale.id,

                        sale_item_id:
                            savedSaleItem.id,

                        inventory_layer_id:
                            layerId,

                        quantity_taken:
                            quantityTaken,

                        unit_cost:
                            unitCost

                    });


                if (fifoDetailError) {

                    throw fifoDetailError;

                }

            }


            /* =============================================
               UPDATE COGS SALE ITEM
            ============================================= */

            const {
                error: saleItemCOGSError
            } = await supabaseClient

                .from("sale_items")

                .update({

                    cogs:
                        itemCOGS

                })

                .eq(
                    "id",
                    savedSaleItem.id
                );


            if (saleItemCOGSError) {

                throw saleItemCOGSError;

            }


            /* =============================================
               KURANGI STOK PRODUK
            ============================================= */

            const oldStock =
                Number(
                    product.current_stock || 0
                );


            const newStock =
                oldStock -
                quantity;


            if (newStock < 0) {

                throw new Error(
                    "Stok produk menjadi negatif."
                );

            }


            const {
                error: productUpdateError
            } = await supabaseClient

                .from("products")

                .update({

                    current_stock:
                        newStock

                })

                .eq(
                    "id",
                    product.id
                );


            if (productUpdateError) {

                throw productUpdateError;

            }


            changedProducts.push({

                id:
                    product.id,

                oldStock:
                    oldStock

            });


            /* =============================================
               INVENTORY MOVEMENT
            ============================================= */

            const averageCost =
                quantity > 0
                    ? itemCOGS / quantity
                    : 0;


            const {
                data: movementData,
                error: movementError
            } = await supabaseClient

                .from("inventory_movements")

                .insert({

                    product_id:
                        product.id,

                    movement_date:
                        saleDate,

                    movement_type:
                        "sale",

                    reference_id:
                        sale.id,

                    quantity_in:
                        0,

                    quantity_out:
                        quantity,

                    balance_quantity:
                        newStock,

                    unit_cost:
                        averageCost,

                    notes:
                        "Penjualan " +
                        saleNumber

                })

                .select("id")

                .single();


            if (movementError) {

                throw movementError;

            }


            if (movementData) {

                insertedMovementIds.push(
                    movementData.id
                );

            }

        }


        /* =================================================
           UPDATE TOTAL COGS SALES
        ================================================= */

        const {
            error: totalCOGSError
        } = await supabaseClient

            .from("sales")

            .update({

                total_cogs:
                    totalCOGS

            })

            .eq(
                "id",
                sale.id
            );


        if (totalCOGSError) {

            throw totalCOGSError;

        }


        /* =================================================
           BUAT JURNAL PENJUALAN OTOMATIS
        ================================================= */

        journalEntryId =
            await createSaleJournal(
                sale,
                paymentMethod,
                totalAmount,
                totalCOGS
            );


        /* =================================================
           BERHASIL
        ================================================= */

        showToast(
            "Penjualan " +
            saleNumber +
            " berhasil disimpan. HPP: " +
            formatRupiah(totalCOGS) +
            ". Jurnal otomatis dibuat.",
            "success"
        );


        console.log(
            "Penjualan berhasil disimpan:",
            sale
        );


        console.log(
            "Metode pembayaran:",
            paymentMethod
        );


        console.log(
            "Total HPP:",
            totalCOGS
        );


        console.log(
            "Jurnal ID:",
            journalEntryId
        );


        console.log(
            "Detail FIFO:",
            changedLayers
        );


        /* =================================================
           RESET FORM
        ================================================= */

        resetSaleForm();


        /* =================================================
           REFRESH DATA
        ================================================= */

        await loadProducts();

        await loadSales();


    } catch (error) {

        console.error(
            "Gagal menyimpan penjualan:",
            error
        );


        /* =================================================
           ROLLBACK JURNAL
        ================================================= */

        if (journalEntryId) {

            try {

                await supabaseClient

                    .from("journal_details")

                    .delete()

                    .eq(
                        "journal_entry_id",
                        journalEntryId
                    );


                await supabaseClient

                    .from("journal_entries")

                    .delete()

                    .eq(
                        "id",
                        journalEntryId
                    );

            } catch (rollbackError) {

                console.error(
                    "Gagal rollback jurnal:",
                    rollbackError
                );

            }

        }


        /* =================================================
           ROLLBACK FIFO LAYERS
        ================================================= */

        for (
            const layer
            of changedLayers
        ) {

            try {

                await supabaseClient

                    .from("inventory_layers")

                    .update({

                        quantity_remaining:
                            layer.oldRemaining

                    })

                    .eq(
                        "id",
                        layer.id
                    );

            } catch (rollbackError) {

                console.error(
                    "Gagal rollback FIFO layer:",
                    rollbackError
                );

            }

        }


        /* =================================================
           ROLLBACK PRODUCT STOCK
        ================================================= */

        for (
            const product
            of changedProducts
        ) {

            try {

                await supabaseClient

                    .from("products")

                    .update({

                        current_stock:
                            product.oldStock

                    })

                    .eq(
                        "id",
                        product.id
                    );

            } catch (rollbackError) {

                console.error(
                    "Gagal rollback stok produk:",
                    rollbackError
                );

            }

        }


        /* =================================================
           HAPUS INVENTORY MOVEMENTS
        ================================================= */

        if (
            insertedMovementIds.length > 0
        ) {

            try {

                await supabaseClient

                    .from("inventory_movements")

                    .delete()

                    .in(
                        "id",
                        insertedMovementIds
                    );

            } catch (rollbackError) {

                console.error(
                    "Gagal rollback inventory movement:",
                    rollbackError
                );

            }

        }


        /* =================================================
           HAPUS SALES
           SALE ITEMS DAN FIFO DETAILS
           AKAN IKUT TERHAPUS KARENA CASCADE
        ================================================= */

        if (saleId) {

            try {

                await supabaseClient

                    .from("sales")

                    .delete()

                    .eq(
                        "id",
                        saleId
                    );

            } catch (rollbackError) {

                console.error(
                    "Gagal rollback transaksi penjualan:",
                    rollbackError
                );

            }

        }


        showToast(
            "Penjualan gagal disimpan: " +
            (
                error.message ||
                "Terjadi kesalahan."
            ),
            "error"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Simpan Penjualan";

        }

    }

}


/* =========================================================
   FIFO ENGINE
   MENGHITUNG HPP BERDASARKAN INVENTORY LAYER
========================================================= */

async function calculateFIFO(
    productId,
    quantityNeeded,
    saleId,
    saleItemId
) {

    const quantityToSell =
        Number(quantityNeeded || 0);


    if (
        !productId ||
        quantityToSell <= 0
    ) {

        throw new Error(
            "Data FIFO tidak valid."
        );

    }


    /* =====================================================
       AMBIL FIFO LAYER
       YANG MASIH MEMILIKI STOK
    ===================================================== */

    const {
        data: layers,
        error: layerError
    } = await supabaseClient

        .from("inventory_layers")

        .select(`
            id,
            product_id,
            purchase_id,
            purchase_item_id,
            layer_date,
            quantity_in,
            quantity_remaining,
            unit_cost
        `)

        .eq(
            "product_id",
            productId
        )

        .gt(
            "quantity_remaining",
            0
        )

        .order(
            "layer_date",
            {
                ascending: true
            }
        );


    if (layerError) {

        throw layerError;

    }


    if (
        !layers ||
        layers.length === 0
    ) {

        throw new Error(
            "Tidak ada FIFO layer yang tersedia untuk produk ini."
        );

    }


    /* =====================================================
       CEK TOTAL STOK FIFO
    ===================================================== */

    const totalAvailable =
        layers.reduce(
            function (
                total,
                layer
            ) {

                return (
                    total +
                    Number(
                        layer.quantity_remaining || 0
                    )
                );

            },
            0
        );


    if (
        totalAvailable <
        quantityToSell
    ) {

        throw new Error(
            "Stok FIFO tidak mencukupi. " +
            "Tersedia " +
            formatNumber(totalAvailable) +
            ", dibutuhkan " +
            formatNumber(quantityToSell) +
            "."
        );

    }


    /* =====================================================
       PROSES FIFO
    ===================================================== */

    let remainingToSell =
        quantityToSell;


    let totalCOGS = 0;


    const fifoDetails = [];


    for (
        const layer
        of layers
    ) {

        if (
            remainingToSell <= 0
        ) {

            break;

        }


        const layerRemaining =
            Number(
                layer.quantity_remaining || 0
            );


        const unitCost =
            Number(
                layer.unit_cost || 0
            );


        if (
            layerRemaining <= 0
        ) {

            continue;

        }


        const quantityTaken =
            Math.min(
                remainingToSell,
                layerRemaining
            );


        const layerCOGS =
            quantityTaken *
            unitCost;


        totalCOGS +=
            layerCOGS;


        remainingToSell -=
            quantityTaken;


        fifoDetails.push({

            inventory_layer_id:
                layer.id,

            quantity_taken:
                quantityTaken,

            unit_cost:
                unitCost,

            total_cost:
                layerCOGS

        });

    }


    /* =====================================================
       HASIL FIFO
    ===================================================== */

    return {

        quantity:
            quantityToSell,

        total_cogs:
            totalCOGS,

        details:
            fifoDetails

    };

}


/* =========================================================
   GENERATE SALE NUMBER
========================================================= */

async function generateSaleNumber() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("sales")
            .select("sale_number");

        if (error) {
            throw error;
        }


        let highestNumber =
            0;


        (data || []).forEach(
            function (sale) {

                const code =
                    String(
                        sale.sale_number || ""
                    )
                    .trim()
                    .toUpperCase();


                const match =
                    code.match(
                        /^PJ-(\d+)$/
                    );


                if (match) {

                    const number =
                        Number(
                            match[1]
                        );


                    if (
                        Number.isFinite(number) &&
                        number > highestNumber
                    ) {

                        highestNumber =
                            number;

                    }

                }

            }
        );


        return (
            "PJ-" +
            String(
                highestNumber + 1
            ).padStart(
                4,
                "0"
            )
        );


    } catch (error) {

        console.error(
            "Gagal membuat nomor penjualan:",
            error
        );


        return (
            "PJ-" +
            Date.now()
        );

    }

}


/* =========================================================
   LOAD SALES HISTORY
========================================================= */

async function loadSales() {

    const tableBody =
        document.getElementById(
            "saleTableBody"
        );

    if (!tableBody) {
        return;
    }


    /* =====================================================
       TAMPILKAN LOADING
    ===================================================== */

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="table-loading">
                Memuat riwayat penjualan...
            </td>
        </tr>
    `;


    try {

        /* =================================================
           AMBIL DATA SALES
        ================================================= */

        const {
            data,
            error
        } = await supabaseClient
            .from("sales")
            .select(`
                id,
                sale_number,
                sale_date,
                customer_id,
                total_amount,
                total_cogs,
                status,
                customers (
                    id,
                    name
                )
            `)
            .order(
                "sale_date",
                {
                    ascending: false
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        /* =================================================
           JIKA BELUM ADA DATA
        ================================================= */

        if (
            !data ||
            data.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <strong>
                                Belum ada transaksi penjualan
                            </strong>

                            <span>
                                Tambahkan transaksi penjualan
                                untuk melihat riwayatnya.
                            </span>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        /* =================================================
           RENDER DATA
        ================================================= */

        tableBody.innerHTML =
            data.map(
                function (sale) {

                    const customerName =
                        sale.customers
                            ? sale.customers.name
                            : "-";


                    let statusClass =
                        "purchase-status";


                    if (
                        sale.status ===
                        "posted"
                    ) {

                        statusClass +=
                            " posted";

                    } else if (
                        sale.status ===
                        "cancelled"
                    ) {

                        statusClass +=
                            " cancelled";

                    } else {

                        statusClass +=
                            " draft";

                    }


                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        sale.sale_number || "-"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${formatDate(
                                    sale.sale_date
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    customerName
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    sale.total_amount
                                )}
                            </td>

                            <td>
                                ${formatRupiah(
                                    sale.total_cogs
                                )}
                            </td>

                            <td>
                                <span class="${statusClass}">
                                    ${escapeHtml(
                                        formatSaleStatus(
                                            sale.status
                                        )
                                    )}
                                </span>
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="table-action"
                                    onclick="viewSale('${sale.id}')"
                                >
                                    Detail
                                </button>
                            </td>

                        </tr>
                    `;

                }
            ).join("");


        console.log(
            "Riwayat penjualan berhasil dimuat:",
            data
        );


    } catch (error) {

        console.error(
            "Gagal memuat riwayat penjualan:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <strong>
                            Riwayat penjualan gagal dimuat
                        </strong>

                        <span>
                            ${escapeHtml(
                                error.message ||
                                "Terjadi kesalahan."
                            )}
                        </span>
                    </div>
                </td>
            </tr>
        `;
    }

}


/* =========================================================
   FORMAT SALES STATUS
========================================================= */

function formatSaleStatus(status) {

    if (status === "posted") {
        return "Posted";
    }

    if (status === "cancelled") {
        return "Dibatalkan";
    }

    if (status === "draft") {
        return "Draft";
    }

    return status || "-";
}


/* =========================================================
   INISIALISASI SALES
========================================================= */

async function initializeSalesModule() {

    console.log(
        "Menyiapkan modul Penjualan..."
    );


    /* =====================================================
       LOAD CUSTOMER
    ===================================================== */

    await loadSaleCustomers();


    /* =====================================================
       SETUP PRODUCT SEARCH
    ===================================================== */

    setupSaleProductSearch();


    /* =====================================================
       RENDER ITEM PENJUALAN
    ===================================================== */

    renderSaleItems();


    /* =====================================================
       LOAD RIWAYAT PENJUALAN
    ===================================================== */

    await loadSales();


    /* =====================================================
       QUICK ADD CUSTOMER
    ===================================================== */

    const addCustomerFromSalesButton =
        document.getElementById(
            "addCustomerFromSalesButton"
        );


    if (
        addCustomerFromSalesButton &&
        !addCustomerFromSalesButton.dataset.initialized
    ) {

        addCustomerFromSalesButton.addEventListener(
            "click",
            function () {

                console.log(
                    "TOMBOL + PELANGGAN BARU DIKLIK"
                );


                /*
                 * Gunakan tombol Tambah Pelanggan
                 * dari Master Customer untuk membuka
                 * modal customer yang sama.
                 */

                const masterCustomerButton =
                    document.getElementById(
                        "addCustomerButton"
                    );


                if (masterCustomerButton) {

                    masterCustomerButton.click();

                } else {

                    console.error(
                        "Tombol addCustomerButton tidak ditemukan."
                    );

                }

            }
        );


        addCustomerFromSalesButton.dataset.initialized =
            "true";

    }


    /* =====================================================
       FORM PENJUALAN
    ===================================================== */

    const salesForm =
        document.getElementById(
            "salesForm"
        );


    if (
        salesForm &&
        !salesForm.dataset.submitInitialized
    ) {

        salesForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await saveSale(event);

            }
        );


        salesForm.dataset.submitInitialized =
            "true";

    }


    console.log(
        "Modul Penjualan siap."
    );

}


/* =========================================================
   EVENT LISTENER SALES
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =================================================
           TOMBOL TAMBAH ITEM
        ================================================= */

        const addSaleItemButton =
            document.getElementById(
                "addSaleItemButton"
            );


        if (addSaleItemButton) {

            addSaleItemButton.addEventListener(
                "click",
                addSaleItem
            );

        }


        /* =================================================
           TOMBOL RESET
        ================================================= */

        const resetSaleButton =
            document.getElementById(
                "resetSaleButton"
            );


        if (resetSaleButton) {

            resetSaleButton.addEventListener(
                "click",
                resetSaleForm
            );

        }


        /* =================================================
           INPUT JUMLAH
        ================================================= */

        const quantityInput =
            document.getElementById(
                "saleQuantity"
            );


        if (quantityInput) {

            quantityInput.addEventListener(
                "input",
                calculateSaleSubtotal
            );

        }


        /* =================================================
           INPUT HARGA JUAL
        ================================================= */

        const priceInput =
            document.getElementById(
                "saleSellingPrice"
            );


        if (priceInput) {

            priceInput.addEventListener(
                "input",
                calculateSaleSubtotal
            );

        }


        /* =================================================
           FORM SUBMIT
        ================================================= */

        const salesForm =
            document.getElementById(
                "salesForm"
            );


        /*
           JANGAN RESET NOMOR/TANGGAL SETELAH
           INISIALISASI SEBELUMNYA.
        */

        initializeSalesModule();

    }
);


/* =========================================================
   SAAT MENU PENJUALAN DIBUKA
   REFRESH CUSTOMER + SETUP AUTOCOMPLETE
========================================================= */

document.addEventListener(
    "click",
    async function (event) {

        const navItem =
            event.target.closest(
                '.nav-item[data-page="sales"]'
            );

        if (!navItem) {
            return;
        }

        console.log(
            "Menu Penjualan dibuka."
        );


        /* ===============================================
           LOAD DATA CUSTOMER
        =============================================== */

        await loadSaleCustomers();


        /* ===============================================
           LOAD DATA PRODUK
        =============================================== */

        await loadProducts();


        /* ===============================================
           SIAPKAN AUTOCOMPLETE
        =============================================== */

        setupSaleProductSearch();


        /* ===============================================
           RENDER ITEM
        =============================================== */

        renderSaleItems();


        await loadSales();

    }
);


/* =========================================================
   OPEN CUSTOMER MODAL
========================================================= */

async function openCustomerModal() {

    const modal =
        document.getElementById(
            "customerModal"
        );

    const form =
        document.getElementById(
            "customerForm"
        );

    const title =
        document.getElementById(
            "customerModalTitle"
        );

    const codeInput =
        document.getElementById(
            "customerCode"
        );


    if (!modal || !form) {
        return;
    }


    /* =====================================================
       RESET FORM
    ===================================================== */

    form.reset();


    if (title) {
        title.textContent =
            "Tambah Pelanggan";
    }


    /* =====================================================
       BUAT KODE PELANGGAN
    ===================================================== */

    if (codeInput) {

        codeInput.value =
            "Membuat kode...";


        const generatedCode =
            await generateCustomerCode();


        console.log(
            "Kode pelanggan saat modal dibuka:",
            generatedCode
        );


        if (generatedCode) {

            codeInput.value =
                generatedCode;

        } else {

            codeInput.value =
                "";

            showToast(
                "Kode pelanggan gagal dibuat.",
                "error"
            );

            return;

        }

    }


    /* =====================================================
       TAMPILKAN MODAL
    ===================================================== */

    modal.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE CUSTOMER MODAL
========================================================= */

function closeCustomerModal() {

    const modal =
        document.getElementById(
            "customerModal"
        );

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );

}


/* =========================================================
   INITIALIZE CUSTOMER MODAL
========================================================= */

function initializeCustomerModal() {

    const openButton =
        document.getElementById(
            "addCustomerButton"
        );

    const openSalesButton =
    document.getElementById(
        "addCustomerFromSalesButton"
    );

    const closeButton =
        document.getElementById(
            "closeCustomerModalButton"
        );

    const cancelButton =
        document.getElementById(
            "cancelCustomerButton"
        );

    const customerForm =
        document.getElementById(
            "customerForm"
        );

    const modal =
        document.getElementById(
            "customerModal"
        );


    if (!modal) {
        return;
    }


    if (!document.body.dataset.customerQuickAddInitialized) {

    document.addEventListener(
        "click",
        async function (event) {

            const button =
                event.target.closest(
                    "#addCustomerFromSalesButton"
                );


            if (!button) {
                return;
            }


            console.log(
                "🔥 QUICK ADD CUSTOMER TERDETEKSI"
            );


            await openCustomerModalForAdd();

        }
    );


    document.body.dataset.customerQuickAddInitialized =
        "true";

}

    /* =====================================================
   TAMBAH PELANGGAN
===================================================== */

async function openCustomerModalForAdd() {

    editingCustomerId =
        null;


    if (customerForm) {
        customerForm.reset();
    }


    const title =
        modal.querySelector(
            ".modal-header h2"
        );


    if (title) {
        title.textContent =
            "Tambah Pelanggan";
    }


    const saveButton =
        customerForm
            ? customerForm.querySelector(
                ".btn-primary"
            )
            : null;


    if (saveButton) {
        saveButton.textContent =
            "Simpan Pelanggan";
    }


    modal.style.display =
        "flex";

    modal.style.opacity =
        "1";

    modal.style.visibility =
        "visible";

    modal.style.pointerEvents =
        "auto";

    modal.classList.add(
        "show"
    );


    const codeInput =
        document.getElementById(
            "customerCodeInput"
        );


    if (codeInput) {

        codeInput.value =
            "Membuat kode...";

    }


    try {

        const newCode =
            await generateCustomerCode();


        if (codeInput) {

            codeInput.value =
                newCode ||
                "PLG-001";

        }

    } catch (error) {

        console.error(
            "Gagal membuat kode pelanggan:",
            error
        );


        if (codeInput) {

            codeInput.value =
                "PLG-001";

        }

    }

}


/* =====================================================
   TOMBOL MASTER CUSTOMER
===================================================== */

if (openButton) {

    openButton.addEventListener(
        "click",
        openCustomerModalForAdd
    );

}


    /* =====================================================
       EDIT PELANGGAN
       EVENT DELEGATION
    ===================================================== */

    const editButtonsContainer =
        document.getElementById(
            "customerTableBody"
        );


    if (
        editButtonsContainer &&
        !editButtonsContainer.dataset.editInitialized
    ) {

        editButtonsContainer.addEventListener(
            "click",
            async function (event) {

                const editButton =
                    event.target.closest(
                        ".action-edit[data-customer-id]"
                    );


                if (!editButton) {
                    return;
                }


                const customerId =
                    editButton.dataset.customerId;


                if (!customerId) {
                    return;
                }


                await editCustomer(
                    customerId
                );

            }
        );


        editButtonsContainer.dataset.editInitialized =
            "true";

    }


    /* =====================================================
       TUTUP X
    ===================================================== */

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeCustomerModal();

            }
        );

    }


    /* =====================================================
       TUTUP BATAL
    ===================================================== */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                closeCustomerModal();

            }
        );

    }


    /* =====================================================
       TUTUP BACKGROUND
    ===================================================== */

    if (
        !modal.dataset.backgroundInitialized
    ) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeCustomerModal();

                }

            }
        );


        modal.dataset.backgroundInitialized =
            "true";

    }


    /* =====================================================
       SUBMIT
    ===================================================== */

    if (
        customerForm &&
        !customerForm.dataset.submitInitialized
    ) {

        customerForm.addEventListener(
            "submit",
            saveCustomer
        );


        customerForm.dataset.submitInitialized =
            "true";

    }

}


/* =========================================================
   EDIT CUSTOMER
========================================================= */

async function editCustomer(
    customerId
) {

    try {

        const {
            data: customer,
            error
        } = await supabaseClient

            .from("customers")

            .select(`
                id,
                customer_code,
                name,
                phone,
                email,
                address
            `)

            .eq(
                "id",
                customerId
            )

            .single();


        if (error) {
            throw error;
        }


        if (!customer) {

            showToast(
                "Data pelanggan tidak ditemukan.",
                "error"
            );

            return;

        }


        editingCustomerId =
            customer.id;


        const modal =
            document.getElementById(
                "customerModal"
            );


        const codeInput =
            document.getElementById(
                "customerCodeInput"
            );


        const nameInput =
            document.getElementById(
                "customerNameInput"
            );


        const phoneInput =
            document.getElementById(
                "customerPhoneInput"
            );


        const emailInput =
            document.getElementById(
                "customerEmailInput"
            );


        const addressInput =
            document.getElementById(
                "customerAddressInput"
            );


        const title =
            modal
                ? modal.querySelector(
                    ".modal-header h2"
                )
                : null;


        const saveButton =
            document.querySelector(
                "#customerForm .btn-primary"
            );


        if (codeInput) {
            codeInput.value =
                customer.customer_code || "";
        }


        if (nameInput) {
            nameInput.value =
                customer.name || "";
        }


        if (phoneInput) {
            phoneInput.value =
                customer.phone || "";
        }


        if (emailInput) {
            emailInput.value =
                customer.email || "";
        }


        if (addressInput) {
            addressInput.value =
                customer.address || "";
        }


        if (title) {
            title.textContent =
                "Edit Pelanggan";
        }


        if (saveButton) {
            saveButton.textContent =
                "Simpan Perubahan";
        }


        if (modal) {

            modal.style.display =
                "flex";

            modal.style.opacity =
                "1";

            modal.style.visibility =
                "visible";

            modal.style.pointerEvents =
                "auto";

            modal.classList.add(
                "show"
            );

        }


    } catch (error) {

        console.error(
            "Gagal mengambil data pelanggan:",
            error
        );


        showToast(
            "Data pelanggan gagal dimuat.",
            "error"
        );

    }

}


/* =========================================================
   CLOSE CUSTOMER MODAL
========================================================= */

function closeCustomerModal() {

    const modal =
        document.getElementById(
            "customerModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );


    modal.style.opacity =
        "0";

    modal.style.visibility =
        "hidden";

    modal.style.pointerEvents =
        "none";

    modal.style.display =
        "none";


    editingCustomerId =
        null;


    const customerForm =
        document.getElementById(
            "customerForm"
        );


    if (customerForm) {
        customerForm.reset();
    }


    const title =
        modal.querySelector(
            ".modal-header h2"
        );


    if (title) {
        title.textContent =
            "Tambah Pelanggan";
    }


    const saveButton =
        document.querySelector(
            "#customerForm .btn-primary"
        );


    if (saveButton) {
        saveButton.textContent =
            "Simpan Pelanggan";
    }

}


/* =========================================================
   SAVE / UPDATE CUSTOMER
========================================================= */

async function saveCustomer(event) {

    event.preventDefault();


    const codeInput =
        document.getElementById(
            "customerCodeInput"
        );


    const nameInput =
        document.getElementById(
            "customerNameInput"
        );


    const phoneInput =
        document.getElementById(
            "customerPhoneInput"
        );


    const emailInput =
        document.getElementById(
            "customerEmailInput"
        );


    const addressInput =
        document.getElementById(
            "customerAddressInput"
        );


    const saveButton =
        document.querySelector(
            "#customerForm .btn-primary"
        );


    const customerForm =
        document.getElementById(
            "customerForm"
        );


    if (
        !codeInput ||
        !nameInput ||
        !phoneInput ||
        !emailInput ||
        !addressInput
    ) {

        showToast(
            "Form pelanggan belum tersedia.",
            "error"
        );

        return;

    }


    const customerCode =
        codeInput.value.trim();


    const name =
        nameInput.value.trim();


    const phone =
        phoneInput.value.trim();


    const email =
        emailInput.value.trim();


    const address =
        addressInput.value.trim();


    if (!customerCode) {

        showToast(
            "Kode pelanggan belum tersedia.",
            "error"
        );

        return;

    }


    if (!name) {

        showToast(
            "Nama pelanggan wajib diisi.",
            "error"
        );

        nameInput.focus();

        return;

    }


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Menyimpan...";

    }


    try {

        /* =================================================
           CEK DUPLIKAT NAMA
        ================================================= */

        let duplicateQuery =
            supabaseClient
                .from("customers")
                .select("id,name")
                .ilike("name", name)
                .limit(1);


        if (editingCustomerId) {

            duplicateQuery =
                duplicateQuery.neq(
                    "id",
                    editingCustomerId
                );

        }


        const {
            data: existingCustomer,
            error: duplicateError
        } = await duplicateQuery;


        if (duplicateError) {
            throw duplicateError;
        }


        if (
            existingCustomer &&
            existingCustomer.length > 0
        ) {

            throw new Error(
                "Pelanggan dengan nama tersebut sudah terdaftar."
            );

        }


        /* =================================================
           MODE EDIT
        ================================================= */

        if (editingCustomerId) {

            const {
                data,
                error
            } = await supabaseClient

                .from("customers")

                .update({

                    customer_code:
                        customerCode,

                    name:
                        name,

                    phone:
                        phone ||
                        null,

                    email:
                        email ||
                        null,

                    address:
                        address ||
                        null

                })

                .eq(
                    "id",
                    editingCustomerId
                )

                .select(`
                    id,
                    customer_code,
                    name,
                    phone,
                    email,
                    address
                `)

                .single();


            if (error) {
                throw error;
            }


            await loadCustomerTable();


            closeCustomerModal();


            showToast(
                "Pelanggan " +
                data.name +
                " berhasil diperbarui.",
                "success"
            );


            return;

        }


        /* =================================================
           MODE TAMBAH
        ================================================= */

        const {
            data,
            error
        } = await supabaseClient

            .from("customers")

            .insert({

                customer_code:
                    customerCode,

                name:
                    name,

                phone:
                    phone ||
                    null,

                email:
                    email ||
                    null,

                address:
                    address ||
                    null

            })

            .select(`
                id,
                customer_code,
                name,
                phone,
                email,
                address,
                created_at
            `)

            .single();


        if (error) {
            throw error;
        }


        await loadCustomerTable();


        if (customerForm) {
            customerForm.reset();
        }


        closeCustomerModal();


        showToast(
            "Pelanggan " +
            data.name +
            " berhasil ditambahkan.",
            "success"
        );


    } catch (error) {

        console.error(
            "Gagal menyimpan pelanggan:",
            error
        );


        showToast(
            "Pelanggan gagal disimpan: " +
            (
                error.message ||
                "Terjadi kesalahan."
            ),
            "error"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingCustomerId
                    ? "Simpan Perubahan"
                    : "Simpan Pelanggan";

        }

    }

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeCustomerModal();

    }
);


/* =========================================================
   FIFO INVENTORY LAYERS
========================================================= */


/* =========================================================
   LOAD FIFO LAYERS
========================================================= */

async function loadFifoLayers() {

    const tableBody =
        document.getElementById(
            "fifoLayerTableBody"
        );

    if (!tableBody) {
        return;
    }


    try {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <strong>Memuat layer FIFO...</strong>
                        <span>
                            Data persediaan sedang dibaca dari sistem.
                        </span>
                    </div>
                </td>
            </tr>
        `;


        /* =================================================
           AMBIL INVENTORY LAYERS
        ================================================== */

        const {
            data: layers,
            error: layerError
        } = await supabaseClient

            .from("inventory_layers")

            .select(`
                id,
                product_id,
                purchase_id,
                purchase_item_id,
                layer_date,
                quantity_in,
                quantity_remaining,
                unit_cost,
                products (
                    id,
                    name,
                    sku
                ),
                purchases (
                    id,
                    purchase_number,
                    purchase_date
                )
            `)

            .order(
                "layer_date",
                {
                    ascending: true
                }
            );


        if (layerError) {
            throw layerError;
        }


        /* =================================================
           SIMPAN DATA FIFO
        ================================================== */

        fifoLayerData =
            layers || [];


        /* =================================================
           ISI FILTER PRODUK
        ================================================== */

        populateFifoProductFilter(
            fifoLayerData
        );


        /* =================================================
           TAMPILKAN DATA
        ================================================== */

        renderFifoLayers(
            fifoLayerData
        );


    } catch (error) {

        console.error(
            "Gagal memuat layer FIFO:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <strong>
                            Layer FIFO gagal dimuat
                        </strong>
                        <span>
                            ${
                                escapeHtml(
                                    error.message ||
                                    "Terjadi kesalahan."
                                )
                            }
                        </span>
                    </div>
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   FIFO DATA CACHE
========================================================= */

let fifoLayerData = [];


/* =========================================================
   POPULATE FIFO PRODUCT FILTER
========================================================= */

function populateFifoProductFilter(
    layers
) {

    const select =
        document.getElementById(
            "fifoProductFilter"
        );


    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    const productMap = {};


    (layers || []).forEach(
        function (layer) {

            const product =
                layer.products;


            if (
                !product ||
                !product.id
            ) {
                return;
            }


            productMap[
                String(product.id)
            ] = product;

        }
    );


    const products =
        Object.values(
            productMap
        )
        .sort(
            function (a, b) {

                return String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    )
                );

            }
        );


    select.innerHTML = `
        <option value="">
            Semua Produk
        </option>
    `;


    products.forEach(
        function (product) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                product.id;

            option.textContent =
                product.name +
                (
                    product.sku
                        ? " (" +
                          product.sku +
                          ")"
                        : ""
                );

            select.appendChild(
                option
            );

        }
    );


    if (
        currentValue &&
        productMap[currentValue]
    ) {

        select.value =
            currentValue;

    }

}


/* =========================================================
   RENDER FIFO LAYERS
========================================================= */

function renderFifoLayers(
    layers
) {

    const tableBody =
        document.getElementById(
            "fifoLayerTableBody"
        );


    const stockElement =
        document.getElementById(
            "fifoTotalStock"
        );


    const valueElement =
        document.getElementById(
            "fifoInventoryValue"
        );


    if (!tableBody) {
        return;
    }


    const selectedProduct =
        document.getElementById(
            "fifoProductFilter"
        );


    const selectedProductId =
        selectedProduct
            ? selectedProduct.value
            : "";


    let filteredLayers =
        layers || [];


    /* =================================================
       FILTER PRODUK
    ================================================== */

    if (selectedProductId) {

        filteredLayers =
            filteredLayers.filter(
                function (layer) {

                    return (
                        String(
                            layer.product_id
                        ) ===
                        String(
                            selectedProductId
                        )
                    );

                }
            );

    }


    /* =================================================
       HITUNG TOTAL STOK
    ================================================== */

    const totalStock =
        filteredLayers.reduce(
            function (total, layer) {

                return (
                    total +
                    Number(
                        layer.quantity_remaining ||
                        0
                    )
                );

            },
            0
        );


    /* =================================================
       HITUNG NILAI PERSEDIAAN
    ================================================== */

    const inventoryValue =
        filteredLayers.reduce(
            function (total, layer) {

                const quantity =
                    Number(
                        layer.quantity_remaining ||
                        0
                    );

                const unitCost =
                    Number(
                        layer.unit_cost ||
                        0
                    );

                return (
                    total +
                    (
                        quantity *
                        unitCost
                    )
                );

            },
            0
        );


    if (stockElement) {

        stockElement.textContent =
            formatNumber(
                totalStock
            ) +
            " unit";

    }


    if (valueElement) {

        valueElement.textContent =
            formatRupiah(
                inventoryValue
            );

    }


    /* =================================================
       EMPTY STATE
    ================================================== */

    if (
        filteredLayers.length ===
        0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <strong>
                            Belum ada layer FIFO
                        </strong>
                        <span>
                            Belum terdapat layer persediaan
                            untuk produk yang dipilih.
                        </span>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    /* =================================================
       TABLE
    ================================================== */

    tableBody.innerHTML =
        filteredLayers
            .map(
                function (layer) {

                    const product =
                        layer.products ||
                        {};

                    const purchase =
                        layer.purchases ||
                        {};


                    const quantityIn =
                        Number(
                            layer.quantity_in ||
                            0
                        );


                    const quantityRemaining =
                        Number(
                            layer.quantity_remaining ||
                            0
                        );


                    const unitCost =
                        Number(
                            layer.unit_cost ||
                            0
                        );


                    const remainingValue =
                        quantityRemaining *
                        unitCost;


                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${
                                        escapeHtml(
                                            product.name ||
                                            "-"
                                        )
                                    }
                                </strong>

                                ${
                                    product.sku
                                        ? `
                                            <small
                                                class="table-subtext"
                                            >
                                                ${
                                                    escapeHtml(
                                                        product.sku
                                                    )
                                                }
                                            </small>
                                          `
                                        : ""
                                }

                            </td>


                            <td>
                                ${
                                    formatDate(
                                        purchase.purchase_date ||
                                        layer.layer_date
                                    )
                                }
                            </td>


                            <td>
                                <strong>
                                    ${
                                        escapeHtml(
                                            purchase.purchase_number ||
                                            "-"
                                        )
                                    }
                                </strong>
                            </td>


                            <td>
                                ${
                                    formatNumber(
                                        quantityIn
                                    )
                                }
                            </td>


                            <td>

                                <span
                                    class="fifo-remaining-badge ${
                                        quantityRemaining >
                                        0
                                            ? "available"
                                            : "empty"
                                    }"
                                >

                                    ${
                                        formatNumber(
                                            quantityRemaining
                                        )
                                    }

                                </span>

                            </td>


                            <td>
                                ${
                                    formatRupiah(
                                        unitCost
                                    )
                                }
                            </td>


                            <td>
                                <strong>
                                    ${
                                        formatRupiah(
                                            remainingValue
                                        )
                                    }
                                </strong>
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   INITIALIZE FIFO
========================================================= */

function initializeFifo() {

    const refreshButton =
        document.getElementById(
            "refreshFifoButton"
        );


    const productFilter =
        document.getElementById(
            "fifoProductFilter"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async function () {

                await loadFifoLayers();

            }
        );

    }


    if (productFilter) {

        productFilter.addEventListener(
            "change",
            function () {

                renderFifoLayers(
                    fifoLayerData
                );

            }
        );

    }


    loadFifoLayers();


}


/* =========================================================
   KARTU PERSEDIAAN FIFO
========================================================= */

window.inventoryCardDataCache = [];


/* =========================================================
   FORMAT JENIS PERGERAKAN
========================================================= */

function formatInventoryMovementType(movementType) {

    const type =
        String(
            movementType || ""
        ).toLowerCase();

    if (type === "purchase") {
        return "Pembelian";
    }

    if (type === "sale") {
        return "Penjualan";
    }

    if (type === "adjustment") {
        return "Penyesuaian";
    }

    if (type === "return_purchase") {
        return "Retur Pembelian";
    }

    if (type === "return_sale") {
        return "Retur Penjualan";
    }

    return movementType || "-";
}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatInventoryMovementDate(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


/* =========================================================
   LOAD KARTU PERSEDIAAN
========================================================= */

async function loadInventoryCard() {

    const productFilter =
        document.getElementById(
            "inventoryCardProductFilter"
        );

    const tableBody =
        document.getElementById(
            "inventoryCardTableBody"
        );

    const titleElement =
        document.getElementById(
            "inventoryCardTableTitle"
        );

    const startDateInput =
        document.getElementById(
            "inventoryCardStartDate"
        );

    const endDateInput =
        document.getElementById(
            "inventoryCardEndDate"
        );


    if (
        !productFilter ||
        !tableBody
    ) {
        return;
    }


    const productId =
        productFilter.value;


    /* =====================================================
       FILTER TANGGAL
    ===================================================== */

    const startDate =
        startDateInput
            ? startDateInput.value
            : "";

    const endDate =
        endDateInput
            ? endDateInput.value
            : "";


    /* =====================================================
       BELUM PILIH PRODUK
    ===================================================== */

    if (!productId) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-state"
                >
                    Pilih produk untuk melihat kartu persediaan.
                </td>
            </tr>
        `;


        if (titleElement) {

            titleElement.textContent =
                "Kartu Persediaan";

        }


        return;
    }


    /* =====================================================
       VALIDASI TANGGAL
    ===================================================== */

    if (
        startDate &&
        endDate &&
        startDate > endDate
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-state"
                >
                    Tanggal awal tidak boleh lebih besar
                    dari tanggal akhir.
                </td>
            </tr>
        `;


        showToast(
            "Tanggal awal tidak boleh lebih besar dari tanggal akhir.",
            "error"
        );


        return;
    }


    try {

        /* =================================================
           AMBIL PRODUK
        ================================================= */

        const {
            data: product,
            error: productError
        } = await supabaseClient
            .from("products")
            .select("*")
            .eq(
                "id",
                productId
            )
            .single();


        if (productError) {
            throw productError;
        }


        /* =================================================
           AMBIL PERGERAKAN PERSEDIAAN
        ================================================= */

        const {
            data: movements,
            error: movementError
        } = await supabaseClient
            .from("inventory_movements")
            .select("*")
            .eq(
                "product_id",
                productId
            )
            .order(
                "movement_date",
                {
                    ascending: true
                }
            );


        if (movementError) {
            throw movementError;
        }


        /* =================================================
           AMBIL DETAIL FIFO PENJUALAN
        ================================================= */

        const {
            data: fifoData,
            error: fifoDataError
        } = await supabaseClient
            .from("sale_fifo_details")
            .select("*");


        if (fifoDataError) {
            throw fifoDataError;
        }


        const allFifoDetails =
            fifoData || [];


        /* =================================================
           SIAPKAN FIFO DETAIL BERDASARKAN SALE ID
        ================================================= */

        const fifoBySale =
            {};


        allFifoDetails.forEach(
            function (detail) {

                const saleId =
                    String(
                        detail.sale_id || ""
                    );


                if (!saleId) {
                    return;
                }


                if (!fifoBySale[saleId]) {

                    fifoBySale[saleId] =
                        [];

                }


                fifoBySale[saleId].push(
                    detail
                );

            }
        );


        /* =================================================
           SORT MOVEMENT
        ================================================= */

        const sortedMovements =
            (movements || [])
                .slice()
                .sort(
                    function (a, b) {

                        return (
                            new Date(
                                a.movement_date
                            ).getTime()
                            -
                            new Date(
                                b.movement_date
                            ).getTime()
                        );

                    }
                );


        /* =================================================
           SIMULASI LAYER FIFO
        ================================================= */

        const activeLayers =
            [];


        let runningBalance =
            0;


        let runningInventoryValue =
            0;


        let totalHPP =
            0;


        const rows =
            [];


        /* =================================================
           PROSES SETIAP MOVEMENT
        ================================================= */

        sortedMovements.forEach(
            function (movement) {

                const movementType =
                    String(
                        movement.movement_type || ""
                    ).toLowerCase();


                const quantityIn =
                    Number(
                        movement.quantity_in || 0
                    );


                const quantityOut =
                    Number(
                        movement.quantity_out || 0
                    );


                const unitCost =
                    Number(
                        movement.unit_cost || 0
                    );


                let hppDetails =
                    [];


                let hppTotal =
                    0;


                /* =========================================
                   PEMBELIAN
                ========================================= */

                if (
                    movementType ===
                    "purchase"
                ) {

                    if (
                        quantityIn > 0
                    ) {

                        activeLayers.push({

                            quantity:
                                quantityIn,

                            unitCost:
                                unitCost

                        });

                    }


                    runningBalance +=
                        quantityIn;


                    runningInventoryValue +=
                        quantityIn *
                        unitCost;

                }


                /* =========================================
                   PENJUALAN
                ========================================= */

                else if (
                    movementType ===
                    "sale"
                ) {

                    const saleId =
                        String(
                            movement.reference_id ||
                            ""
                        );


                    const details =
                        fifoBySale[
                            saleId
                        ] || [];


                    /* =====================================
                       AMBIL HPP DARI DETAIL FIFO
                    ===================================== */

                    details.forEach(
                        function (detail) {

                            const quantityTaken =
                                Number(
                                    detail.quantity_taken ||
                                    0
                                );


                            const fifoUnitCost =
                                Number(
                                    detail.unit_cost ||
                                    0
                                );


                            const fifoTotalCost =
                                quantityTaken *
                                fifoUnitCost;


                            if (
                                quantityTaken <= 0
                            ) {
                                return;
                            }


                            hppDetails.push({

                                quantity:
                                    quantityTaken,

                                unitCost:
                                    fifoUnitCost,

                                total:
                                    fifoTotalCost

                            });


                            hppTotal +=
                                fifoTotalCost;

                        }
                    );


                    /* =====================================
                       KURANGI ACTIVE LAYER FIFO
                    ===================================== */

                    let quantityToRemove =
                        quantityOut;


                    for (
                        let i = 0;
                        i < activeLayers.length &&
                        quantityToRemove > 0;
                        i++
                    ) {

                        const layer =
                            activeLayers[i];


                        if (
                            layer.quantity <= 0
                        ) {
                            continue;
                        }


                        const quantityTaken =
                            Math.min(
                                layer.quantity,
                                quantityToRemove
                            );


                        layer.quantity -=
                            quantityTaken;


                        quantityToRemove -=
                            quantityTaken;

                    }


                    runningBalance -=
                        quantityOut;


                    runningInventoryValue -=
                        hppTotal;


                    totalHPP +=
                        hppTotal;

                }


/* =========================================
   PENYESUAIAN PERSEDIAAN
   BARANG RUSAK & EXPIRED
========================================= */

else if (
    movementType ===
    "adjustment"
) {

    /* =====================================
       KURANGI STOK
    ===================================== */

    runningBalance -=
        quantityOut;


    /* =====================================
       KURANGI NILAI PERSEDIAAN
       
       Unit cost sudah ditentukan oleh
       fungsi FIFO di database.
    ===================================== */

    runningInventoryValue -=
        quantityOut *
        unitCost;


    /* =====================================
       JAGA AGAR TIDAK MINUS KECIL
    ===================================== */

    if (
        runningBalance < 0 &&
        Math.abs(
            runningBalance
        ) < 0.01
    ) {

        runningBalance =
            0;

    }


    if (
        runningInventoryValue < 0 &&
        Math.abs(
            runningInventoryValue
        ) < 0.01
    ) {

        runningInventoryValue =
            0;

    }

}


                /* =========================================
                   JAGA AGAR TIDAK MINUS
                ========================================= */

                if (
                    runningBalance < 0 &&
                    Math.abs(
                        runningBalance
                    ) < 0.01
                ) {

                    runningBalance =
                        0;

                }


                if (
                    runningInventoryValue < 0 &&
                    Math.abs(
                        runningInventoryValue
                    ) < 0.01
                ) {

                    runningInventoryValue =
                        0;

                }


                /* =========================================
                   HITUNG LAYER TERSISA
                ========================================= */

                const remainingLayers =
                    activeLayers.filter(
                        function (layer) {

                            return (
                                layer.quantity >
                                0
                            );

                        }
                    );


                /* =========================================
                   GABUNGKAN LAYER HARGA SAMA
                   
                   PENTING:
                   Gunakan ARRAY, bukan OBJECT.

                   Tujuannya agar urutan layer tetap:
                   
                   layer pertama
                   →
                   layer kedua
                   →
                   layer ketiga

                   Bukan diurutkan berdasarkan harga.
                ========================================= */

                const remainingGroups =
                    [];


                remainingLayers.forEach(
                    function (layer) {

                        const existingGroup =
                            remainingGroups.find(
                                function (group) {

                                    return (
                                        Number(
                                            group.unitCost
                                        ) ===
                                        Number(
                                            layer.unitCost
                                        )
                                    );

                                }
                            );


                        if (
                            existingGroup
                        ) {

                            existingGroup.quantity +=
                                layer.quantity;

                        }
                        else {

                            remainingGroups.push({

                                quantity:
                                    layer.quantity,

                                unitCost:
                                    layer.unitCost

                            });

                        }

                    }
                );


                /* =========================================
                   FORMAT HARGA PERSEDIAAN
                ========================================= */

                let inventoryUnitText =
                    "-";


                if (
                    remainingGroups.length ===
                    1
                ) {

                    inventoryUnitText =
                        formatRupiah(
                            remainingGroups[0]
                                .unitCost
                        );

                }
                else if (
                    remainingGroups.length > 1
                ) {

                    inventoryUnitText =
                        remainingGroups
                            .map(
                                function (group) {

                                    return (
                                        formatNumber(
                                            group.quantity
                                        ) +
                                        " @ " +
                                        formatRupiah(
                                            group.unitCost
                                        )
                                    );

                                }
                            )
                            .join(
                                "; "
                            );

                }


                /* =========================================
                   FORMAT HPP FIFO
                ========================================= */

                let hppUnitText =
                    "-";


                if (
                    hppDetails.length > 0
                ) {

                    hppUnitText =
                        hppDetails
                            .map(
                                function (detail) {

                                    return (
                                        formatNumber(
                                            detail.quantity
                                        ) +
                                        " @ " +
                                        formatRupiah(
                                            detail.unitCost
                                        )
                                    );

                                }
                            )
                            .join(
                                "; "
                            );

                }


                /* =========================================
                   SIMPAN ROW
                ========================================= */

                rows.push({

                    date:
                        movement.movement_date,

                    movementType:
                        movementType,

                    referenceId:
                        movement.reference_id,

                    quantityIn:
                        quantityIn,

                    quantityOut:
                        quantityOut,

                    balance:
                        runningBalance,

                    hppUnitText:
                        hppUnitText,

                    hppTotal:
                        hppTotal,

                    inventoryUnitText:
                        inventoryUnitText,

                    inventoryValue:
                        runningInventoryValue

                });

            }
        );


        /* =================================================
           FILTER TANGGAL

           Perhitungan FIFO tetap dilakukan dari awal.
           Setelah saldo dan layer dihitung, barulah
           hasil ditampilkan sesuai tanggal.
        ================================================= */

        let displayedRows =
            rows;


        if (startDate) {

            displayedRows =
                displayedRows.filter(
                    function (row) {

                        return (
                            String(
                                row.date
                            ).slice(0, 10) >=
                            startDate
                        );

                    }
                );

        }


        if (endDate) {

            displayedRows =
                displayedRows.filter(
                    function (row) {

                        return (
                            String(
                                row.date
                            ).slice(0, 10) <=
                            endDate
                        );

                    }
                );

        }


        window.inventoryCardDataCache =
            displayedRows;


        renderInventoryCardTable(
            displayedRows,
            product
        );


    } catch (error) {

        console.error(
            "Gagal memuat Kartu Persediaan:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-state"
                >
                    Gagal memuat Kartu Persediaan.
                </td>
            </tr>
        `;


        showToast(
            "Kartu Persediaan gagal dimuat.",
            "error"
        );

    }

}


/* =========================================================
   RENDER TABEL
========================================================= */

function renderInventoryCardTable(
    rows,
    product
) {

    const tableBody =
        document.getElementById(
            "inventoryCardTableBody"
        );


    const titleElement =
        document.getElementById(
            "inventoryCardTableTitle"
        );


    if (!tableBody) {
        return;
    }


    /* =====================================================
       JUDUL
    ===================================================== */

    if (titleElement) {

        titleElement.textContent =
            "Kartu Persediaan — " +
            (
                product &&
                product.name
                    ? product.name
                    : "-"
            );

    }


    /* =====================================================
       TIDAK ADA DATA
    ===================================================== */

    if (!rows.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-state"
                >
                    Tidak ada transaksi pada periode yang dipilih.
                </td>
            </tr>
        `;

        return;
    }


    /* =====================================================
       HARGA JUAL PRODUK YANG DIPILIH
       
       HANYA mengambil selling_price dari product
       yang sedang dibuka.
    ===================================================== */

    const sellingPrice =
        product &&
        product.selling_price !== null &&
        product.selling_price !== undefined
            ? Number(
                product.selling_price
            )
            : 0;


    const sellingPriceText =
        sellingPrice > 0
            ? formatRupiah(
                sellingPrice
            )
            : "-";


    /* =====================================================
       SIAPKAN ROW
    ===================================================== */

    const htmlRows =
        [];


    rows.forEach(
        function (row) {

            /* =============================================
               HPP FIFO
               
               Ini TETAP dipakai untuk:
               Harga/Unit Persediaan Akhir
            ============================================= */

            const inventoryParts =
                row.inventoryUnitText &&
                row.inventoryUnitText !== "-"
                    ? row.inventoryUnitText
                        .split("; ")
                    : [];


            /* =============================================
               JUMLAH BARIS DETAIL
            ============================================= */

            const detailRowCount =
                Math.max(
                    inventoryParts.length,
                    1
                );


            for (
                let i = 0;
                i < detailRowCount;
                i++
            ) {

                const isFirstRow =
                    i === 0;


                const isLastRow =
                    i ===
                    detailRowCount - 1;


                /* =========================================
                   HPP PERSEDIAAN AKHIR
                ========================================= */

                const inventoryText =
                    inventoryParts[i] ||
                    "";


                /* =========================================
                   TOTAL HARGA JUAL
                   
                   Mengikuti jumlah barang yang bergerak.
                   
                   Pembelian:
                   quantityIn × sellingPrice
                   
                   Penjualan:
                   quantityOut × sellingPrice
                ========================================= */

                let totalSellingValue =
                    0;


                if (
                    row.quantityIn > 0
                ) {

                    totalSellingValue =
                        Number(
                            row.quantityIn
                        ) *
                        sellingPrice;

                }
                else if (
                    row.quantityOut > 0
                ) {

                    totalSellingValue =
                        Number(
                            row.quantityOut
                        ) *
                        sellingPrice;

                }


                const totalSellingValueHtml =
                    isFirstRow &&
                    totalSellingValue > 0
                        ? formatRupiah(
                            totalSellingValue
                        )
                        : "";


                /* =========================================
                   NILAI PERSEDIAAN AKHIR
                ========================================= */

                const inventoryValueHtml =
                    isLastRow
                        ? formatRupiah(
                            row.inventoryValue
                        )
                        : "";


                /* =========================================
                   TANGGAL
                ========================================= */

                const dateHtml =
                    isFirstRow
                        ? escapeHtml(
                            formatInventoryMovementDate(
                                row.date
                            )
                        )
                        : "";


                /* =========================================
                   JENIS TRANSAKSI
                ========================================= */

                const movementHtml =
                    isFirstRow
                        ? escapeHtml(
                            formatInventoryMovementType(
                                row.movementType
                            )
                        )
                        : "";


                /* =========================================
                   QTY MASUK
                ========================================= */

                const quantityInHtml =
                    isFirstRow &&
                    row.quantityIn > 0
                        ? formatNumber(
                            row.quantityIn
                        )
                        : "";


                /* =========================================
                   QTY KELUAR
                ========================================= */

                const quantityOutHtml =
                    isFirstRow &&
                    row.quantityOut > 0
                        ? formatNumber(
                            row.quantityOut
                        )
                        : "";


                /* =========================================
                   SALDO
                ========================================= */

                const balanceHtml =
                    isFirstRow
                        ? formatNumber(
                            row.balance
                        )
                        : "";


                /* =========================================
                   RENDER
                ========================================= */

                htmlRows.push(`

                    <tr
                        class="${
                            isFirstRow
                                ? "inventory-card-main-row"
                                : "inventory-card-detail-row"
                        }"
                    >

                        <!-- TANGGAL -->

                        <td>
                            ${dateHtml}
                        </td>


                        <!-- TRANSAKSI -->

                        <td>
                            ${movementHtml}
                        </td>


                        <!-- MASUK -->

                        <td class="number-cell">
                            ${quantityInHtml}
                        </td>


                        <!-- KELUAR -->

                        <td class="number-cell">
                            ${quantityOutHtml}
                        </td>


                        <!-- HARGA JUAL / UNIT -->

                        <td class="currency-cell">
                            ${
                                isFirstRow &&
                                sellingPrice > 0
                                    ? sellingPriceText
                                    : "–"
                            }
                        </td>


                        <!-- TOTAL HARGA JUAL -->

                        <td class="currency-cell">
                            ${
                                totalSellingValueHtml
                                    ? totalSellingValueHtml
                                    : "–"
                            }
                        </td>


                        <!-- SALDO -->

                        <td class="number-cell">
                            ${balanceHtml}
                        </td>


                        <!-- HARGA / UNIT PERSEDIAAN AKHIR -->

                        <td>
                            ${
                                inventoryText
                                    ? escapeHtml(
                                        inventoryText
                                    )
                                    : "–"
                            }
                        </td>


                        <!-- NILAI PERSEDIAAN AKHIR -->

                        <td class="currency-cell">
                            ${
                                inventoryValueHtml
                                    ? inventoryValueHtml
                                    : "–"
                            }
                        </td>

                    </tr>

                `);

            }

        }
    );


    /* =====================================================
       MASUKKAN KE TABLE
    ===================================================== */

    tableBody.innerHTML =
        htmlRows.join("");

}


/* =========================================================
   DOWNLOAD PDF KARTU PERSEDIAAN
========================================================= */

function downloadInventoryCardPDF() {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        showToast(
            "Library PDF belum tersedia.",
            "error"
        );

        return;
    }


    const productFilter =
        document.getElementById(
            "inventoryCardProductFilter"
        );


    const startDateInput =
        document.getElementById(
            "inventoryCardStartDate"
        );


    const endDateInput =
        document.getElementById(
            "inventoryCardEndDate"
        );


    if (!productFilter) {
        return;
    }


    const productId =
        productFilter.value;


    if (!productId) {

        showToast(
            "Pilih produk terlebih dahulu.",
            "error"
        );

        return;
    }


    const selectedOption =
        productFilter.options[
            productFilter.selectedIndex
        ];


    const productName =
        selectedOption
            ? selectedOption.textContent.trim()
            : "-";


    const startDate =
        startDateInput
            ? startDateInput.value
            : "";


    const endDate =
        endDateInput
            ? endDateInput.value
            : "";


    const rows =
        Array.isArray(
            window.inventoryCardDataCache
        )
            ? window.inventoryCardDataCache
            : [];


    if (!rows.length) {

        showToast(
            "Tidak ada data kartu persediaan untuk dibuat PDF.",
            "error"
        );

        return;
    }


    /* =====================================================
       AMBIL DATA TERAKHIR
    ===================================================== */

    const lastRow =
        rows[
            rows.length - 1
        ];


    const finalBalance =
        Number(
            lastRow.balance || 0
        );


    const finalInventoryValue =
        Number(
            lastRow.inventoryValue || 0
        );


    /* =====================================================
       FORMAT PERIODE
    ===================================================== */

    let periodText =
        "Seluruh periode";


    if (
        startDate &&
        endDate
    ) {

        periodText =
            formatInventoryCardPdfDate(
                startDate
            ) +
            " s.d. " +
            formatInventoryCardPdfDate(
                endDate
            );

    }
    else if (startDate) {

        periodText =
            "Mulai " +
            formatInventoryCardPdfDate(
                startDate
            );

    }
    else if (endDate) {

        periodText =
            "Sampai " +
            formatInventoryCardPdfDate(
                endDate
            );

    }


    /* =====================================================
       TIMESTAMP
    ===================================================== */

    const openedAt =
        new Date();


    const timestampText =
        openedAt.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "Asia/Jakarta"
            }
        ) +
        " WIB";


    /* =====================================================
       BUAT PDF
    ===================================================== */

    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF(
            {
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            }
        );


    const pageWidth =
        doc.internal.pageSize.getWidth();


    const pageHeight =
        doc.internal.pageSize.getHeight();


    /* =====================================================
       JUDUL
    ===================================================== */

    doc.setTextColor(
        36,
        37,
        43
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        17
    );


    doc.text(
        "KARTU PERSEDIAAN",
        pageWidth / 2,
        18,
        {
            align: "center"
        }
    );


    doc.setFontSize(
        10
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        "DISTRIBUTOR MAKANAN/MINUMAN",
        pageWidth / 2,
        24,
        {
            align: "center"
        }
    );


    doc.setFontSize(
        9
    );


    doc.text(
        "Produk: " +
        productName,
        pageWidth / 2,
        31,
        {
            align: "center"
        }
    );


    doc.text(
        "Periode: " +
        periodText,
        pageWidth / 2,
        37,
        {
            align: "center"
        }
    );


    /* =====================================================
       SIAPKAN DATA TABEL
    ===================================================== */

    const tableRows =
        [];


    rows.forEach(
        function (row) {

            const hppParts =
                row.hppUnitText &&
                row.hppUnitText !== "-"
                    ? row.hppUnitText
                        .split("; ")
                    : [];


            const inventoryParts =
                row.inventoryUnitText &&
                row.inventoryUnitText !== "-"
                    ? row.inventoryUnitText
                        .split("; ")
                    : [];


            const detailRowCount =
                Math.max(
                    hppParts.length,
                    inventoryParts.length,
                    1
                );


            for (
                let i = 0;
                i < detailRowCount;
                i++
            ) {

                const isFirstRow =
                    i === 0;


                const isLastRow =
                    i ===
                    detailRowCount - 1;


                const hppText =
                    hppParts[i] ||
                    "-";


                const inventoryText =
                    inventoryParts[i] ||
                    "-";


                tableRows.push([

                    isFirstRow
                        ? formatInventoryMovementDate(
                            row.date
                        )
                        : "",

                    isFirstRow
                        ? formatInventoryMovementType(
                            row.movementType
                        )
                        : "",

                    isFirstRow &&
                    Number(row.quantityIn) > 0
                        ? formatNumber(
                            row.quantityIn
                        )
                        : "",

                    isFirstRow &&
                    Number(row.quantityOut) > 0
                        ? formatNumber(
                            row.quantityOut
                        )
                        : "",

                    hppText,

                    isLastRow &&
                    Number(row.hppTotal) > 0
                        ? formatRupiah(
                            row.hppTotal
                        )
                        : "",

                    isFirstRow
                        ? formatNumber(
                            row.balance
                        )
                        : "",

                    inventoryText,

                    isLastRow
                        ? formatRupiah(
                            row.inventoryValue
                        )
                        : ""

                ]);

            }

        }
    );


    /* =====================================================
       TABEL PDF
    ===================================================== */

    doc.autoTable({

        startY:
            44,

        head: [[
            "Tanggal",
            "Keterangan",
            "Masuk",
            "Keluar",
            "Harga/Unit HPP",
            "Total HPP",
            "Saldo",
            "Harga/Unit Persediaan Akhir",
            "Nilai Persediaan Akhir"
        ]],

        body:
            tableRows,

        theme:
            "grid",

        styles: {

            font:
                "helvetica",

            fontSize:
                7,

            textColor:
                [
                    52,
                    38,
                    61
                ],

            lineColor:
                [
                    210,
                    207,
                    214
                ],

            lineWidth:
                0.15,

            cellPadding:
                2.2,

            valign:
                "middle"

        },

        headStyles: {

            fillColor:
                [
                    234,
                    220,
                    246
                ],

            textColor:
                [
                    49,
                    27,
                    72
                ],

            fontStyle:
                "bold",

            halign:
                "center",

            valign:
                "middle"

        },

        alternateRowStyles: {

            fillColor:
                [
                    250,
                    248,
                    251
                ]

        },

        columnStyles: {

            0: {
                cellWidth: 24,
                halign: "center"
            },

            1: {
                cellWidth: 29
            },

            2: {
                cellWidth: 17,
                halign: "right"
            },

            3: {
                cellWidth: 17,
                halign: "right"
            },

            4: {
                cellWidth: 42
            },

            5: {
                cellWidth: 28,
                halign: "right"
            },

            6: {
                cellWidth: 18,
                halign: "right"
            },

            7: {
                cellWidth: 48
            },

            8: {
                cellWidth: 32,
                halign: "right"
            }

        },

        margin: {

            left:
                10,

            right:
                10

        },

        didDrawPage:
            function () {

                const currentPage =
                    doc.internal.getNumberOfPages();


                doc.setFontSize(
                    7
                );


                doc.setTextColor(
                    145,
                    145,
                    150
                );


                doc.text(
                    "Kartu Persediaan",
                    10,
                    pageHeight - 8
                );


                doc.text(
                    "Halaman " +
                    currentPage,
                    pageWidth - 10,
                    pageHeight - 8,
                    {
                        align:
                            "right"
                    }
                );

            }

    });


    /* =====================================================
       RINGKASAN AKHIR
    ===================================================== */

    let finalY =
        doc.lastAutoTable.finalY +
        9;


    if (
        finalY >
        pageHeight - 35
    ) {

        doc.addPage();

        finalY =
            18;

    }


    doc.setDrawColor(
        201,
        177,
        220
    );


    doc.setLineWidth(
        0.5
    );


    doc.line(
        10,
        finalY,
        pageWidth - 10,
        finalY
    );


    finalY +=
        7;


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        9
    );


    doc.setTextColor(
        49,
        27,
        72
    );


    doc.text(
        "RINGKASAN PERSEDIAAN AKHIR",
        10,
        finalY
    );


    finalY +=
        6;


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        8
    );


    doc.setTextColor(
        65,
        66,
        73
    );


    doc.text(
        "Saldo akhir: " +
        formatNumber(
            finalBalance
        ) +
        " unit",
        10,
        finalY
    );


    doc.text(
        "Nilai persediaan akhir: " +
        formatRupiah(
            finalInventoryValue
        ),
        90,
        finalY
    );


    /* =====================================================
       TIMESTAMP
    ===================================================== */

    finalY +=
        9;


    doc.setFontSize(
        7
    );


    doc.setTextColor(
        145,
        145,
        150
    );


    doc.text(
        "Laporan dibuka pada " +
        timestampText,
        pageWidth - 10,
        finalY,
        {
            align:
                "right"
        }
    );


    /* =====================================================
       NAMA FILE
    ===================================================== */

    const safeProductName =
        productName
            .replace(
                /[^a-zA-Z0-9\s-]/g,
                ""
            )
            .trim()
            .replace(
                /\s+/g,
                "_"
            );


    const nowForFile =
        new Date();


    const monthName =
        nowForFile.toLocaleDateString(
            "id-ID",
            {
                month: "long"
            }
        );


    const year =
        nowForFile.getFullYear();


    const fileName =
        "Kartu_Persediaan_" +
        (
            safeProductName ||
            "Produk"
        ) +
        "_" +
        monthName +
        "_" +
        year +
        ".pdf";


    doc.save(
        fileName
    );


    showToast(
        "Kartu Persediaan berhasil diunduh.",
        "success"
    );

}


/* =========================================================
   FORMAT TANGGAL PDF
========================================================= */

function formatInventoryCardPdfDate(
    dateString
) {

    if (!dateString) {
        return "-";
    }


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


/* =========================================================
   UPDATE TIMESTAMP KARTU PERSEDIAAN
========================================================= */

function updateInventoryCardOpenedAt() {

    const timestampElement =
        document.getElementById(
            "inventoryCardOpenedAt"
        );


    if (!timestampElement) {
        return;
    }


    const now =
        new Date();


    const formattedDate =
        now.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "Asia/Jakarta"
            }
        );


    timestampElement.textContent =
        formattedDate +
        " WIB";

}


/* =========================================================
   LOAD PRODUK UNTUK FILTER
========================================================= */

async function loadInventoryCardProducts() {

    const productFilter =
        document.getElementById(
            "inventoryCardProductFilter"
        );


    if (!productFilter) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select(
                "id, sku, name"
            )
            .eq(
                "is_active",
                true
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        productFilter.innerHTML = `
            <option value="">
                Pilih Produk
            </option>
        `;


        (data || []).forEach(
            function (product) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    product.id;


                option.textContent =
                    (
                        product.sku
                            ? product.sku +
                              " — "
                            : ""
                    ) +
                    (
                        product.name ||
                        "-"
                    );


                productFilter.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat produk Kartu Persediaan:",
            error
        );

    }

}


/* =========================================================
   FILTER
========================================================= */

async function applyInventoryCardFilter() {

    await loadInventoryCard();

}


function resetInventoryCardFilter() {

    const productFilter =
        document.getElementById(
            "inventoryCardProductFilter"
        );


    const startDate =
        document.getElementById(
            "inventoryCardStartDate"
        );


    const endDate =
        document.getElementById(
            "inventoryCardEndDate"
        );


    if (productFilter) {

        productFilter.value =
            "";

    }


    if (startDate) {

        startDate.value =
            "";

    }


    if (endDate) {

        endDate.value =
            "";

    }


    loadInventoryCard();

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeInventoryCardPage() {

    const page =
        document.getElementById(
            "inventoryCardPage"
        );


    if (!page) {
        return;
    }


    if (
        page.dataset.initialized ===
        "true"
    ) {
        return;
    }


    page.dataset.initialized =
        "true";


    const productFilter =
        document.getElementById(
            "inventoryCardProductFilter"
        );


    const applyButton =
        document.getElementById(
            "applyInventoryCardFilterButton"
        );


    const resetButton =
        document.getElementById(
            "resetInventoryCardFilterButton"
        );


    const refreshButton =
        document.getElementById(
            "refreshInventoryCardButton"
        );


    const downloadPdfButton =
        document.getElementById(
            "downloadInventoryCardPdfButton"
        );


    /* =====================================================
       PILIH PRODUK
    ===================================================== */

    if (productFilter) {

        productFilter.addEventListener(
            "change",
            function () {

                loadInventoryCard();

            }
        );

    }


    /* =====================================================
       TAMPILKAN
    ===================================================== */

    if (applyButton) {

        applyButton.addEventListener(
            "click",
            function () {

                applyInventoryCardFilter();

            }
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function () {

                resetInventoryCardFilter();

            }
        );

    }


    /* =====================================================
       REFRESH
    ===================================================== */

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                loadInventoryCardProducts();

                loadInventoryCard();

                updateInventoryCardOpenedAt();

            }
        );

    }


    /* =====================================================
       DOWNLOAD PDF
    ===================================================== */

    if (downloadPdfButton) {

        downloadPdfButton.addEventListener(
            "click",
            function () {

                downloadInventoryCardPDF();

            }
        );

    }


    /* =====================================================
       TIMESTAMP
    ===================================================== */

    updateInventoryCardOpenedAt();


    /* =====================================================
       LOAD PRODUK
    ===================================================== */

    loadInventoryCardProducts();

}


/* =========================================================
   LAPORAN HPP FIFO
   ========================================================= */


/* =========================================================
   1. BUKA LAPORAN HPP
========================================================= */

function openHppReport() {

    const reportMenu =
        document.getElementById(
            "reportMenu"
        );

    const hppReportDetail =
        document.getElementById(
            "hppReportDetail"
        );

    const otherReportPlaceholder =
        document.getElementById(
            "otherReportPlaceholder"
        );


    if (reportMenu) {

        reportMenu.style.display =
            "none";

    }


    if (otherReportPlaceholder) {

        otherReportPlaceholder.style.display =
            "none";

    }


    if (hppReportDetail) {

        hppReportDetail.style.display =
            "block";

    }


    loadHppProductFilter();

    loadHppReport();
}


/* =========================================================
   2. KEMBALI KE MENU REPORT
========================================================= */

function closeHppReport() {

    const reportMenu =
        document.getElementById(
            "reportMenu"
        );

    const hppReportDetail =
        document.getElementById(
            "hppReportDetail"
        );


    if (hppReportDetail) {

        hppReportDetail.style.display =
            "none";

    }


    if (reportMenu) {

        reportMenu.style.display =
            "grid";

    }

}


/* =========================================================
   3. LOAD PRODUK UNTUK FILTER
========================================================= */

async function loadHppProductFilter() {

    const select =
        document.getElementById(
            "hppProductFilter"
        );


    if (!select) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("products")

            .select(
                "id, name"
            )

            .eq(
                "is_active",
                true
            )

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        select.innerHTML =
            `
                <option value="">
                    Semua produk
                </option>
            `;


        (data || []).forEach(
            function (product) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    product.id;


                option.textContent =
                    product.name;


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat produk untuk laporan HPP:",
            error
        );

    }

}


/* =========================================================
   4. LOAD LAPORAN HPP FIFO
========================================================= */

async function loadHppReport() {

    const tableBody =
        document.getElementById(
            "hppReportTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML =
        `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <strong>
                            Memuat laporan...
                        </strong>
                        <span>
                            Sedang mengambil data HPP FIFO.
                        </span>
                    </div>
                </td>
            </tr>
        `;


    try {

        /* =============================================
           FILTER
        ============================================= */

        const startDate =
            document.getElementById(
                "hppStartDate"
            )?.value || "";


        const endDate =
            document.getElementById(
                "hppEndDate"
            )?.value || "";


        const productId =
            document.getElementById(
                "hppProductFilter"
            )?.value || "";


        /* =============================================
           1. AMBIL SALES
        ============================================= */

        let salesQuery =
            supabaseClient

                .from("sales")

                .select(
                    "id, sale_number, sale_date"
                )

                .order(
                    "sale_date",
                    {
                        ascending: true
                    }
                );


        if (startDate) {

            salesQuery =
                salesQuery.gte(
                    "sale_date",
                    startDate
                );

        }


        if (endDate) {

            salesQuery =
                salesQuery.lte(
                    "sale_date",
                    endDate
                );

        }


        const {
            data: sales,
            error: salesError
        } = await salesQuery;


        if (salesError) {
            throw salesError;
        }


        if (
            !sales ||
            sales.length === 0
        ) {

            renderEmptyHppReport(
                "Belum ada transaksi penjualan pada periode tersebut."
            );

            return;

        }


        /* =============================================
           2. AMBIL SALE ITEMS
        ============================================= */

        const saleIds =
            sales.map(
                function (sale) {

                    return sale.id;

                }
            );


        let saleItemsQuery =
            supabaseClient

                .from("sale_items")

                .select(
                    `
                        id,
                        sale_id,
                        product_id,
                        quantity,
                        selling_price,
                        cogs,
                        subtotal
                    `
                )

                .in(
                    "sale_id",
                    saleIds
                );


        if (productId) {

            saleItemsQuery =
                saleItemsQuery.eq(
                    "product_id",
                    productId
                );

        }


        const {
            data: saleItems,
            error: saleItemsError
        } = await saleItemsQuery;


        if (saleItemsError) {
            throw saleItemsError;
        }


        if (
            !saleItems ||
            saleItems.length === 0
        ) {

            renderEmptyHppReport(
                "Belum ada detail penjualan yang sesuai filter."
            );

            return;

        }


        /* =============================================
           3. AMBIL NAMA PRODUK
        ============================================= */

        const productIds =
            [
                ...new Set(
                    saleItems.map(
                        function (item) {

                            return item.product_id;

                        }
                    )
                )
            ];


        const {
            data: productsData,
            error: productsError
        } = await supabaseClient

            .from("products")

            .select(
                "id, name"
            )

            .in(
                "id",
                productIds
            );


        if (productsError) {
            throw productsError;
        }


        const productMap =
            {};


        (productsData || []).forEach(
            function (product) {

                productMap[
                    String(
                        product.id
                    )
                ] =
                    product.name;

            }
        );


        /* =============================================
           4. AMBIL DETAIL FIFO
           
           PENTING:
           Hanya transaksi yang benar-benar
           memiliki pengambilan layer FIFO
           yang akan masuk laporan.
        ============================================= */

        const saleItemIds =
            saleItems.map(
                function (item) {

                    return item.id;

                }
            );


        const {
            data: fifoDetails,
            error: fifoError
        } = await supabaseClient

            .from("sale_fifo_details")

            .select(
                `
                    sale_id,
                    sale_item_id,
                    inventory_layer_id,
                    quantity_taken,
                    unit_cost
                `
            )

            .in(
                "sale_item_id",
                saleItemIds
            );


        if (fifoError) {
            throw fifoError;
        }


        /* =============================================
           5. MAP SALES
        ============================================= */

        const salesMap =
            {};


        sales.forEach(
            function (sale) {

                salesMap[
                    String(
                        sale.id
                    )
                ] =
                    sale;

            }
        );


        /* =============================================
           6. MAP SALE ITEMS
        ============================================= */

        const saleItemMap =
            {};


        saleItems.forEach(
            function (item) {

                saleItemMap[
                    String(
                        item.id
                    )
                ] =
                    item;

            }
        );


        /* =============================================
           7. BUILD REPORT ROWS
           
           HANYA dari sale_fifo_details.
           
           Jadi:
           - produk tanpa penjualan -> tidak muncul
           - produk tanpa FIFO consumption -> tidak muncul
           - transaksi multi-layer -> beberapa baris
        ============================================= */

        const reportRows =
            [];


        (fifoDetails || []).forEach(
            function (detail) {

                const sale =
                    salesMap[
                        String(
                            detail.sale_id
                        )
                    ];


                const item =
                    saleItemMap[
                        String(
                            detail.sale_item_id
                        )
                    ];


                if (!sale || !item) {
                    return;
                }


                const quantity =
                    Number(
                        detail.quantity_taken
                    ) || 0;


                const unitCost =
                    Number(
                        detail.unit_cost
                    ) || 0;


                if (
                    quantity <= 0
                ) {
                    return;
                }


                reportRows.push({

                    saleId:
                        sale.id,

                    saleDate:
                        sale.sale_date,

                    saleNumber:
                        sale.sale_number,

                    productName:
                        productMap[
                            String(
                                item.product_id
                            )
                        ] || "-",

                    quantity:
                        quantity,

                    sellingPrice:
                        Number(
                            item.selling_price
                        ) || 0,

                    unitCost:
                        unitCost,

                    totalCogs:
                        quantity *
                        unitCost

                });

            }
        );


        /* =============================================
           8. URUTKAN DATA
        ============================================= */

        reportRows.sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.saleDate
                    ).getTime();


                const dateB =
                    new Date(
                        b.saleDate
                    ).getTime();


                if (
                    dateA !==
                    dateB
                ) {

                    return (
                        dateA -
                        dateB
                    );

                }


                return String(
                    a.saleNumber || ""
                ).localeCompare(
                    String(
                        b.saleNumber || ""
                    )
                );

            }
        );


        /* =============================================
           9. VALIDASI HASIL
        ============================================= */

        if (
            reportRows.length === 0
        ) {

            renderEmptyHppReport(
                "Belum ada pengambilan persediaan FIFO pada periode tersebut."
            );

            return;

        }


        /* =============================================
           10. RENDER
        ============================================= */

        renderHppReport(
            reportRows
        );


    } catch (error) {

        console.error(
            "Gagal memuat laporan HPP FIFO:",
            error
        );


        tableBody.innerHTML =
            `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">

                            <strong>
                                Laporan gagal dimuat
                            </strong>

                            <span>
                                ${escapeHtml(
                                    error.message ||
                                    "Terjadi kesalahan."
                                )}
                            </span>

                        </div>
                    </td>
                </tr>
            `;

    }

}


/* =========================================================
   5. RENDER LAPORAN HPP
========================================================= */

function renderHppReport(
    rows
) {

    const tableBody =
        document.getElementById(
            "hppReportTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (
        !rows ||
        rows.length === 0
    ) {

        renderEmptyHppReport(
            "Belum ada data HPP FIFO."
        );

        return;

    }


    /* =============================================
       TOTAL
    ============================================= */

    let totalQuantity = 0;
    let totalSales = 0;
    let totalCogs = 0;


    let html = "";


    /* =============================================
       TRACKING TRANSAKSI

       Dipakai supaya transaksi yang terdiri
       dari beberapa layer FIFO tidak dihitung
       penjualannya berkali-kali.
    ============================================= */

    const countedSaleItems =
        {};


    let currentSaleItemKey =
        null;


    rows.forEach(
        function (row) {

            /*
             * Karena render sebelumnya hanya punya
             * saleId, kita gunakan kombinasi:
             * saleId + productName
             *
             * untuk mengidentifikasi transaksi produk.
             */

            const saleItemKey =
                String(
                    row.saleId
                ) +
                "_" +
                String(
                    row.productName
                );


            const isFirstLayer =
                !countedSaleItems[
                    saleItemKey
                ];


            if (isFirstLayer) {

                countedSaleItems[
                    saleItemKey
                ] =
                    true;

            }


            /* =====================================
               TOTAL HPP
            ===================================== */

            const rowCogs =
                Number(
                    row.totalCogs
                ) || 0;


            totalCogs +=
                rowCogs;


            /* =====================================
               TOTAL QTY

               Setiap layer FIFO memang harus
               dijumlahkan karena quantity_taken
               adalah quantity yang benar-benar
               keluar dari layer tersebut.
            ===================================== */

            totalQuantity +=
                Number(
                    row.quantity
                ) || 0;


            /* =====================================
               TOTAL PENJUALAN

               HANYA HITUNG SEKALI PER
               TRANSAKSI PRODUK.
            ===================================== */

            if (isFirstLayer) {

                /*
                 * Untuk mendapatkan total quantity
                 * penjualan produk tersebut, kita
                 * jumlahkan seluruh layer FIFO
                 * pada sale + product yang sama.
                 */

                let saleItemQuantity =
                    0;


                rows.forEach(
                    function (otherRow) {

                        const otherKey =
                            String(
                                otherRow.saleId
                            ) +
                            "_" +
                            String(
                                otherRow.productName
                            );


                        if (
                            otherKey ===
                            saleItemKey
                        ) {

                            saleItemQuantity +=
                                Number(
                                    otherRow.quantity
                                ) || 0;

                        }

                    }
                );


                totalSales +=
                    saleItemQuantity *
                    Number(
                        row.sellingPrice
                    );

            }


            /* =====================================
               TENTUKAN BARIS PERTAMA
            ===================================== */

            const isFirstDisplayRow =
                currentSaleItemKey !==
                saleItemKey;


            if (
                isFirstDisplayRow
            ) {

                currentSaleItemKey =
                    saleItemKey;

            }


            /* =====================================
               RENDER
            ===================================== */

            html +=
                `
                    <tr
                        class="${
                            isFirstDisplayRow
                                ? ""
                                : "hpp-layer-row"
                        }"
                    >

                        <td>
                            ${
                                isFirstDisplayRow
                                    ? formatDate(
                                        row.saleDate
                                    )
                                    : ""
                            }
                        </td>

                        <td>
                            ${
                                isFirstDisplayRow
                                    ? escapeHtml(
                                        row.saleNumber
                                    )
                                    : ""
                            }
                        </td>

                        <td>
                            ${
                                isFirstDisplayRow
                                    ? escapeHtml(
                                        row.productName
                                    )
                                    : ""
                            }
                        </td>

                        <td>
                            ${formatNumber(
                                row.quantity
                            )}
                        </td>

                        <td>
                            ${
                                isFirstDisplayRow
                                    ? formatCurrency(
                                        row.sellingPrice
                                    )
                                    : ""
                            }
                        </td>

                        <td>
                            ${
                                row.unitCost > 0
                                    ? formatCurrency(
                                        row.unitCost
                                    )
                                    : "-"
                            }
                        </td>

                        <td>
                            ${formatCurrency(
                                rowCogs
                            )}
                        </td>

                    </tr>
                `;

        }
    );


    /* =============================================
       TOTAL ROW
    ============================================= */

    html +=
        `
            <tr class="hpp-total-row">

                <td
                    colspan="3"
                    class="hpp-total-label"
                >
                    TOTAL
                </td>

                <td
                    class="hpp-total-quantity"
                >
                    ${formatNumber(
                        totalQuantity
                    )}
                </td>

                <td
                    class="hpp-total-sales"
                >
                    ${formatCurrency(
                        totalSales
                    )}
                </td>

                <td
                    class="hpp-total-empty"
                >
                </td>

                <td
                    class="hpp-total-cogs"
                >
                    ${formatCurrency(
                        totalCogs
                    )}
                </td>

            </tr>
        `;


    tableBody.innerHTML =
        html;


    /* =============================================
       SUMMARY
    ============================================= */

    const totalSalesElement =
        document.getElementById(
            "hppTotalSales"
        );


    const totalCogsElement =
        document.getElementById(
            "hppTotalCogs"
        );


    const totalQuantityElement =
        document.getElementById(
            "hppTotalQuantity"
        );


    const grossProfitElement =
        document.getElementById(
            "hppGrossProfit"
        );


    if (totalQuantityElement) {

        totalQuantityElement.textContent =
            formatNumber(
                totalQuantity
            ) +
            " unit";

    }


    if (totalSalesElement) {

        totalSalesElement.textContent =
            formatCurrency(
                totalSales
            );

    }


    if (totalCogsElement) {

        totalCogsElement.textContent =
            formatCurrency(
                totalCogs
            );

    }


    if (grossProfitElement) {

        grossProfitElement.textContent =
            formatCurrency(
                totalSales -
                totalCogs
            );

    }

}


/* =========================================================
   6. EMPTY REPORT
========================================================= */

function renderEmptyHppReport(
    message
) {

    const tableBody =
        document.getElementById(
            "hppReportTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML =
        `
            <tr>

                <td colspan="7">

                    <div class="empty-state">

                        <strong>
                            Belum ada data
                        </strong>

                        <span>
                            ${escapeHtml(
                                message
                            )}
                        </span>

                    </div>

                </td>

            </tr>
        `;


    const ids =
        [
            "hppTotalQuantity",
            "hppTotalSales",
            "hppTotalCogs",
            "hppGrossProfit"
        ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    id ===
                    "hppTotalQuantity"
                        ? "0 unit"
                        : "Rp0";

            }

        }
    );

}


/* =========================================================
   7. EVENT LISTENER
========================================================= */

function initHppReportEvents() {

    const openButton =
        document.getElementById(
            "openHppReportButton"
        );


    const backButton =
        document.getElementById(
            "backToReportMenuButton"
        );


    const applyButton =
        document.getElementById(
            "applyHppFilterButton"
        );


    const resetButton =
        document.getElementById(
            "resetHppFilterButton"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openHppReport
        );

    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            closeHppReport
        );

    }


    if (applyButton) {

        applyButton.addEventListener(
            "click",
            loadHppReport
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function () {

                const startDate =
                    document.getElementById(
                        "hppStartDate"
                    );


                const endDate =
                    document.getElementById(
                        "hppEndDate"
                    );


                const product =
                    document.getElementById(
                        "hppProductFilter"
                    );


                if (startDate) {
                    startDate.value = "";
                }


                if (endDate) {
                    endDate.value = "";
                }


                if (product) {
                    product.value = "";
                }


                loadHppReport();

            }
        );

    }

}


/* =========================================================
   8. INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initHppReportEvents();

    }
);


/* =========================================================
   HELPER FORMAT CURRENCY
   Digunakan oleh Laporan HPP FIFO
========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ).format(number);
}


/* =========================================================
   REPORT 03 - LAPORAN PENJUALAN
========================================================= */


/* =========================================================
   OPEN SALES REPORT
========================================================= */

function openSalesReport() {

    const reportMenu =
        document.getElementById(
            "reportMenu"
        );

    const hppReportDetail =
        document.getElementById(
            "hppReportDetail"
        );

    const salesReportDetail =
        document.getElementById(
            "salesReportDetail"
        );

    const otherReportPlaceholder =
        document.getElementById(
            "otherReportPlaceholder"
        );


    if (reportMenu) {
        reportMenu.style.display =
            "none";
    }

    if (hppReportDetail) {
        hppReportDetail.style.display =
            "none";
    }

    if (otherReportPlaceholder) {
        otherReportPlaceholder.style.display =
            "none";
    }

    if (salesReportDetail) {
        salesReportDetail.style.display =
            "block";
    }


    loadSalesReportFilters();

    loadSalesReport();

}


/* =========================================================
   CLOSE SALES REPORT
========================================================= */

function closeSalesReport() {

    const salesReportDetail =
        document.getElementById(
            "salesReportDetail"
        );

    const reportMenu =
        document.getElementById(
            "reportMenu"
        );


    if (salesReportDetail) {
        salesReportDetail.style.display =
            "none";
    }

    if (reportMenu) {
        reportMenu.style.display =
            "grid";
    }

}


/* =========================================================
   LOAD FILTER DROPDOWNS
========================================================= */

async function loadSalesReportFilters() {

    await loadSalesReportProductFilter();

    await loadSalesReportCustomerFilter();

}


/* =========================================================
   PRODUCT FILTER
========================================================= */

async function loadSalesReportProductFilter() {

    const select =
        document.getElementById(
            "salesReportProductFilter"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `
            <option value="">
                Semua produk
            </option>
        `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("products")

            .select("*")

            .order(
                "name",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        (data || []).forEach(
            function(product) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    product.id;


                option.textContent =
                    product.name || "-";


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat produk untuk laporan penjualan:",
            error
        );

    }

}


/* =========================================================
   CUSTOMER FILTER
========================================================= */

async function loadSalesReportCustomerFilter() {

    const select =
        document.getElementById(
            "salesReportCustomerFilter"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `
            <option value="">
                Semua pelanggan
            </option>
        `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("customers")

            .select("*")

            .order(
                "id",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        (data || []).forEach(
            function(customer) {

                const customerId =
                    getObjectValue(
                        customer,
                        [
                            "id",
                            "customer_id",
                            "id_customer"
                        ]
                    );


                const customerName =
                    getObjectValue(
                        customer,
                        [
                            "name",
                            "customer_name",
                            "nama",
                            "nama_pelanggan",
                            "full_name"
                        ]
                    ) || "-";


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    customerId;


                option.textContent =
                    customerName;


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Gagal memuat pelanggan untuk laporan penjualan:",
            error
        );

    }

}


/* =========================================================
   LOAD SALES REPORT
========================================================= */

async function loadSalesReport() {

    const tableBody =
        document.getElementById(
            "salesReportTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML =
        `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <strong>
                            Memuat laporan...
                        </strong>
                        <span>
                            Data penjualan sedang diambil.
                        </span>
                    </div>
                </td>
            </tr>
        `;


    try {

        /* =================================================
           AMBIL SALES
        ================================================= */

        const {
            data: salesData,
            error: salesError
        } = await supabaseClient

            .from("sales")

            .select("*")

            .order(
                "sale_date",
                {
                    ascending: true
                }
            );


        if (salesError) {
            throw salesError;
        }


        /* =================================================
           AMBIL SALE ITEMS
        ================================================= */

        const {
            data: saleItemsData,
            error: saleItemsError
        } = await supabaseClient

            .from("sale_items")

            .select("*");


        if (saleItemsError) {
            throw saleItemsError;
        }


        /* =================================================
           AMBIL PRODUCTS
        ================================================= */

        const {
            data: productsData,
            error: productsError
        } = await supabaseClient

            .from("products")

            .select("*");


        if (productsError) {
            throw productsError;
        }


        /* =================================================
           AMBIL CUSTOMERS
        ================================================= */

        let customersData = [];


        try {

            const {
                data,
                error
            } = await supabaseClient

                .from("customers")

                .select("*");


            if (!error) {
                customersData =
                    data || [];
            }

        } catch (customerError) {

            console.warn(
                "Data pelanggan tidak dapat dibaca:",
                customerError
            );

        }


        /* =================================================
           FILTER
        ================================================= */

        const startDate =
            document.getElementById(
                "salesReportStartDate"
            )?.value || "";


        const endDate =
            document.getElementById(
                "salesReportEndDate"
            )?.value || "";


        const customerFilter =
            document.getElementById(
                "salesReportCustomerFilter"
            )?.value || "";


        const productFilter =
            document.getElementById(
                "salesReportProductFilter"
            )?.value || "";


        /* =================================================
           BUAT LOOKUP
        ================================================= */

        const salesMap =
            {};


        (salesData || []).forEach(
            function(sale) {

                salesMap[
                    String(sale.id)
                ] = sale;

            }
        );


        const productsMap =
            {};


        (productsData || []).forEach(
            function(product) {

                productsMap[
                    String(product.id)
                ] = product;

            }
        );


        const customersMap =
            {};


        (customersData || []).forEach(
            function(customer) {

                const customerId =
                    getObjectValue(
                        customer,
                        [
                            "id",
                            "customer_id",
                            "id_customer"
                        ]
                    );


                customersMap[
                    String(customerId)
                ] = customer;

            }
        );


        /* =================================================
           GABUNGKAN DATA
        ================================================= */

        const rows =
            [];


        (saleItemsData || []).forEach(
            function(item) {

                const sale =
                    salesMap[
                        String(item.sale_id)
                    ];


                if (!sale) {
                    return;
                }


                const product =
                    productsMap[
                        String(item.product_id)
                    ];


                const customer =
                    customersMap[
                        String(sale.customer_id)
                    ];


                const saleDate =
                    getObjectValue(
                        sale,
                        [
                            "sale_date",
                            "transaction_date",
                            "date",
                            "created_at"
                        ]
                    );


                const customerId =
                    getObjectValue(
                        sale,
                        [
                            "customer_id",
                            "id_customer"
                        ]
                    );


                const productId =
                    getObjectValue(
                        item,
                        [
                            "product_id",
                            "id_product",
                            "productId",
                            "id_produk"
                        ]
                    );


                /* =========================================
                   FILTER TANGGAL
                ========================================= */

                if (
                    startDate &&
                    saleDate &&
                    String(saleDate).slice(0, 10)
                        < startDate
                ) {

                    return;

                }


                if (
                    endDate &&
                    saleDate &&
                    String(saleDate).slice(0, 10)
                        > endDate
                ) {

                    return;

                }


                /* =========================================
                   FILTER CUSTOMER
                ========================================= */

                if (
                    customerFilter &&
                    String(customerId)
                        !== String(customerFilter)
                ) {

                    return;

                }


                /* =========================================
                   FILTER PRODUCT
                ========================================= */

                if (
                    productFilter &&
                    String(productId)
                        !== String(productFilter)
                ) {

                    return;

                }


                /* =========================================
                   CUSTOMER NAME
                ========================================= */

                const customerName =
                    customer
                        ? (
                            getObjectValue(
                                customer,
                                [
                                    "name",
                                    "customer_name",
                                    "nama",
                                    "nama_pelanggan",
                                    "full_name"
                                ]
                            ) || "-"
                        )
                        : "-";


                /* =========================================
                   PRODUCT NAME
                ========================================= */

                const productName =
                    product
                        ? (
                            product.name || "-"
                        )
                        : "-";


                /* =========================================
                   DATA NILAI
                ========================================= */

                const quantity =
                    Number(
                        item.quantity || 0
                    );


                const sellingPrice =
                    Number(
                        item.selling_price || 0
                    );


                /*
                 * PENTING:
                 * Gunakan subtotal dari database.
                 * Jangan hitung ulang quantity × selling_price.
                 */

                const subtotal =
                    Number(
                        item.subtotal || 0
                    );


                rows.push({

                    saleId:
                        sale.id,

                    saleItemId:
                        item.id,

                    saleDate:
                        saleDate,

                    saleNumber:
                        sale.sale_number || "-",

                    customerName:
                        customerName,

                    productName:
                        productName,

                    productId:
                        productId,

                    quantity:
                        quantity,

                    sellingPrice:
                        sellingPrice,

                    subtotal:
                        subtotal

                });

            }
        );


        /* =================================================
           URUTKAN DATA
        ================================================= */

        rows.sort(
            function(a, b) {

                const dateA =
                    new Date(
                        a.saleDate || 0
                    ).getTime();


                const dateB =
                    new Date(
                        b.saleDate || 0
                    ).getTime();


                return dateA - dateB;

            }
        );


        renderSalesReport(
            rows
        );


    } catch (error) {

        console.error(
            "Gagal memuat laporan penjualan:",
            error
        );


        tableBody.innerHTML =
            `
                <tr>
                    <td colspan="7">

                        <div class="empty-state">

                            <strong>
                                Gagal memuat laporan
                            </strong>

                            <span>
                                Terjadi kesalahan saat mengambil
                                data penjualan.
                            </span>

                        </div>

                    </td>
                </tr>
            `;

    }

}


/* =========================================================
   RENDER SALES REPORT
========================================================= */

function renderSalesReport(
    rows
) {

    const tableBody =
        document.getElementById(
            "salesReportTableBody"
        );


    const totalTransactionsElement =
        document.getElementById(
            "salesReportTotalTransactions"
        );


    const totalQuantityElement =
        document.getElementById(
            "salesReportTotalQuantity"
        );


    const totalSalesElement =
        document.getElementById(
            "salesReportTotalSales"
        );


    if (!tableBody) {
        return;
    }


    /* =====================================================
       DATA KOSONG
    ===================================================== */

    if (!rows.length) {

        tableBody.innerHTML =
            `
                <tr>

                    <td colspan="7">

                        <div class="empty-state">

                            <strong>
                                Tidak ada data penjualan
                            </strong>

                            <span>
                                Tidak ditemukan transaksi
                                sesuai filter yang dipilih.
                            </span>

                        </div>

                    </td>

                </tr>
            `;


        if (totalTransactionsElement) {
            totalTransactionsElement.textContent =
                "0";
        }


        if (totalQuantityElement) {
            totalQuantityElement.textContent =
                "0";
        }


        if (totalSalesElement) {
            totalSalesElement.textContent =
                "Rp0";
        }


        return;

    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    const transactionIds =
        new Set();


    let totalQuantity =
        0;


    let totalSales =
        0;


    rows.forEach(
        function(row) {

            transactionIds.add(
                String(
                    row.saleId
                )
            );


            totalQuantity +=
                Number(
                    row.quantity
                ) || 0;


            totalSales +=
                Number(
                    row.subtotal
                ) || 0;

        }
    );


    if (totalTransactionsElement) {

        totalTransactionsElement.textContent =
            formatNumber(
                transactionIds.size
            );

    }


    if (totalQuantityElement) {

        totalQuantityElement.textContent =
            formatNumber(
                totalQuantity
            );

    }


    if (totalSalesElement) {

        totalSalesElement.textContent =
            formatCurrency(
                totalSales
            );

    }


    /* =====================================================
       TABLE
    ===================================================== */

    let html =
        "";


    rows.forEach(
        function(row) {

            html +=
                `
                    <tr>

                        <td>
                            ${formatDate(
                                row.saleDate
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                row.saleNumber
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                row.customerName
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                row.productName
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                row.quantity
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                row.sellingPrice
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                row.subtotal
                            )}
                        </td>

                    </tr>
                `;

        }
    );


    /* =====================================================
       TOTAL ROW
    ===================================================== */

    html +=
        `
            <tr class="sales-total-row">

                <td
                    colspan="4"
                    class="sales-total-label"
                >
                    TOTAL
                </td>


                <td class="sales-total-quantity">
                    ${formatNumber(
                        totalQuantity
                    )}
                </td>


                <td class="sales-total-price">
                </td>


                <td class="sales-total-subtotal">
                    ${formatCurrency(
                        totalSales
                    )}
                </td>

            </tr>
        `;


    tableBody.innerHTML =
        html;

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetSalesReportFilter() {

    const startDate =
        document.getElementById(
            "salesReportStartDate"
        );


    const endDate =
        document.getElementById(
            "salesReportEndDate"
        );


    const customerFilter =
        document.getElementById(
            "salesReportCustomerFilter"
        );


    const productFilter =
        document.getElementById(
            "salesReportProductFilter"
        );


    if (startDate) {
        startDate.value =
            "";
    }


    if (endDate) {
        endDate.value =
            "";
    }


    if (customerFilter) {
        customerFilter.value =
            "";
    }


    if (productFilter) {
        productFilter.value =
            "";
    }


    loadSalesReport();

}


/* =========================================================
   EVENT REPORT 03
========================================================= */

function initSalesReportEvents() {

    const openButton =
        document.getElementById(
            "openSalesReportButton"
        );


    const backButton =
        document.getElementById(
            "backToReportMenuFromSalesButton"
        );


    const applyButton =
        document.getElementById(
            "applySalesReportFilterButton"
        );


    const resetButton =
        document.getElementById(
            "resetSalesReportFilterButton"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openSalesReport
        );

    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            closeSalesReport
        );

    }


    if (applyButton) {

        applyButton.addEventListener(
            "click",
            loadSalesReport
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetSalesReportFilter
        );

    }

}


/* =========================================================
   INITIALIZE REPORT 03
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initSalesReportEvents();

    }
);


/* =========================================================
   REPORT 04 - LAPORAN LABA RUGI
========================================================= */


/* =========================================================
   STATE
========================================================= */

let profitLossReportRows = [];


/* =========================================================
   OPEN REPORT
========================================================= */

function openProfitLossReport() {

    const reportMenu =
        document.getElementById(
            "reportMenu"
        );


    const hppReportDetail =
        document.getElementById(
            "hppReportDetail"
        );


    const salesReportDetail =
        document.getElementById(
            "salesReportDetail"
        );


    const profitLossReportDetail =
        document.getElementById(
            "profitLossReportDetail"
        );


    const otherReportPlaceholder =
        document.getElementById(
            "otherReportPlaceholder"
        );


    if (reportMenu) {

        reportMenu.style.display =
            "none";

    }


    if (hppReportDetail) {

        hppReportDetail.style.display =
            "none";

    }


    if (salesReportDetail) {

        salesReportDetail.style.display =
            "none";

    }


    if (otherReportPlaceholder) {

        otherReportPlaceholder.style.display =
            "none";

    }


    if (profitLossReportDetail) {

        profitLossReportDetail.style.display =
            "block";

    }


    setProfitLossDefaultPeriod();

    updateProfitLossPeriodFields();

    updateProfitLossOpenedAt();

    loadProfitLossReport();

}


/* =========================================================
   CLOSE REPORT
========================================================= */

function closeProfitLossReport() {

    const reportMenu =
        document.getElementById(
            "reportMenu"
        );


    const profitLossReportDetail =
        document.getElementById(
            "profitLossReportDetail"
        );


    if (profitLossReportDetail) {

        profitLossReportDetail.style.display =
            "none";

    }


    if (reportMenu) {

        reportMenu.style.display =
            "block";

    }

}


/* =========================================================
   DEFAULT PERIOD
========================================================= */

function setProfitLossDefaultPeriod() {

    const periodType =
        document.getElementById(
            "profitLossPeriodType"
        );


    const monthInput =
        document.getElementById(
            "profitLossMonth"
        );


    if (periodType) {

        periodType.value =
            "monthly";

    }


    if (monthInput) {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        monthInput.value =
            `${year}-${month}`;

    }

}


/* =========================================================
   UPDATE PERIOD FIELDS
========================================================= */

function updateProfitLossPeriodFields() {

    const periodType =
        document.getElementById(
            "profitLossPeriodType"
        );


    const monthGroup =
        document.getElementById(
            "profitLossMonthGroup"
        );


    const startDateGroup =
        document.getElementById(
            "profitLossStartDateGroup"
        );


    const endDateGroup =
        document.getElementById(
            "profitLossEndDateGroup"
        );


    if (
        !periodType ||
        !monthGroup ||
        !startDateGroup ||
        !endDateGroup
    ) {

        return;

    }


    if (
        periodType.value ===
        "custom"
    ) {

        monthGroup.style.display =
            "none";


        startDateGroup.style.display =
            "flex";


        endDateGroup.style.display =
            "flex";

    } else {

        monthGroup.style.display =
            "flex";


        startDateGroup.style.display =
            "none";


        endDateGroup.style.display =
            "none";

    }

}


/* =========================================================
   GET REPORT PERIOD
========================================================= */

function getProfitLossPeriod() {

    const periodTypeElement =
        document.getElementById(
            "profitLossPeriodType"
        );


    const monthElement =
        document.getElementById(
            "profitLossMonth"
        );


    const startDateElement =
        document.getElementById(
            "profitLossStartDate"
        );


    const endDateElement =
        document.getElementById(
            "profitLossEndDate"
        );


    const periodType =
        periodTypeElement
            ? periodTypeElement.value
            : "monthly";


    /* =====================================================
       CUSTOM
    ===================================================== */

    if (
        periodType ===
        "custom"
    ) {

        return {

            startDate:
                startDateElement
                    ? startDateElement.value
                    : "",

            endDate:
                endDateElement
                    ? endDateElement.value
                    : ""

        };

    }


    /* =====================================================
       MONTH
    ===================================================== */

    const selectedMonth =
        monthElement
            ? monthElement.value
            : "";


    if (!selectedMonth) {

        return {

            startDate: "",
            endDate: ""

        };

    }


    const parts =
        selectedMonth.split(
            "-"
        );


    const year =
        Number(
            parts[0]
        );


    const month =
        Number(
            parts[1]
        );


    let startDate;
    let endDate;


    /* =====================================================
       BULANAN
    ===================================================== */

    if (
        periodType ===
        "monthly"
    ) {

        startDate =
            new Date(
                year,
                month - 1,
                1
            );


        endDate =
            new Date(
                year,
                month,
                0
            );

    }


    /* =====================================================
       3 BULAN
    ===================================================== */

    else if (
        periodType ===
        "quarterly"
    ) {

        const quarterStartMonth =
            Math.floor(
                (month - 1) / 3
            ) * 3;


        startDate =
            new Date(
                year,
                quarterStartMonth,
                1
            );


        endDate =
            new Date(
                year,
                quarterStartMonth + 3,
                0
            );

    }


    /* =====================================================
       6 BULAN
    ===================================================== */

    else if (
        periodType ===
        "semester"
    ) {

        const semesterStartMonth =
            month <= 6
                ? 0
                : 6;


        startDate =
            new Date(
                year,
                semesterStartMonth,
                1
            );


        endDate =
            new Date(
                year,
                semesterStartMonth + 6,
                0
            );

    }


    /* =====================================================
       1 TAHUN
    ===================================================== */

    else {

        startDate =
            new Date(
                year,
                0,
                1
            );


        endDate =
            new Date(
                year,
                12,
                0
            );

    }


    return {

        startDate:
            formatDateForSupabase(
                startDate
            ),

        endDate:
            formatDateForSupabase(
                endDate
            )

    };

}


/* =========================================================
   DATE → YYYY-MM-DD
========================================================= */

function formatDateForSupabase(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


/* =========================================================
   FORMAT PERIOD TEXT
========================================================= */

function formatProfitLossPeriodText(
    startDate,
    endDate
) {

    const start =
        new Date(
            startDate
        );

    const end =
        new Date(
            endDate
        );


    const startDay =
        String(
            start.getDate()
        ).padStart(
            2,
            "0"
        );


    const endDay =
        String(
            end.getDate()
        ).padStart(
            2,
            "0"
        );


    const startMonth =
        start.toLocaleDateString(
            "id-ID",
            {
                month: "long"
            }
        );


    const endMonth =
        end.toLocaleDateString(
            "id-ID",
            {
                month: "long"
            }
        );


    const startYear =
        start.getFullYear();

    const endYear =
        end.getFullYear();


    /* =====================================================
       JIKA HANYA SATU BULAN
       ===================================================== */

    if (
        start.getMonth() === end.getMonth() &&
        startYear === endYear
    ) {

        return (
            "Untuk periode " +
            startDay +
            " " +
            startMonth +
            " " +
            startYear +
            " s.d. " +
            endDay +
            " " +
            endMonth +
            " " +
            endYear
        );

    }


    /* =====================================================
       JIKA PERIODE LEBIH DARI SATU BULAN
       ===================================================== */

    return (
        "Untuk periode " +
        startDay +
        " " +
        startMonth +
        " " +
        startYear +
        " s.d. " +
        endDay +
        " " +
        endMonth +
        " " +
        endYear
    );

}


/* =========================================================
   LOAD REPORT
========================================================= */

async function loadProfitLossReport() {

    const period =
        getProfitLossPeriod();


    if (
        !period.startDate ||
        !period.endDate
    ) {

        showToast(
            "Periode laporan belum lengkap.",
            "error"
        );

        return;

    }


    if (
        period.startDate >
        period.endDate
    ) {

        showToast(
            "Tanggal mulai tidak boleh lebih besar dari tanggal akhir.",
            "error"
        );

        return;

    }


    try {

        /* =================================================
           AMBIL SALES ITEMS
        ================================================== */

        const {
            data,
            error
        } = await supabaseClient

            .from(
                "sale_items"
            )

            .select(
                `
                    id,
                    sale_id,
                    quantity,
                    subtotal,
                    cogs,
                    sales (
                        sale_date,
                        status
                    )
                `
            );


        if (error) {

            throw error;

        }


        /* =================================================
           FILTER PENJUALAN SESUAI PERIODE
        ================================================= */

        const filteredRows =
            (data || [])
                .filter(
                    function(item) {

                        if (
                            !item.sales
                        ) {

                            return false;

                        }


                        const saleDate =
                            String(
                                item.sales.sale_date
                            );


                        return (
                            saleDate >=
                                period.startDate &&
                            saleDate <=
                                period.endDate
                        );

                    }
                );


        /* =================================================
           AMBIL JURNAL PENYESUAIAN
           
           KHUSUS AKUN:
           5104 — Kerugian Persediaan
        ================================================= */

        const {
            data: adjustmentJournals,
            error: adjustmentError
        } = await supabaseClient

            .from(
                "journal_entries"
            )

            .select(
                `
                    id,
                    journal_date,
                    reference_type,
                    journal_details (
                        debit,
                        credit,
                        accounts (
                            account_code,
                            account_name
                        )
                    )
                `
            )

            .eq(
                "reference_type",
                "adjustment"
            )
            .gte(
                "journal_date",
                period.startDate
            )
            .lte(
                "journal_date",
                period.endDate
            );


        if (adjustmentError) {

            throw adjustmentError;

        }


        /* =================================================
           HITUNG KERUGIAN PERSEDIAAN
           
           AKUN 5104 = KERUGIAN PERSEDIAAN
        ================================================= */

        let totalInventoryLoss =
            0;


        (
            adjustmentJournals ||
            []
        ).forEach(
            function(journal) {

                (
                    journal.journal_details ||
                    []
                ).forEach(
                    function(detail) {

                        const account =
                            detail.accounts;


                        if (
                            account &&
                            String(
                                account.account_code
                            ) === "5104"
                        ) {

                            totalInventoryLoss +=
                                Number(
                                    detail.debit
                                ) || 0;

                        }

                    }
                );

            }
        );


        /* =================================================
           SIMPAN DATA REPORT
        ================================================= */

        profitLossReportRows =
            filteredRows;


        /* =================================================
           RENDER REPORT
           
           Untuk sementara kita kirim juga
           totalInventoryLoss ke fungsi render.
        ================================================= */

        renderProfitLossReport(
            filteredRows,
            period.startDate,
            period.endDate,
            totalInventoryLoss
        );


    } catch (error) {

        console.error(
            "Gagal memuat laporan laba rugi:",
            error
        );


        showToast(
            "Laporan laba rugi gagal dimuat.",
            "error"
        );

    }

}


/* =========================================================
   RENDER REPORT
========================================================= */

function renderProfitLossReport(
    rows,
    startDate,
    endDate,
    totalInventoryLoss
) {

    let totalSales =
        0;


    let totalCogs =
        0;


    /* =====================================================
       PASTIKAN NILAI KERUGIAN VALID
    ===================================================== */

    totalInventoryLoss =
        Number(
            totalInventoryLoss
        ) || 0;


    /* =====================================================
       HITUNG PENJUALAN DAN HPP
    ===================================================== */

    rows.forEach(
        function(row) {

            totalSales +=
                Number(
                    row.subtotal
                ) || 0;


            totalCogs +=
                Number(
                    row.cogs
                ) || 0;

        }
    );


    /* =====================================================
       LABA KOTOR
    ===================================================== */

    const grossProfit =
        totalSales -
        totalCogs;


    /* =====================================================
       MARGIN LABA KOTOR
    ===================================================== */

    let grossMargin =
        0;


    if (
        totalSales !== 0
    ) {

        grossMargin =
            (
                grossProfit /
                totalSales
            ) * 100;

    }


    /* =====================================================
       LABA SETELAH KERUGIAN PERSEDIAAN
    ===================================================== */

    const finalProfit =
        grossProfit -
        totalInventoryLoss;


    /* =====================================================
       UPDATE JUDUL PERIODE
    ===================================================== */

    const periodTextElement =
        document.getElementById(
            "profitLossReportPeriodText"
        );


    if (periodTextElement) {

        periodTextElement.textContent =
            formatProfitLossPeriodText(
                startDate,
                endDate
            );

    }


    /* =====================================================
       UPDATE PENJUALAN
    ===================================================== */

    const salesElement =
        document.getElementById(
            "profitLossSalesAmount"
        );


    if (salesElement) {

        salesElement.textContent =
            formatCurrency(
                totalSales
            );

    }


    /* =====================================================
       UPDATE HPP
    ===================================================== */

    const cogsElement =
        document.getElementById(
            "profitLossCogsAmount"
        );


    if (cogsElement) {

        cogsElement.textContent =
            formatCurrency(
                totalCogs
            );

    }


    /* =====================================================
       UPDATE LABA KOTOR
    ===================================================== */

    const grossProfitElement =
        document.getElementById(
            "profitLossGrossProfitAmount"
        );


    if (grossProfitElement) {

        grossProfitElement.textContent =
            formatCurrency(
                grossProfit
            );

    }


    /* =====================================================
       UPDATE MARGIN LABA KOTOR
    ===================================================== */

    const grossMarginElement =
        document.getElementById(
            "profitLossGrossMargin"
        );


    if (grossMarginElement) {

        grossMarginElement.textContent =
            grossMargin.toLocaleString(
                "id-ID",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            ) +
            "%";

    }


    /* =====================================================
       UPDATE KERUGIAN PERSEDIAAN
    ===================================================== */

    const inventoryLossElement =
        document.getElementById(
            "profitLossInventoryLossAmount"
        );


    if (inventoryLossElement) {

        inventoryLossElement.textContent =
            formatCurrency(
                totalInventoryLoss
            );

    }


    /* =====================================================
       UPDATE LABA SETELAH KERUGIAN PERSEDIAAN
    ===================================================== */

    const finalProfitElement =
        document.getElementById(
            "profitLossFinalProfitAmount"
        );


    if (finalProfitElement) {

        finalProfitElement.textContent =
            formatCurrency(
                finalProfit
            );

    }


    /* =====================================================
       UPDATE WAKTU LAPORAN DIBUKA
    ===================================================== */

    const openedAtElement =
        document.getElementById(
            "profitLossOpenedAt"
        );


    if (openedAtElement) {

        const now =
            new Date();

        openedAtElement.textContent =
            now.toLocaleString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }

}


/* =========================================================
   TIMESTAMP LAPORAN
========================================================= */

function updateProfitLossOpenedAt() {

    const element =
        document.getElementById(
            "profitLossOpenedAt"
        );


    if (!element) {
        return;
    }


    const now =
        new Date();


    const formatted =
        now.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "Asia/Jakarta"
            }
        );


    element.textContent =
        formatted +
        " WIB";

}


/* =========================================================
   RESET REPORT
========================================================= */

function resetProfitLossReport() {

    setProfitLossDefaultPeriod();

    updateProfitLossPeriodFields();

    loadProfitLossReport();

}


/* =========================================================
   EVENT LISTENER
========================================================= */

function initProfitLossReportEvents() {

    const periodType =
        document.getElementById(
            "profitLossPeriodType"
        );


    const applyButton =
        document.getElementById(
            "applyProfitLossFilterButton"
        );


    const resetButton =
        document.getElementById(
            "resetProfitLossFilterButton"
        );

    
const downloadProfitLossPdfButton =
    document.getElementById(
        "downloadProfitLossPdfButton"
    );

if (
    downloadProfitLossPdfButton
) {

    downloadProfitLossPdfButton.addEventListener(
        "click",
        downloadProfitLossPDF
    );

}


    const backButton =
        document.getElementById(
            "backToReportMenuFromProfitLossButton"
        );


    if (periodType) {

        periodType.addEventListener(
            "change",
            function() {

                updateProfitLossPeriodFields();

            }
        );

    }


    if (applyButton) {

        applyButton.addEventListener(
            "click",
            function() {

                loadProfitLossReport();

            }
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function() {

                resetProfitLossReport();

            }
        );

    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            function() {

                closeProfitLossReport();

            }
        );

    }

}


/* =========================================================
   REPORT MENU → REPORT 04
========================================================= */

function initProfitLossReportMenuButton() {

    const button =
        document.getElementById(
            "openProfitLossReportButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function() {

            openProfitLossReport();

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initProfitLossReportEvents();

        initProfitLossReportMenuButton();

    }
);


/* =========================================================
   REPORT 03 - DOWNLOAD PDF
========================================================= */

function downloadProfitLossPDF() {

    /* =====================================================
       CEK LIBRARY PDF
    ===================================================== */

    if (
        typeof window.jspdf === "undefined"
    ) {

        showToast(
            "Library PDF belum berhasil dimuat.",
            "error"
        );

        return;

    }


    /* =====================================================
       AMBIL DATA LAPORAN
    ===================================================== */

    const salesElement =
        document.getElementById(
            "profitLossSalesAmount"
        );

    const cogsElement =
        document.getElementById(
            "profitLossCogsAmount"
        );

    const grossProfitElement =
        document.getElementById(
            "profitLossGrossProfitAmount"
        );

    const grossMarginElement =
        document.getElementById(
            "profitLossGrossMargin"
        );

    const inventoryLossElement =
        document.getElementById(
            "profitLossInventoryLossAmount"
        );

    const finalProfitElement =
        document.getElementById(
            "profitLossFinalProfitAmount"
        );

    const periodElement =
        document.getElementById(
            "profitLossReportPeriodText"
        );


    /* =====================================================
       AMBIL TEXT
    ===================================================== */

    const salesText =
        salesElement
            ? salesElement.textContent.trim()
            : "Rp0";


    const cogsText =
        cogsElement
            ? cogsElement.textContent.trim()
            : "Rp0";


    const grossProfitText =
        grossProfitElement
            ? grossProfitElement.textContent.trim()
            : "Rp0";


    const grossMarginText =
        grossMarginElement
            ? grossMarginElement.textContent.trim()
            : "0,00%";


    const inventoryLossText =
        inventoryLossElement
            ? inventoryLossElement.textContent.trim()
            : "Rp0";


    const finalProfitText =
        finalProfitElement
            ? finalProfitElement.textContent.trim()
            : "Rp0";


    const periodText =
        periodElement
            ? periodElement.textContent.trim()
            : "Periode laporan";


    /* =====================================================
       AMBIL NILAI NUMERIK
    ===================================================== */

    function parseCurrencyText(text) {

        return Number(
            String(text)
                .replace(
                    /[^0-9,-]/g,
                    ""
                )
                .replace(
                    ",",
                    "."
                )
        ) || 0;

    }


    const sales =
        parseCurrencyText(
            salesText
        );


    const cogs =
        parseCurrencyText(
            cogsText
        );


    const grossProfit =
        parseCurrencyText(
            grossProfitText
        );


    const inventoryLoss =
        parseCurrencyText(
            inventoryLossText
        );


    const finalProfit =
        parseCurrencyText(
            finalProfitText
        );


    /* =====================================================
       BUAT PDF
    ===================================================== */

    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF(
            {
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            }
        );


    /* =====================================================
       UKURAN HALAMAN
    ===================================================== */

    const pageWidth =
        doc.internal.pageSize.getWidth();


    const pageHeight =
        doc.internal.pageSize.getHeight();


    const marginLeft =
        25;


    const marginRight =
        25;


    const contentWidth =
        pageWidth -
        marginLeft -
        marginRight;


    /* =====================================================
       WARNA
    ===================================================== */

    const darkText =
        [48, 48, 54];


    const mutedText =
        [105, 106, 112];


    const purple =
        [49, 27, 72];


    const lineColor =
        [52, 53, 59];


    /* =====================================================
       HEADER LAPORAN
    ===================================================== */

    doc.setTextColor(
        darkText[0],
        darkText[1],
        darkText[2]
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        16
    );


    doc.text(
        "LAPORAN LABA RUGI",
        pageWidth / 2,
        30,
        {
            align: "center"
        }
    );


    doc.setFontSize(
        11
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        "DISTRIBUTOR MAKANAN/MINUMAN",
        pageWidth / 2,
        38,
        {
            align: "center"
        }
    );


    doc.setFontSize(
        9
    );


    doc.setTextColor(
        mutedText[0],
        mutedText[1],
        mutedText[2]
    );


    doc.text(
        periodText,
        pageWidth / 2,
        45,
        {
            align: "center"
        }
    );


    /* =====================================================
       GARIS HEADER
    ===================================================== */

    doc.setDrawColor(
        210,
        210,
        213
    );


    doc.line(
        marginLeft,
        53,
        pageWidth - marginRight,
        53
    );


    /* =====================================================
       POSISI LAPORAN
    ===================================================== */

    let y =
        68;


    const valueX =
        pageWidth -
        marginRight;


    /* =====================================================
       BAGIAN PENJUALAN
    ===================================================== */

    doc.setTextColor(
        darkText[0],
        darkText[1],
        darkText[2]
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        9
    );


    doc.text(
        "PENJUALAN",
        marginLeft,
        y
    );


    y += 8;


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        10
    );


    doc.text(
        "Penjualan",
        marginLeft,
        y
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        formatCurrency(
            sales
        ),
        valueX,
        y,
        {
            align: "right"
        }
    );


    /* =====================================================
       BAGIAN HPP
    ===================================================== */

    y += 18;


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        9
    );


    doc.text(
        "HARGA POKOK PENJUALAN",
        marginLeft,
        y
    );


    y += 8;


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        10
    );


    doc.text(
        "Harga Pokok Penjualan (FIFO)",
        marginLeft,
        y
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        formatCurrency(
            cogs
        ),
        valueX,
        y,
        {
            align: "right"
        }
    );


    /* =====================================================
       GARIS LABA KOTOR
    ===================================================== */

    y += 10;


    doc.setDrawColor(
        lineColor[0],
        lineColor[1],
        lineColor[2]
    );


    doc.setLineWidth(
        0.5
    );


    doc.line(
        marginLeft,
        y,
        pageWidth - marginRight,
        y
    );


    /* =====================================================
       LABA KOTOR
    ===================================================== */

    y += 10;


    doc.setTextColor(
        darkText[0],
        darkText[1],
        darkText[2]
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        10
    );


    doc.text(
        "LABA KOTOR",
        marginLeft,
        y
    );


    doc.setTextColor(
        purple[0],
        purple[1],
        purple[2]
    );


    doc.setFontSize(
        11
    );


    doc.text(
        formatCurrency(
            grossProfit
        ),
        valueX,
        y,
        {
            align: "right"
        }
    );


    /* =====================================================
       MARGIN LABA KOTOR
    ===================================================== */

    y += 9;


    doc.setTextColor(
        mutedText[0],
        mutedText[1],
        mutedText[2]
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        8
    );


    doc.text(
        "Margin Laba Kotor",
        marginLeft,
        y
    );


    doc.text(
        grossMarginText,
        valueX,
        y,
        {
            align: "right"
        }
    );


    /* =====================================================
       KERUGIAN PERSEDIAAN
    ===================================================== */

    y += 18;


    doc.setTextColor(
        darkText[0],
        darkText[1],
        darkText[2]
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        9
    );


    doc.text(
        "KERUGIAN PERSEDIAAN",
        marginLeft,
        y
    );


    y += 8;


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        10
    );


    doc.text(
        "Barang Rusak & Expired",
        marginLeft,
        y
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setTextColor(
        darkText[0],
        darkText[1],
        darkText[2]
    );


    doc.text(
        formatCurrency(
            inventoryLoss
        ),
        valueX,
        y,
        {
            align: "right"
        }
    );


    /* =====================================================
       GARIS LABA SETELAH KERUGIAN
    ===================================================== */

    y += 10;


    doc.setDrawColor(
        lineColor[0],
        lineColor[1],
        lineColor[2]
    );


    doc.setLineWidth(
        0.5
    );


    doc.line(
        marginLeft,
        y,
        pageWidth - marginRight,
        y
    );


    /* =====================================================
       LABA SETELAH KERUGIAN PERSEDIAAN
    ===================================================== */

    y += 10;


    doc.setTextColor(
        darkText[0],
        darkText[1],
        darkText[2]
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        10
    );


    doc.text(
        "LABA SETELAH KERUGIAN PERSEDIAAN",
        marginLeft,
        y
    );


    doc.setTextColor(
        purple[0],
        purple[1],
        purple[2]
    );


    doc.setFontSize(
        11
    );


    doc.text(
        formatCurrency(
            finalProfit
        ),
        valueX,
        y,
        {
            align: "right"
        }
    );


    /* =====================================================
       TIMESTAMP
    ===================================================== */

    const openedAtElement =
        document.getElementById(
            "profitLossOpenedAt"
        );


    const openedAt =
        openedAtElement
            ? openedAtElement.textContent.trim()
            : "-";


    /* =====================================================
       FOOTER
    ===================================================== */

    doc.setDrawColor(
        230,
        230,
        232
    );


    doc.line(
        marginLeft,
        pageHeight - 25,
        pageWidth - marginRight,
        pageHeight - 25
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        7
    );


    doc.setTextColor(
        150,
        151,
        156
    );


    doc.text(
        "Laporan dibuka pada " +
        openedAt,
        pageWidth - marginRight,
        pageHeight - 17,
        {
            align: "right"
        }
    );


    /* =====================================================
       NAMA FILE
    ===================================================== */

    const now =
        new Date();


    const monthName =
        now.toLocaleDateString(
            "id-ID",
            {
                month: "long"
            }
        );


    const year =
        now.getFullYear();


    const fileName =
        "Laporan_Laba_Rugi_" +
        monthName +
        "_" +
        year +
        ".pdf";


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    doc.save(
        fileName
    );


    showToast(
        "Laporan laba rugi berhasil diunduh.",
        "success"
    );

}


document.addEventListener("click", function(event) {

    console.log(
        "KLIK TERDETEKSI:",
        event.target
    );

}, true);