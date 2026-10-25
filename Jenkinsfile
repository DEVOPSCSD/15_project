
pipeline {
    agent any

    environment {
        DOCKER = 'C:\\Users\\srisailam\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe'
    }

    stages {
        stage('Build Docker Images') {
            steps {
                bat '"%DOCKER%" compose build'
            }
        }

        stage('Start Application') {
            steps {
                bat '"%DOCKER%" compose up -d'

                bat 'powershell -NoProfile -Command "$deadline=(Get-Date).AddMinutes(2); do { try { $r=Invoke-WebRequest -UseBasicParsing http://localhost:8081; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 3 } while ((Get-Date) -lt $deadline); exit 1"'
            }
        }

        stage('Selenium UI Tests') {
            steps {
                bat '"%DOCKER%" compose --profile test run --rm selenium-tests'
            }
        }
    }

    post {
        always {
            bat '"%DOCKER%" compose ps'
            bat '"%DOCKER%" compose logs --no-color --tail=100 backend'
        }

        success {
            echo 'Build and Selenium tests completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Review the stage output and container logs.'
        }
    }
}
