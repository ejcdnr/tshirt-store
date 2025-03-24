// MongoDB Database Schema for T-Shirt E-Store

// Users Collection
{
  "_id": ObjectId("..."),
  "username": "john_doe",
  "email": "john.doe@example.com",
  "password": "hashed_password_here",  // Bcrypt hashed
  "isAdmin": false,                    // Boolean to identify admin users
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "addresses": [                       // Array of addresses
    {
      "addressId": "addr_123",         // Generated unique ID for each address
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main Street",
      "apartment": "Apt 4B",           // Optional
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "United States",
      "phone": "+1234567890",
      "isDefault": true               // Boolean to mark default address
    }
  ],
  "wishlist": [ObjectId("...")],      // Array of product IDs
  "createdAt": ISODate("2025-01-15T12:00:00Z"),
  "updatedAt": ISODate("2025-03-15T14:30:00Z"),
  "lastLogin": ISODate("2025-03-15T14:30:00Z")
}

// Products Collection
{
  "_id": ObjectId("..."),
  "name": "Classic Black Tee",
  "slug": "classic-black-tee",         // URL-friendly version of name
  "description": "A timeless black t-shirt that goes with everything.",
  "price": 24.99,
  "costPrice": 8.50,                   // Cost price for profit calculations
  "compareAtPrice": 29.99,             // Original price for showing discounts (optional)
  "category": "unisex",                // men, women, unisex
  "tags": ["basic", "bestseller"],     // For filtering and categorization
  "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
  "colors": ["black"],
  "images": [
    {
      "url": "/uploads/products/black-tee-1.jpg",
      "alt": "Classic Black Tee Front View",
      "isMain": true
    },
    {
      "url": "/uploads/products/black-tee-2.jpg",
      "alt": "Classic Black Tee Back View",
      "isMain": false
    }
  ],
  "variants": [  // For products with multiple size/color combinations
    {
      "variantId": "var_123",
      "size": "M",
      "color": "black",
      "sku": "BLK-TEE-M",
      "stockQuantity": 45,
      "inStock": true,
      "weight": 0.2,  // In kg
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 2
      }
    }
  ],
  "stockQuantity": 200,               // Total stock across all variants
  "inStock": true,                    // Overall stock status
  "lowStockThreshold": 10,            // Threshold for low stock alerts
  "featured": true,                   // For featuring on homepage or special collections
  "onSale": false,                    // For sale items
  "saleStart": ISODate("..."),        // Optional - sale period start
  "saleEnd": ISODate("..."),          // Optional - sale period end
  "ratings": {
    "average": 4.7,
    "count": 125
  },
  "metadata": {                       // SEO and additional data
    "seoTitle": "Classic Black T-Shirt | T-Shirt Haven",
    "seoDescription": "Shop our classic black t-shirt, perfect for any occasion.",
    "seoKeywords": "black tee, classic t-shirt, basic tee"
  },
  "createdAt": ISODate("2025-01-10T09:00:00Z"),
  "updatedAt": ISODate("2025-03-01T10:15:00Z")
}

// Orders Collection
{
  "_id": ObjectId("..."),
  "orderNumber": "ORD-1001",           // Human-readable order ID
  "user": ObjectId("..."),             // Reference to user (null for guest checkout)
  "items": [
    {
      "product": ObjectId("..."),      // Reference to product
      "variantId": "var_123",          // Reference to specific variant
      "name": "Classic Black Tee",     // Store name in case product changes later
      "quantity": 2,
      "size": "M",
      "color": "Black",
      "price": 24.99,                  // Store price at time of purchase
      "subtotal": 49.98                // price * quantity
    }
  ],
  "subtotal": 49.98,
  "shipping": {
    "method": "standard",
    "carrier": "USPS",
    "cost": 4.99,
    "estimatedDelivery": ISODate("2025-03-25T00:00:00Z")
  },
  "tax": {
    "amount": 4.50,
    "rate": 0.09,
    "taxLines": [
      {
        "description": "State Tax",
        "rate": 0.07,
        "amount": 3.50
      },
      {
        "description": "County Tax",
        "rate": 0.02,
        "amount": 1.00
      }
    ]
  },
  "discounts": [
    {
      "code": "WELCOME10",
      "description": "10% Off First Order",
      "type": "percentage",
      "value": 10,
      "amount": 5.00
    }
  ],
  "totalAmount": 54.47,               // subtotal + shipping.cost + tax.amount - discounts total
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main Street",
    "apartment": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "United States",
    "phone": "+1234567890"
  },
  "billingAddress": {                 // Can be same as shipping
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main Street",
    "apartment": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "United States",
    "phone": "+1234567890"
  },
  "paymentMethod": "credit_card",      // credit_card, paypal, stripe
  "paymentDetails": {
    "processor": "stripe",
    "transactionId": "txn_123456",
    "last4": "4242",                   // Last 4 digits of card
    "cardBrand": "Visa"
  },
  "paymentStatus": "completed",        // pending, completed, failed, refunded
  "orderStatus": "processing",         // processing, shipped, delivered, cancelled
  "fulfillment": {
    "status": "pending",               // pending, fulfilled, partial
    "trackingNumber": "1Z999AA10123456784",
    "trackingUrl": "https://www.ups.com/track?loc=en_US&tracknum=1Z999AA10123456784",
    "shippedAt": ISODate("2025-03-22T09:30:00Z"),
    "deliveredAt": null
  },
  "customerNotes": "Please leave package at the front door.",
  "adminNotes": "Customer is a repeat buyer. Consider including a discount code for next purchase.",
  "returns": [                         // If there are any returns
    {
      "returnId": "RTN-001",
      "items": [
        {
          "product": ObjectId("..."),
          "quantity": 1,
          "reason": "Wrong size",
          "condition": "unopened"
        }
      ],
      "status": "approved",            // requested, approved, rejected, completed
      "refundAmount": 24.99,
      "refundMethod": "original_payment",
      "refundStatus": "pending",       // pending, processed
      "createdAt": ISODate("2025-03-25T14:00:00Z")
    }
  ],
  "orderDate": ISODate("2025-03-20T15:30:00Z"),
  "updatedAt": ISODate("2025-03-20T15:30:00Z")
}

// Reviews Collection
{
  "_id": ObjectId("..."),
  "product": ObjectId("..."),          // Reference to product
  "user": ObjectId("..."),             // Reference to user
  "username": "john_doe",              // Store username in case user changes it
  "rating": 5,                         // 1-5 star rating
  "title": "Perfect fit!",
  "review": "This is the best t-shirt I've ever owned. The material is soft and the fit is perfect.",
  "verified": true,                    // Whether the user actually purchased the product
  "status": "approved",                // pending, approved, rejected
  "helpful": {                         // For "Was this review helpful?" feature
    "yes": 12,
    "no": 2
  },
  "createdAt": ISODate("2025-03-15T10:00:00Z"),
  "updatedAt": ISODate("2025-03-15T10:00:00Z")
}

// Categories Collection
{
  "_id": ObjectId("..."),
  "name": "T-Shirts",
  "slug": "t-shirts",
  "description": "Our collection of high-quality t-shirts for all occasions.",
  "parent": ObjectId("..."),           // Reference to parent category (null for top-level)
  "image": "/uploads/categories/tshirts.jpg",
  "featured": true,
  "order": 1,                          // For controlling display order
  "metadata": {
    "seoTitle": "T-Shirts | T-Shirt Haven",
    "seoDescription": "Shop our collection of high-quality t-shirts for all occasions.",
    "seoKeywords": "t-shirts, tees, shirts"
  },
  "createdAt": ISODate("2025-01-01T00:00:00Z"),
  "updatedAt": ISODate("2025-01-01T00:00:00Z")
}

// Coupons Collection
{
  "_id": ObjectId("..."),
  "code": "SUMMER25",
  "description": "25% off summer collection",
  "type": "percentage",                // percentage, fixed_amount, free_shipping
  "value": 25,                         // 25% off
  "minPurchase": 50.00,                // Minimum purchase amount
  "maxDiscount": 100.00,               // Maximum discount amount
  "usageLimit": 1000,                  // Total number of times coupon can be used
  "usageCount": 342,                   // Number of times coupon has been used
  "perUserLimit": 1,                   // Number of times each user can use coupon
  "products": [ObjectId("...")],       // Products coupon applies to (empty for all)
  "categories": [ObjectId("...")],     // Categories coupon applies to (empty for all)
  "excludedProducts": [ObjectId("...")], // Products excluded from coupon
  "startDate": ISODate("2025-06-01T00:00:00Z"),
  "endDate": ISODate("2025-08-31T23:59:59Z"),
  "active": true,
  "createdAt": ISODate("2025-05-15T00:00:00Z"),
  "updatedAt": ISODate("2025-05-15T00:00:00Z")
}

// Configuration Collection (for store settings)
{
  "_id": "store_settings",
  "storeName": "T-Shirt Haven",
  "contact": {
    "email": "support@tshirthaven.com",
    "phone": "+1234567890",
    "address": "123 Main St, Suite 100, New York, NY 10001"
  },
  "social": {
    "facebook": "https://facebook.com/tshirthaven",
    "instagram": "https://instagram.com/tshirthaven",
    "twitter": "https://twitter.com/tshirthaven"
  },
  "shipping": {
    "methods": [
      {
        "id": "standard",
        "name": "Standard Shipping",
        "description": "Delivery in 3-5 business days",
        "baseRate": 4.99,
        "freeThreshold": 50.00      // Free shipping on orders over $50
      },
      {
        "id": "express",
        "name": "Express Shipping",
        "description": "Delivery in 1-2 business days",
        "baseRate": 9.99,
        "freeThreshold": 100.00     // Free shipping on orders over $100
      }
    ],
    "countries": ["US", "CA", "MX"] // Supported shipping countries
  },
  "tax": {
    "default": {
      "rate": 0.0625,               // 6.25% default tax rate
      "includedInPrices": false     // Whether prices include tax
    },
    "byState": [
      {
        "state": "NY",
        "rate": 0.08875             // 8.875% for New York
      },
      {
        "state": "CA",
        "rate": 0.0725              // 7.25% for California
      }
    ]
  },
  "analytics": {
    "googleAnalyticsId": "UA-12345678-1",
    "facebookPixelId": "123456789012345"
  },
  "updatedAt": ISODate("2025-03-01T00:00:00Z")
}
