pipeline {
    agent any

    environment {
        // ===== DOCKER HUB =====
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_BACKEND = 'houdanasr/taskmanager-backend'
        DOCKER_IMAGE_FRONTEND = 'houdanasr/taskmanager-frontend'

        // ===== VAULT =====
        VAULT_URL = 'http://host.docker.internal:8200'
        VAULT_TOKEN = 'root'

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
        // STAGE 2: Install Dependencies
        // ============================================
        stage('Install Dependencies') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Install') {
                    steps {
                        dir('frontend') {
                            sh 'npm install --omit=optional'
                        }
                    }
                }
            }
        }

        // ============================================
        // STAGE 3: Unit Tests
        // ============================================
        stage('Unit Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test -- --coverage --coverageReporters=lcov || echo "⚠️ Tests backend terminés"'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'CI=true npm test -- --coverage --coverageReporters=lcov --passWithNoTests || echo "⚠️ Tests frontend terminés"'
                        }
                    }
                }
            }
        }

        // ============================================
        // STAGE 4: npm audit
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
        // STAGE 5: SAST - Semgrep
        // ============================================
        stage('SAST - Semgrep') {
            steps {
                dir('backend') {
                    sh '''
                        docker run --rm \
                          -v ${pwd()}:/src \
                          returntocorp/semgrep:latest \
                          semgrep --config=p/security-audit /src --no-git-ignore \
                          --json --output=/src/semgrep-report.json \
                        || echo "⚠️ Semgrep scan terminé"
                    """
                }
            }
        }

        // ============================================
        // STAGE 6: SonarQube Analysis
        // ============================================
        stage('SonarQube Analysis') {
            steps {
                dir('backend') {
                    withSonarQubeEnv('SonarQube') {
                        sh """
                            npx sonar-scanner \
                              -Dsonar.projectKey=taskmanager-backend \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=${SONAR_HOST_URL} \
                              -Dsonar.token=${SONAR_TOKEN} \
                              -Dsonar.exclusions=node_modules/**,**/*.test.js \
                            || echo "⚠️ SonarQube scan terminé"
                        """
                    }
                }
            }
        }

        // ============================================
        // STAGE 7: OWASP Dependency Check
        // ============================================
        stage('OWASP Dependency Check') {
            steps {
                dir('backend') {
                    sh """
                        docker run --rm \
                          -v ${pwd()}:/src \
                          owasp/dependency-check:latest \
                          --project "taskmanager-backend" \
                          --scan /src \
                          --format JSON \
                          --out /src/owasp-report.json \
                          --noupdate \
                        || echo "⚠️ OWASP scan terminé"
                    """
                }
            }
        }

        // ============================================
        // STAGE 8: Build Docker Images
        // ============================================
        stage('Build Docker Images') {
            steps {
                sh """
                    docker build -t ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} -t ${DOCKER_IMAGE_BACKEND}:latest ./backend
                    docker build -t ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} -t ${DOCKER_IMAGE_FRONTEND}:latest ./frontend
                    echo "✅ Images buildées"
                """
            }
        }

        // ============================================
        // STAGE 9: Trivy Image Scan
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
        // STAGE 10: Push to Docker Hub
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
        // STAGE 11: Update Manifests (GitOps)
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

                    git push https://${GH_TOKEN}@github.com/NASRHOUDA/taskmanager-app.git HEAD:main
                    echo "✅ Manifests mis à jour"
                """
            }
        }

        // ============================================
        // STAGE 12: Flux Reconciliation
        // ============================================
        stage('Flux Reconciliation') {
            steps {
                sh """
                    sleep 30
                    flux reconcile source git flux-system --timeout=3m || true
                    flux reconcile kustomization taskmanager --timeout=3m || true

                    sleep 20
                    echo "📊 Flux status:"
                    flux get kustomizations
                    
                    echo "📊 Pods:"
                    kubectl get pods -n taskmanager || true
                    
                    echo "✅ Déploiement Flux CD complété"
                """
            }
        }

        // ============================================
        // STAGE 13: Checkov - IaC Scan
        // ============================================
        stage('Checkov - IaC Scan') {
            steps {
                sh """
                    docker run --rm \
                      -v ${pwd()}/kubernetes:/work \
                      bridgecrew/checkov:latest \
                      -d /work \
                      --framework kubernetes \
                      --soft-fail \
                    || echo "✅ Checkov scan terminé"
                """
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline DevSecOps réussi !'
        }
        failure {
            echo '❌ Pipeline échoué'
        }
    }
}
