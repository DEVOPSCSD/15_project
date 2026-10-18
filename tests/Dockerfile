FROM python:3.12-slim
WORKDIR /tests
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY test_shop.py .
CMD ["python", "-m", "unittest", "-v", "test_shop.py"]
