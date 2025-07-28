# Structured Response Formatting Example

This document shows how the Gemini CLI will now format responses using structured blocks for better parsing and display.

## Example Response

Here's how a response about adding comments to SQL files would be formatted:

```
I'll help you add descriptive comments to your SQL files. Let me go through them one by one.

```step
STEP: 1 - Adding comment to 30_day_sales.sql
ACTION: Added descriptive comment at the top of the file
FILE: 30_day_sales.sql
```

```patch
FILE: 30_day_sales.sql
CHANGES:
+ -- Query to analyze sales data for the last 30 days
+ -- This query calculates daily sales totals and identifies trends
SELECT 
    DATE(sale_date) as sale_day,
    SUM(amount) as daily_total,
    COUNT(*) as num_transactions
FROM sales_data
WHERE sale_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY DATE(sale_date)
ORDER BY sale_day DESC;
```

```step
STEP: 2 - Adding comment to math_scores_summary.sql
ACTION: Added descriptive comment at the top of the file
FILE: math_scores_summary.sql
```

```patch
FILE: math_scores_summary.sql
CHANGES:
+ -- Summary statistics for math test scores
+ -- Provides overview of student performance across different grade levels
SELECT 
    grade_level,
    AVG(score) as avg_score,
    STDDEV(score) as score_stddev,
    MIN(score) as min_score,
    MAX(score) as max_score
FROM math_scores
GROUP BY grade_level
ORDER BY grade_level;
```

```step
STEP: 3 - Adding comment to math_scores.sql
ACTION: Added descriptive comment at the top of the file
FILE: math_scores.sql
```

```patch
FILE: math_scores.sql
CHANGES:
+ -- Individual student math test scores
+ -- Contains detailed score data for analysis and reporting
SELECT 
    student_id,
    test_date,
    score,
    grade_level,
    teacher_id
FROM math_scores
WHERE test_date >= '2024-01-01'
ORDER BY test_date DESC, score DESC;
```

```summary
COMPLETED: Added comments to 30_day_sales.sql, math_scores_summary.sql, math_scores.sql, scores_distribution.sql, test_sql.sql, top_20_customers.sql
NEXT: All SQL files now have descriptive comments explaining their purpose and functionality
```

I have successfully added descriptive comments to all your SQL files. Each file now has a clear explanation of what the query does and what data it analyzes.
```

## Benefits of This Format

1. **Easy Parsing**: Each section is clearly delimited with code blocks
2. **Visual Separation**: Steps, patches, summaries, and insights are clearly separated
3. **Code Display**: Patches show exactly what changes were made
4. **Progress Tracking**: Steps show what was completed in order
5. **Summary Information**: Quick overview of what was accomplished

## Supported Block Types

- **```step```**: Individual steps in a process
- **```patch```**: Code changes with diff format
- **```summary```**: Summary of completed actions
- **```insights```**: Data analysis findings and recommendations

## UI Display

The webview will automatically parse these blocks and display them with:
- 📋 Steps section with numbered items
- 🔧 Code changes with syntax highlighting
- 📊 Summary with bullet points
- 💡 Insights with structured findings

This makes responses much more readable and actionable for users! 