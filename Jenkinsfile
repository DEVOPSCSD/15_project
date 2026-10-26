
pipeline {
    agent any

    environment {
        DOCKER_COMPOSE = 'C:\\Users\\Ajay\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker-compose.exe'
    }

    stages {
        stage('Checkout / Verify Project') {
            steps {
                bat 'echo Jenkins workspace: %WORKSPACE%'
                bat 'dir'
                bat 'if not exist docker-compose.yml exit /b 1'
                bat 'if not exist Jenkinsfile exit /b 1'
                bat '"%DOCKER_COMPOSE%" version'
            }
        }

        stage('Build Docker Images') {
            steps {
                bat '"%DOCKER_COMPOSE%" --profile test build'
            }
        }

        stage('Start Application') {
            steps {
                bat '"%DOCKER_COMPOSE%" up -d mongodb backend frontend selenium'

                bat '''
                powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddMinutes(3); do { try { $b=Invoke-WebRequest -UseBasicParsing http://localhost:5000/api/health -TimeoutSec 5; $f=Invoke-WebRequest -UseBasicParsing http://localhost:8081 -TimeoutSec 5; if ($b.StatusCode -eq 200 -and $f.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 5 } while ((Get-Date) -lt $deadline); exit 1"
                '''
            }
        }

        stage('Selenium UI Tests') {
            steps {
                bat '"%DOCKER_COMPOSE%" --profile test run --build --rm selenium-tests'
            }
        }
    }

    post {
        always {
            bat '"%DOCKER_COMPOSE%" ps'
            bat '"%DOCKER_COMPOSE%" logs --no-color --tail=100 backend'
            bat '"%DOCKER_COMPOSE%" logs --no-color --tail=50 selenium'
        }

        success {
            echo 'SUCCESS: Docker build, application startup, and Selenium UI tests completed.'
        }

        failure {
            echo 'FAILURE: Review the failed stage and container logs above.'
        }
    }
}
