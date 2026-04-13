"""
db.py — Supabase read connection for the ML service.

The ML service uses the service role key so it can read aggregate
transaction data across all users without being restricted by RLS.
"""
import os
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def fetch_training_data():
    """
    Fetches completed transactions joined with their category slug for
    model training.

    Returns:
        X (np.ndarray): feature matrix [category_enc, location_enc, rating_placeholder]
        y (np.ndarray): target prices
        category_labels (list[str]): all category slugs seen
        location_labels (list[str]): all zip codes seen
    """
    import numpy as np
    from sklearn.preprocessing import LabelEncoder

    client = get_client()

    # Pull completed transactions with category slug.
    res = (
        client.table("transactions")
        .select("final_price, category_id, categories(slug)")
        .not_("completed_at", "is", "null")
        .execute()
    )
    rows = res.data or []

    if not rows:
        raise ValueError("No completed transactions found for training.")

    categories = [r["categories"]["slug"] if r.get("categories") else "unknown" for r in rows]
    prices     = [float(r["final_price"]) for r in rows]
    locations  = ["unknown"] * len(rows)  # zip_code not on transactions; placeholder

    cat_enc = LabelEncoder().fit(categories)
    loc_enc = LabelEncoder().fit(locations)

    X = np.column_stack([
        cat_enc.transform(categories),
        loc_enc.transform(locations),
        [4.5] * len(rows),  # rating placeholder (not stored on transaction)
    ])
    y = np.array(prices)

    return X, y, categories, locations