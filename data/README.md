# California Wildfire Tweet Scraper & Dataset

## 📊 真实数据来源

### Kaggle Disaster Tweets Dataset

**文件**: `website/data/DisasterTweets.csv`

**原始数据来源**: 
- URL: https://www.kaggle.com/datasets/vstepanchap/twitter-disaster-tweets
- 包含: 2,559 条各类灾害推文
- 灾害类型: Drought (770), Wildfire (540), Earthquake (500), Floods (436), Hurricanes (178), Tornadoes (135)

**处理后的词云数据**:
- 文件: `website/data/wildfire_wordcloud_data.csv`
- 野火相关推文: 304 条
- 提取词汇: 200 个
- 情感分析: VADER (Valence Aware Dictionary and sEntiment Reasoner)

## 📁 数据文件列表

| 文件 | 说明 |
|------|------|
| `website/data/DisasterTweets.csv` | 原始 Kaggle 数据集 |
| `website/data/wildfire_wordcloud_data.csv` | 处理后的野火词云数据 |
| `process_wildfire_data.py` | 数据处理脚本 |
| `california_wildfire_sentiment.csv` | 早期模拟数据（已弃用） |

## 📊 情感分布

| 情感 | 数量 |
|------|------|
| 😊 正面 (Positive) | 2 词 |
| 😐 中性 (Neutral) | 8 词 |
| 😞 负面 (Negative) | 27 词 |

## 🔝 高频词 Top 15

1. 🔴 wildfires (169) - 野火
2. 🔴 wildfire (52) - 野火
3. 🔴 fire (46) - 火
4. 🔴 fires (28) - 火灾
5. 🔴 acres (21) - 英亩
6. 🔴 burning (12) - 燃烧
7. 😐 firefighters (12) - 消防员
8. 🔴 damage (8) - 损害
9. 🔴 lost (6) - 失去
10. 🔴 maui (6) - 毛伊岛
11. 😐 home (6) - 家
12. 🔴 flames (6) - 火焰
13. 😐 growing (5) - 蔓延
14. 🔴 spread (5) - 扩散
15. 🔴 burned (4) - 烧毁

## 🚫 已排除的词汇

以下词汇因不属于"纯野火相关"而被排除：
- 其他灾害: drought, floods, earthquake, hurricane, tornado
- 泛气候词: climate, climatechange, weather, temperature
- 一般描述词: texas, panhandle, million, disaster

## 🎯 筛选标准

只保留**直接描述野火**的词汇：
- ✅ 野火核心词: wildfire, fire, flames, burning
- ✅ 疏散相关: evacuation, evacuate, evacuated
- ✅ 消防相关: firefighters, firefighting, calfire
- ✅ 野火影响: damage, destroyed, lost, homes, structures
- ✅ 野火蔓延: spread, spreading, growing, acres

## 🌐 网站使用

数据文件: `website/data/wildfire_wordcloud_data.csv`

在 vis6.html 词云可视化中使用。

