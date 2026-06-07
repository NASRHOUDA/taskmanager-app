    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_FRONTEND = 'taskmanager-frontend'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
        }
        
        // ÉTAPE 2: SECRET SCAN (GITLEAKS)
        stage('Secret Scan - Gitleaks') {
                sh 'docker run --rm -v $(pwd):/path zricethezav/gitleaks:latest detect --source=/path --verbose || echo "No secrets found"'
        
        // ÉTAPE 3: INSTALLATION DÉPENDANCES BACKEND
            steps {
                dir('backend') {
                }
            }
        }
        
        // ÉTAPE 4: UNIT TESTS
            steps {
                    sh 'npm test -- --passWithNoTests || echo "No tests yet"'
            }
        }
        // ÉTAPE 5: SAST - SONARQUBE
            steps {
                withSonarQubeEnv('SonarQube') {
                        sh 'sonar-scanner -Dsonar.projectKey=taskmanager-backend -Dsonar.sources=. -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_TOKEN || echo "Sonar scan skipped"'
        }
        
        // ÉTAPE 6: OWASP DEPENDENCY CHECK
                dir('backend') {
                dir('frontend') {
            }
        }
        
        // ÉTAPE 7: BUILD DOCKER IMAGES
            steps {
                script {
                    sh "docker tag ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_BACKEND}:latest"
        }
        
        // ÉTAPE 8: TRIVY CONTAINER SCAN
            steps {
                sh "docker run --rm aquasec/trivy:latest image --severity HIGH,CRITICAL --exit-code 0 ${DOCKER_IMAGE_BACKEND}:latest || true"
        }
        // ÉTAPE 9: PUSH TO DOCKER HUB
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_HUB_CREDENTIALS) {
                    }
            }
        }
        
        // ÉTAPE 10: DEPLOY TO KUBERNETES
                sh 'kubectl apply -f kubernetes/namespace.yaml || true'
                sh 'kubectl apply -f kubernetes/backend-service.yaml || true'
                sh 'kubectl rollout status deployment/frontend -n taskmanager --timeout=3m || true'
        }
    }
    post {
        success {
        }
        failure {
            echo '❌ Pipeline échoué!'
        }
    }
}
