import urllib.request
import json
from bs4 import BeautifulSoup
import os

url = "https://ocw.mit.edu/courses/online-textbooks/"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        html = response.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # We need to find how textbooks are listed.
    # Usually OCW lists courses. Let's look for course links.
    print(soup.title.text)
    
    # Let's just dump the HTML to a file so we can inspect it safely
    with open('ocw_textbooks.html', 'wb') as f:
        f.write(html)
        
    print("Saved HTML to ocw_textbooks.html")
        
except Exception as e:
    print(f"Error: {e}")
