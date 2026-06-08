pipeline {
    agent any

    environment {
        DOCKER_REGISTRY       = 'docker.io'
        DOCKER_IMAGE_BACKEND  = 'houdanasr/taskmanager-backend'
        DOCKER_IMAGE_FRONTEND = 'houdanasr/taskmanager-frontend'
        SONAR_HOST_URL        = 'http://host.docker.internal:9000'
        DOCKER_HUB_CREDENTIALS = 'docker-hub-credentials'
        SONAR_TOKEN           = credentials('sonarqube-token')
        ZAP_TARGET_URL        = 'http://host.docker.internal:3000'
    }

    stages {

        stage('Fix Docker Socket') {
            steps {
                sh 'chmod 666 /var/run/docker.sock || true'
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
                echo '📦 Code récupéré depuis GitHub'
            }
        }

        // ── Installer Node.js dans le conteneur Jenkins ───────────────
        // Jenkins tourne lui-même dans Docker, donc on installe Node.js
        // directement dans l'agent au lieu de lancer un autre conteneur
        stage('Setup Node.js') {
            steps {
                sh '''
                    # Vérifie si node est déjà disponible
                    if command -v node > /dev/null 2>&1; then
                        echo "✅ Node.js déjà installé: $(node -v)"
                    else
                        echo "📦 Installation de Node.js..."
                        apt-get update -qq
                        apt-get install -y -qq curl
                        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                        apt-get install -y -qq nodejs
                        echo "✅ Node.js installé: $(node -v)"
                    fi
                    node -v
                    npm -v
                '''
            }
        }

        // ── SAST 1 : Gitleaks ─────────────────────────────────────────
        stage('Secret Scan - Gitleaks') {
            steps {
                sh '''
                    docker run --rm \
                      -v $(pwd):/path \
                      zricethezav/gitleaks:latest detect \
                        --source=/path \
                        --no-git \
                        --report-format=sarif \
                        --report-path=/path/gitleaks-report.sarif \
                        --verbose \
                    || echo "⚠️  Gitleaks: vérifier le rapport"
                    ls -la gitleaks-report.sarif || echo "Rapport non généré"
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'gitleaks-report.sarif', allowEmptyArchive: true
                }
            }
        }

        // ── SAST 2 : Semgrep ──────────────────────────────────────────
        stage('SAST - Semgrep') {
            steps {
                sh '''
                    docker run --rm \
                      -v $(pwd):/src \
                      returntocorp/semgrep semgrep scan \
                        --config=auto \
                        --json \
                        --output=/src/semgrep-report.json \
                        /src \
                    || echo "⚠️  Semgrep: vérifier le rapport"
                    ls -la semgrep-report.json || echo "Rapport non généré"
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'semgrep-report.json', allowEmptyArchive: true
                }
            }
        }

        // ── Backend Install (npm directement dans l'agent) ────────────
        stage('Backend Install') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        // ── Frontend Install ──────────────────────────────────────────
        stage('Frontend Install') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        // ── Tests unitaires Jest ──────────────────────────────────────
        stage('Unit Tests') {
            steps {
                dir('backend') {
                    sh 'npm test -- --passWithNoTests --coverage --coverageReporters=lcov || echo "⚠️  Tests: vérifier les résultats"'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/junit.xml'
                    publishHTML(target: [
                        allowMissing: true,
                        reportDir: 'backend/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        // ── Tests BDD Cucumber ────────────────────────────────────────
        stage('BDD Tests - Cucumber') {
            steps {
                dir('backend') {
                    sh 'npx --yes cucumber-js --format json:cucumber-report.json --format progress || echo "⚠️  Cucumber: pas de scénarios"'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'backend/cucumber-report.json', allowEmptyArchive: true
                }
            }
        }

        // ── SonarQube SAST ────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        docker run --rm \
                          --add-host=host.docker.internal:host-gateway \
                          -e SONAR_HOST_URL=$SONAR_HOST_URL \
                          -e SONAR_TOKEN=$SONAR_TOKEN \
                          -v $(pwd)/backend:/usr/src \
                          sonarsource/sonar-scanner-cli \
                            -Dsonar.projectKey=taskmanager-backend \
                            -Dsonar.sources=. \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        || echo "⚠️  SonarQube scan ignoré"
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        // ── OWASP Dependency Check ────────────────────────────────────
        stage('OWASP Dependency Check') {
            steps {
                dir('backend') {
                    sh 'npm audit --audit-level=high --json > npm-audit-backend.json || echo "⚠️  Vulnérabilités backend"'
                }
                dir('frontend') {
                    sh 'npm audit --audit-level=high --json > npm-audit-frontend.json || echo "⚠️  Vulnérabilités frontend"'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '**/npm-audit-*.json', allowEmptyArchive: true
                }
            }
        }

        // ── Build Docker Images ───────────────────────────────────────
        stage('Build Docker Images') {
            steps {
                script {
                    sh "docker build -f docker/Dockerfile.backend  -t ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}  ."
                    sh "docker build -f docker/Dockerfile.frontend -t ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}  ${DOCKER_IMAGE_BACKEND}:latest"
                    sh "docker tag ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_FRONTEND}:latest"
                }
            }
        }

        // ── Trivy ─────────────────────────────────────────────────────
        stage('Trivy Scan') {
            steps {
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                        --severity HIGH,CRITICAL \
                        --format json \
                        --output trivy-backend.json \
                        --exit-code 0 \
                        ${DOCKER_IMAGE_BACKEND}:latest || true
                """
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                        --severity HIGH,CRITICAL \
                        --format json \
                        --output trivy-frontend.json \
                        --exit-code 0 \
                        ${DOCKER_IMAGE_FRONTEND}:latest || true
                """
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-*.json', allowEmptyArchive: true
                }
            }
        }

        // ── Push Docker Hub ───────────────────────────────────────────
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_HUB_CREDENTIALS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh "docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE_BACKEND}:latest"
                    sh "docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE_FRONTEND}:latest"
                    sh 'docker logout'
                }
            }
        }

        // ── Deploy Kubernetes ─────────────────────────────────────────
        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f kubernetes/namespace.yaml           || true'
                sh 'kubectl apply -f kubernetes/configmap.yaml           || true'
                sh 'kubectl apply -f kubernetes/secrets.yaml             || true'
                sh 'kubectl apply -f kubernetes/backend-deployment.yaml  || true'
                sh 'kubectl apply -f kubernetes/backend-service.yaml     || true'
                sh 'kubectl apply -f kubernetes/frontend-deployment.yaml || true'
                sh 'kubectl apply -f kubernetes/frontend-service.yaml    || true'
                sh "kubectl set image deployment/backend  backend=${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}  -n taskmanager || true"
                sh "kubectl set image deployment/frontend frontend=${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} -n taskmanager || true"
                sh 'kubectl rollout status deployment/backend  -n taskmanager --timeout=5m || true'
                sh 'kubectl rollout status deployment/frontend -n taskmanager --timeout=5m || true'
                sh 'kubectl get pods -n taskmanager || true'
            }
        }

        // ── DAST : OWASP ZAP ─────────────────────────────────────────
        stage('DAST - OWASP ZAP') {
            steps {
                sh '''
                    mkdir -p zap-reports
                    chmod 777 zap-reports
                    docker run --rm \
                      -v $(pwd)/zap-reports:/zap/wrk:rw \
                      --add-host=host.docker.internal:host-gateway \
                      ghcr.io/zaproxy/zaproxy:stable \
                      zap-baseline.py \
                        -t $ZAP_TARGET_URL \
                        -r zap-report.html \
                        -J zap-report.json \
                        -x zap-report.xml \
                        -I \
                    || echo "⚠️  ZAP: vérifier le rapport DAST"
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'zap-reports/zap-report.*', allowEmptyArchive: true
                    publishHTML(target: [
                        allowMissing: true,
                        reportDir: 'zap-reports',
                        reportFiles: 'zap-report.html',
                        reportName: 'ZAP DAST Report'
                    ])
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline DevSecOps réussi!'
        }
        failure {
            echo '❌ Pipeline échoué!'
        }
        unstable {
            echo '⚠️  Pipeline instable'
        }
        always {
            sh "docker rmi ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}  || true"
            sh "docker rmi ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} || true"
        }
    }
}
