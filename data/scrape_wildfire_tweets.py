#!/usr/bin/env python3
"""
Twitter Wildfire Sentiment Analysis Scraper
使用 Snscrape 爬取加州大火相关推文，进行情感分析，生成词云所需数据

使用方法:
    python3 scrape_wildfire_tweets.py

注意事项:
    - macOS 上请使用 python3 而不是 python
    - 需要 VPN 才能访问 Twitter/X
    - 如果无法访问，可以手动创建 sentiment_analysis.csv
"""

import snscrape.modules.twitter as sntwitter
import pandas as pd
import re
from collections import Counter
from textblob import TextBlob
import nltk
from datetime import datetime, timedelta
import json
import os

# 下载必要的 NLTK 数据
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    from nltk.corpus import stopwords
    STOPWORDS = set(stopwords.words('english'))
except:
    STOPWORDS = set()

# 添加自定义停用词（常见但无意义的词）
CUSTOM_STOPWORDS = {
    'rt', 'https', 'http', 'co', 'amp', 'via', 'new', 'get', 'got',
    'one', 'two', 'would', 'could', 'like', 'just', 'really', 'still',
    'going', 'want', 'know', 'think', 'see', 'look', 'make', 'let'
}
STOPWORDS = STOPWORDS.union(CUSTOM_STOPWORDS)

# 扩展停用词列表（针对野火推文特定）
WILDFIRE_STOPWORDS = {
    'wildfire', 'wildfires', 'fire', 'fires', 'california', 'ca',
    'rt', 'https', 'http', 'co', 'amp', 'via', 'new', 'get', 'got',
    'one', 'two', 'would', 'could', 'like', 'just', 'really', 'still',
    'going', 'want', 'know', 'think', 'see', 'look', 'make', 'let',
    'today', 'day', 'week', 'month', 'time', 'year', 'years',
    'people', 'person', 'thing', 'stuff', 'lot', 'much', 'many',
    'im', 'ive', 'dont', 'cant', 'wont', 'didnt', 'thats', 'youre',
    'us', 'our', 'weve', 'theyre', 'hes', 'shes', 'its', 'heres'
}
STOPWORDS = STOPWORDS.union(WILDFIRE_STOPWORDS)


def clean_tweet(tweet_text):
    """
    清理推文文本
    - 移除 URLs
    - 移除 @mentions
    - 移除特殊字符
    - 转小写
    """
    if not tweet_text:
        return ""
    
    # 移除 URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    # 移除 @mentions
    text = re.sub(r'@\w+', '', text)
    # 移除 # 符号但保留标签文字
    text = re.sub(r'#', '', text)
    # 只保留字母
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # 转小写
    text = text.lower()
    # 移除多余空格
    text = ' '.join(text.split())
    
    return text


def extract_words(text):
    """
    提取有意义的词语
    - 移除停用词
    - 只保留长度 > 2 的词
    """
    if not text:
        return []
    
    words = text.split()
    meaningful_words = [
        word for word in words 
        if word not in STOPWORDS 
        and len(word) > 2
    ]
    
    return meaningful_words


def analyze_sentiment(text):
    """
    使用 TextBlob 分析情感
    返回: 1 (正面), 0 (中性), -1 (负面)
    """
    if not text:
        return 0
    
    try:
        blob = TextBlob(str(text))
        polarity = blob.sentiment.polarity
        
        if polarity > 0.1:
            return 1   # 正面
        elif polarity < -0.1:
            return -1  # 负面
        else:
            return 0   # 中性
    except:
        return 0


def get_sentiment_label(sentiment):
    """
    获取情感标签
    """
    if sentiment == 1:
        return "Positive"
    elif sentiment == -1:
        return "Negative"
    else:
        return "Neutral"


def scrape_california_wildfire_tweets(max_tweets=5000):
    """
    爬取加州大火相关推文
    """
    
    print("=" * 60)
    print("🐦 开始爬取加州大火推文...")
    print("=" * 60)
    
    # 定义搜索关键词
    search_queries = [
        '(#CAfire OR #CaliforniaFire OR "California wildfire" OR "CA fire") lang:en',
        '(#DixieFire OR #CaldorFire OR #AugustComplexFire) lang:en',
        '("wildfire" OR "forest fire") California -is:retweet lang:en',
        '(#LAFires OR #SoCalFires OR "Southern California fire") lang:en',
        '("evacuation" OR "evacuate" OR "emergency") wildfire California lang:en',
        '("destroyed" OR "burned" OR "burning") California fire lang:en',
    ]
    
    all_tweets = []
    
    for query in search_queries:
        print(f"\n📊 搜索关键词: {query[:60]}...")
        
        tweets_list = []
        
        try:
            for i, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
                if len(all_tweets) >= max_tweets:
                    break
                    
                if tweet.content and len(tweet.content) > 20:
                    tweets_list.append({
                        'date': tweet.date,
                        'username': tweet.user.username,
                        'content': tweet.content,
                        'url': tweet.url,
                        'reply_count': tweet.replyCount,
                        'retweet_count': tweet.retweetCount,
                        'like_count': tweet.likeCount
                    })
                    
                if (i + 1) % 100 == 0:
                    print(f"   已获取 {i + 1} 条推文...")
                    
                if len(tweets_list) >= max_tweets // len(search_queries) + 1:
                    break
                    
        except Exception as e:
            print(f"   ⚠️ 搜索出错: {e}")
            continue
        
        all_tweets.extend(tweets_list)
        print(f"✓ 完成搜索，获取 {len(tweets_list)} 条推文")
    
    print(f"\n📈 总计获取 {len(all_tweets)} 条推文")
    
    return all_tweets


def process_tweets(tweets):
    """
    处理推文：清理、分析情感、统计词频
    """
    print("\n" + "=" * 60)
    print("🔍 处理推文数据...")
    print("=" * 60)
    
    word_counts = Counter()
    word_sentiments = {}
    tweet_data = []
    
    for i, tweet in enumerate(tweets):
        if i % 500 == 0:
            print(f"   处理进度: {i}/{len(tweets)}")
        
        # 清理推文
        cleaned_text = clean_tweet(tweet['content'])
        words = extract_words(cleaned_text)
        
        # 分析情感
        sentiment = analyze_sentiment(tweet['content'])
        
        # 统计词频
        for word in words:
            word_counts[word] += 1
            if word not in word_sentiments:
                word_sentiments[word] = []
            word_sentiments[word].append(sentiment)
        
        tweet_data.append({
            'date': tweet['date'],
            'content': tweet['content'],
            'sentiment': sentiment,
            'cleaned_text': cleaned_text
        })
    
    # 计算每个词的平均情感
    word_sentiment_avg = {}
    for word, sentiments in word_sentiments.items():
        avg = sum(sentiments) / len(sentiments)
        if avg > 0.1:
            word_sentiment_avg[word] = 1
        elif avg < -0.1:
            word_sentiment_avg[word] = -1
        else:
            word_sentiment_avg[word] = 0
    
    print(f"   提取了 {len(word_counts)} 个不同的词")
    
    return word_counts, word_sentiment_avg, tweet_data


def generate_sentiment_csv(word_counts, word_sentiments, output_file):
    """
    生成 sentiment_analysis.csv 文件
    """
    print("\n" + "=" * 60)
    print("📁 生成 CSV 文件...")
    print("=" * 60)
    
    # 获取前100个高频词
    top_words = word_counts.most_common(100)
    
    # 创建 DataFrame
    data = []
    for word, frequency in top_words:
        sentiment = word_sentiments.get(word, 0)
        data.append({
            'Word': word,
            'Frequency': frequency,
            'Sentiment': sentiment
        })
    
    df = pd.DataFrame(data)
    df.to_csv(output_file, index=False)
    
    print(f"✅ 已生成 {output_file}")
    print(f"   包含 {len(df)} 个词")
    
    # 显示统计信息
    positive = len(df[df['Sentiment'] == 1])
    neutral = len(df[df['Sentiment'] == 0])
    negative = len(df[df['Sentiment'] == -1])
    
    print(f"\n📊 情感分布:")
    print(f"   😊 正面词: {positive} ({positive/len(df)*100:.1f}%)")
    print(f"   😐 中性词: {neutral} ({neutral/len(df)*100:.1f}%)")
    print(f"   😞 负面词: {negative} ({negative/len(df)*100:.1f}%)")
    
    return df


def generate_tweets_csv(tweet_data, output_file):
    """
    生成处理后的完整推文数据 CSV
    """
    df = pd.DataFrame(tweet_data)
    df.to_csv(output_file, index=False)
    print(f"✅ 已生成 {output_file}")
    print(f"   包含 {len(df)} 条推文")
    
    return df


def print_top_words(word_counts, word_sentiments, n=20):
    """
    打印高频词列表
    """
    print("\n" + "=" * 60)
    print(f"🔝 Top {n} 高频词:")
    print("=" * 60)
    
    top_n = word_counts.most_common(n)
    
    print(f"{'排名':<5} {'词语':<15} {'频次':<8} {'情感':<10}")
    print("-" * 40)
    
    for i, (word, count) in enumerate(top_n, 1):
        sentiment = word_sentiments.get(word, 0)
        sentiment_label = get_sentiment_label(sentiment)
        emoji = "😊" if sentiment == 1 else "😐" if sentiment == 0 else "😞"
        print(f"{i:<5} {word:<15} {count:<8} {emoji} {sentiment_label}")
    
    return top_n


def main():
    """
    主函数
    """
    # 配置
    MAX_TWEETS = 3000  # 最大推文数量
    OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(OUTPUT_DIR, 'data')
    
    # 确保输出目录存在
    os.makedirs(DATA_DIR, exist_ok=True)
    
    OUTPUT_CSV = os.path.join(DATA_DIR, 'sentiment_analysis.csv')
    TWEETS_CSV = os.path.join(DATA_DIR, 'wildfire_tweets_raw.csv')
    
    # 时间戳
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    BACKUP_DIR = os.path.join(DATA_DIR, 'backup', timestamp)
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    print("\n" + "=" * 60)
    print("🔥 California Wildfire Tweet Sentiment Analysis")
    print("   加州野火推文情感分析")
    print("=" * 60)
    
    # 1. 爬取推文
    tweets = scrape_california_wildfire_tweets(max_tweets=MAX_TWEETS)
    
    if not tweets:
        print("\n❌ 未获取到任何推文，请检查网络连接或稍后重试")
        return
    
    # 保存原始数据备份
    backup_file = os.path.join(BACKUP_DIR, 'tweets_raw.csv')
    df_backup = pd.DataFrame(tweets)
    df_backup.to_csv(backup_file, index=False)
    print(f"\n💾 原始数据已备份到: {backup_file}")
    
    # 2. 处理推文
    word_counts, word_sentiments, tweet_data = process_tweets(tweets)
    
    # 3. 生成 CSV
    generate_sentiment_csv(word_counts, word_sentiments, OUTPUT_CSV)
    generate_tweets_csv(tweet_data, TWEETS_CSV)
    
    # 4. 显示结果
    print_top_words(word_counts, word_sentiments)
    
    # 5. 生成摘要报告
    summary = {
        'total_tweets': len(tweets),
        'unique_words': len(word_counts),
        'positive_words': len([w for w in word_sentiments.values() if w == 1]),
        'neutral_words': len([w for w in word_sentiments.values() if w == 0]),
        'negative_words': len([w for w in word_sentiments.values() if w == -1]),
        'generated_at': datetime.now().isoformat(),
        'data_source': 'Twitter via Snscrape',
        'topic': 'California Wildfire'
    }
    
    summary_file = os.path.join(DATA_DIR, 'sentiment_analysis_summary.json')
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n" + "=" * 60)
    print("✅ 分析完成!")
    print("=" * 60)
    print(f"\n生成的文件:")
    print(f"  1. {OUTPUT_CSV}")
    print(f"  2. {TWEETS_CSV}")
    print(f"  3. {summary_file}")
    print(f"\n💡 现在可以将 sentiment_analysis.csv 复制到 website/data/ 目录")
    print(f"   然后刷新 vis6 页面查看词云效果!")
    print()


if __name__ == "__main__":
    main()
