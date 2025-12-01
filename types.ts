
export type Marketplace = 'US' | 'DE' | 'JP' | 'UK' | 'FR';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'cs';
  avatar: string;
}

export interface QAPair {
  id: string;
  question: string; // The query intent
  answer: string; // The gold standard answer
  keywords: string[]; // Keywords to boost matching
  author: 'Engineer' | 'CustomerService'; // Who added this knowledge
  updatedAt: string;
}

export interface Product {
  id: string;
  asin: string;
  name: string;
  modelNumber?: string;
  category: string;
  marketplace: Marketplace;
  image: string;
  features: string[];
  manual_content: string; 
  troubleshooting: string;
  policy: string;
  expert_knowledge?: QAPair[]; // NEW: Knowledge injected by humans
}

export interface Ticket {
  id: string;
  customerName: string;
  emailBody: string;
  timestamp: string;
  status: 'pending' | 'drafted' | 'sent';
  detectedLanguage?: string;
}

export interface RetrievalResult {
  source: 'Manual' | 'Listing' | 'Policy' | 'History' | 'Expert Q&A';
  content: string;
  relevanceScore: number;
}

export interface AIAnalysis {
  intent: string;
  language: string;
  sentiment: 'Negative' | 'Neutral' | 'Positive';
  keyIssues: string[];
  suggestedStrategy: string; 
}

export interface GeneratedDraft {
  subject: string;
  chineseBody: string; // For CS Agent review
  targetBody: string;  // For Customer (Localized)
  tone: string;
}
