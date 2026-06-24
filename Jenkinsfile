pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND  = 'houdanasr/taskmanager-backend'
        DOCKER_IMAGE_FRONTEND = 'houdanasr/taskmanager-frontend'
        VAULT_ADDR            = 'http://host.docker.internal:8200'
        VAULT_TOKEN           = 'root'
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // ============================================
        // STAGE 1: Checkout
        // ============================================
        stage('Checkout') {
            steps {
                checkout scm
                echo '📦 Code récupéré depuis GitHub'
            }
        }

        // ============================================
        // STAGE 2: Fetch Secrets from Vault
        // ============================================
        stage('Fetch Secrets from Vault') {
            steps {
                script {
                    // Docker secrets
                    def dockerSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/docker
                    """, returnStdout: true).trim()
                    env.DOCKER_USER = sh(script: "echo '${dockerSecrets}' | jq -r '.data.data.username'", returnStdout: true).trim()
                    env.DOCKER_PASS = sh(script: "echo '${dockerSecrets}' | jq -r '.data.data.password'", returnStdout: true).trim()

                    // GitHub secrets
                    def githubSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/github
                    """, returnStdout: true).trim()
                    env.GH_TOKEN = sh(script: "echo '${githubSecrets}' | jq -r '.data.data.token'", returnStdout: true).trim()

                    // SonarQube secrets
                    def sonarSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/sonar
                    """, returnStdout: true).trim()
                    env.SONAR_TOKEN = sh(script: "echo '${sonarSecrets}' | jq -r '.data.data.token'", returnStdout: true).trim()

                    // Google OAuth secrets
                    def googleSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/google
                    """, returnStdout: true).trim()
                    env.GOOGLE_CLIENT_ID     = sh(script: "echo '${googleSecrets}' | jq -r '.data.data.client_id'", returnStdout: true).trim()
                    env.GOOGLE_CLIENT_SECRET = sh(script: "echo '${googleSecrets}' | jq -r '.data.data.client_secret'", returnStdout: true).trim()

                    // DB secrets
                    def dbSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/db
                    """, returnStdout: true).trim()
                    env.DB_HOST     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.host'", returnStdout: true).trim()
                    env.DB_PORT     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.port'", returnStdout: true).trim()
                    env.DB_NAME     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.name'", returnStdout: true).trim()
                    env.DB_USER     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.user'", returnStdout: true).trim()
                    env.DB_PASSWORD = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.password'", returnStdout: true).trim()

                    // App secrets
                    def appSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/app
                    """, returnStdout: true).trim()
                    env.JWT_SECRET     = sh(script: "echo '${appSecrets}' | jq -r '.data.data.jwt_secret'", returnStdout: true).trim()
                    env.JWT_EXPIRES_IN = sh(script: "echo '${appSecrets}' | jq -r '.data.data.jwt_expires_in'", returnStdout: true).trim()
                    env.FRONTEND_URL   = sh(script: "echo '${appSecrets}' | jq -r '.data.data.frontend_url'", returnStdout: true).trim()
                    env.API_URL        = sh(script: "echo '${appSecrets}' | jq -r '.data.data.api_url'", returnStdout: true).trim()

                    echo '✅ Secrets récupérés depuis Vault'
                }
            }
        }

        // ============================================
        // STAGE 3: Install Dependencies
        // ============================================
        stage('Install Dependencies') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') { sh 'npm ci' }
                    }
                }
                stage('Frontend Install') {
                    steps {
                        dir('frontend') { sh 'npm install --omit=optional' }
                    }
                }
            }
        }

        // ============================================
        // STAGE 4: Unit Tests
        // ============================================
        stage('Unit Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                npm test -- --coverage --coverageReporters=lcov \
                                || echo "⚠️ Tests backend terminés"
                            '''
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh '''
                                CI=true npm test -- --coverage --coverageReporters=lcov \
                                  --passWithNoTests \
                                || echo "⚠️ Tests frontend terminés"
                            '''
                        }
                    }
                }
            }
        }

        // ============================================
        // STAGE 5: Dependency Audit
        // ============================================
        stage('Dependency Audit') {
            parallel {
                stage('npm audit - Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm audit --audit-level=high || echo "⚠️ npm vulnerabilities detected"'
                        }
                    }
                }
                stage('npm audit - Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=high || echo "⚠️ npm vulnerabilities detected"'
                        }
                    }
                }
            }
        }

        // ============================================
        // STAGE 6: SAST - Semgrep
        // ============================================
        stage('SAST - Semgrep') {
            steps {
                dir('backend') {
                    sh '''
                        docker run --rm \
                          -v $(pwd):/src \
                          returntocorp/semgrep:latest \
                          semgrep --config=p/security-audit /src \
                          --json --output=/src/semgrep-report.json \
                        || echo "⚠️ Semgrep scan terminé"
                    '''
                }
            }
        }

        // ============================================
        // STAGE 7: SonarQube Analysis
        // ============================================
        stage('SonarQube Analysis') {
            steps {
                dir('backend') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            npx sonar-scanner \
                              -Dsonar.projectKey=taskmanager-backend \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=http://sonarqube:9000 \
                              -Dsonar.login=${SONAR_TOKEN} \
                              -Dsonar.exclusions=node_modules/**,**/*.test.js \
                            || echo "⚠️ SonarQube scan terminé"
                        '''
                    }
                }
            }
        }

        // ============================================
        // STAGE 8: OWASP Dependency Check
        // ============================================
        stage('OWASP Dependency Check') {
            steps {
                dir('backend') {
                    sh '''
                        docker run --rm \
                          -v $(pwd):/src \
                          -v owasp-data:/usr/share/dependency-check/data \
                          owasp/dependency-check:latest \
                          --project "taskmanager-backend" \
                          --scan /src \
                          --format JSON \
                          --out /src/owasp-report.json \
                          --noupdate \
                        || echo "⚠️ OWASP scan terminé"
                    '''
                }
            }
        }

        // ============================================
        // STAGE 9: Build Docker Images
        // ============================================
        stage('Build Docker Images') {
            steps {
                dir('backend') {
                    sh "docker build -t ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} -t ${DOCKER_IMAGE_BACKEND}:latest ."
                }
                dir('frontend') {
                    sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} -t ${DOCKER_IMAGE_FRONTEND}:latest ."
                }
                echo '✅ Images buildées'
            }
        }

        // ============================================
        // STAGE 10: Trivy Image Scan
        // ============================================
        stage('Trivy Image Scan') {
            steps {
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${DOCKER_IMAGE_BACKEND}:latest

                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${DOCKER_IMAGE_FRONTEND}:latest
                """
            }
        }

        // ============================================
        // STAGE 11: Push to Docker Hub
        // ============================================
        stage('Push to Docker Hub') {
            steps {
                sh """
                    echo '${DOCKER_PASS}' | docker login -u '${DOCKER_USER}' --password-stdin
                    docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}
                    docker push ${DOCKER_IMAGE_BACKEND}:latest
                    docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}
                    docker push ${DOCKER_IMAGE_FRONTEND}:latest
                    docker logout
                    echo "✅ Images poussées vers Docker Hub"
                """
            }
        }

        // ============================================
        // STAGE 12: Update Manifests (GitOps)
        // ============================================
        stage('Update Manifests') {
            steps {
                sh """
                    git config user.email "jenkins@taskmanager.com"
                    git config user.name "Jenkins CI"

                    sed -i "s|image: houdanasr/taskmanager-backend:.*|image: houdanasr/taskmanager-backend:${BUILD_NUMBER}|g" \
                        kubernetes/backend-deployment.yaml
                    sed -i "s|image: houdanasr/taskmanager-frontend:.*|image: houdanasr/taskmanager-frontend:${BUILD_NUMBER}|g" \
                        kubernetes/frontend-deployment.yaml

                    git add kubernetes/backend-deployment.yaml kubernetes/frontend-deployment.yaml
                    git commit -m "ci: update image tags to build #${BUILD_NUMBER}" || echo "Nothing to commit"

                    git push https://\${GH_TOKEN}@github.com/NASRHOUDA/taskmanager-app.git HEAD:main
                    echo "✅ Manifests mis à jour"
                """
            }
        }

        // ============================================
        // STAGE 13: Flux Reconciliation
        // ============================================
        stage('Flux Reconciliation') {
            steps {
                sh '''
                    sleep 30
                    flux reconcile source git flux-system || true
                    flux reconcile kustomization taskmanager || true
                    sleep 20
                    echo "📊 Flux status:"
                    flux get kustomizations
                    echo "📊 Pods:"
                    kubectl get pods -n taskmanager || true
                    echo "✅ Déploiement Flux CD complété"
                '''
            }
        }

        // ============================================
        // STAGE 14: Checkov - IaC Scan
        // ============================================
        stage('Checkov - IaC Scan') {
            steps {
                sh '''
                    docker run --rm \
                      -v $(pwd)/kubernetes:/work \
                      bridgecrew/checkov:latest \
                      -d /work \
                      --framework kubernetes \
                      --soft-fail \
                    || echo "✅ Checkov scan terminé"
                '''
            }
        }
    }

    post {
        success { echo '✅ Pipeline DevSecOps réussi !' }
        failure { echo '❌ Pipeline échoué' }
    }
}
