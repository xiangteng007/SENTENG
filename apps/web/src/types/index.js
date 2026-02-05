/**
 * SENTENG ERP Type Definitions
 * P3 Optimization: TypeScript Migration Foundation
 * 
 * Core entity types for gradual TypeScript adoption
 */

// ============================================
// Core Entities
// ============================================

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} projectNo
 * @property {string} name
 * @property {string} clientId
 * @property {'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'} status
 * @property {number} contractAmount
 * @property {number} estimatedCost
 * @property {Date} startDate
 * @property {Date} [endDate]
 * @property {string} [description]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} name
 * @property {string} [companyName]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [address]
 * @property {'active' | 'inactive'} status
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Quotation
 * @property {string} id
 * @property {string} quotationNo
 * @property {string} title
 * @property {string} clientId
 * @property {string} [projectId]
 * @property {'draft' | 'pending' | 'approved' | 'rejected' | 'expired'} status
 * @property {QuotationItem[]} items
 * @property {number} subtotal
 * @property {number} taxRate
 * @property {number} taxAmount
 * @property {number} totalAmount
 * @property {Date} validUntil
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} QuotationItem
 * @property {string} id
 * @property {string} itemCode
 * @property {'chapter' | 'section' | 'item'} type
 * @property {string} name
 * @property {string} [specification]
 * @property {string} unit
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} amount
 * @property {string} [parentId]
 */

/**
 * @typedef {Object} Contract
 * @property {string} id
 * @property {string} contractNo
 * @property {string} title
 * @property {string} clientId
 * @property {string} projectId
 * @property {'draft' | 'active' | 'completed' | 'terminated'} status
 * @property {number} amount
 * @property {Date} signedDate
 * @property {Date} startDate
 * @property {Date} endDate
 */

/**
 * @typedef {Object} Vendor
 * @property {string} id
 * @property {string} name
 * @property {string} [taxId]
 * @property {string} [contactPerson]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [address]
 * @property {'active' | 'inactive' | 'blacklisted'} status
 * @property {string[]} categories
 */

/**
 * @typedef {Object} CostEntry
 * @property {string} id
 * @property {string} projectId
 * @property {string} category
 * @property {string} description
 * @property {number} amount
 * @property {Date} date
 * @property {string} [vendorId]
 * @property {string} [invoiceNo]
 */

// ============================================
// API Response Types
// ============================================

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [message]
 * @property {ApiError} [error]
 */

/**
 * @typedef {Object} ApiError
 * @property {string} code
 * @property {string} message
 * @property {Object} [details]
 */

/**
 * @typedef {Object} PaginatedResponse
 * @template T
 * @property {T[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 */

// ============================================
// User & Auth Types
// ============================================

/**
 * @typedef {Object} User
 * @property {string} uid
 * @property {string} email
 * @property {string} [displayName]
 * @property {string} [photoURL]
 * @property {'super_admin' | 'admin' | 'manager' | 'user' | 'viewer'} role
 * @property {string[]} permissions
 */

// Export for JSDoc usage
export {};
