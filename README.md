# E-Commerce Customer Analytics Project

![E-commerce](https://img.shields.io/badge/Dataset-E--commerce-blue)
![Data Analysis](https://img.shields.io/badge/Analysis-Python-green)
![Machine Learning](https://img.shields.io/badge/ML-Clustering-orange)
![Records](https://img.shields.io/badge/Records-500+-yellow)

A comprehensive analysis of customer transaction data from an e-commerce platform, containing detailed information about customer demographics, purchase behavior, and product preferences. This project includes data preprocessing, exploratory data analysis, customer segmentation using clustering techniques, and predictive modeling.

## Dataset Overview

This dataset (`electronics.json`) contains customer transaction records with the following key information:

- Customer demographics (ID, age, gender, income level, address)
- Transaction details (ID, date, amount)
- Product information (ID, category, brand)
- Customer behavior metrics (average spending, purchase frequency, brand affinity)
- Temporal data (month, year, season)
- Predictive target (will purchase next month)

## Data Structure

Each record in the dataset is a JSON object with the following fields:

| Field | Description | Data Type |
|-------|-------------|-----------|
| Customer_ID | Unique identifier for each customer | String |
| Age | Customer's age | String |
| Gender | Customer's gender (Male, Female, Other) | String |
| Income_Level | Income bracket (Low, Medium, High) | String |
| Address | Customer's mailing address | String |
| Transaction_ID | Unique identifier for each transaction | String |
| Purchase_Date | Date of purchase (YYYY-MM-DD) | String |
| Product_ID | Unique identifier for each product | String |
| Product_Category | Category of product (Electronics, Books, Clothing) | String |
| Brand | Product brand (Brand_A, Brand_B, Brand_C) | String |
| Purchase_Amount | Amount spent on purchase | String |
| Average_Spending_Per_Purchase | Average amount spent per purchase | String |
| Purchase_Frequency_Per_Month | Number of purchases per month | String |
| Brand_Affinity_Score | Score indicating brand loyalty (1-10) | String |
| Product_Category_Preferences | Preference level for product category (Low, Medium, High) | String |
| Month | Month of purchase | String |
| Year | Year of birth or other reference | String |
| Season | Season of purchase (Spring, Summer, Fall, Winter) | String |
| Will_Purchase_Next_Month | Binary indicator of future purchase (1=Yes, 0=No) | Integer |

## Data Quality Notes

- Some fields contain missing values (empty strings)
- Some sensitive data is marked as "Hidden"
- All monetary values are represented as strings
- The dataset contains a mix of complete and incomplete records

## Analysis Performed

This project includes several analytical approaches:

### 1. Exploratory Data Analysis
- Statistical analysis of customer demographics and purchase behavior
- Visualization of key metrics and distributions
- Correlation analysis between variables

### 2. Customer Segmentation
The analysis identified two distinct customer segments using K-means clustering:

- **High-Value Customers (Cluster 0)**
  - Higher average purchase amount (~$354)
  - Moderate purchase frequency
  - Higher brand affinity
  - Typically older demographic

- **Frequent Shoppers (Cluster 1)**
  - Lower average purchase amount (~$123)
  - Higher purchase frequency
  - More diverse product preferences
  - Broader age distribution

### 3. Linear Regression Analysis
- Predictive modeling of purchase amounts
- Identification of key factors influencing purchase decisions
- Feature importance analysis

### 4. Purchase Prediction
- Binary classification to predict future purchases
- Evaluation of model performance
- Identification of key predictors for customer retention

## Key Findings and Insights

### Purchase Behavior Predictors
The most influential factors in predicting future purchases are:
- Purchase frequency per month
- Average spending per purchase
- Brand affinity score
- Income level

### Seasonal Trends
Significant seasonal patterns were identified in purchasing behavior, with notable increases during:
- Winter months
- Holiday seasons
- Promotional periods

### Business Recommendations
Based on the analysis, several recommendations can be made:
1. **Targeted Marketing**: Develop personalized campaigns for each customer segment
2. **Loyalty Programs**: Create tiered programs based on purchase frequency and amount
3. **Seasonal Promotions**: Align marketing efforts with identified seasonal trends
4. **Product Recommendations**: Leverage brand affinity scores to suggest relevant products

## Getting Started

### Prerequisites
- Python 3.7+
- Required libraries: pandas, numpy, matplotlib, seaborn, scikit-learn

## Contributing

If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

---

*Note: This README describes a dataset that may contain synthetic or anonymized data for demonstration purposes.*
