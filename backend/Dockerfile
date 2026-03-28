# Backend Dockerfile for Saathi Service
FROM golang:alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
ENV GOTOOLCHAIN=auto
RUN go mod tidy
RUN go build -o main ./cmd/api-gateway


FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
