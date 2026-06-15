// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\middlewares\authEmployee.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'employee_jwt_secret_gocart_2025';

// ── All valid permission keys (matches checkbox list in store panel) ──────────
export const PERMISSIONS = {
  ADD_PRODUCT: 'ADD_PRODUCT',
  EDIT_PRODUCT: 'EDIT_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  MANAGE_INVENTORY: 'MANAGE_INVENTORY',
  VIEW_ORDERS: 'VIEW_ORDERS',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  MANAGE_CATEGORIES: 'MANAGE_CATEGORIES',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_STORE_SETTINGS: 'MANAGE_STORE_SETTINGS',
};

/**
 * Verifies JWT from Authorization header.
 * Returns decoded employee payload | null.
 *
 * Token payload shape:
 * {
 *   employeeId: string,
 *   storeId: string,
 *   email: string,
 *   permissions: { ADD_PRODUCT: true, VIEW_ORDERS: false, ... }
 * }
 */
export function verifyEmployeeToken(request) {
  try {
    const authHeader = request.headers.get
      ? request.headers.get('authorization') || ''
      : request.headers?.authorization || '';

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('verifyEmployeeToken error:', err.message);
    return null;
  }
}

/**
 * Checks if employee has a specific permission.
 * Returns true | false.
 *
 * Usage:
 *   hasPermission(employee, PERMISSIONS.ADD_PRODUCT)
 */
export function hasPermission(employee, permission) {
  if (!employee) return false;
  // Owners signing in via employee route also get full access
  if (employee.isOwner === true) return true;
  return employee.permissions?.[permission] === true;
}

/**
 * Verifies the employee belongs to the expected store.
 * Prevents employees from accessing other stores' APIs.
 */
export function belongsToStore(employee, storeId) {
  if (!employee) return false;
  return employee.storeId === storeId;
}

export const JWT_SECRET_KEY = JWT_SECRET;

export default verifyEmployeeToken;