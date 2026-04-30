# syntax=docker/dockerfile:1.7
# Jonathan Torres wrote 28 lines of code for this file

FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json .env.production ./
COPY src ./src

RUN npm run build

FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py databasev1.py ./
COPY routers ./routers
COPY Database ./Database
COPY --from=frontend-builder /app/build ./build

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
