with open('index.html', encoding='utf-8') as f:
    import re
    print(re.findall(r'id=["\']tabBtn-[^"\'>]+', f.read()))
