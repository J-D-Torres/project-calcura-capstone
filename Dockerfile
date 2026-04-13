# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python API server
FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY db/ db/
COPY routers/ routers/
COPY testapp.py .

# Copy built frontend from Stage 1
COPY --from=frontend /app/build ./build

EXPOSE 8000

# Seed initial data then start the API server
CMD ["sh", "-c", "python -m db.seed && uvicorn testapp:app --host 0.0.0.0 --port 8000"]
