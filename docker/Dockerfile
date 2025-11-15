ARG NODE_IMAGE=node:lts-trixie
ARG NGINX_IMAGE=nginx:1.29-trixie

FROM ${NODE_IMAGE} AS builder

ENV COREPACK_ENABLE=1

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock
# to take advantage of Docker layer caching
COPY package.json yarn.lock .yarnrc.yml ./

RUN corepack enable

# Install dependencies using Yarn
RUN yarn install --immutable

# Copy the rest of the application source code
COPY . .

# Build the application using Yarn
# This command must generate the static files (e.g., HTML, CSS, JS)
# into a directory like 'dist' or 'build'
RUN yarn run build

FROM ${NGINX_IMAGE}

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist/ ./

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]