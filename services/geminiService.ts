
import { GoogleGenAI, Type } from "@google/genai";
import { Product, RetrievalResult, AIAnalysis, GeneratedDraft } from "../types";

// --- HARDCODED IMAGE MAPPING FOR DEMO RELIABILITY ---
// Gemini acts as a simulator. Since it cannot browse the live web for images, 
// we map specific ASINs to working URLs to ensure the demo looks perfect.
const KNOWN_ASIN_IMAGES: Record<string, string> = {
  // Gtheos Wireless Gaming Headset - REMOVED IMAGE AS REQUESTED (User will upload)
  'B0B4B2HW2N': '', 
  // LuminaPro Lantern
  'B08XYZ1234': 'https://m.media-amazon.com/images/I/71r+t8b-N-L._AC_SL1500_.jpg',
  // SonicStream Earbuds
  'B09ABC5678': 'https://m.media-amazon.com/images/I/61s+N9hyLpL._AC_SL1500_.jpg',
  // G-Pad Pro Tablet (JP) - NEW
  'B0FD3KWHT2': 'https://m.media-amazon.com/images/I/710VjIDe7bD._AC_SL1500_.jpg'
};

// --- KNOWN PRODUCT DATA MAPPING (Simulate Real Page Crawl) ---
// This prevents AI hallucination for specific demo ASINs
const KNOWN_PRODUCT_PAGES: Record<string, Partial<Product>> = {
  'B0FD3KWHT2': {
    name: 'G-Pad Pro 11インチ タブレット Android 13 (2024モデル) Wi-Fiモデル 128GB',
    modelNumber: 'CT-PAD-JP',
    marketplace: 'JP',
    features: [
      '11インチ 2K IPSディスプレイ (2000x1200)',
      '大容量 8000mAh バッテリー',
      '最新 Android 13 OS 搭載',
      '専用スタイラスペン付属',
      '8GB RAM + 128GB ROM (1TB拡張可能)'
    ],
    manual_content: `
      充電について: 必ず付属の純正USB-Cケーブルと電源アダプターを使用してください。PCのUSBポートでは出力不足で充電できない場合があります。
      
      電源が入らない場合: 電源ボタンを20秒以上長押しして、強制リセットを行ってください。
      
      スタイラスペンのペアリング: 
      1. タブレットのBluetoothをオンにします。
      2. ペンをタブレット右側面の磁気コネクタに吸着させます。
      3. 画面に「G-Pen」の接続ポップアップが表示されたら「接続」をタップします。
      
      画面のキャスト: クイック設定パネルから「画面キャスト」を選択し、対応するテレビやモニターを選択します。
    `,
    troubleshooting: `
      問題: Wi-Fiが頻繁に切れる
      解決策: 
      1. 「設定」>「システム」>「リセットオプション」>「Wi-Fi、モバイル、Bluetoothをリセット」を実行してください。
      2. ルーターの5GHz帯に接続することをお勧めします。
      
      問題: 画面がちらつく
      解決策: 「設定」>「ディスプレイ」>「明るさの自動調節」をオフにしてください。それでも直らない場合はセーフモードで起動してアプリの干渉を確認してください。
    `,
    policy: 'Amazon.co.jp 返品ポリシー: お客様都合の返品・交換は商品到着後30日以内に限ります。開封済みまたは使用済みの場合は、商品代金の50%を返金します。初期不良の場合は全額返金または交換いたします。'
  }
};

export const simulateRetrieval = (query: string, product: Product): RetrievalResult[] => {
  const results: RetrievalResult[] = [];
  const lowerQuery = query.toLowerCase();

  // 1. Expert Knowledge Scan (Highest Priority)
  // Check both Question text and Keywords
  if (product.expert_knowledge) {
    product.expert_knowledge.forEach(qa => {
        const matchQuestion = qa.question.toLowerCase().split(' ').some(word => lowerQuery.includes(word) && word.length > 3);
        const matchKeyword = qa.keywords.some(k => lowerQuery.includes(k.toLowerCase()));
        
        if (matchQuestion || matchKeyword) {
            results.push({
                source: 'Expert Q&A',
                content: `[Expert Answer by ${qa.author}]: ${qa.answer}`,
                relevanceScore: 0.99 // Super high score to override everything else
            });
        }
    });
  }

  // 2. Manual Scan (Simple keyword matching for demo)
  if (product.manual_content.toLowerCase().split(' ').some(word => lowerQuery.includes(word) && word.length > 3)) {
    results.push({
      source: 'Manual',
      content: product.manual_content.substring(0, 300) + "...", 
      relevanceScore: 0.95
    });
  }

  // 3. Troubleshooting Scan
  if (product.troubleshooting.toLowerCase().split(' ').some(word => lowerQuery.includes(word) && word.length > 3)) {
    results.push({
      source: 'Listing',
      content: product.troubleshooting,
      relevanceScore: 0.88
    });
  }

  // 4. Always include Marketplace Policy
  results.push({
    source: 'Policy',
    content: product.policy,
    relevanceScore: 0.5
  });

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

// --- Gemini API Interaction ---

const getGeminiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key is missing.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

// Helper: Get domain from marketplace
export const getAmazonDomain = (marketplace: string): string => {
  switch (marketplace) {
    case 'US': return 'amazon.com';
    case 'DE': return 'amazon.de';
    case 'JP': return 'amazon.co.jp';
    case 'UK': return 'amazon.co.uk';
    case 'FR': return 'amazon.fr';
    default: return 'amazon.com';
  }
};

// Helper: Determine strict target language based on Marketplace
export const getTargetLanguage = (marketplace: string): string => {
    switch (marketplace) {
      case 'JP': return 'Japanese (Strict Business Keigo/Sonkeigo)';
      case 'DE': return 'German (Formal Sie)';
      case 'FR': return 'French (Formal Vous)';
      case 'ES': return 'Spanish';
      case 'IT': return 'Italian';
      case 'UK': return 'British English';
      default: return 'American English';
    }
};

// NEW: Simulate Crawling Amazon Page to get Product Data
export const generateMockProductData = async (asin: string, marketplace: string): Promise<Partial<Product> & { mainImage?: string }> => {
  // 1. Check Hardcoded Mappings FIRST (The "Local Cache")
  // This ensures B0FD3KWHT2 returns Tablet data, NOT Headset data.
  const knownPage = KNOWN_PRODUCT_PAGES[asin];
  const knownImage = KNOWN_ASIN_IMAGES[asin];

  // If we have a strict page map, return it immediately (Simulating perfect crawl)
  if (knownPage) {
      // Small delay to simulate network
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
          ...knownPage,
          mainImage: knownImage || '' // Attach image if available
      };
  }

  const ai = getGeminiClient();
  if (!ai) throw new Error("API Key missing");

  const domain = getAmazonDomain(marketplace);
  const targetUrl = `https://www.${domain}/dp/${asin}`;

  const prompt = `
    Act as an advanced Amazon Data Scraper and Content Manager.
    
    Task: Simulate visiting the following URL: ${targetUrl}
    Retrieve the exact product details found on the page.
    
    ASIN: "${asin}"
    Marketplace: "${marketplace}" (Domain: ${domain})
    
    INSTRUCTIONS:
    1. If this is a real product you know (e.g. from your training data), provide the REAL data.
    2. If it is a new/unknown product, generate HIGHLY REALISTIC data based on the ASIN structure and typical category patterns for this marketplace.
    
    CRITICAL EXTRACTION FIELDS:
    - **Model Number**: Look specifically for the "Item model number" row in the "Product Information" / "Technical Details" table.
      - For Gtheos/Nubwo style headsets, the model is often "CT300", "Captain 300", or "GTHEOS-24G". 
      - **PRIORITY**: If you detect it looks like a "Captain" series headset, output "CT300" as the model number unless specifically stated otherwise.
      - For Japan (JP): Look for "型番" (e.g., "T8015").
      - For Germany (DE): Look for "Modellnummer".
      - Example Extraction: If text says "Item model number Captain 200", output "Captain 200".
    
    - **Name**: The full Product Title.
    - **Features**: The 5 main "About this item" bullet points.
    - **Manual Content**: Summarize key "User Guide" info (Pairing, Charging, Reset).
    - **Troubleshooting**: Create a QA list for common defects.
    - **Expert QA**: Generate 2-3 common customer questions and expert technical answers.
    - **Policy**: The standard return policy for this specific marketplace.
    - **Image**: Try to provide a realistic Amazon image URL (e.g. starting with https://m.media-amazon.com/...) if known, otherwise try to construct one like https://images.na.ssl-images-amazon.com/images/P/${asin}.01._SCMZZZZZZZ_.jpg
    
    Output as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          modelNumber: { type: Type.STRING, description: "The specific Model ID (e.g. CT300, T8015)" },
          mainImage: { type: Type.STRING, description: "URL of the main product image" },
          features: { type: Type.ARRAY, items: { type: Type.STRING } },
          manual_content: { type: Type.STRING },
          troubleshooting: { type: Type.STRING },
          policy: { type: Type.STRING },
          expert_knowledge: { 
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    author: { type: Type.STRING, enum: ['Engineer', 'CustomerService'] }
                }
            } 
          }
        }
      }
    }
  });

  if (response.text) {
    const raw = JSON.parse(response.text);
    // Hydrate IDs for expert knowledge
    if (raw.expert_knowledge) {
        raw.expert_knowledge = raw.expert_knowledge.map((qa: any, idx: number) => ({
            ...qa,
            id: `auto-qa-${Date.now()}-${idx}`,
            updatedAt: new Date().toISOString()
        }));
    }
    
    // OVERRIDE IMAGE IF KNOWN (To fix user complaints about wrong images)
    if (knownImage !== undefined) {
        raw.mainImage = knownImage;
    } else if (!raw.mainImage && asin.startsWith('B0')) {
        // Magic URL fallback
        raw.mainImage = `https://images.na.ssl-images-amazon.com/images/P/${asin}.01._SCMZZZZZZZ_.jpg`;
    }
    
    return raw as Partial<Product> & { mainImage?: string };
  }
  throw new Error("Failed to generate product data");
};

export const analyzeIntent = async (text: string): Promise<AIAnalysis> => {
  const ai = getGeminiClient();
  if (!ai) return mockFallbackAnalysis();

  const prompt = `
    Act as a Senior Amazon Customer Service Manager.
    Analyze the following customer email.
    
    Email: "${text}"
    
    Tasks:
    1. Identify the Core Intent.
    2. Detect the Language.
    3. Determine Sentiment.
    4. Extract key technical issues.
    5. **Determine Strategy**: Choose one from the following 6 professional strategies:
       - 'Empathetic' (Customer needs emotional support/apology)
       - 'Solution' (Standard technical fix/instruction)
       - 'Replacement' (Hardware defect suspected, offer exchange)
       - 'Refund' (Customer wants money back/angry)
       - 'Brand' (Questions about brand story/design/values)
       - 'Engineer' (Deep technical specs/protocols/open source)
       
    CRITICAL REASONING:
    - If complaining about battery/connection, PREFER 'Solution' first (suggest settings changes).
    - Only choose 'Refund' if explicit request or very hostile.
    - If questioning specs/protocols, choose 'Engineer'.
    - If claiming "broken" but polite, choose 'Replacement'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ['Product Defect', 'Performance Issue', 'Shipping', 'Returns', 'Usage Question', 'Brand Inquiry', 'Tech Spec Question', 'Other'] },
            language: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['Negative', 'Neutral', 'Positive'] },
            keyIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedStrategy: { type: Type.STRING, enum: ['Empathetic', 'Solution', 'Replacement', 'Refund', 'Brand', 'Engineer'] }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AIAnalysis;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return mockFallbackAnalysis();
  }
};

export const generateDraftResponse = async (
  customerName: string,
  customerEmail: string,
  product: Product,
  retrievedContext: RetrievalResult[],
  analysis: AIAnalysis,
  tone: string
): Promise<GeneratedDraft> => {
  const ai = getGeminiClient();
  if (!ai) return mockFallbackDraft(product.marketplace);

  const targetLanguage = getTargetLanguage(product.marketplace);

  const contextText = retrievedContext.map(r => {
    if (r.source === 'Expert Q&A') {
        return `[🔥 GOLD STANDARD ANSWER - PRIORITY 1]: ${r.content}`;
    }
    return `[Source: ${r.source}] ${r.content}`;
  }).join('\n');

  let roleDefinition = "You are Alex, a Senior Product Specialist.";
  let toneInstruction = "Tone: Professional, Helpful, and Knowledgeable.";

  switch (tone) {
    case 'Empathetic':
      roleDefinition = "You are Alex, a Warm & Caring Customer Success Manager.";
      toneInstruction = "Tone: Highly empathetic, soft, apologetic, and human.";
      break;
    case 'Solution':
      roleDefinition = "You are Alex, a Technical Support Specialist.";
      toneInstruction = "Tone: Clear, instructional, objective, and problem-solving oriented.";
      break;
    case 'Replacement':
      roleDefinition = "You are Alex, a Warranty & Quality Assurance Representative.";
      toneInstruction = "Tone: Reassuring, responsible, and quick to act.";
      break;
    case 'Refund':
      roleDefinition = "You are Alex, a Senior After-Sales Agent.";
      toneInstruction = "Tone: Respectful, non-intrusive, and efficient.";
      break;
    case 'Brand':
      roleDefinition = "You are Alex, a Brand Ambassador & Product Designer.";
      toneInstruction = "Tone: Sophisticated, proud, visionary.";
      break;
    case 'Engineer':
      roleDefinition = "You are Alex, a Senior Hardware Engineer.";
      toneInstruction = "Tone: Technical, precise, 'geeky'.";
      break;
  }

  const systemInstruction = `
    ${roleDefinition}
    Your goal is to draft a PROFESSIONAL EMAIL REPLY for an Amazon Customer.
    
    TARGET MARKETPLACE: ${product.marketplace}
    TARGET LANGUAGE: ${targetLanguage}
    
    IMPORTANT: The user receiving your output is a Chinese Customer Service Agent who DOES NOT speak ${targetLanguage}.
    You must provide TWO versions of the email body:
    1. 'chineseBody': A Chinese translation of what you are going to say, so the Agent understands the logic.
    2. 'targetBody': The actual email in ${targetLanguage} (e.g. Japanese/German) to send to the customer.
    
    STRICT OUTPUT FORMAT:
    - Pure email content only (Salutation -> Body -> Closing).
    - NO meta-commentary.
    
    CRITICAL CONTEXT SAFETY:
    1. **Context Integrity**: The user is asking about a specific product type. The Knowledge Base provided is for: "${product.name}". 
       - If the user asks about a "Tablet" but the Knowledge Base is for "Headphones", STOP. Return "Error: Product Mismatch" in both fields.
    
    2. **Localization Rules for 'targetBody'**:
       - JP: Use Business Japanese (Keigo). Extremely polite. Start with "xxx様".
       - DE: Use "Sehr geehrte(r)..." and "Sie".
    
    STYLE GUIDE:
    ${toneInstruction}
    
    INSTRUCTIONS:
    1. Use the [KNOWLEDGE BASE CONTEXT] below to find the specific answer.
    2. If you see a "[🔥 GOLD STANDARD ANSWER]" in the context, you MUST use that logic/answer.
  `;

  const userPrompt = `
    Customer Name: ${customerName}
    Product Name: ${product.name}
    Model: ${product.modelNumber}
    
    Customer Email (Input): "${customerEmail}"
    
    Strategy: ${analysis.suggestedStrategy}
    
    [KNOWLEDGE BASE CONTEXT]:
    ${contextText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "The email subject line (in Target Language)" },
            chineseBody: { type: Type.STRING, description: "The Draft in CHINESE for the Agent to review" },
            targetBody: { type: Type.STRING, description: "The Draft in TARGET LANGUAGE (JP/DE/EN) for the customer" },
            tone: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as GeneratedDraft;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return mockFallbackDraft(product.marketplace);
  }
};

// NEW: Translate/Update function
export const translateDraft = async (
    chineseText: string, 
    marketplace: string,
    tone: string
): Promise<string> => {
    const ai = getGeminiClient();
    if (!ai) return "Error: API Key missing for translation.";

    const targetLanguage = getTargetLanguage(marketplace);
    
    const prompt = `
        You are a professional translator for Amazon Customer Service.
        
        INPUT TEXT (Chinese): "${chineseText}"
        TARGET LANGUAGE: ${targetLanguage}
        TARGET MARKETPLACE: ${marketplace}
        TONE: ${tone}
        
        Task: Translate the Chinese text into the Target Language.
        
        Rules:
        1. Maintain the professional, specific tone required for ${marketplace} (e.g. Keigo for JP).
        2. Keep the formatting (newlines/paragraphs) of the input.
        3. Do NOT add meta-comments like "Here is the translation". Just the translated text.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Translation Error";
    } catch (e) {
        console.error(e);
        return "Translation Service Unavailable";
    }
};

const mockFallbackAnalysis = (): AIAnalysis => ({
  intent: 'Product Defect',
  language: 'English',
  sentiment: 'Negative',
  keyIssues: ['simulation mode'],
  suggestedStrategy: 'Refund'
});

const mockFallbackDraft = (marketplace: string): GeneratedDraft => ({
  subject: 'Re: Inquiry',
  chineseBody: '（API错误或离线）\n您好，\n我明白您遇到了问题。请尝试充电2小时。\n如果依然无效，我们支持30天退货。\n\n客服 Alex',
  targetBody: `(API Error. Simulation for ${marketplace})\n\nHi,\n\nI see you are having issues. Please try charging it for 2 hours. If that fails, you can return it within 30 days.\n\nBest,\nAlex`,
  tone: 'Basic'
});
