import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException


def scrape_recipe_page(url: str) -> str:
    # Beefed up headers to bypass basic bot protection (like the 402 error)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        # If Allrecipes is still being stubborn, catch the 402 specifically
        if response.status_code == 402:
            raise HTTPException(
                status_code=400,
                detail="Strict bot protection triggered on this site (402). Try a smaller blog or a site like foodnetwork.com.",
            )
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Network error: {str(e)}")

    soup = BeautifulSoup(response.content, "html.parser")

    # Remove script and style elements
    for script_or_style in soup(["script", "style", "nav", "footer", "header"]):
        script_or_style.extract()

    text = soup.get_text(separator="\n")

    # Clean up blank lines
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    cleaned_text = "\n".join(chunk for chunk in chunks if chunk)

    if not cleaned_text or len(cleaned_text) < 100:
        raise HTTPException(
            status_code=400,
            detail="Could not extract sufficient text from the page. Is it a valid recipe?",
        )

    return cleaned_text
