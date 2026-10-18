# DevOps E-Commerce Shopping Website

A local Windows-friendly learning project using React, Node.js/Express, MongoDB, Docker Compose, Jenkins, and Selenium.

## Architecture

- React + Vite frontend, built into Nginx
- Nginx serves the site on `http://localhost:8080` and proxies `/api/*` to Express
- Express REST API on port `5000` (also published for debugging)
- MongoDB on port `27017` (Docker network only by default)
- Selenium Standalone Chrome on port `4444`
- Selenium test runner (Python) used by Docker Compose and Jenkins

## Prerequisites (Windows)

1. Install Docker Desktop and start it. Docker Desktop must be using Linux containers.
2. Install Git (optional) and Jenkins (only if running Jenkins on the host; recommended here is Jenkins in Docker).
3. In PowerShell, verify:
   ```powershell
   docker --version
   docker compose version
   docker info
   ```
   If `docker info` fails, start Docker Desktop and wait until its engine is running.

## Start the website

Open PowerShell in this extracted project folder:

```powershell
docker compose up --build -d
docker compose ps
```

Open `http://localhost:8080`. API health: `http://localhost:5000/api/health`.
List products: `http://localhost:5000/api/products`.

To view logs:
```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

## Run Selenium browser tests

The Compose file includes a Selenium test-runner profile. Run:

```powershell
docker compose --profile test run --rm selenium-tests
```

The runner connects to Selenium Chrome and checks that the home page loads, products appear, and a product can be added to the cart. The first test run can take a minute while images download.

## Stop and reset

Stop containers but keep the database:
```powershell
docker compose down
```

Delete containers and database data:
```powershell
docker compose down -v
```

## Jenkins (local, Docker-based)

This project contains a `Jenkinsfile`. It expects Jenkins to have access to the Docker CLI and Docker Engine. The most reliable Windows learning setup is a Jenkins container with the host Docker socket/pipe configured by an administrator; Docker Desktop pipe permissions and Jenkins-in-Docker setup differ by Windows installation. Do not expose a Docker daemon to an untrusted network.

Simpler beginner setup:
1. Run Jenkins locally or in your approved Docker setup.
2. Create a **Pipeline** job.
3. Connect the Git repository containing this project.
4. Select **Pipeline script from SCM**, SCM = Git, and script path = `Jenkinsfile`.
5. Ensure the Jenkins agent can run `docker compose` and access the Docker daemon.
6. Click **Build Now**. The pipeline builds containers, starts the stack, runs Selenium tests, and prints logs if a stage fails.

If Jenkins runs directly on Windows, install Docker Desktop and ensure the Jenkins service account can run `docker.exe`. If Jenkins runs in a container, it needs a compatible Docker CLI and access to the host daemon. A plain Jenkins container does not automatically have Docker access.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get one product |
| POST | `/api/cart/checkout` | Demo checkout; validates submitted items |

Example PowerShell:
```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/products
```

Demo checkout is not a real payment system. No payment data is collected. For a production application, add authentication, input validation, inventory transactions, secure secrets, logging, and a real payment provider.

## Troubleshooting

- **`docker` not recognized**: install Docker Desktop, reopen PowerShell, and check PATH.
- **Docker engine / pipe error**: start Docker Desktop; wait for Engine running; use Linux containers.
- **Port 8080 already in use**: change the left side of `8080:80` in `docker-compose.yml`, e.g. `8090:80`, then browse to `http://localhost:8090`.
- **Port 5000 already in use**: change `5000:5000` to `5001:5000`; API is then on `http://localhost:5001/api`.
- **Frontend shows API error**: `docker compose ps`, then `docker compose logs backend`; ensure MongoDB is healthy.
- **MongoDB startup delay**: backend retries database connection; inspect `docker compose logs -f backend`.
- **Selenium test cannot connect**: run `docker compose ps`, wait for `selenium` to report healthy, then rerun the test command.
- **Jenkins says `docker` not found**: the Jenkins agent needs Docker CLI and daemon access. This is an agent configuration issue, not an app-code issue.
- **Tests fail after code edits**: rebuild with `docker compose build --no-cache`, then rerun the stack and test runner.
