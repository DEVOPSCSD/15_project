
pipeline {
    agent any

    environment {
        DOCKER_COMPOSE = 'C:\\Users\\srisailam\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker-compose.exe'
    }

    stages {
        stage('Build Docker Images') {
            steps {
                bat '"%DOCKER_COMPOSE%" build'
            }
        }

        stage('Start Application') {
            steps {
                bat '"%DOCKER_COMPOSE%" up -d'

                bat 'powershell -NoProfile -Command "$deadline=(Get-Date).AddMinutes(2); do { try { $r=Invoke-WebRequest -UseBasicParsing http://localhost:8081; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 3 } while ((Get-Date) -lt $deadline); exit 1"'
            }
        }

        stage('Selenium UI Tests') {
            steps {
                bat '"%DOCKER_COMPOSE%" --profile test run --rm selenium-tests'
            }
        }
    }

    post {
        always {
            bat '"%DOCKER_COMPOSE%" ps'
            bat '"%DOCKER_COMPOSE%" logs --no-color --tail=100 backend'
        }

        success {
            echo 'Build and Selenium tests completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Review the stage output and container logs.'
        }
    }
}
