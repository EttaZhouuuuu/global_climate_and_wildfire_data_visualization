#!/usr/bin/env python3
"""
Process real Twitter disaster data to generate wildfire-specific word cloud dataset
Filters for ONLY wildfire-related words, excluding other disasters and general terms
"""

import pandas as pd
import re
from collections import Counter
import json

# Download required NLTK data
import nltk
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

from nltk.corpus import stopwords
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Configuration
INPUT_FILE = "../website/data/DisasterTweets.csv"
OUTPUT_FILE = "../website/data/wildfire_wordcloud_data.csv"

# Wildfire DIRECT keywords - ONLY these will be included
WILDFIRE_KEYWORDS = [
    # Core wildfire terms
    'wildfire', 'wildfires', 'fire', 'fires', 'burning', 'burned', 'burns',
    'blaze', 'blazes', 'flames', 'flaming', 'ember', 'embers', 'cinders',
    'smoke', 'smokey', 'ash', 'ashes', 'soot',
    'evacuation', 'evacuate', 'evacuated', 'evacuees', 'evacuating',
    'firefighter', 'firefighters', 'firefighting', 'firefighter',
    'calfire', 'firecrew', 'fire crews', 'hotshot',
    'hotspot', 'hotspots', 'containment', 'controlled', 'out of control',
    'spread', 'spreading', 'grown', 'growing',
    'firebreak', 'fuel', 'fuels', 'brushfire', 'forest fire', 'forestfire',
    'wildland', 'wildfire', 'bushfire', 'grassfire', 'peaks fire',
    # Specific fire names
    'caldor', 'dixie', 'camp fire', 'woolsey', 'thomas fire', 'tubbs',
    'maui', 'lahaina', 'paradise', 'malibu', 'ventura', 'socal', 'norcal',
    'california fire', 'texas fire', 'australia fire',
    # Wildfire effects
    'destroyed', 'destroying', 'damaged', 'damage', 'lost', 'loss',
    'home', 'homes', 'house', 'houses', 'property', 'structure', 'structures',
    'acre', 'acres', 'acreage', 'square miles', 'squaremile',
]

# Words to EXCLUDE - not directly wildfire-related
EXCLUDE_KEYWORDS = {
    # Other disasters
    'drought', 'droughts', 'dry', 'dryness',
    'flood', 'floods', 'flooding', 'flooded', 'rain', 'rains', 'raining',
    'earthquake', 'earthquakes', 'quake', 'quakes',
    'hurricane', 'hurricanes', 'storm', 'storms', 'storming',
    'tornado', 'tornadoes', 'tornados', 'twister',
    'tsunami', 'landslide', 'landslides', 'avalanche',
    # General climate (not specific to wildfires)
    'climate', 'climatechange', 'climatechange', 'globalwarming',
    'weather', 'temperature', 'snow', 'snowing', 'cold', 'hot',
    'greenhouse', 'carbon', 'emissions', 'pollution',
    # General terms
    'disaster', 'catastrophe', 'emergency', 'crisis',
    'farmers', 'farming', 'farm', 'farms', 'agriculture',
    'million', 'billion', 'percent', 'percent', 'estimate',
    'panhandle', 'region', 'area', 'county', 'counties',
    'high', 'low', 'level', 'levels',
    'conditions', 'condition',
}

# Words to exclude (stopwords + common non-informative words)
STOPWORDS = set(stopwords.words('english'))
CUSTOM_STOPWORDS = {
    'http', 'https', 'co', 'rt', 'amp', 'via', 'get', 'got', 'would', 'could',
    'like', 'just', 'really', 'one', 'two', 'new', 'now', 'today', 'day',
    'us', 'im', 'ive', 'dont', 'cant', 'wont', 'thats', 'youre', 'theyre',
    'going', 'gonna', 'back', 'see', 'make', 'want', 'know', 'think', 'say',
    'said', 'still', 'even', 'much', 'many', 'may', 'might', 'must', 'also',
    'first', 'last', 'next', 'every', 'way', 'well', 'take', 'come', 'made',
    'let', 'look', 'thing', 'things', 'something', 'everything', 'nothing',
    'watch', 'live', 'follow', 'news', 'update', 'latest', 'read', 'click',
    'video', 'photo', 'image', 'link', 'share', 'retweet', 'reply', 'dm',
    'still', 'even', 'via', 'according', 'reported', 'reports', 'saying',
    'year', 'years', 'time', 'week', 'month', 'hour', 'today',
}
ALL_STOPWORDS = STOPWORDS | CUSTOM_STOPWORDS

def clean_tweet(text):
    """Clean and tokenize tweet text"""
    if pd.isna(text):
        return []
    
    text = str(text).lower()
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Remove mentions
    text = re.sub(r'@\w+', '', text)
    
    # Remove hashtag symbols but keep the word
    text = re.sub(r'#', '', text)
    
    # Remove special characters and numbers
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', '', text)
    
    # Tokenize
    words = text.split()
    
    # Filter
    words = [w for w in words if len(w) > 2 and w not in ALL_STOPWORDS]
    
    return words

def is_wildfire_specific(word):
    """Check if word is directly wildfire-related (not general disaster/climate)"""
    word_lower = word.lower()
    
    # Check if in exclude list
    if word_lower in EXCLUDE_KEYWORDS:
        return False
    
    # Check if in wildfire keywords
    for keyword in WILDFIRE_KEYWORDS:
        if keyword.lower() == word_lower:
            return True
    
    return False

def is_wildfire_tweet(text):
    """Check if tweet is related to wildfires"""
    if pd.isna(text):
        return False
    
    text = str(text).lower()
    
    # Check for wildfire keywords
    for keyword in WILDFIRE_KEYWORDS:
        if keyword.lower() in text:
            return True
    
    return False

def get_sentiment(text):
    """Get sentiment score using VADER"""
    if pd.isna(text):
        return 0
    
    analyzer = SentimentIntensityAnalyzer()
    scores = analyzer.polarity_scores(str(text))
    
    # compound score: -1 (negative) to 1 (positive)
    compound = scores['compound']
    
    if compound >= 0.05:
        return 1  # Positive
    elif compound <= -0.05:
        return -1  # Negative
    else:
        return 0  # Neutral

def main():
    print("=" * 60)
    print("Processing Wildfire-Specific Word Cloud Data")
    print("=" * 60)
    
    # Load data
    print("\n📂 Loading data from:", INPUT_FILE)
    df = pd.read_csv(INPUT_FILE)
    print(f"   Total tweets loaded: {len(df)}")
    
    # Show disaster types distribution
    print("\n📊 Disaster Type Distribution:")
    disaster_counts = df['Disaster'].value_counts()
    for disaster, count in disaster_counts.items():
        print(f"   {disaster}: {count}")
    
    # Filter for wildfire-related tweets
    print("\n🔥 Filtering for wildfire-related tweets...")
    
    # Method 1: Filter by Disaster type = Wildfire
    wildfire_by_type = df[df['Disaster'] == 'Wildfire']
    print(f"   Tweets with Disaster='Wildfire': {len(wildfire_by_type)}")
    
    # Method 2: Also include tweets mentioning wildfire keywords
    df['is_wildfire'] = df['Tweets'].apply(is_wildfire_tweet)
    wildfire_by_keyword = df[df['is_wildfire']]
    print(f"   Tweets mentioning wildfire keywords: {len(wildfire_by_keyword)}")
    
    # Combine both methods (union)
    wildfire_df = df[(df['Disaster'] == 'Wildfire') | (df['is_wildfire'] == True)]
    wildfire_df = wildfire_df.drop_duplicates(subset=['Tweet ID'])
    print(f"   Total unique wildfire tweets: {len(wildfire_df)}")
    
    if len(wildfire_df) == 0:
        print("\n⚠️ No wildfire tweets found! Using all disaster tweets...")
        wildfire_df = df
        print(f"   Using {len(wildfire_df)} disaster tweets instead")
    
    # Process tweets - STRICT WILDFIRE FILTERING
    print("\n📝 Processing tweets with STRICT wildfire filtering...")
    
    word_counts = Counter()
    word_sentiments = {}
    excluded_words = Counter()
    
    for idx, row in wildfire_df.iterrows():
        words = clean_tweet(row['Tweets'])
        sentiment = get_sentiment(row['Tweets'])
        
        for word in words:
            # Apply STRICT filtering - ONLY wildfire-specific words
            if is_wildfire_specific(word):
                word_counts[word] += 1
                # Aggregate sentiment
                if word not in word_sentiments:
                    word_sentiments[word] = {'positive': 0, 'neutral': 0, 'negative': 0}
                if sentiment == 1:
                    word_sentiments[word]['positive'] += 1
                elif sentiment == -1:
                    word_sentiments[word]['negative'] += 1
                else:
                    word_sentiments[word]['neutral'] += 1
            else:
                excluded_words[word] += 1
    
    # Calculate final sentiment for each word
    print("\n😊 Calculating sentiment for each word...")
    
    output_data = []
    for word, count in word_counts.most_common(150):  # Top 150 wildfire-specific words
        sents = word_sentiments[word]
        total = sents['positive'] + sents['neutral'] + sents['negative']
        
        # Determine dominant sentiment
        if sents['positive'] > sents['negative']:
            sentiment = 1
        elif sents['negative'] > sents['positive']:
            sentiment = -1
        else:
            sentiment = 0
        
        output_data.append({
            'Word': word,
            'Frequency': count,
            'Sentiment': sentiment
        })
    
    # Create DataFrame and save
    output_df = pd.DataFrame(output_data)
    output_df.to_csv(OUTPUT_FILE, index=False)
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ PROCESSING COMPLETE")
    print("=" * 60)
    print(f"\n📁 Output file: {OUTPUT_FILE}")
    print(f"📊 Total wildfire-specific words: {len(output_data)}")
    
    # Sentiment distribution
    sentiment_dist = output_df['Sentiment'].value_counts()
    print(f"\n😊 Positive words: {sentiment_dist.get(1, 0)}")
    print(f"😐 Neutral words: {sentiment_dist.get(0, 0)}")
    print(f"😞 Negative words: {sentiment_dist.get(-1, 0)}")
    
    # Top 25 words
    print("\n🔝 Top 25 Wildfire-Specific Words:")
    print("-" * 50)
    for i, row in output_df.head(25).iterrows():
        emoji = "😊" if row['Sentiment'] == 1 else "😐" if row['Sentiment'] == 0 else "😞"
        print(f"   {emoji} {row['Word']:<18} {row['Frequency']:>6}")
    
    # Show excluded words (most common excluded)
    print("\n🚫 Most Common Excluded Words (non-wildfire-specific):")
    print("-" * 50)
    for word, count in excluded_words.most_common(15):
        print(f"   - {word:<20} {count:>6}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
