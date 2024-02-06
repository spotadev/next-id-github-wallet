FROM node:21-alpine AS builder
LABEL maintainer="Nyk Ma <nykma@mask.io>"

WORKDIR /app
ADD . .
ENV REACT_APP_WALLET_CONNECT_PROJECT_ID=get_from_https://cloud.walletconnect.com/sign-in REACT_APP_PROOF_SERVICE_BASE_URL=https://proof-service.next.id
RUN npm i && npm run build

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
FROM nginx:alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html
