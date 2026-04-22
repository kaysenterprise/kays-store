// ===== CONFIGURATION =====
const CONFIG = {
  SHEET_CSV_URL: "REPLACE_WITH_YOUR_PUBLISHED_GOOGLE_SHEET_CSV_URL",
  FORM_URL: "REPLACE_WITH_YOUR_GOOGLE_FORM_URL",
  USE_GOOGLE_SHEETS: true // Set to false if using products.json
};

// ===== DOM ELEMENTS =====
const elements = {
  productGrid: document.getElementById('product-grid'),
  orderForm: document.getElementById('order-form'),
  formContainer: document.querySelector('.form-container')
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initializeForm();
  loadProducts();
  setupEventListeners();
});

// ===== PRODUCT LOADING =====
async function loadProducts() {
  try {
    if (CONFIG.USE_GOOGLE_SHEETS) {
      await loadFromGoogleSheets();
    } else {
      await loadFromJSON();
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showErrorState();
  }
}

async function loadFromGoogleSheets() {
  const response = await fetch(CONFIG.SHEET_CSV_URL);
  if (!response.ok) throw new Error('Failed to fetch CSV');
  
  const csvText = await response.text();
  const products = parseCSV(csvText);
  renderProducts(products);
}

async function loadFromJSON() {
  const response = await fetch('products.json');
  if (!response.ok) throw new Error('Failed to fetch products.json');
  
  const products = await response.json();
  renderProducts(products);
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
    });
    return obj;
  }).filter(p => p.Name && p.Name.length > 0);
}

function renderProducts(products) {
  if (!elements.productGrid) return;
  
  elements.productGrid.innerHTML = '';
  
  if (products.length === 0) {
    elements.productGrid.innerHTML = `
      <div class="error-message" style="grid-column: 1/-1;">
        <h3>No products available</h3>
        <p>Check back soon for new items!</p>
      </div>
    `;
    return;
  }
  
  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    elements.productGrid.appendChild(card);
  });
}

function createProductCard(product, index) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.animationDelay = `${index * 0.1}s`;
  
  const imageUrl = product.ImageURL || product.image || 'https://placehold.co/400x300?text=No+Image';
  const name = product.Name || product.name || 'Unnamed Product';
  const price = product.Price || product.price || 'Price on request';
  const description = product.Description || product.description || 'No description available';
  
  card.innerHTML = `
    <img src="${escapeHtml(imageUrl)}" 
         alt="${escapeHtml(name)}" 
         class="product-image"
         onerror="this.src='https://placehold.co/400x300?text=Image+Not+Found'">
    <div class="card-body">
      <h3>${escapeHtml(name)}</h3>
      <div class="price">${escapeHtml(price)}</div>
      <div class="description">${escapeHtml(description)}</div>
      <button class="btn-order" onclick="selectProduct('${escapeHtml(name.replace(/'/g, "\\'"))}')">
        <span>🛒</span>
        <span>Order Now</span>
      </button>
    </div>
  `;
  
  return card;
}

// ===== FORM INTERACTION =====
function initializeForm() {
  if (elements.orderForm) {
    elements.orderForm.src = CONFIG.FORM_URL;
  }
}

function selectProduct(productName) {
  // Copy to clipboard
  navigator.clipboard.writeText(productName).then(() => {
    showToast(`✅ "${productName}" copied to clipboard!`, 'success');
    
    // Smooth scroll to form
    if (elements.orderForm) {
      elements.orderForm.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Highlight the form temporarily
      if (elements.formContainer) {
        elements.formContainer.style.animation = 'pulse 1s ease-in-out';
        setTimeout(() => {
          elements.formContainer.style.animation = '';
        }, 1000);
      }
    }
    
    // Show helpful hint
    setTimeout(() => {
      showToast('💡 Paste the product name in the form below', 'info');
    }, 1500);
    
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('❌ Failed to copy. Please copy manually.', 'error');
  });
}

// ===== UI HELPERS =====
function showErrorState() {
  if (!elements.productGrid) return;
  
  elements.productGrid.innerHTML = `
    <div class="error-message">
      <h3>⚠️ Unable to load products</h3>
      <p>Please refresh the page or try again later.</p>
      <button class="btn-order" onclick="location.reload()" style="margin-top: 16px; max-width: 200px;">
        🔄 Refresh Page
      </button>
    </div>
  `;
}

function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function setupEventListeners() {
  // Add smooth scroll behavior for all internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // Add loading state to all buttons
  document.querySelectorAll('.btn-order').forEach(btn => {
    btn.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  });
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== PERFORMANCE OPTIMIZATION =====
// Lazy load images
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img').forEach(img => imageObserver.observe(img));
}

// ===== SERVICE WORKER (Optional - for offline support) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment to enable offline support
    // navigator.serviceWorker.register('/sw.js');
  });
}

// ===== ANALYTICS (Optional) =====
function trackProductView(productName) {
  // Add your analytics here (Google Analytics, etc.)
  console.log(`Product viewed: ${productName}`);
}

function trackOrderClick(productName) {
  // Add your analytics here
  console.log(`Order clicked: ${productName}`);
}
