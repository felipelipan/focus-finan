from dotenv import load_dotenv
import os
from sqlalchemy import text
from database import engine

load_dotenv()

def test_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            val = result.scalar()
            print("Connection OK, SELECT 1 ->", val)
    except Exception as e:
        print("Connection failed:", e)
        raise

if __name__ == "__main__":
    test_connection()