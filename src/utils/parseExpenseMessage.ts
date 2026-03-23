// ─────────────────────────────────────────────
//  parseExpenseMessage · Smart NLP-lite parser
//  Extracts amount, category, note, and payment
//  method from natural-language messages like:
//    "paid 500 for food on paytm"
//    "bought coffee ₹120 gpay"
//    "uber ride $15.50"
//    "electricity bill 2000 paid via phonepe"
// ─────────────────────────────────────────────
import type { ExpenseCategory } from '../context/SpendingContext';

export interface ParsedExpense {
    amount: number | null;
    category: ExpenseCategory;
    note: string;
    paymentMethod: string | null;
    confidence: number; // 0–1, how confident we are in parsing
}

// ── Keyword → category mapping ────────────────
const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
    food: [
        'food', 'lunch', 'dinner', 'breakfast', 'snack', 'coffee', 'tea', 'chai',
        'restaurant', 'hotel', 'biryani', 'pizza', 'burger', 'sandwich', 'meal',
        'swiggy', 'zomato', 'dominos', 'mcdonalds', 'kfc', 'starbucks',
        'dine', 'eat', 'ate', 'beverage', 'drink', 'juice', 'water',
        'grocery', 'groceries', 'vegetables', 'fruits', 'milk', 'bread',
        'bakery', 'cake', 'ice cream', 'dessert', 'paneer', 'chicken',
        'mutton', 'egg', 'rice', 'dal', 'roti', 'noodles', 'pasta',
    ],
    shopping: [
        'shopping', 'shop', 'bought', 'buy', 'purchase', 'amazon', 'flipkart',
        'myntra', 'meesho', 'ajio', 'shirt', 'shoes', 'clothes', 'dress',
        'jeans', 'tshirt', 't-shirt', 'jacket', 'watch', 'phone', 'laptop',
        'earphone', 'headphone', 'charger', 'case', 'accessories', 'gadget',
        'electronics', 'furniture', 'home decor', 'cosmetics', 'perfume',
        'gift', 'present', 'jewellery', 'jewelry', 'bag', 'backpack',
        'sunglasses', 'wallet', 'belt', 'product', 'item', 'order',
    ],
    bills: [
        'bill', 'electricity', 'electric', 'water bill', 'gas bill', 'wifi',
        'internet', 'broadband', 'recharge', 'prepaid', 'postpaid', 'mobile bill',
        'phone bill', 'dth', 'cable', 'rent', 'emi', 'loan', 'insurance',
        'premium', 'subscription', 'monthly', 'payment', 'utility', 'maintenance',
        'society', 'tax', 'gst', 'credit card', 'cc bill', 'due',
    ],
    transport: [
        'uber', 'ola', 'cab', 'taxi', 'auto', 'rickshaw', 'bus', 'train',
        'metro', 'flight', 'airline', 'airport', 'petrol', 'diesel', 'fuel',
        'gas station', 'toll', 'parking', 'ride', 'travel', 'trip',
        'rapido', 'indigo', 'irctc', 'booking', 'ticket', 'fare',
        'commute', 'drive', 'drove', 'commuted',
    ],
    entertainment: [
        'movie', 'film', 'cinema', 'theatre', 'netflix', 'prime', 'hotstar',
        'spotify', 'youtube', 'game', 'gaming', 'pub', 'bar', 'club',
        'concert', 'show', 'event', 'party', 'outing', 'fun', 'bookmyshow',
        'tickets', 'amusement', 'park', 'museum', 'zoo',
    ],
    health: [
        'medicine', 'medical', 'doctor', 'hospital', 'clinic', 'pharmacy',
        'health', 'fitness', 'gym', 'yoga', 'supplement', 'vitamin',
        'lab', 'test', 'scan', 'xray', 'checkup', 'dental', 'eye',
        'apollo', 'pharmeasy', 'netmeds', '1mg', 'practo', 'therapy',
    ],
    education: [
        'course', 'class', 'tuition', 'book', 'books', 'study', 'exam',
        'fee', 'fees', 'school', 'college', 'university', 'udemy', 'coursera',
        'skillshare', 'learning', 'tutorial', 'coaching', 'notebook',
        'stationery', 'pen', 'pencil',
    ],
    other: [],
};

// ── Payment method detection ──────────────────
const PAYMENT_KEYWORDS: Record<string, string> = {
    paytm: 'Paytm',
    gpay: 'Google Pay',
    'google pay': 'Google Pay',
    phonepe: 'PhonePe',
    'phone pe': 'PhonePe',
    cash: 'Cash',
    card: 'Card',
    'credit card': 'Credit Card',
    'debit card': 'Debit Card',
    upi: 'UPI',
    neft: 'NEFT',
    imps: 'IMPS',
    bhim: 'BHIM UPI',
    'amazon pay': 'Amazon Pay',
    cred: 'CRED',
    mobikwik: 'MobiKwik',
    freecharge: 'Freecharge',
    bank: 'Bank Transfer',
    netbanking: 'Net Banking',
};

// ── Amount extraction ─────────────────────────
// Matches patterns like: ₹500, $15.50, rs 200, 1000, inr 350
const AMOUNT_PATTERNS = [
    /(?:₹|rs\.?|inr|rupees?)\s*(\d[\d,]*\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*(?:₹|rs\.?|inr|rupees?)/i,
    /\$\s*(\d[\d,]*\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*(?:dollars?|bucks?)/i,
    // Plain number (fallback — largest number in the message)
    /\b(\d[\d,]*\.?\d+)\b/,
    /\b(\d{2,})\b/, // at least 2 digits to avoid matching "1" in "1 coffee"
];

/**
 * Parse a natural-language expense message.
 *
 * Examples:
 *  "paid 500 for food on paytm"       → { amount: 500, category: 'food', paymentMethod: 'Paytm' }
 *  "bought coffee ₹120 gpay"          → { amount: 120, category: 'food', paymentMethod: 'Google Pay' }
 *  "uber ride $15.50"                 → { amount: 15.5, category: 'transport' }
 *  "electricity bill 2000 phonepe"    → { amount: 2000, category: 'bills', paymentMethod: 'PhonePe' }
 *  "netflix subscription 199"        → { amount: 199, category: 'entertainment' }
 */
export function parseExpenseMessage(message: string): ParsedExpense {
    const raw = message.trim();
    const lower = raw.toLowerCase();
    let confidence = 0;

    // 1) Extract amount
    let amount: number | null = null;
    for (const pattern of AMOUNT_PATTERNS) {
        const match = lower.match(pattern);
        if (match) {
            const parsed = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0) {
                amount = parsed;
                confidence += 0.4;
                break;
            }
        }
    }

    // 2) Detect category
    let category: ExpenseCategory = 'other';
    let maxScore = 0;
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (cat === 'other') continue;
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                // Longer keywords get higher score
                score += kw.length;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            category = cat as ExpenseCategory;
        }
    }
    if (maxScore > 0) confidence += 0.3;

    // 3) Detect payment method
    let paymentMethod: string | null = null;
    for (const [kw, display] of Object.entries(PAYMENT_KEYWORDS)) {
        if (lower.includes(kw)) {
            paymentMethod = display;
            confidence += 0.15;
            break;
        }
    }

    // 4) Build note (clean up the message)
    let note = raw;
    // Remove amount patterns from note
    note = note.replace(/[₹$]\s*\d[\d,]*\.?\d*/g, '').trim();
    note = note.replace(/\b\d[\d,]*\.?\d*\s*(?:rs\.?|inr|rupees?|dollars?|bucks?)/gi, '').trim();
    note = note.replace(/(?:rs\.?|inr|rupees?)\s*\d[\d,]*\.?\d*/gi, '').trim();
    // Remove known payment keywords from note
    for (const kw of Object.keys(PAYMENT_KEYWORDS)) {
        const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        note = note.replace(re, '').trim();
    }
    // Remove filler words
    note = note.replace(/\b(paid|spent|for|on|via|through|using|with|in|at|to|the|a|an|my)\b/gi, ' ');
    note = note.replace(/\s{2,}/g, ' ').trim();

    // Capitalize first letter
    if (note.length > 0) {
        note = note.charAt(0).toUpperCase() + note.slice(1);
        confidence += 0.15;
    }

    return {
        amount,
        category,
        note,
        paymentMethod,
        confidence: Math.min(confidence, 1),
    };
}

/**
 * Generate example prompts for the user
 */
export const EXAMPLE_MESSAGES = [
    'Paid ₹500 for lunch on Paytm',
    'Uber ride $12 GPay',
    'Coffee ₹150',
    'Electricity bill ₹2000 PhonePe',
    'Netflix subscription ₹199',
    'Bought shoes ₹3000 Amazon Pay',
    'Groceries ₹800 cash',
    'Gym membership ₹1200',
];
