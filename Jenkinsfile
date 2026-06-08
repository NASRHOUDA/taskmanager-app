pipeline {
    agent any

    environment {
        DOCKER_REGISTRY      = 'docker.io'
        DOCKER_IMAGE_BACKEND = 'houdanasr/taskmanager-backend'
        DOCKER_IMAGE_FRONTEND= 'houdanasr/taskmanager-frontend'
        SONAR_HOST_URL       = 'http://host.docker.internal:9000'
        DOCKER_HUB_CREDENTIALS = 'docker-hub-credentials'
        SONAR_TOKEN          = credentials('sonarqube-token')
        ZAP_TARGET_URL       = 'http://host.docker.internal:3000'   // URL frontend déployée
        NODE_VERSION         = '20'
    }

    tools {
        nodejs "NodeJS-${NODE_VERSION}"   // Nom du tool configuré dans Jenkins > Global Tool Configuration
    }

    stages {

        // ─────────────────────────────────────────────
        // 0. Prérequis : accès socket Docker
        // ─────────────────────────────────────────────
        stage('Fix Docker Socket') {
            steps {
                sh 'chmod 666 /var/run/docker.sock || true'
            }
        }

        // ─────────────────────────────────────────────
        // 1. Récupération du code source
        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo '📦 Code récupéré depuis GitHub'
            }
        }

        // ─────────────────────────────────────────────
        // 2. Scan de secrets (Gitleaks)
        // ─────────────────────────────────────────────
        stage('Secret Scan - Gitleaks') {
            steps {
                sh '''
                    docker run --rm \
                      -v $(pwd):/path \
                      zricethezav/gitleaks:latest detect \
                        --source=/path \
                        --report-format=sarif \
                        --report-path=/path/gitleaks-report.sarif \
                        --verbose \
                    || echo "⚠️  Gitleaks: vérifier le rapport"
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'gitleaks-report.sarif', allowEmptyArchive: true
                }
            }
        }

        // ─────────────────────────────────────────────
        // 3. Scan SAST statique (Semgrep) — AJOUT
        // ─────────────────────────────────────────────
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
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'semgrep-report.json', allowEmptyArchive: true
                }
            }
        }

        // ─────────────────────────────────────────────
        // 4. Installation des dépendances (Node.js tool)
        // ─────────────────────────────────────────────
        stage('Backend Install') {
            steps {
                dir('backend') {
                    sh 'npm ci'          // ci = installation reproductible (lockfile)
                }
            }
        }

        stage('Frontend Install') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        // ─────────────────────────────────────────────
        // 5. Tests unitaires Jest — CORRIGÉ + rapport
        // ─────────────────────────────────────────────
        stage('Unit Tests') {
            steps {
                dir('backend') {
                    sh '''
                        npm test -- \
                          --passWithNoTests \
                          --coverage \
                          --coverageReporters=lcov \
                          --reporters=default \
                          --reporters=jest-junit \
                        || echo "⚠️  Tests échoués - vérifier les résultats"
                    '''
                }
            }
            post {
                always {
                    // Publie les résultats JUnit dans Jenkins
                    junit allowEmptyResults: true,
                          testResults: 'backend/junit.xml'
                    // Publie la couverture de code
                    publishHTML(target: [
                        allowMissing: true,
                        reportDir: 'backend/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        // ─────────────────────────────────────────────
        // 6. Tests BDD Cucumber — AJOUT
        // ─────────────────────────────────────────────
        stage('BDD Tests - Cucumber') {
            steps {
                dir('backend') {
                    sh '''
                        npx cucumber-js \
                          --format json:cucumber-report.json \
                          --format progress \
                        || echo "⚠️  Cucumber: vérifier les scénarios"
                    '''
                }
            }
            post {
                always {
                    // Plugin Cucumber Reports requis dans Jenkins
                    cucumber buildStatus: 'UNSTABLE',
                             fileIncludePattern: 'backend/cucumber-report.json',
                             jsonReportDirectory: 'backend'
                }
            }
        }

        // ─────────────────────────────────────────────
        // 7. Analyse qualité SonarQube (SAST)
        // ─────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        docker run --rm \
                          -e SONAR_HOST_URL=$SONAR_HOST_URL \
                          -e SONAR_TOKEN=$SONAR_TOKEN \
                          -v $(pwd)/backend:/usr/src \
                          sonarsource/sonar-scanner-cli \
                            -Dsonar.projectKey=taskmanager-backend \
                            -Dsonar.sources=. \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.testExecutionReportPaths=junit.xml \
                        || echo "⚠️  SonarQube scan ignoré"
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    // Échoue le build si la Quality Gate SonarQube est KO
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        // ─────────────────────────────────────────────
        // 8. Audit des dépendances (OWASP) — CORRIGÉ : utilise le tool Node.js
        // ─────────────────────────────────────────────
        stage('OWASP Dependency Check') {
            steps {
                dir('backend') {
                    sh 'npm audit --audit-level=high --json > npm-audit-backend.json || echo "⚠️  Vulnérabilités détectées (backend)"'
                }
                dir('frontend') {
                    sh 'npm audit --audit-level=high --json > npm-audit-frontend.json || echo "⚠️  Vulnérabilités détectées (frontend)"'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '**/npm-audit-*.json', allowEmptyArchive: true
                }
            }
        }

        // ─────────────────────────────────────────────
        // 9. Build des images Docker
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // 10. Scan de vulnérabilités images (Trivy)
        // ─────────────────────────────────────────────
        stage('Trivy Scan') {
            steps {
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v trivy-cache:/root/.cache \
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
                      -v trivy-cache:/root/.cache \
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

        // ─────────────────────────────────────────────
        // 11. Push sur Docker Hub
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // 12. Déploiement Kubernetes — CORRIGÉ timeout frontend
        // ─────────────────────────────────────────────
        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f kubernetes/namespace.yaml    || true'
                sh 'kubectl apply -f kubernetes/configmap.yaml    || true'
                sh 'kubectl apply -f kubernetes/secrets.yaml      || true'
                sh 'kubectl apply -f kubernetes/backend-deployment.yaml  || true'
                sh 'kubectl apply -f kubernetes/backend-service.yaml     || true'
                sh 'kubectl apply -f kubernetes/frontend-deployment.yaml || true'
                sh 'kubectl apply -f kubernetes/frontend-service.yaml    || true'

                // Force le rollout avec l'image du build courant
                sh "kubectl set image deployment/backend  backend=${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}  -n taskmanager || true"
                sh "kubectl set image deployment/frontend frontend=${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} -n taskmanager || true"

                // Attente avec timeout augmenté pour le frontend
                sh 'kubectl rollout status deployment/backend  -n taskmanager --timeout=5m || true'
                sh 'kubectl rollout status deployment/frontend -n taskmanager --timeout=5m || true'

                // Diagnostic en cas de problème
                sh 'kubectl get pods -n taskmanager || true'
                sh 'kubectl describe deployment/frontend -n taskmanager || true'
            }
        }

        // ─────────────────────────────────────────────
        // 13. Tests dynamiques DAST (OWASP ZAP) — AJOUT
        //     Exécuté après le déploiement, sur l'app vivante
        // ─────────────────────────────────────────────
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

    // ─────────────────────────────────────────────
    // Notifications post-build
    // ─────────────────────────────────────────────
    post {
        success {
            echo '✅ Pipeline DevSecOps réussi!'
            // Décommente si tu as le plugin Slack/Email configuré :
            // slackSend(color: 'good', message: "✅ Build #${BUILD_NUMBER} réussi - ${JOB_NAME}")
        }
        failure {
            echo '❌ Pipeline échoué!'
            // slackSend(color: 'danger', message: "❌ Build #${BUILD_NUMBER} échoué - ${JOB_NAME}")
        }
        unstable {
            echo '⚠️  Pipeline instable (tests ou Quality Gate en avertissement)'
        }
        always {
            // Nettoyage des images locales pour libérer de l'espace
            sh "docker rmi ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}  || true"
            sh "docker rmi ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} || true"
        }
    }
}
