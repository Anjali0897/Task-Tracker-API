pipeline {
    agent any

    environment {
        APP_IMAGE = 'anjaligundavaram/taskapi'
        DB_IMAGE  = 'anjaligundavaram/taskapi-db'
        TAG       = "${env.BUILD_NUMBER}"
        REPO      = 'github.com/Anjali0897/Task-Tracker-API.git'
    }

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Code') {
            steps { checkout scm }
        }

        stage('Build & Test') {
            steps {
                // Runs inside a Node container, so Jenkins needs no Node install
                sh '''
                    docker run --rm -v "$PWD":/app -w /app node:20-alpine \
                      sh -c "npm ci && npm test"
                '''
            }
        }

        // Optional: add SonarQube here (withSonarQubeEnv + waitForQualityGate)

        stage('Images') {
            steps {
                sh 'docker build -f Docker-app/Dockerfile -t $APP_IMAGE:$TAG .'
                sh 'docker build -t $DB_IMAGE:$TAG Docker-db'
            }
        }

        stage('Trivy') {
            steps {
                sh 'trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 0 $APP_IMAGE:$TAG > app-trivy-report.txt'
                sh 'trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 0 $DB_IMAGE:$TAG  > db-trivy-report.txt'
                // Gate: fail the build on fixable CRITICAL issues
                sh 'trivy image --severity CRITICAL --ignore-unfixed --exit-code 1 $APP_IMAGE:$TAG'
            }
            post { always { archiveArtifacts artifacts: '*-trivy-report.txt', allowEmptyArchive: true } }
        }

        stage('Compose Smoke Test') {
            steps {
                sh 'docker compose up -d --build --wait'
                sh 'curl -fs http://localhost:3000/ready'
                sh 'docker compose ps'
            }
        }

        stage('Registry') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'dockerhub-cred') {
                        sh 'docker push $APP_IMAGE:$TAG'
                        sh 'docker push $DB_IMAGE:$TAG'
                    }
                }
            }
        }

        stage('Update GitOps Repo') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-cred',
                                                  usernameVariable: 'GIT_USER',
                                                  passwordVariable: 'GIT_TOKEN')]) {
                    sh '''
                        sed -i "s|image: .*taskapi:.*|image: $APP_IMAGE:$TAG|" k8s/08-deployment.yaml
                        sed -i "s|image: .*taskapi-db:.*|image: $DB_IMAGE:$TAG|" k8s/06-statefulset-db.yaml
                        git config user.email "jenkins@example.com"
                        git config user.name  "jenkins"
                        git add k8s/
                        git commit -m "ci: deploy build $TAG [skip ci]" || echo "nothing to commit"
                        git push https://$GIT_USER:$GIT_TOKEN@$REPO HEAD:main
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker compose down -v || true'
            sh 'docker rmi $APP_IMAGE:$TAG $DB_IMAGE:$TAG || true'
        }
    }
}
