# FHIR Viewer Webapp

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

## Development

To run the development server locally, use one of the following commands:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

---

## Docker Setup

For a consistent Dockerized development and production environment, follow these consolidated instructions.

### 1. Clone and Build

**Clone the Repository:**

```bash
git clone https://github.com/niccoreyes/FHIR-webapp
cd FHIR-webapp
```

**Build and Run via Docker Compose:**

To build the Docker image (if not already built) and start the container on port 3000:

- **Interactive Mode:**

  ```bash
  docker compose up --build
  ```
  *(Press CTRL+C to stop the container.)*

- **Detached Mode (Background):**

  ```bash
  docker compose up -d
  ```

### 2. Access the Application

After the container is running, open your browser and navigate to:

```
http://localhost:3000
```

### 3. Manage the Application

- **Stop the Container and Remove Network:**

  ```bash
  docker compose down
  ```

- **View Container Logs:**

  ```bash
  docker compose logs
  ```

- **Remove the Built Image (Optional):**

  ```bash
  docker compose down --rmi all
  ```

### 4. Alternative: Docker Hub Image

For a quicker setup, you can use the pre-built image from Docker Hub:

```bash
docker pull niccoreyes/fhir-webapp
```

Then start the container with:

```bash
docker compose up      # add -d for detached mode
```

---

## Additional Resources

- **Next.js Documentation:** [Next.js Docs](https://nextjs.org/docs)
- **Learn Next.js:** [Interactive Tutorial](https://nextjs.org/learn)
- **Next.js GitHub Repository:** [vercel/next.js](https://github.com/vercel/next.js)

---

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).  
For detailed deployment instructions, refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
