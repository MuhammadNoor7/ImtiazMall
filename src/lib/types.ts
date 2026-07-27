export interface RawRecord {
  Customer_ID: string;
  Age: string;
  Gender: string;
  Income_Level: string;
  Address: string;
  Transaction_ID: string;
  Purchase_Date: string;
  Product_ID: string;
  Product_Category: string;
  Brand: string;
  Purchase_Amount: string;
  Average_Spending_Per_Purchase: string;
  Purchase_Frequency_Per_Month: string;
  Brand_Affinity_Score: string;
  Product_Category_Preferences: string;
  Month: string;
  Year: string;
  Season: string;
  Will_Purchase_Next_Month: number;
}

export interface CleanRecord {
  id: string;
  purchaseAmount: number;
  avgSpendPerPurchase: number;
  purchaseFrequency: number;
  brandAffinity: number;
  age: number;
  incomeLevel: number; // 0 Low, 1 Medium, 2 High
  incomeLevelLabel: string;
  gender: string;
  productPref: number; // 0 Low, 1 Medium, 2 High
  productPrefLabel: string;
  season: string;
  month: number;
  year: number;
  willPurchase: number;
  avgSpendPerMonth: number;
  cluster: number;
}

export const ORDINAL_LEVELS = ['Low', 'Medium', 'High'];
